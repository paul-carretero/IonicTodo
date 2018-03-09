import { Global } from './../../shared/global';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Settings } from '../../model/settings';

/*
  Generated class for the SettingProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SettingServiceProvider {
  private userSetting: Promise<Settings>;

  constructor() {
    this.userSetting = new Promise((resolve, reject) => {
      resolve(Global.DEFAULT_SETTING);
    });
  }

  public getSetting(): Promise<Settings> {
    return this.userSetting;
  }
}
