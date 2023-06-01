import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags, OmitType } from '@nestjs/swagger';
import { HttpException } from './intern/intern.controller';

@Controller('/api')
@ApiTags('home')
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

  @Get('/verify')
  @ApiOperation({
    description: 'get the csrf token for the request',
    summary: 'csrf token',
  })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  @ApiResponse({ type: String, status: 200 })
  setCsrf(@Req() req) {
    return req.csrfToken();
  }
}
