import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';
import { compile } from 'handlebars';
import { EmailDto } from './dto/mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly mailerService: MailerService,
  ) { }

  async send(emailDto: EmailDto) {
    try {
      let fileTemplate: string = '';
      try {
        fileTemplate = fs.readFileSync(`${join(__dirname, '../templates/')}${emailDto.template}.html`).toString();
      } catch (error) {
        this.logger.warn(`TEMPLATE_LOCAL_NOTFOUND ${emailDto.template}`);
        throw new InternalServerErrorException('Failed to read mail template');
      }

      //compile
      const template = compile(fileTemplate);
      const html = template(emailDto.body);

      let sendMail: ISendMailOptions = {
        to: emailDto.to,
        subject: emailDto.subject,
        html: html,
      };

      if (emailDto.from) sendMail.from = emailDto.from;

      this.mailerService.sendMail(sendMail);
      return Promise.resolve(true);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
