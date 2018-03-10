import { SettingsPage } from './../settings/settings';
import { Component, ViewChild } from '@angular/core';
import { Flashlight } from '@ionic-native/flashlight';
import { AlertController, Tabs, ToastController } from 'ionic-angular';

import { Global } from '../../shared/global';
import { QrReaderPage } from '../qr-reader/qr-reader';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { EventServiceProvider } from './../../providers/event/event-service';
import { AuthentificationPage } from './../authentification/authentification';
import { HomePage } from './../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  public tab1Root = HomePage;
  public tab2Root = AuthentificationPage;
  public tab3Root = SettingsPage;
  public JeVoisBien = false;
  @ViewChild('navTabs') tabRef: Tabs;

  constructor(
    private evtCtrl: EventServiceProvider,
    private flashlight: Flashlight,
    private alertCtrl: AlertController,
    private authCtrl: AuthServiceProvider,
    private toastCtrl: ToastController
  ) {}

  get allowNavigate(): boolean {
    return this.authCtrl.navAllowed();
  }

  get modeName(): string {
    if (this.authCtrl.isConnected()) {
      return 'Authentifié';
    } else {
      return 'Hors Ligne';
    }
  }

  get canLogOut(): boolean {
    return this.authCtrl.isConnected();
  }

  public checkIfNotAllowed(): void {
    if (!this.allowNavigate) {
      this.toastCtrl
        .create({
          message:
            'Vous devez être connecté ou utiliser le mode hors ligne pour accéder à cette page',
          duration: 3000,
          position: 'bottom'
        })
        .present();
    }
  }

  private setRoot(root: number) {
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

  public logInOut(): void {
    if (this.authCtrl.isConnected()) {
      this.authCtrl.logout();
    }
    this.setRoot(Global.AUTHPAGE);
  }

  public home(): void {
    this.setRoot(Global.HOMEPAGE);
  }
}
