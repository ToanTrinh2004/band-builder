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

    let customScraperErrorMsg = '';
    try {
      // 1. Try our custom scraper first (high success rate on Cloud servers)
      return await this.fetchWithCustomScraper(videoId);
    } catch (error) {
      customScraperErrorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Custom transcript scraper failed for video ID ${videoId}: ${customScraperErrorMsg}. Falling back to library...`
      );
    }

    // 2. Fallback to youtube-transcript library
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId);
      if (items.length === 0) {
        return [];
      }

      // Detect if the underlying library returned times in milliseconds (InnerTube) or seconds (HTML fallback)
      const avgDuration = items.reduce((sum, item) => sum + item.duration, 0) / items.length;
      const isMilliseconds = avgDuration > 100;
      const scale = isMilliseconds ? 1000 : 1;

      return items.map((item, index) => {
        const start = item.offset / scale;
        const duration = item.duration / scale;
        return {
          text: item.text,
          startTime: parseFloat(start.toFixed(2)),
          endTime: parseFloat((start + duration).toFixed(2)),
          orderIndex: index,
        };
      });
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
}
