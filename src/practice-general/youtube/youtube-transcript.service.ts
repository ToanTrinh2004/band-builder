import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';
import { extractYoutubeVideoId } from './extract-youtube-id.util';

export interface ScrapedSentence {
  text: string;
  startTime: number;
  endTime: number;
  orderIndex: number;
}

@Injectable()
export class YoutubeTranscriptService {
  private readonly logger = new Logger(YoutubeTranscriptService.name);

  // Fetches transcript segments for a given YouTube URL and processes offsets/durations into float seconds.
  async fetchTranscriptByUrl(url: string): Promise<ScrapedSentence[]> {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      throw new BadRequestException('Invalid YouTube URL');
    }

    let sentences: ScrapedSentence[] = [];
    let customScraperErrorMsg = '';
    let scrapedSuccess = false;

    // 1. Try our custom scraper first (high success rate on Cloud servers)
    try {
      sentences = await this.fetchWithCustomScraper(videoId);
      scrapedSuccess = true;
    } catch (error) {
      customScraperErrorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Custom transcript scraper failed for video ID ${videoId}: ${customScraperErrorMsg}. Falling back to library...`
      );
    }

    // 2. Fallback to youtube-transcript library
    if (!scrapedSuccess) {
      try {
        const items = await YoutubeTranscript.fetchTranscript(videoId);
        if (items.length > 0) {
          // Detect if the underlying library returned times in milliseconds (InnerTube) or seconds (HTML fallback)
          const avgDuration = items.reduce((sum, item) => sum + item.duration, 0) / items.length;
          const isMilliseconds = avgDuration > 100;
          const scale = isMilliseconds ? 1000 : 1;

          sentences = items.map((item, index) => {
            const start = item.offset / scale;
            const duration = item.duration / scale;
            return {
              text: item.text,
              startTime: parseFloat(start.toFixed(2)),
              endTime: parseFloat((start + duration).toFixed(2)),
              orderIndex: index,
            };
          });
          scrapedSuccess = true;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to fetch transcript for video ID ${videoId} (Custom: ${customScraperErrorMsg} | Library: ${message})`
        );

