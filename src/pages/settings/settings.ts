import { NotifServiceProvider } from './../../providers/notif-service/notif-service';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';

import { Settings } from '../../model/settings';
import { DBServiceProvider } from './../../providers/db/db-service';

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  protected autoLogIn: boolean = false;
  protected disableOffline: boolean = false;
  protected disableSMS: boolean = false;
  protected disableNotification: boolean = false;
  protected autoReadAlert: boolean = false;
  protected autoImport: boolean = false;
  protected enableSTS: boolean = false;
  protected setting = Settings;

  constructor(
    private readonly settingCtrl: DBServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly notifCtrl: NotifServiceProvider
  ) {}

  ionViewDidLoad() {
    this.settingCtrl.getSetting(Settings.AUTO_LOG_IN).then(res => {
      this.autoLogIn = res;
    });

    this.settingCtrl.getSetting(Settings.AUTO_READ_ALERT).then(res => {
      this.autoReadAlert = res;
    });

    this.settingCtrl.getSetting(Settings.DISABLE_OFFLINE).then(res => {
      this.disableOffline = res;
    });

    this.settingCtrl.getSetting(Settings.DISABLE_NOTIF).then(res => {
      this.disableNotification = res;
    });

    this.settingCtrl.getSetting(Settings.DISABLE_SMS).then(res => {
      this.disableSMS = res;
    });

    this.settingCtrl.getSetting(Settings.AUTO_IMPORT).then(res => {
      this.autoImport = res;
    });

    this.settingCtrl.getSetting(Settings.ENABLE_STS).then(res => {
      this.enableSTS = res;
    });
  }

  get isConnected(): boolean {
    return this.authCtrl.isConnected();
  }

  protected async defSetting(event: any, setting: Settings): Promise<void> {
    await this.settingCtrl.setSetting(setting, event.value);
    if (setting === Settings.DISABLE_NOTIF) {
      this.notifCtrl.redefNotifStatus();
    }
  }

  protected async reset(): Promise<void> {
    await this.settingCtrl.resetSettings();
    this.ionViewDidLoad();
  }
}
