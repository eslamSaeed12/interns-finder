import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InternModule } from './intern/intern.module';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryInterceptor } from './sentry/sentry.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        url: config.getOrThrow('REDIS_URI'),
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow('MONGO_URI'),
        autoIndex: true,
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    InternModule,
  ],
  controllers: [AppController],
  providers: [AppService,SentryInterceptor],
})
export class AppModule {}
