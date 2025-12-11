import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import * as fs from 'fs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as moment from 'moment-timezone';
export interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, Response<any>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<any>> {
    return next.handle().pipe(
      map((data) => {
        //skip streaming response
        if (
          context.switchToHttp().getResponse().getHeaders()[
            'content-disposition'
          ]
        ) {
          return data;
        }
        let json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        let version = json.version;

        return {
          code: context.switchToHttp().getResponse().statusCode,
          message: data?.message || 'success',
          data: data,
          timestamp: moment.tz('Asia/Jakarta').format(),
          version,
        };
      }),
    );
  }
}
