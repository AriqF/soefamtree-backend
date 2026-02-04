import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export default class AccountGuard extends AuthGuard('account-access-token') {
  constructor(private reflector: Reflector) {
    super();
  }
}
