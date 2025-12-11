import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (context.getType() === 'http') {
      return this.logHttpCall(context, next);
    }
  }
  private readonly logger = new Logger(LoggingInterceptor.name);

  private logHttpCall(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.get('user-agent') || '';
    const { method, path, ip } = request;
    const requestKey = uuidv4();
    const now = Date.now();

    const payload = {
      body: request.body,
      query: request.query,
      params: request.params,
    };

    this.logger.verbose(
      `[Request ${requestKey}] ${String(method).toUpperCase()} ${path} ${userAgent} IP: ${ip} CallStack: ${context.getClass().name} at ${context.getHandler().name} payload: ${JSON.stringify(payload)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;

        this.logger.verbose(
          `[Response ${requestKey}] ${String(method).toUpperCase()} ${path} StatusCode:${statusCode} ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
