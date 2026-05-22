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
        const message =
          error instanceof Error ? error.message : String(error)

      this.logger.error(
        `Failed to fetch transcript for video ID ${videoId}: ${message}`
      )

      throw new BadRequestException(
        `Failed to fetch YouTube transcripts: ${message}`
      )
    }
  }
}
