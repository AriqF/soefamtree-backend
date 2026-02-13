import { Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('API Admin - Mail Module')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async sendTestMail(){
    return await this.mailService.send({
      to: ['ariqfachry.dev@gmail.com'],
      subject: 'Test Mail',
      template: 'testing-temp',
      body: {
        name: 'Riqs'
      }
    })
  }
}
