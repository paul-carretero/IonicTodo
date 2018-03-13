import { AuthServiceProvider } from './../providers/auth-service/auth-service';
import {
  AlertController,
  Loading,
  LoadingController,
  NavController,
  ToastController
} from 'ionic-angular';
import { Subscription } from 'rxjs';

import { MenuRequest } from '../model/menu-request';
import { EventServiceProvider } from '../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { NavRequest } from './../model/nav-request';
import { User } from '@firebase/auth-types';

export abstract class GenericPage {
  public loading: Loading;

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
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider,
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
    this.navSub = this.evtCtrl
      .getNavRequestSubject()
      .subscribe((navReq: NavRequest) => this.navCtrl.push(navReq.page));

    this.menuEvtSub = this.evtCtrl
      .getMenuRequestSubject()
      .subscribe((req: MenuRequest) => {
        switch (req) {
          case MenuRequest.SPEECH_SYNTH:
            this.ttsCtrl.synthText(this.generateDescription());
            break;
          case MenuRequest.HELP:
            this.alert('Aide sur la page', this.generateHelp());
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
    this.secrureAuthSub = this.authCtrl.getConnexionSubject().subscribe((user: User) => {
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
    return new Promise<boolean>((resolve, reject) => {
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
  public abstract menuEventHandler(req: MenuRequest): void;

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
