import {
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
    if (!res.ok)
      throw new ServiceUnavailableException('Service IA indisponible');
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
    if (!res.ok)
      throw new ServiceUnavailableException('Service IA indisponible');
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0].message.content;
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

  private truncate(text: string): string {
    return text.length > MAX_CONTEXT_CHARS
      ? text.slice(0, MAX_CONTEXT_CHARS)
      : text;
  }

  // Renvoie les questions valides extraites du brut, ou [] si rien
  // d'exploitable (la boucle de retry de generateQuiz décide ensuite).
  private parseQuiz(raw: string): QuizQuestion[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // tentative de réparation : extraire le bloc [...]
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return this.logParseFailure(raw);
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return this.logParseFailure(raw);
      }
    }

    // format: "json" peut renvoyer un objet enveloppe { questions: [...] }
    if (
      !Array.isArray(parsed) &&
      typeof parsed === 'object' &&
      parsed !== null
    ) {
      const values = Object.values(parsed as Record<string, unknown>);
      const arr = values.find((v) => Array.isArray(v));
      if (arr) parsed = arr;
    }

    if (!Array.isArray(parsed)) return this.logParseFailure(raw);

    return parsed.filter((q) => this.isValidQuestion(q));
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
