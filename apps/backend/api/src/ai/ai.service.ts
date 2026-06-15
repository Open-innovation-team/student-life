import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

export type QuizQuestion = {
  question: string;
  choix: [string, string, string, string];
  bonneReponse: number; // 0..3
  explication: string;
};

export type GeneratedInterviewQuestion = {
  category: string;
  question: string;
};

const GENERATION_TIMEOUT_MS = 120_000;
const MAX_CONTEXT_CHARS = 8_000;
const QUIZ_MAX_ATTEMPTS = 3;

type GenerateOptions = {
  json?: boolean;
  numCtx?: number;
  numPredict?: number;
  temperature?: number;
};

@Injectable()
export class AiService {
  async generate(prompt: string, opts?: GenerateOptions): Promise<string> {
    if (process.env.AI_PROVIDER === 'openai-compatible') {
      return this.generateOpenAiCompatible(prompt, opts);
    }
    return this.generateOllama(prompt, opts);
  }

  private async generateOllama(
    prompt: string,
    opts?: GenerateOptions,
  ): Promise<string> {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL,
          prompt,
          stream: false,
          ...(opts?.json ? { format: 'json' } : {}),
          options: {
            // fenêtre de contexte : par défaut Ollama plafonne à 2048,
            // ce qui tronque le contenu ET laisse trop peu de place à la
            // sortie pour les quiz de 10/20 questions.
            num_ctx: opts?.numCtx ?? 8192,
            // budget de génération : -1 = illimité (borné par num_ctx).
            num_predict: opts?.numPredict ?? -1,
            temperature: opts?.temperature ?? 0.4,
          },
        }),
        signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
    } catch {
      throw new ServiceUnavailableException('Service IA indisponible');
    }
    if (!res.ok) await this.throwForResponse(res, 'Ollama');
    const data = (await res.json()) as { response: string };
    return data.response;
  }

  private async generateOpenAiCompatible(
    prompt: string,
    opts?: GenerateOptions,
  ): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${process.env.AI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          ...(opts?.json ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
    } catch {
      throw new ServiceUnavailableException('Service IA indisponible');
    }
    if (!res.ok) await this.throwForResponse(res, 'OpenAI-compatible');
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0].message.content;
  }

  // Le fournisseur IA a répondu avec un statut non-2xx. On distingue le 429
  // (limite de débit côté fournisseur, ex. TPM Groq) pour ne pas le masquer
  // derrière un 503 générique, et on logge le corps pour le diagnostic.
  private async throwForResponse(
    res: Response,
    provider: string,
  ): Promise<never> {
    const body = await res.text().catch(() => '');
    console.error(
      `[AiService] ${provider} ${res.status}: ${body.slice(0, 300)}`,
    );
    if (res.status === 429) {
      throw new HttpException(
        'Limite du fournisseur IA atteinte, réessayez dans une minute',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    throw new ServiceUnavailableException('Service IA indisponible');
  }

  async summarize(text: string): Promise<string> {
    const prompt = `Tu es un assistant pédagogique. À partir du contenu de cours ci-dessous,
rédige une fiche de révision claire et structurée en français, avec :
- un titre,
- 3 à 6 points clés,
- les définitions importantes,
- une section "À retenir".
Reste fidèle au contenu, n'invente rien, ne me mets AUCUN emojies, Met des escpaces entre les différentes sections et pour chaque section met un titre.

CONTENU :
"""
${this.truncate(text)}
"""`;
    return this.generate(prompt);
  }

  async generateQuiz(
    text: string,
    nbQuestions: number,
  ): Promise<QuizQuestion[]> {
    const prompt = `Tu es un générateur de QCM. À partir du contenu ci-dessous, génère EXACTEMENT ${nbQuestions} questions à choix multiples en français.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{
  "questions": [
    {
      "question": "…",
      "choix": ["…", "…", "…", "…"],
      "bonneReponse": 0,
      "explication": "…"
    }
  ]
}
Règles :
- le tableau "questions" doit contenir EXACTEMENT ${nbQuestions} objets, ni plus ni moins ;
- exactement 4 choix par question ;
- "bonneReponse" est l'index (0-3) du bon choix ;
- ne pas inventer hors du contenu.

CONTENU :
"""
${this.truncate(text)}
"""`;
    // ~220 tokens par question + marge ; borné par num_ctx côté Ollama.
    const numPredict = nbQuestions * 220 + 512;

    // Best-effort : un 4B atteint rarement le compte exact du premier coup.
    // On réessaie quelques fois et on garde le meilleur résultat.
    let best: QuizQuestion[] = [];
    for (let attempt = 0; attempt < QUIZ_MAX_ATTEMPTS; attempt++) {
      const raw = await this.generate(prompt, {
        json: true,
        numPredict,
        numCtx: 8192,
      });
      const questions = this.parseQuiz(raw);
      if (questions.length > best.length) best = questions;
      if (best.length >= nbQuestions) break;
    }

    if (best.length === 0) {
      throw new UnprocessableEntityException(
        'Génération du quiz échouée, réessayez',
      );
    }
    // tronque l'éventuel surplus ; renvoie au mieux ce qu'on a obtenu.
    return best.slice(0, nbQuestions);
  }

  async generateInterviewQuestions(
    position: string,
    company: string | null,
  ): Promise<GeneratedInterviewQuestion[]> {
    const target = company ? `${position} chez ${company}` : position;
    const prompt = `Tu es un coach en recrutement. Génère EXACTEMENT 5 questions d'entretien ciblées pour le poste suivant : "${target}".
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{
  "questions": [
    { "category": "…", "question": "…" }
  ]
}
Règles :
- le tableau "questions" doit contenir EXACTEMENT 5 objets ;
- "category" vaut obligatoirement l'une de ces valeurs : "Motivation", "Comportemental", "Technique", "Mise en situation" ;
- les questions doivent être en français et spécifiques au poste visé ;
- pas de numérotation, pas de texte hors du JSON.`;
    const raw = await this.generate(prompt, {
      json: true,
      numPredict: 1024,
      temperature: 0.5,
    });
    const questions = this.parseInterviewQuestions(raw);
    if (questions.length === 0) {
      throw new UnprocessableEntityException(
        'Génération des questions échouée, réessayez',
      );
    }
    return questions.slice(0, 5);
  }

  private parseInterviewQuestions(raw: string): GeneratedInterviewQuestion[] {
    const items = this.extractJsonArray(raw);
    if (!items) return [];
    return items.filter((q): q is GeneratedInterviewQuestion =>
      this.isValidInterviewQuestion(q),
    );
  }

  private isValidInterviewQuestion(
    q: unknown,
  ): q is GeneratedInterviewQuestion {
    if (typeof q !== 'object' || q === null) return false;
    const obj = q as Record<string, unknown>;
    return (
      typeof obj.category === 'string' &&
      typeof obj.question === 'string' &&
      obj.question.trim().length > 0
    );
  }

  private truncate(text: string): string {
    return text.length > MAX_CONTEXT_CHARS
      ? text.slice(0, MAX_CONTEXT_CHARS)
      : text;
  }

  // Renvoie les questions valides extraites du brut, ou [] si rien
  // d'exploitable (la boucle de retry de generateQuiz décide ensuite).
  private parseQuiz(raw: string): QuizQuestion[] {
    const items = this.extractJsonArray(raw);
    if (!items) return this.logParseFailure(raw);
    return items.filter((q) => this.isValidQuestion(q));
  }

  // Extrait un tableau JSON d'une réponse brute : parse direct, sinon
  // réparation du bloc [...], puis dé-wrapping d'un éventuel objet
  // enveloppe { questions: [...] }. Renvoie null si rien d'exploitable.
  private extractJsonArray(raw: string): unknown[] | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return null;
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return null;
      }
    }

    if (
      !Array.isArray(parsed) &&
      typeof parsed === 'object' &&
      parsed !== null
    ) {
      const values = Object.values(parsed as Record<string, unknown>);
      const arr = values.find((v) => Array.isArray(v));
      if (arr) parsed = arr;
    }

    return Array.isArray(parsed) ? parsed : null;
  }

  private logParseFailure(raw: string): QuizQuestion[] {
    console.warn(
      `[AiService] quiz JSON non exploitable (${raw.length} car.) : ${raw.slice(0, 300)}`,
    );
    return [];
  }

  private isValidQuestion(q: unknown): q is QuizQuestion {
    if (typeof q !== 'object' || q === null) return false;
    const obj = q as Record<string, unknown>;
    return (
      typeof obj.question === 'string' &&
      Array.isArray(obj.choix) &&
      obj.choix.length === 4 &&
      obj.choix.every((c) => typeof c === 'string') &&
      typeof obj.bonneReponse === 'number' &&
      Number.isInteger(obj.bonneReponse) &&
      obj.bonneReponse >= 0 &&
      obj.bonneReponse <= 3 &&
      typeof obj.explication === 'string'
    );
  }
}
