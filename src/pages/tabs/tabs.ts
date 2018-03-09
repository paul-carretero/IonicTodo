import { Component, ViewChild } from '@angular/core';
import { Flashlight } from '@ionic-native/flashlight';
import { AlertController, Tabs, NavController } from 'ionic-angular';

import { QrReaderPage } from '../qr-reader/qr-reader';
import { EventServiceProvider } from './../../providers/event/event-service';
import { AuthentificationPage } from './../authentification/authentification';
import { HomePage } from './../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  private tab1Root = HomePage;
  private tab2Root = AuthentificationPage;
  public JeVoisBien = false;
  @ViewChild('navTabs') tabRef: Tabs;

  constructor(
    private navCtrl: NavController,
    private evtCtrl: EventServiceProvider,
    private flashlight: Flashlight,
    private alertCtrl: AlertController
  ) {}

  ionViewDidLoad() {
    this.setRoot(1);
  }

  public setRoot(root: number) {
    this.tabRef.select(root);
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

  public showQrPage(): void {
    this.evtCtrl.getNavRequestSubject().next({ page: QrReaderPage });
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
