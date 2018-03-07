import { Component } from '@angular/core';
import { Flashlight } from '@ionic-native/flashlight';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Platform, AlertController } from 'ionic-angular';

import { TabsPage } from '../pages/tabs/tabs';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  public rootPage: any = TabsPage;
  public JeVoisBien = false;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private flashlight: Flashlight,
    private alertCtrl: AlertController
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      statusBar.overlaysWebView(true);
      statusBar.show();
      splashScreen.hide();
    });
  }

  /**
   * affiche une fenêtre d'information
   * @param title le titre de la fenêtre d'alerte
   * @param text le texte de le fenêtre d'alerte
   */
  public alert(title: string, text: string) {
    this.alertCtrl
      .create({
        title: title,
        subTitle: text,
        buttons: ['OK']
      })
      .present();
  }

  public voirMieux(): void {
    this.JeVoisBien = !this.JeVoisBien;
    if (this.JeVoisBien) {
      this.flashlight.switchOn().catch(() => {
        this.alert(
          'erreur',
          "Vous devez accepter que l'utilisation de votre appareil photo pour mieux voir."
        );
        this.JeVoisBien = !this.JeVoisBien;
      });
    } else {
      this.flashlight.switchOff();
    }
  }
}
