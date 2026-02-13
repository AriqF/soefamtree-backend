import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MailerModule.forRoot({
      transport: {
        host: `${process.env.SMTP_HOST}`,
        port: 587,
        secure: false,
        auth: {
          user: `${process.env.SMTP_USERNAME}`,
          pass: `${process.env.SMTP_PASSWORD}`,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 1000,
      },
      defaults: {
        from: `"No Reply DjonHub" <${process.env.SMTP_USERNAME}>`,
      },
      // template: {
      //   dir: join(__dirname, '../templates'),
      //   adapter: new HandlebarsAdapter(),
      //   options: {
      //     strict: false,
      //   },
      // },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {}
