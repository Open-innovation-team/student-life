import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Quota MVP : compteur en mémoire par utilisateur, remis à zéro chaque jour.
 * (Suffisant tant que l'API tourne sur une seule instance.)
 */
@Injectable()
export class AiQuotaService {
  private readonly counters = new Map<string, { day: string; count: number }>();

  consume(userId: string): void {
    const limit = Number(process.env.AI_DAILY_QUOTA ?? 20);
    const today = new Date().toISOString().slice(0, 10);
    const entry = this.counters.get(userId);
    const count = entry?.day === today ? entry.count : 0;
    if (count >= limit) {
      throw new HttpException(
        `Quota IA journalier atteint (${limit} générations/jour)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.counters.set(userId, { day: today, count: count + 1 });
  }
}
