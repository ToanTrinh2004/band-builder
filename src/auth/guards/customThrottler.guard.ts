import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use API key if available, otherwise fall back to user ID or IP address
    const apiKey = req.headers['x-api-key'] || req.user?.id;
    return apiKey ?? req.ip;
  }
}