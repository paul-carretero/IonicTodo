import { NavController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { IMenuRequest } from '../model/menu-request';
import { MenuRequestType } from '../model/menu-request-type';
import { EventServiceProvider } from '../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { INavRequest } from './../model/nav-request';
import { ITodoList } from './../model/todo-list';
import { AuthServiceProvider } from './../providers/auth-service/auth-service';
import { UiServiceProvider } from './../providers/ui-service/ui-service';

/**
 * page générique de l'application, fournie des méthode helper et overridable pour facilité le déploiements d'autre pages
 *
 * @export
 * @abstract
 * @class GenericPage
 */
export abstract class GenericPage {
  /**
   * subscription aux requêtes de navigation internes
   *
   * @static
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  private static navSub: Subscription;

  /**
   * Subscription au evenement utilisateur sur le menu
   *
   * @static
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  private static menuEvtSub: Subscription;

  /**
   * subscription pour les connexion utilisateur et la vérification des authorisation
   *
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  private secureAuthSub: Subscription;

  /**
   * subscription pour la suppression de la liste ou du todo lors de l'édition.
   *
   * @private
   * @type {Subscription}
   * @memberof GenericPage
   */
  protected deleteSub: Subscription;

  /**
   * Connexion aux évenements de réseau (connexion-déconnexion)
   *
   * @protected
   * @type {Subscription}
   * @memberof GenericPage
   */
  protected netSub: Subscription;

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
    this.checkNet();
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
    this.tryUnSub(GenericPage.navSub);
    this.tryUnSub(GenericPage.menuEvtSub);

    GenericPage.navSub = this.evtCtrl
      .getNavRequestSubject()
      .subscribe((navReq: INavRequest) => {
        if (this.allowNavigate()) {
          this.navCtrl.push(navReq.page, navReq.data);
        }
      });

    GenericPage.menuEvtSub = this.evtCtrl
      .getMenuRequestSubject()
      .subscribe((req: IMenuRequest) => {
        switch (req.request) {
          case MenuRequestType.SPEECH_SYNTH:
            this.ttsCtrl.synthText(this.generateDescription());
            break;
          case MenuRequestType.HELP:
            const help = this.generateHelp();
            if (help.messages.length > 1) {
              this.uiCtrl.presentModal(help, 'HelpModalPage');
            } else if (help.messages.length === 1) {
              this.uiCtrl.alert_message(
                "Aide sur l'application",
                help.subtitle,
                help.messages[0]
              );
            }
            break;
        }
        this.menuEventHandler(req);
      });
  }

  /**
   * Termine les subscription aux évenement de menu et de navigation (par le menu de gauche)
   * et à la surveillance de suppression de contenus
   *
   * @memberof GenericPage
   */
  ionViewWillLeave() {
    this.tryUnSub(this.deleteSub);
    this.tryUnSub(this.netSub);
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * pop une page en cas de déconnexion
   *
   * @private
   * @memberof GenericPage
   */
  private checkNet(): void {
    if (this.networkRequired()) {
      this.netSub = this.evtCtrl.getNetStatusObs().subscribe(status => {
        if (!status) {
          this.navCtrl.pop();
        }
      });
    }
  }

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
   * retourne si l'utilisateur est connecté
   *
   * @readonly
   * @protected
   * @type {boolean}
   * @memberof GenericPage
   */
  protected get isConnected(): boolean {
    return this.authCtrl.isConnected();
  }

  /**
   * tente de terminer une subscription
   *
   * @protected
   * @param {Subscription} sub
   * @memberof GenericPage
   */
  protected tryUnSub(sub: Subscription | null) {
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

  /**
   * retourne si la recherche correspond à une liste.
   * Regarde le nom de la liste et le nom et l'email de l'autheur si il sont renseignés
   *
   * @protected
   * @param {ITodoList} list
   * @param {string} search
   * @returns {boolean}
   * @memberof GenericPage
   */
  protected areMatching(list: ITodoList, search: string): boolean {
    if (search == null || search === '' || search === '#') {
      return true;
    }
    if (list == null || list.name == null) {
      return false;
    }
    if (list.name.toUpperCase().includes(search)) {
      return true;
    }
    if (list.author == null) {
      return false;
    }
    if (list.author.email != null && list.author.email.toUpperCase().includes(search)) {
      return true;
    }
    if (
      list.author.displayName != null &&
      list.author.displayName.toUpperCase().includes(search)
    ) {
      return true;
    }
    return false;
  }

  /**
   * handler si une liste ou une tache à été supprimé et n'est plus disponible, par défault poptoroot
   *
   * @protected
   * @param {boolean} isList
   * @memberof GenericPage
   */
  protected hasBeenRemoved(isList: boolean): void {
    if (isList) {
      this.uiCtrl.displayToast("La liste a été supprimée et n'est plus disponible");
    } else {
      this.uiCtrl.displayToast("La tâche a été supprimée et n'est plus disponible");
    }
    this.navCtrl.popToRoot();
  }

  /**************************************************************************/
  /****************************** OVERRIDABLE *******************************/
  /**************************************************************************/

  /**
   * Retourne un text html décrivant l'utilisation et la compréhention de la page
   * Devrait être overriden par les page étendant la page générique
   * Overiddable éventuellement
   *
   * @protected
   * @returns {string}
   * @memberof GenericPage
   */
  protected generateHelp(): { subtitle: string; messages: string[] } {
    return { subtitle: '', messages: ['Aucune aide disponible pour cette page :/'] };
  }

  /**
   * méthode overridable par les page ayant besoin du réseau pour leur logique métier.
   * Si le réseau n'est pas disponible alors lors du chargement on pop une page
   * Overiddable éventuellement
   *
   * @protected
   * @returns {boolean}
   * @memberof GenericPage
   */
  protected networkRequired(): boolean {
    return false;
  }

  /**
   * Permet de gérer les actions a réaliser en fonction de la page et du type de requête menu
   * Overiddable éventuellement
   *
   * @protected
   * @param {IMenuRequest} req
   * @memberof GenericPage
   */
  protected menuEventHandler(req: IMenuRequest): void {
    req;
  }

  /**
   * Permet de générer une description de la page, notament pour la synthèse vocale
   *
   * @protected
   * @returns {string} une description textuelle de la page
   * @memberof GenericPage
   */
  protected generateDescription(): string {
    return "Désolé mais aucune description de la page n'est disponible";
  }

  /**
   * Permet de gérer la confidentialités des pages
   * Overiddable éventuellement
   *
   * @protected
   * @returns {boolean} true si la page ne doit être accéssible qu'une fois loggué avec un compte, false sinon
   * @memberof GenericPage
   */
  protected loginAuthRequired(): boolean {
    return false;
  }

  /**
   * Permet de gérer l'accéssibilité des pages.
   * Overiddable éventuellement
   *
   * @protected
   * @returns {boolean} true si il faux naviguer en mode hors connexion ou connecté, false sinon
   * @memberof GenericPage
   */
  protected basicAuthRequired(): boolean {
    return true;
  }

  /**
   * retourne true si l'on peut accépter les demande de navigation
   *
   * @protected
   * @returns {boolean}
   * @memberof GenericPage
   */
  protected allowNavigate(): boolean {
    return true;
  }
}
