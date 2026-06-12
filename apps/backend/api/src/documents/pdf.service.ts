import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfService {
  async extractText(path: string): Promise<string> {
    const buffer = await readFile(path);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    let text: string;
    try {
      const result = await parser.getText();
      text = result.text;
    } catch {
      throw new UnprocessableEntityException(
        'Document non lisible (PDF corrompu ou protégé)',
      );
    } finally {
      await parser.destroy();
    }

    if (!text || text.trim().length === 0) {
      throw new UnprocessableEntityException(
        'Document non lisible (pas de texte extractible)',
      );
    }
    return text;
  }
}
