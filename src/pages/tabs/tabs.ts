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
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * page principale de l'application
   *
   * @protected
   * @memberof TabsPage
   */
  protected readonly tab1Root = 'HomePage';

  /**
   * page d'authentification
   *
   * @protected
   * @memberof TabsPage
   */
  protected readonly tab2Root = 'AuthentificationPage';

  /**
   * page de paramètre
   *
   * @protected
   * @memberof TabsPage
   */
  protected readonly tab3Root = 'SettingsPage';

  /**
   * true si la lampe est allumé, false sinon
   *
   * @protected
   * @memberof TabsPage
   */
  protected JeVoisBien = false;

  /**
   * true si on est connecté aux interwebz false sinon
   *
   * @protected
   * @type {boolean}
   * @memberof TabsPage
   */
  protected netStatus: boolean;

  /**
   * bar des tabs
   *
   * @type {Tabs}
   * @memberof TabsPage
   */
  @ViewChild('navTabs') tabRef: Tabs;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of TabsPage.
   * @param {EventServiceProvider} evtCtrl
   * @param {Flashlight} flashlight
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {AdsServiceProvider} adsCtrl
   * @memberof TabsPage
   */
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

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**
   * retourne si l'on est authorisé à accéder aux onglet protégés
   *
   * @readonly
   * @protected
   * @type {boolean}
   * @memberof TabsPage
   */
  protected get allowNavigate(): boolean {
    return this.authCtrl.navAllowed();
  }

  /**
   * retourne le nom du mode d'authentification actuel
   *
   * @readonly
   * @protected
   * @type {string}
   * @memberof TabsPage
   */
  protected get modeName(): string {
    if (this.authCtrl.isConnected()) {
      return 'Authentifié';
    } else {
      return 'Hors Ligne';
    }
  }

  /**
   * retourne true si l'on peut se déconnecter, false sinon
   *
   * @readonly
   * @protected
   * @type {boolean}
   * @memberof TabsPage
   */
  protected get canLogOut(): boolean {
    return this.authCtrl.isConnected();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * défini le tab courrant
   *
   * @private
   * @param {number} root
   * @memberof TabsPage
   */
  private setRoot(root: number) {
    this.tabRef.select(root);
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * affiche une publicité intersticiel
   *
   * @memberof TabsPage
   */
  protected showAds(): void {
    this.adsCtrl.showInterstitial();
  }

  /**
   * envoie une demande de redirection vers la page de lecture qr code
   *
   * @memberof TabsPage
   */
  protected showQrPage(): void {
    this.evtCtrl.getNavRequestSubject().next({ page: 'QrReaderPage' });
  }

  /**
   * envoie une demande de redirection vers la page de cloud
   *
   * @memberof TabsPage
   */
  protected showCloudPage(): void {
    this.evtCtrl.getNavRequestSubject().next({ page: 'CloudSpacePage' });
  }

  /**
   * envoie une demande de redirection vers la page de planification de sms
   *
   * @protected
   * @memberof TabsPage
   */
  protected autoSms(): void {
    this.evtCtrl.getNavRequestSubject().next({ page: 'AutoSmsPage' });
  }

  /**
   * Permet de mieux voir en allumant la lampe torche
   * Si on voit déjà mieux
   *
   * @memberof TabsPage
   */
  protected voirMieux(): void {
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
  protected logInOut(): void {
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
  protected home(): void {
    this.setRoot(Global.HOMEPAGE);
  }
}
