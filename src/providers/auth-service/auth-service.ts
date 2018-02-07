import { Credential } from './../../model/credentials';
import { Injectable } from '@angular/core';

/*
  Generated class for the AuthServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthServiceProvider {
  private current: Credential;

  constructor() {
    console.log('Hello AuthServiceProvider Provider');
  }

  public login(auth: Credential): void {}
}
