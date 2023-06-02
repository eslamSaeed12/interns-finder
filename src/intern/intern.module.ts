import { Module } from '@nestjs/common';
import { InternController } from './intern.controller';
import { InternService } from './intern.service';
import { BullModule } from '@nestjs/bull';
import { InternJob } from './intern.job';
import { InternCrawler } from './inter.crawler';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Intern, InternSchema } from './intern.schema';
import { Model } from 'mongoose';

@Module({
  providers: [InternService, InternJob, InternCrawler],
  controllers: [InternController],
  imports: [
    MongooseModule.forFeature([{ name: Intern.name, schema: InternSchema }]),
    BullModule.registerQueue({
      name: 'Crawler',
    }),
  ],
})
export class InternModule {
  constructor(@InjectModel(Intern.name) private model: Model<Intern>) {
    model.ensureIndexes();
  }
}
