import { ITodoList } from './../model/todo-list';
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
  /**
   * subscription aux requêtes de navigation internes
   *
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  private navSub: Subscription;

  /**
   * Subscription au evenement utilisateur sur le menu
   *
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  private menuEvtSub: Subscription;

  /**
   * subscription pour les connexion utilisateur et la vérification des authorisation
   *
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  private secureAuthSub: Subscription;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of GenericPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @memberof GenericPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider
  ) {}

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * vérifie si la page à le droit d'être chargé
   *
   * @memberof GenericPage
   */
  ionViewDidLoad(): void {
    this.securePage();
  }

  /**
   * termine la subscription d'authorisation
   *
   * @memberof GenericPage
   */
  ionViewWillUnload(): void {
    this.tryUnSub(this.secureAuthSub);
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
    this.tryUnSub(this.navSub);
    this.tryUnSub(this.menuEvtSub);
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * vérifie l'authorisation d'afficher la page en fonction de la connexione et des données renseignée par la page
   *
   * @private
   * @memberof GenericPage
   */
  private securePage(): void {
    this.secureAuthSub = this.authCtrl.getConnexionSubject().subscribe(() => {
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

  /**
   * tente de terminé une subscription
   *
   * @protected
   * @param {Subscription} sub
   * @memberof GenericPage
   */
  protected tryUnSub(sub: Subscription) {
    if (sub != null) {
      sub.unsubscribe();
    }
  }

  /**
   * converti une date dans un forma jj/mm/aaaa
   *
   * @protected
   * @param {Date} date
   * @returns {string}
   * @memberof GenericPage
   */
  protected dateToString(date: Date): string {
    return date.toLocaleDateString();
  }

  protected areMatching(list: ITodoList, search: string): boolean {
    return (
      list.name.toUpperCase().includes(search) ||
      list.author.email.toUpperCase().includes(search) ||
      list.author.displayName.toUpperCase().includes(search) ||
      search === '' ||
      search === '#' ||
      search == null
    );
  }

  /**************************************************************************/
  /****************************** OVERRIDABLE *******************************/
  /**************************************************************************/

  /**
   * Retourne un text html décrivant l'utilisation et la compréhention de la page
   * Devrait être overriden par les page étendant la page générique
   *
   * @abstract
   * @protected
   * @returns {string}
   * @memberof GenericPage
   */
  protected generateHelp(): string {
    return 'Aucune aide disponible pour cette page :/';
  }

  /**
   * Permet de gérer les actions a réaliser en fonction de la page et du type de requête menu
   *
   * @protected
   * @abstract
   * @param {IMenuRequest} req
   * @memberof GenericPage
   */
  protected abstract menuEventHandler(req: IMenuRequest): void;

  /**
   * Permet de générer une description de la page, notament pour la synthèse vocale
   *
   * @protected
   * @abstract
   * @returns {string} une description textuelle de la page
   * @memberof GenericPage
   */
  protected abstract generateDescription(): string;

  /**
   * Permet de gérer la confidentialités des pages
   *
   * @protected
   * @abstract
   * @returns {boolean} true si la page ne doit être accéssible qu'une fois loggué avec un compte, false sinon
   * @memberof GenericPage
   */
  protected abstract loginAuthRequired(): boolean;

  /**
   * Permet de gérer l'accéssibilité des pages
   *
   * @protected
   * @abstract
   * @returns {boolean} true si il faux naviguer en mode hors connexion ou connecté, false sinon
   * @memberof GenericPage
   */
  protected abstract basicAuthRequired(): boolean;
}
