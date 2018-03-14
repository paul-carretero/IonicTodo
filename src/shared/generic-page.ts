import { AuthServiceProvider } from './../providers/auth-service/auth-service';
import {
  AlertController,
  Loading,
  LoadingController,
  NavController,
  ToastController,
  Events
} from 'ionic-angular';
import { Subscription } from 'rxjs';

import { IMenuRequest } from '../model/menu-request';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { INavRequest } from './../model/nav-request';
import { Global } from './global';
import { MenuRequestType } from '../model/menu-request-type';

export abstract class GenericPage {
  public loading: Loading;

  private secrureAuthSub: Subscription;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: Events,
    public ttsCtrl: SpeechSynthServiceProvider,
    public toastCtrl: ToastController,
    public authCtrl: AuthServiceProvider
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
    this.evtCtrl.subscribe(Global.BASIC_NAVIGATION_TOPIC, this._navReqHandler);
    this.evtCtrl.subscribe(Global.MENU_REQ_TOPIC, this._menuReqHandler);
  }

  /**
   * Termine les subscription aux évenement de menu et de navigation (par le menu de gauche)
   *
   * @memberof GenericPage
   */
  ionViewDidLeave() {
    this.evtCtrl.unsubscribe(Global.BASIC_NAVIGATION_TOPIC, this._navReqHandler);
    this.evtCtrl.unsubscribe(Global.MENU_REQ_TOPIC, this._menuReqHandler);
  }

  /******************************** HANDLER *********************************/

  private _navReqHandler(navReq: INavRequest): void {
    this.navCtrl.push(navReq.page);
  }

  private _menuReqHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.SPEECH_SYNTH:
        this.ttsCtrl.synthText(this.generateDescription());
        break;
      case MenuRequestType.HELP:
        this.alert('Aide sur la page', this.generateHelp());
        break;
    }
    this.menuEventHandler(req);
  }

  /**************************************************************************/
  /******************************** HELPER **********************************/
  /**************************************************************************/

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

  /**
   * affiche un élément modal de chargement
   *
   * @param {string} text le texte affiché lors du chargement
   * @param {number} [duration]
   * @memberof GenericPage
   */
  public showLoading(text: string, duration?: number): void {
    if (this.loading != null) {
      this.loading.dismissAll();
    }

    if (duration == null) {
      duration = 60000; // 1min max default
    }

    this.loading = this.loadingCtrl.create({
      content: text,
      dismissOnPageChange: true,
      duration: duration
    });
    this.loading.present();
  }

  /**
   * affiche une fenêtre d'information
   * @param {string} title le titre de la fenêtre d'alerte
   * @param {string} text le texte de le fenêtre d'alerte
   */
  public alert(title: string, text: string): void {
    this.alertCtrl
      .create({
        title: title,
        subTitle: text,
        buttons: ['OK']
      })
      .present();
  }

  public displayToast(message: string, duration?: number): void {
    if (duration == null) {
      duration = 3000;
    }
    this.toastCtrl
      .create({ message: message, duration: duration, position: 'bottom' })
      .present();
  }

  public tryUnSub(sub: Subscription) {
    if (sub != null) {
      sub.unsubscribe();
    }
  }

  public confirm(title: string, message: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.alertCtrl
        .create({
          title: title,
          message: message,
          buttons: [
            {
              text: 'Annuler',
              role: 'cancel',
              handler: () => {
                resolve(false);
              }
            },
            {
              text: 'Valider',
              handler: () => {
                resolve(true);
              }
            }
          ]
        })
        .present();
    });
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
   * @param {MenuRequest} req
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
