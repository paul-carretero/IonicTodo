import { NavController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { IMenuRequest } from '../model/menu-request';
import { MenuRequestType } from '../model/menu-request-type';
import { EventServiceProvider } from '../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { INavRequest } from './../model/nav-request';
import { AuthServiceProvider } from './../providers/auth-service/auth-service';
import { UiServiceProvider } from './../providers/ui-service/ui-service';

export abstract class GenericPage {
  private navSub: Subscription;

  /**
   * Subscription au evenement utilisateur sur le menu
   *
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  private menuEvtSub: Subscription;

  private secrureAuthSub: Subscription;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  constructor(
    public navCtrl: NavController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    public authCtrl: AuthServiceProvider,
    public uiCtrl: UiServiceProvider
  ) {}

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewDidLoad(): void {
    this.securePage();
  }

  ionViewWillUnload(): void {
    this.tryUnSub(this.secrureAuthSub);
  }

  /**
   * utiliser super.ionViewWillEnter() si besoin dans les classe filles.
   * ecoute les demande de nav du menu et les traite dans l'onglet courant.
   * ecoute également les évenement menu poppover
   * @memberof GenericPage
   */
  ionViewWillEnter() {
    this.navSub = this.evtCtrl
      .getNavRequestSubject()
      .subscribe((navReq: INavRequest) => this.navCtrl.push(navReq.page));

    this.menuEvtSub = this.evtCtrl
      .getMenuRequestSubject()
      .subscribe((req: IMenuRequest) => {
        switch (req.request) {
          case MenuRequestType.SPEECH_SYNTH:
            this.ttsCtrl.synthText(this.generateDescription());
            break;
          case MenuRequestType.HELP:
            this.uiCtrl.alert('Aide sur la page', this.generateHelp());
            break;
        }
        this.menuEventHandler(req);
      });
  }

  /**
   * Termine les subscription aux évenement de menu et de navigation (par le menu de gauche)
   *
   * @memberof GenericPage
   */
  ionViewDidLeave() {
    this.clear();
  }

  private clear() {
    this.tryUnSub(this.navSub);
    this.tryUnSub(this.menuEvtSub);
  }

  private securePage(): void {
    this.secrureAuthSub = this.authCtrl.getConnexionSubject().subscribe(() => {
      if (this.basicAuthRequired() && !this.authCtrl.navAllowed()) {
        this.navCtrl.popToRoot();
      }
      if (this.loginAuthRequired() && !this.authCtrl.isConnected()) {
        this.navCtrl.popToRoot();
      }
    });
  }

  /**************************************************************************/
  /******************************** HELPER **********************************/
  /**************************************************************************/

  public tryUnSub(sub: Subscription) {
    if (sub != null) {
      sub.unsubscribe();
    }
  }

  public dateToString(date: Date): string {
    return date.toLocaleDateString();
  }

  /**************************************************************************/
  /****************************** OVERRIDABLE *******************************/
  /**************************************************************************/

  /**
   * Retourne un text html décrivant l'utilisation et la compréhention de la page
   * Devrait être overriden par les page étendant la page générique
   *
   * @returns {string}
   * @memberof GenericPage
   */
  public generateHelp(): string {
    return 'Aucune aide disponible pour cette page :/';
  }

  /**
   * Permet de gérer les actions a réaliser en fonction de la page et du type de requête menu
   *
   * @abstract
   * @param {IMenuRequest} req
   * @memberof GenericPage
   */
  public abstract menuEventHandler(req: IMenuRequest): void;

  /**
   * Permet de générer une description de la page, notament pour la synthèse vocale
   *
   * @abstract
   * @returns {string} une description textuelle de la page
   * @memberof GenericPage
   */
  public abstract generateDescription(): string;

  /**
   * Permet de gérer la confidentialités des pages
   *
   * @abstract
   * @returns {boolean} true si la page ne doit être accéssible qu'une fois loggué avec un compte, false sinon
   * @memberof GenericPage
   */
  public abstract loginAuthRequired(): boolean;

  /**
   * Permet de gérer l'accéssibilité des pages
   *
   * @abstract
   * @returns {boolean} true si il faux naviguer en mode hors connexion ou connecté, false sinon
   * @memberof GenericPage
   */
  public abstract basicAuthRequired(): boolean;
}
