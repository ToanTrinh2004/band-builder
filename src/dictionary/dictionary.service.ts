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

    const isIncomplete = !cachedWord ||
      !cachedWord.audioUrl ||
      cachedWord.synonyms === 'N/A' ||
      cachedWord.synonyms === 'No synonyms found' ||
      cachedWord.example === 'N/A' ||
      cachedWord.example === 'No example found in database' ||
      cachedWord.meaning === 'Definition not found';

    // Cache Miss or Incomplete: Fetch from Free Dictionary API and Translate/Update
    if (isIncomplete) {
      this.logger.log(`Cache miss or incomplete record for word: "${cleanWord}". Fetching/updating from external APIs...`);
      let phonetic = cachedWord?.phonetic || '';
      let audioUrl = cachedWord?.audioUrl || '';
      let meaning = cachedWord?.meaning || 'Definition not found';
      let synonyms = cachedWord?.synonyms || 'N/A';
      let explainVN = cachedWord?.explainVN || 'Không tìm thấy nghĩa';
      let example = cachedWord?.example || 'N/A';

      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          if (Array.isArray(dictData) && dictData.length > 0) {
            let foundPhonetic = '';
            let foundAudioUrl = '';
            let foundMeaning = '';
            let synonymsList: string[] = [];
            let foundExample = '';

            for (const entry of dictData) {
              if (!foundPhonetic && entry.phonetic) {
                foundPhonetic = entry.phonetic;
              }
              if (entry.phonetics && Array.isArray(entry.phonetics)) {
                for (const p of entry.phonetics) {
                  if (!foundPhonetic && p.text) {
                    foundPhonetic = p.text;
                  }
                  if (!foundAudioUrl && p.audio && p.audio.trim() !== '') {
                    foundAudioUrl = p.audio.trim();
                  }
                }
              }

              if (entry.meanings && Array.isArray(entry.meanings)) {
                for (const m of entry.meanings) {
                  if (m.synonyms && Array.isArray(m.synonyms)) {
                    for (const s of m.synonyms) {
                      if (s && !synonymsList.includes(s)) {
                        synonymsList.push(s);
                      }
                    }
                  }
                  if (m.definitions && Array.isArray(m.definitions)) {
                    for (const d of m.definitions) {
                      if (!foundMeaning && d.definition) {
                        foundMeaning = d.definition;
                      }
                      if (!foundExample && d.example) {
                        foundExample = d.example;
                      }
                      if (d.synonyms && Array.isArray(d.synonyms)) {
                        for (const s of d.synonyms) {
                          if (s && !synonymsList.includes(s)) {
                            synonymsList.push(s);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            if (foundPhonetic) phonetic = foundPhonetic;
            if (foundAudioUrl) {
              audioUrl = foundAudioUrl;
              if (audioUrl.startsWith('//')) {
                audioUrl = 'https:' + audioUrl;
              }
            }
            if (foundMeaning) meaning = foundMeaning;
            if (synonymsList.length > 0) {
              synonyms = synonymsList.slice(0, 5).join(', ');
            } else {
              synonyms = 'N/A';
            }
            if (foundExample) example = foundExample;
          }
        }

        // Translate the word itself to Vietnamese if not already done
        if (explainVN === 'Không tìm thấy nghĩa' || !explainVN) {
          const translatedWord = await this.translateToVietnamese(cleanWord);
          if (translatedWord) {
            explainVN = translatedWord;
          }
        }

        // Cache or update the result in database
        if (cachedWord) {
          cachedWord = await this.prisma.dictionaryCache.update({
            where: { word: cleanWord },
            data: {
              phonetic,
              audioUrl,
              meaning,
              synonyms,
              explainVN,
              example,
            },
          });
        } else {
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
        }
      } catch (error: any) {
        this.logger.error(`Error processing dictionary search for "${cleanWord}": ${error.message}`);
        // If we have a cached word but it failed to update, fallback to cached values
        if (!cachedWord) {
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

    if (!cachedWord) {
      return {
        word: cleanWord,
        phonetic: '',
        audio: '',
        meaning: 'Definition not found',
        related: 'N/A',
        explainVN: 'Không tìm thấy nghĩa',
        example: 'N/A',
        translation: sentenceTranslation,
        isSaved: false,
        dateSaved: null,
      };
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
