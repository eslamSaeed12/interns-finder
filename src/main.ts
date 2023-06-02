import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import * as expressStatusMonitor from 'express-status-monitor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  const env = app.get(ConfigService);

  const isProd = env.get('NODE_ENV') === 'production';

  const config = new DocumentBuilder()
    .setTitle('Interns Finder')
    .setDescription('The Interns Finder In Egypt API description')
    .setVersion('1.0')
    .addTag('interns')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  Sentry.init({
    dsn: env.getOrThrow('SENTRY_KEY'),
  });

  app.use(helmet({ contentSecurityPolicy: isProd }));
  app.use(
    morgan('combined', {
      stream: {
        write(message: string) {
          Logger.log(message.replace('\n', ''));
          return true;
        },
      },
    }),
  );

  SwaggerModule.setup('/docs', app, document);

  if (!isProd) {
    app.use(expressStatusMonitor({ path: '/status' }));
  }

  await app.listen(3000);
}
bootstrap();
