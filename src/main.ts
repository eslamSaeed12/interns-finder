import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import csurf from 'csurf';
import * as expressStatusMonitor from 'express-status-monitor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const env = app.get(ConfigService);

  const isProd = env.get('NODE_ENV') === 'production';

  if (isProd) {
    app.use(csurf());
  }

  const config = new DocumentBuilder()
    .setTitle('Interns Finder')
    .setDescription('The Interns Finder In Egypt API description')
    .setVersion('1.0')
    .addTag('interns')
    .build();

  const document = SwaggerModule.createDocument(app, config);

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

  if (!isProd) {
    SwaggerModule.setup('/docs', app, document);
    app.use(expressStatusMonitor({ path: '/status' }));
  }

  await app.listen(3000);
}
bootstrap();
