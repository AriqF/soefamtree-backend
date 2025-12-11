import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as moment from 'moment-timezone';
import { EntityNotFoundError, TypeORMError } from 'typeorm';
import * as Sentry from "@sentry/nestjs";

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService) {
    this.config = config;
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    // const request = host.switchToHttp().getRequest<Request>();
    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let resErr: any = {};

    if (status >= 500) {
      Sentry.captureException(exception);
    }

    if (this.config.get<string>('NODE_ENV') === 'prod' && status == 500) {
      resErr = {
        code: status,
        message: 'Internal server error',
      };
    } else {
      resErr =
        exception instanceof HttpException
          ? typeof exception.getResponse() === 'string'
            ? {}
            : exception.getResponse()
          : {
              code: status,
              message: 'Internal server error',
            };
    }
    resErr.code = status;

    if (resErr.statusCode) {
      resErr.code = resErr.statusCode;
      delete resErr.statusCode;
    }

    if (status == 422) {
      status = 422;
      resErr.code = 422;
    }

    let json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let version = json.version;

    response.status(status).json({
      ...resErr,
      timestamp: moment.tz('Asia/Jakarta').format(),
      version,
    });
  }
}

@Catch(EntityNotFoundError, TypeORMError)
export class EntityNotFoundFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    Sentry.captureException(exception);

    let json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let version = json.version;

    response.status(400).json({
      code: 400,
      message: 'Data not found',
      timestamp: moment.tz('Asia/Jakarta').format(),
      version,
    });
  }
}
