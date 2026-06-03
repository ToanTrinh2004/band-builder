import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const mobileRedirect = request.query.mobileRedirect;
    if (mobileRedirect) {
      return {
        state: JSON.stringify({ mobileRedirect }),
      };
    }
    return {};
  }
}
