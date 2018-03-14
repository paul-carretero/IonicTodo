import { Component, ViewChild } from '@angular/core';
import { Flashlight } from '@ionic-native/flashlight';
import { AlertController, Events, Tabs, ToastController } from 'ionic-angular';

import { NfcProvider } from '../../providers/nfc/nfc';
import { Global } from '../../shared/global';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { AuthentificationPage } from './../authentification/authentification';
import { HomePage } from './../home/home';
import { QrReaderPage } from './../list-receiver/qr-reader/qr-reader';
import { SettingsPage } from './../settings/settings';

/**
 * Page de nav de base de l'application
 *
 * @export
 * @class TabsPage
 */
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  public readonly tab1Root = HomePage;
  public readonly tab2Root = AuthentificationPage;
  public readonly tab3Root = SettingsPage;
  public JeVoisBien = false;
  @ViewChild('navTabs') tabRef: Tabs;

  constructor(
    private readonly evtCtrl: Events,
    private readonly flashlight: Flashlight,
    private readonly alertCtrl: AlertController,
    private readonly authCtrl: AuthServiceProvider,
    private readonly toastCtrl: ToastController,
    private readonly nfc: NfcProvider
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
    this.evtCtrl.publish(Global.BASIC_NAVIGATION_TOPIC, { page: QrReaderPage });
  }

  public showCloudPage(): void {
    //todo
  }

  /**
   * Permet de mieux voir en allumant la lampe torche
   * Si on voit déjà mieux
   *
   * @memberof TabsPage
   */
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

  /**
   * Log-In si pas loggué, logout sinon
   *
   * @memberof TabsPage
   */
  public logInOut(): void {
    if (this.authCtrl.isConnected()) {
      this.authCtrl.logout();
    }
    this.setRoot(Global.AUTHPAGE);
  }

  /**
   * Redirige vers la page d'accueil
   *
   * @memberof TabsPage
   */
  public home(): void {
    this.setRoot(Global.HOMEPAGE);
  }

  public writenfc(): void {
    this.nfc.write('nfc write hello world');
  }
}
