import { AdsServiceProvider } from './../../providers/ads-service/ads-service';
import { Component, ViewChild } from '@angular/core';
import { Flashlight } from '@ionic-native/flashlight';
import { IonicPage, Tabs } from 'ionic-angular';

import { Global } from '../../shared/global';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { EventServiceProvider } from './../../providers/event/event-service';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';

/**
 * Page de nav de base de l'application
 *
 * @export
 * @class TabsPage
 */
@IonicPage()
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  protected readonly tab1Root = 'HomePage';
  protected readonly tab2Root = 'AuthentificationPage';
  protected readonly tab3Root = 'SettingsPage';
  protected JeVoisBien = false;
  protected netStatus: boolean;
  @ViewChild('navTabs') tabRef: Tabs;

  constructor(
    private readonly evtCtrl: EventServiceProvider,
    private readonly flashlight: Flashlight,
    private readonly authCtrl: AuthServiceProvider,
    private readonly uiCtrl: UiServiceProvider,
    private readonly adsCtrl: AdsServiceProvider
  ) {
    this.netStatus = this.evtCtrl.getNetStatus();
    this.evtCtrl.getNetStatusObs().subscribe(res => {
      this.netStatus = res;
    });
  }

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

  private setRoot(root: number) {
    this.tabRef.select(root);
  }

  public showAds(): void {
    this.adsCtrl.showInterstitial();
  }

  /**
   * envoie une demande de redirection vers la page de lecture qr code
   *
   * @memberof TabsPage
   */
  public showQrPage(): void {
    this.evtCtrl.getNavRequestSubject().next({ page: 'QrReaderPage' });
  }

  /**
   * envoie une demande de redirection vers la page de cloud
   *
   * @memberof TabsPage
   */
  public showCloudPage(): void {
    this.evtCtrl.getNavRequestSubject().next({ page: 'CloudSpacePage' });
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
        this.uiCtrl.alert(
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
}
