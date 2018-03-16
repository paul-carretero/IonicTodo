import { Component } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Platform } from 'ionic-angular';

import { NfcProvider } from '../providers/nfc/nfc';
import { CloudServiceProvider } from './../providers/cloud-service/cloud-service';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  public rootPage: any = 'TabsPage';

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private readonly cloudCtrl: CloudServiceProvider,
    private readonly nfcCtrl: NfcProvider
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      statusBar.overlaysWebView(false);
      statusBar.show();
      splashScreen.hide();
      this.startListeners();
    });
  }

  private startListeners(): void {
    this.cloudCtrl.listenForUpdate();
    this.nfcCtrl.listenForEvents();
  }
}
