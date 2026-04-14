import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return "fffffff"
  }
  @Get('test')
test(@Req() req) {
  return {
    message: 'OAuth success',
    query: req.query,
  };

  
}

}
