import { Component } from '@angular/core';
import { User } from '@firebase/auth-types';
import { IonicPage, NavController } from 'ionic-angular';
import moment from 'moment';
import { Subscription } from 'rxjs/Rx';

import { EventServiceProvider } from '../../providers/event/event-service';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from './../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { GenericPage } from './../../shared/generic-page';
import { Global } from './../../shared/global';

/**
 * Offre une interface et des méthodes pour créer un compte et se connecter à l'application.
 * (╯°□°)╯︵ ʞooqǝɔɐɟ
 *
 * @export
 * @class AuthentificationPage
 * @extends {GenericPage}
 */
@IonicPage()
@Component({
  selector: 'page-authentification',
  templateUrl: 'authentification.html'
})
export class AuthentificationPage extends GenericPage {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * défini la redirection vers l'accueil une fois connecté (mais permet de retourner sur cette page une fois connecté)
   *
   * @private
   * @static
   * @type {boolean}
   * @memberof AuthentificationPage
   */
  private static autoRedirect: boolean = true;

  /**
   * Flux des connexions/déconnexion (notament pour les auto redirect)
   *
   * @private
   * @type {Subscription}
   * @memberof AuthentificationPage
   */
  private connSub: Subscription;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * Profile utilisateur firebase (si connecté)
   *
   * @protected
   * @type {User}
   * @memberof AuthentificationPage
   */
  protected userProfile: User | null;

  /**
   * choix de l'utilisateur si il n'est pas connecté
   *
   * @protected
   * @type {('login' | 'create')}
   * @memberof AuthentificationPage
   */
  protected choice: 'login' | 'create';

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AuthentificationPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {GooglePlus} googlePlus
   * @param {FormBuilder} formBuilder
   * @param {DBServiceProvider} settingCtrl
   * @memberof AuthentificationPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.choice = 'login';
    const data = moment().format('YYYYMMDD');
    const time = moment().format('HHmmss');
    console.log('today is: ', data + ' and time: ', time);
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * Gère les redirection automatique une fois connecté vers la page principale
   *
   * @memberof AuthentificationPage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    this.connSub = this.authCtrl.getConnexionSubject().subscribe((user: User) => {
      this.userProfile = user;
      if (user != null && AuthentificationPage.autoRedirect) {
        AuthentificationPage.autoRedirect = false;
        this.navCtrl.parent.select(Global.HOMEPAGE);
      } else {
        AuthentificationPage.autoRedirect = true;
      }
    });
  }

  /**
   * termine les subscription, notament à la connexion de l'utilisateur
   *
   * @memberof AuthentificationPage
   */
  ionViewWillLeave(): void {
    if (this.connSub != null) {
      this.connSub.unsubscribe();
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @protected
   * @returns {boolean}
   * @memberof AuthentificationPage
   */
  protected loginAuthRequired(): boolean {
    return false;
  }

  /**
   * @protected
   * @returns {boolean}
   * @memberof AuthentificationPage
   */
  protected basicAuthRequired(): boolean {
    return false;
  }
}
