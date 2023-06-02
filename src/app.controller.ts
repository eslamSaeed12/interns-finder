import { Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags, OmitType } from '@nestjs/swagger';
import { HttpException } from './intern/intern.controller';
import { SentryInterceptor } from './sentry/sentry.interceptor';

@Controller('/api')
@ApiTags('utils')
@UseInterceptors(SentryInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  @ApiOperation({
    description: 'check the api health status',
    summary: 'Health Check',
  })
  @ApiResponse({ type: String, status: 200 })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  getHello() {
    return this.appService.getHello();
  }

}
