import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InternService } from './intern.service';

@Injectable()
export class InternJob {
  constructor(private internService: InternService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM,{
    timeZone:"Africa/Cairo"
  })
  async handleCron() {
    // scrab last 24 hour interns from [wuzzuf,linkedin,indeed]
    const crawlers: Array<'Wuzzuf' | 'Tanqeeb' | 'Linkedin' | 'Indeed'> = [
      'Wuzzuf',
      'Linkedin',
      'Indeed',
      "Tanqeeb"
    ];

    console.log("start scheduling crawlers")
    // scrab data for pages in jobs , so if a job fails it will retry in another time
    for (let i = 0; i < crawlers.length; i++) {
      await this.internService.CallCrawler({ from: crawlers[i] });
    }

    Logger.log(
      'successfully calling crawlers '.concat(' ', new Date().toISOString()),
    );
  }
}
