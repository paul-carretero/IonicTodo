import { NavController, NavParams } from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { ITodoListPath } from './../../model/todo-list-path';
import { MenuRequestType } from '../../model/menu-request-type';

/**
 * page abstraite pour la gestion des fonctionalités lié à la génération d'un objet de liste exportable par valeur ou référence ou référence en lecture seule
 *
 * @export
 * @class GenericSharer
 * @extends {GenericPage}
 */
export class GenericSharer extends GenericPage {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * requête utilisateur pour l'échange, contenant également l'uuid de la liste à partaer
   *
   * @private
   * @type {IMenuRequest}
   * @memberof GenericSharer
   */
  private readonly request: IMenuRequest;

  /**
   * objet d'échange de liste pour un envoie par valeur ou par référence, défini par le choix utilisateur
   *
   * @private
   * @type {ITodoListPath}
   * @memberof GenericSharer
   */
  private readonly listPath: ITodoListPath;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * choix courrant de l'utilisateur sur, respectivement, partage readonly, partage par référence, envoie par valeur
   *
   * @protected
   * @type {('lock' | 'unlock' | 'send')}
   * @memberof GenericSharer
   */
  protected choice: 'lock' | 'unlock' | 'send';

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of GenericSharer.
   * @param {NavParams} navParams
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @memberof GenericSharer
   */
  constructor(
    protected readonly navParams: NavParams,
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.request = navParams.get('request');
    if (this.request != null && this.request.uuid != null) {
      this.listPath = this.todoCtrl.getListLink(this.request.uuid);
    }
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * Charge le liste demandé et la stocke dans un json
   *
   * @memberof GenericSharer
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();

    if (this.listPath == null) {
      this.uiCtrl.alert('Echec', 'Une erreur est survenue pendant la tentative de partage');
      this.navCtrl.pop();
    }

    if (this.request == null || this.request.uuid == null) {
      this.navCtrl.pop();
    } else {
      if (this.request.request === MenuRequestType.SEND) {
        this.choice = 'send';
      } else {
        this.choice = 'unlock';
      }

      this.deleteSub = this.todoCtrl
        .getDeleteSubject(this.request.uuid)
        .subscribe(() => this.hasBeenRemoved(true));
    }
  }

  /**
   * désinscription de la surveillance de la suppression de liste
   *
   * @memberof GenericSharer
   */
  ionViewWillLeave(): void {
    super.ionViewWillLeave();
    this.todoCtrl.unsubDeleteSubject();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * retourne le json de l'échange, configuré en fonction du choix utilisateur
   *
   * @readonly
   * @protected
   * @type {string}
   * @memberof GenericSharer
   */
  protected get json(): string {
    return JSON.stringify(this.list);
  }

  /**
   * retourne l'objet déchange de liste en fonction du choix utilisateur et le configure si bersoin
   *
   * @readonly
   * @protected
   * @type {ITodoListPath}
   * @memberof GenericSharer
   */
  protected get list(): ITodoListPath {
    if (this.choice === 'send') {
      this.listPath.shareByReference = false;
      this.listPath.locked = false;
    } else if (this.choice === 'lock') {
      this.listPath.shareByReference = true;
      this.listPath.locked = true;
    } else {
      this.listPath.shareByReference = true;
      this.listPath.locked = false;
    }
    return this.listPath;
  }

  /**
   * génère une chaine de caractère décrivant le choix utilisateur pour l'échange de liste
   *
   * @readonly
   * @protected
   * @type {string}
   * @memberof GenericSharer
   */
  protected get shareSendDesc(): string {
    if (this.choice === 'send') {
      return "Votre (ou vos) destinataire(s) recevront une copie de cette liste. Vos modification future n'impacteront pas leur liste et inversement";
    } else if (this.choice === 'lock') {
      return 'Votre (ou vos) destinataire(s) recevront un lien vers cette liste. Vos modification future seront repercuter sur leur liste mais ils ne pourront pas modifier cette liste ou les tâche qui la compose';
    } else {
      return 'Votre (ou vos) destinataire(s) recevront un lien vers cette liste. Vos modification future seront repercuter sur leur liste et inversement';
    }
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * pour partager une liste on doit être connecté
   * @override
   * @protected
   * @returns {boolean}
   * @memberof GenericSharer
   */
  protected loginAuthRequired(): boolean {
    return true;
  }

  /**
   * pour partager une liste on doit être connecté
   * @override
   * @protected
   * @returns {boolean}
   * @memberof GenericSharer
   */
  protected basicAuthRequired(): boolean {
    return true;
  }

  /**
   * pour partager une liste on doit être connecté aux interwebz
   * @override
   * @protected
   * @returns {boolean}
   * @memberof GenericReceiver
   */
  protected networkRequired(): boolean {
    return true;
  }
}
