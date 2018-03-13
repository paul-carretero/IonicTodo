import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';

import { Settings } from '../../model/settings';
import { SettingServiceProvider } from './../../providers/setting/setting-service';

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public autoLogIn: boolean = false;
  public notifWhen: string = '0';
  public disableOffline: boolean = false;
  public disableSMS: boolean = false;
  public disableNotification: boolean = false;
  public autoReadAlert: boolean = false;
  public setting = Settings;

  constructor(
    private readonly settingCtrl: SettingServiceProvider,
    private readonly authCtrl: AuthServiceProvider
  ) {}

  ionViewDidLoad() {
    this.settingCtrl.getSetting(Settings.AUTO_LOG_IN).then(res => {
      this.autoLogIn = res === 'true';
    });

    this.settingCtrl.getSetting(Settings.AUTO_READ_ALERT).then(res => {
      this.autoReadAlert = res === 'true';
    });

    this.settingCtrl.getSetting(Settings.NOTIF_DELAY).then(res => {
      if (res !== '') {
        this.notifWhen = res;
      } else {
        this.notifWhen = '0';
      }
    });

    this.settingCtrl.getSetting(Settings.DISABLE_OFFLINE).then(res => {
      this.disableOffline = res === 'true';
    });

    this.settingCtrl.getSetting(Settings.DISABLE_NOTIF).then(res => {
      this.disableNotification = res === 'true';
    });

    this.settingCtrl.getSetting(Settings.DISABLE_SMS).then(res => {
      this.disableSMS = res === 'true';
    });
  }

  get isConnected(): boolean {
    return this.authCtrl.isConnected();
  }

  public defSetting(event: any, setting: Settings): void {
    this.settingCtrl.setSetting(setting, event.value);
  }

  public defSettingNotif(): void {
    this.settingCtrl.setSetting(Settings.NOTIF_DELAY, this.notifWhen.toString());
  }

  public reset(): void {
    this.settingCtrl.reset();
    this.ionViewDidLoad();
  }
}
