import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfService {
  async extractText(path: string): Promise<string> {
    const buffer = await readFile(path);

    // Validation réelle du type : le mimetype client est falsifiable, on
    // vérifie la signature (magic bytes) du fichier — un vrai PDF commence
    // par « %PDF- ».
    if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new UnprocessableEntityException(
        'Fichier non valide (ce n’est pas un PDF)',
      );
    }

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
