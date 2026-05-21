import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DictionaryResponseDto } from './dto/dictionary.dto';

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);

  constructor(private readonly prisma: PrismaService) { }

  private async translateToVietnamese(text: string): Promise<string> {
    if (!text || !text.trim()) return '';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Translate returned HTTP ${res.status}`);
      }
      const data = await res.json();
      return data[0]?.map((segment: any) => segment[0]).filter(Boolean).join('') || '';
    } catch (error: any) {
      this.logger.error(`Failed to translate text: ${error.message}`);
      return '';
    }
  }

  async getDefinition(word: string, sentence?: string): Promise<DictionaryResponseDto> {
    const cleanWord = word.toLowerCase().trim().split(' ')[0];
    let cachedWord = await this.prisma.dictionaryCache.findUnique({
      where: { word: cleanWord },
    });

    // Cache Miss: Fetch from Free Dictionary API and Translate
    if (!cachedWord) {
      this.logger.log(`Cache miss for word: "${cleanWord}". Fetching from external APIs...`);
      let phonetic = '';
      let audioUrl = '';
      let meaning = 'Definition not found';
      let synonyms = 'N/A';
      let explainVN = 'Không tìm thấy nghĩa';
      let example = 'N/A';

      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          if (Array.isArray(dictData) && dictData.length > 0) {
            const entry = dictData[0];
            phonetic = entry?.phonetic || '';
            audioUrl = entry?.phonetics?.find((p: any) => p.audio)?.audio || '';

            const firstMeaning = entry?.meanings?.[0];
            const firstDef = firstMeaning?.definitions?.[0];

            meaning = firstDef?.definition || 'Definition not found';
            synonyms = firstMeaning?.synonyms?.slice(0, 5).join(', ') || 'No synonyms found';
            example = firstDef?.example || entry?.meanings?.[1]?.definitions?.[0]?.example || 'No example found in database';
          }
        }

        // Translate the word itself to Vietnamese
        const translatedWord = await this.translateToVietnamese(cleanWord);
        if (translatedWord) {
          explainVN = translatedWord;
        }

        // Cache the result in database
        cachedWord = await this.prisma.dictionaryCache.create({
          data: {
            word: cleanWord,
            phonetic,
            audioUrl,
            meaning,
            synonyms,
            explainVN,
            example,
          },
        });
      } catch (error: any) {
        this.logger.error(`Error processing dictionary search for "${cleanWord}": ${error.message}`);
        // Return default fallback if external APIs fail and we couldn't create cache record
        return {
          word: cleanWord,
          phonetic: '',
          audio: '',
          meaning: 'Definition not found',
          related: 'N/A',
          explainVN: 'Không tìm thấy nghĩa',
          example: 'N/A',
          translation: '',
          isSaved: false,
          dateSaved: null,
        };
      }
    }

    // Handle Sentence Translation (if provided)
    let sentenceTranslation = '';
    if (sentence && sentence.trim()) {
      const cleanSentence = sentence.trim();
      let cachedSentence = await this.prisma.sentenceTranslationCache.findUnique({
        where: { sentence: cleanSentence },
      });

      if (!cachedSentence) {
        this.logger.log(`Cache miss for sentence. Translating...`);
        const translatedSentence = await this.translateToVietnamese(cleanSentence);
        if (translatedSentence) {
          cachedSentence = await this.prisma.sentenceTranslationCache.create({
            data: {
              sentence: cleanSentence,
              translation: translatedSentence,
            },
          });
        }
      }
      sentenceTranslation = cachedSentence?.translation || '';
    }

    return {
      word: cachedWord.word,
      phonetic: cachedWord.phonetic || '',
      audio: cachedWord.audioUrl || '',
      meaning: cachedWord.meaning || 'Definition not found',
      related: cachedWord.synonyms || 'N/A',
      explainVN: cachedWord.explainVN || 'Không tìm thấy nghĩa',
      example: cachedWord.example || 'N/A',
      translation: sentenceTranslation,
      isSaved: false, // Default fixed fields requested for notebook
      dateSaved: null,
    };
  }
}
