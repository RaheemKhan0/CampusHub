import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import morgan from 'morgan';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/betterauth';
import { connectDB } from './lib/connectMongodb';
import { ValidationPipe } from '@nestjs/common';
import type { Express, Request, Response } from 'express';
import {
  SwaggerModule,
  DocumentBuilder,
  type OpenAPIObject,
} from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  await connectDB();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Campus Hub API')
    .setDescription('REST API for Campus Hub')
    .setVersion('1.0.0')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.use('/api-json', (_req: Request, res: Response) => res.json(document));

  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.use(morgan('dev'));
  expressApp.all('/api/auth/*splat', toNodeHandler(auth));

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}

void bootstrap();
