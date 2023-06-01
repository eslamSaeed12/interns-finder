import { Module } from '@nestjs/common';
import { InternController } from './intern.controller';
import { InternService } from './intern.service';
import { BullModule } from '@nestjs/bull';
import { InternJob } from './intern.job';
import { InternCrawler } from './inter.crawler';
import { MongooseModule } from '@nestjs/mongoose';
import { Intern, InternSchema } from './intern.schema';

@Module({
  providers: [InternService,InternJob,InternCrawler],
  controllers: [InternController],
  imports: [
     MongooseModule.forFeature([{ name: Intern.name, schema: InternSchema }]),
     BullModule.registerQueue({
      name: 'Crawler',
    }),
  ],
})
export class InternModule {}
