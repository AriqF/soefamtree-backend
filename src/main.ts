import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { config } from 'process';
import {
  HttpExceptionFilter,
  EntityNotFoundFilter,
} from './app.http_exception_filter.interceptor';
import { ResponseInterceptor } from './app.response.interceptor';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter(config));
  app.useGlobalFilters(new EntityNotFoundFilter());
  app.useGlobalPipes(new ValidationPipe());

  if (+config.get<string>('ENABLE_API_DOCS', '1') == 1) {
    app.use(
      ['/docs', '/docs-json'],
      basicAuth({
        challenge: true,
        users: {
          developer: config.get<string>('API_DOCS_KEY', ''),
        },
      }),
    );

    const docConfig = new DocumentBuilder()
      .addBearerAuth(
        {
          scheme: 'Bearer',
          type: 'http',
          name: 'admin-access-token',
        },
        'admin-access-token',
      )
      .addBearerAuth(
        {
          scheme: 'Bearer',
          type: 'http',
          name: 'user-access-token',
        },
        'user-access-token',
      )
      .addApiKey({ type: 'apiKey', name: 'x-apikey', in: 'header' }, 'x-apikey')
      .addSecurityRequirements('x-apikey')
      .setTitle('SoeFamTree API Docs')
      .setDescription('SoeFamTree Project API Documentation')
      .setVersion('1.0')
      .addTag('API PUBLIC', 'endpoint for public')
      .setExternalDoc('Download JSON spec for postman', '/docs-json')
      .build();

    const document = SwaggerModule.createDocument(app, docConfig);

    await app.listen(process.env.PORT ?? 8000);
  }
}
bootstrap();
