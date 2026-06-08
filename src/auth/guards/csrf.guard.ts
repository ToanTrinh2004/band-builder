import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers['origin'];
    const csrfHeader = request.headers['x-requested-with'];

    const allowedOrigins = [
      process.env.FRONTEND_URL,   // e.g. https://yourapp.com
    ];

    // Allow only known origins AND require the custom header
    if (!origin || !allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Unauthorized origin');
    }

    if (!csrfHeader || csrfHeader !== 'XMLHttpRequest') {
      throw new ForbiddenException('Missing CSRF header');
    }

    return true;
  }
}