        throw new BadRequestException(
          `Failed to fetch YouTube transcripts. (Custom: ${customScraperErrorMsg} | Library: ${message})`
        );
      }
    }

    return this.cleanAndFormatSentences(sentences);
  }

  private cleanAndFormatSentences(rawSentences: ScrapedSentence[]): ScrapedSentence[] {
    if (rawSentences.length === 0) return [];

    interface WordInfo {
      text: string;
      time: number;
    }

    // Step 1: Flatten all sentences into a stream of words with estimated timestamps
    const words: WordInfo[] = [];
    
    for (const s of rawSentences) {
      const segmentWords = s.text.trim().split(/\s+/);
      if (segmentWords.length === 0) continue;
      
      const duration = s.endTime - s.startTime;
      // Distribute duration over words, or use 0.25s per word if duration is invalid
      const timePerWord = duration > 0 ? duration / segmentWords.length : 0.25;
      
      for (let i = 0; i < segmentWords.length; i++) {
        words.push({
          text: segmentWords[i],
          time: s.startTime + (i * timePerWord),
        });
      }
    }

    if (words.length === 0) return [];

    // Step 2: Group words into semantic sentences based on sentence starters, punctuation and pauses
    const sentences: ScrapedSentence[] = [];
    let currentWords: WordInfo[] = [words[0]];
    
    const SENTENCE_STARTERS = new Set([
      'so', 'because', 'but', 'and', 'then', 'when', 'if', 
      'i', 'you', 'he', 'she', 'we', 'they', 'it', 'this', 'there', 
      'now', 'here', 'why', 'what', 'how', 'who', 'where',
      'im', 'youre', 'hes', 'shes', 'theyre', 'weare', 'its', 'theres', 'thats'
    ]);
    
    const MIN_WORDS = 8;
    const MAX_WORDS = 18;

    for (let i = 1; i < words.length; i++) {
      const prevWord = words[i - 1];
      const currWord = words[i];
      
      const currentLength = currentWords.length;
      const nextWordLower = currWord.text.toLowerCase().replace(/[^a-z]/g, '');
      const isStarter = SENTENCE_STARTERS.has(nextWordLower);
      
      const timeGap = currWord.time - prevWord.time;
      const hasPunctuation = /[.!?]$/.test(prevWord.text);
      
      let shouldSplit = false;
      
      if (hasPunctuation) {
        // Split on punctuation immediately
        shouldSplit = true;
      } else if (currentLength >= MAX_WORDS) {
        // Split if sentence is getting too long
        shouldSplit = true;
      } else if (currentLength >= MIN_WORDS) {
        // Split if we have a sentence starter or a significant pause
        if (isStarter || timeGap > 1.2) {
          shouldSplit = true;
        }
      }

      if (shouldSplit) {
        const text = currentWords.map(w => w.text).join(' ');
        const startTime = currentWords[0].time;
        const endTime = currWord.time;
        
        sentences.push({
          text,
          startTime,
          endTime,
          orderIndex: 0,
        });
        
        currentWords = [currWord];
      } else {
        currentWords.push(currWord);
      }
    }
    
    // Push remaining words
    if (currentWords.length > 0) {
      const text = currentWords.map(w => w.text).join(' ');
      const startTime = currentWords[0].time;
      const endTime = currentWords[currentWords.length - 1].time + 1.0;
      
      sentences.push({
        text,
        startTime,
        endTime,
        orderIndex: 0,
      });
    }

    // Step 3: Resolve overlapping times (sequential alignment)
    for (let i = 0; i < sentences.length - 1; i++) {
      const cur = sentences[i];
      const next = sentences[i + 1];
      
      if (cur.endTime > next.startTime) {
        cur.endTime = next.startTime;
      }
      if (cur.endTime <= cur.startTime) {
        cur.endTime = parseFloat((cur.startTime + 0.5).toFixed(2));
      }
    }

    // Format output
    return sentences.map((s, index) => ({
      text: s.text,
      startTime: parseFloat(s.startTime.toFixed(2)),
      endTime: parseFloat(s.endTime.toFixed(2)),
      orderIndex: index,
    }));
  }

  private async fetchWithCustomScraper(videoId: string): Promise<ScrapedSentence[]> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page (HTTP ${response.status})`);
    }

    const html = await response.text();
    const regex = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;/;
    let match = html.match(regex);

    if (!match || !match[1]) {
      const fallbackRegex = /ytInitialPlayerResponse\s*=\s*({.+?})\s*(?:var|window|<\/script|\n)/;
      match = html.match(fallbackRegex);
      if (!match || !match[1]) {
        throw new Error('Could not extract player response from video page');
      }
    }

    return this.parsePlayerResponse(match[1]);
  }

  private async parsePlayerResponse(jsonStr: string): Promise<ScrapedSentence[]> {
    let data: any;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error('Player response was not valid JSON');
    }

    const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) {
      throw new Error('Transcripts are not available or disabled on this video');
    }

    // Try finding English track first, then fallback to first available
    const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
    if (!track || !track.baseUrl) {
      throw new Error('Could not find caption baseUrl');
    }

    const captionUrl = `${track.baseUrl}&fmt=json3`;
    const captionResponse = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch caption data (HTTP ${captionResponse.status})`);
    }

    const captionData = await captionResponse.json();
    if (!captionData.events || captionData.events.length === 0) {
      return [];
    }

    const sentences: ScrapedSentence[] = [];
    let orderIndex = 0;

    for (const event of captionData.events) {
      if (!event.segs || event.segs.length === 0) {
        continue;
      }

      const text = event.segs
        .map((seg: any) => seg.utf8)
        .join('')
        .replace(/\n/g, ' ')
        .trim();

      if (!text) {
        continue;
      }

      const startTimeMs = event.tStartMs;
      const durationMs = event.dDurationMs || 0;
      const startTime = parseFloat((startTimeMs / 1000).toFixed(2));
      const endTime = parseFloat(((startTimeMs + durationMs) / 1000).toFixed(2));

      sentences.push({
        text,
        startTime,
        endTime,
        orderIndex: orderIndex++,
      });
    }

    return sentences;
  }

  async getVideoTitle(url: string): Promise<string> {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) return 'YouTube Lesson';

    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!response.ok) throw new Error();
      const html = await response.text();
      const match = html.match(/<title>(.+?)\s*-\s*YouTube<\/title>/i);
      if (match && match[1]) {
        return match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
      }
    } catch (e) {
      // ignore
    }
    return `YouTube Lesson: ${videoId.toUpperCase()}`;
  }
}
