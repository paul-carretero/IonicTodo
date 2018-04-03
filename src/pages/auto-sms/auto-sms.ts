import { DatePicker } from '@ionic-native/date-picker';
import { Global } from './../../shared/global';
import { ISimpleContact } from './../../model/simple-contact';
import { AutoSmsServiceProvider } from './../../providers/auto-sms-service/auto-sms-service';
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { GenericPage } from '../../shared/generic-page';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { Subscription } from 'rxjs/Subscription';
import { IPlanifiedSms } from '../../model/planified-sms';
import moment from 'moment';
import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';

/**
 * Page affichant une interface pour créer, voir et modifier des sms automatique
 *
 * @export
 * @class AutoSmsPage
 */
@IonicPage()
@Component({
  selector: 'page-auto-sms',
  templateUrl: 'auto-sms.html'
})
export class AutoSmsPage extends GenericPage {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * liste des sms en attente
   *
   * @protected
   * @type {IPlanifiedSms[]}
   * @memberof AutoSmsPage
   */
  protected autoSmsList: IPlanifiedSms[];

  /**
   * subscription à la liste des sms en attente
   *
   * @protected
   * @type {Subscription}
   * @memberof AutoSmsPage
   */
  protected smsSub: Subscription;

  /**
   * list des contacts à ajouter à l'envoi
   *
   * @protected
   * @type {ISimpleContact[]}
   * @memberof AutoSmsPage
   */
  protected contactList: ISimpleContact[];

  /**
   * date d'envoie planifié du sms
   *
   * @protected
   * @type {(Date | null)}
   * @memberof AutoSmsPage
   */
  protected date: Date | null;

  /**
   * corps du message
   *
   * @protected
   * @type {string}
   * @memberof AutoSmsPage
   */
  protected message: string;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AutoSmsPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {AutoSmsServiceProvider} autoSmsCtrl
   * @param {DatePicker} datePicker
   * @memberof AutoSmsPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly autoSmsCtrl: AutoSmsServiceProvider,
    private readonly datePicker: DatePicker
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.contactList = [];
    this.date = null;
    this.message = '';
    this.autoSmsList = [];
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise le tableau des sms planifié existant
   *
   * @memberof AutoSmsPage
   */
  ionViewDidLoad() {
    super.ionViewDidLoad();
    this.smsSub = this.autoSmsCtrl.getPlanifiedSmsObs().subscribe(smsList => {
      this.filterAndApplySmsList(smsList);
    });
  }

  /**
   * défini le header de la page
   *
   * @memberof AutoSmsPage
   */
  ionViewWillEnter(): void {
    const header = Global.getValidablePageData();
    header.title = 'SMS Planifiés';
    header.subtitle = 'plannifier vos sms';
    this.evtCtrl.setHeader(header);
  }

  /**
   * termine la subscription au tableau des sms planifié existant
   *
   * @memberof AutoSmsPage
   */
  ionViewWillUnload() {
    super.ionViewWillUnload();
    this.tryUnSub(this.smsSub);
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @param {IMenuRequest} req
   * @memberof ListEditPage
   */
  protected menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.VALIDATE:
        this.validate();
        break;
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * tri et applique la date en chaine sur un tableau d'entrée de sms planifié
   *
   * @private
   * @param {IPlanifiedSms[]} list
   * @memberof AutoSmsPage
   */
  private filterAndApplySmsList(list: IPlanifiedSms[]): void {
    for (const item of list) {
      item.dateStr = this.getDateStr(item.date);
    }
    this.autoSmsList = list.sort(compare);
  }

  /**
   * convertie une date en humainement lisible
   *
   * @private
   * @param {Date} date
   * @returns {string}
   * @memberof AutoSmsPage
   */
  private getDateStr(date: Date): string {
    return moment(date)
      .locale('fr')
      .format('ddd D MMM, HH:mm');
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * permet si possible d'ajouter un sms planifié dans la liste.
   * reset les constante du formulaire une fois fais
   *
   * @protected
   * @memberof AutoSmsPage
   */
  protected validate(): void {
    if (!this.isFormValid) {
      this.uiCtrl.displayToast("Impossible d'ajouter le SMS, veuillez vérifier le formulaire");
    } else if (this.date != null) {
      const newAutoSms = Global.getBlankPlanifiedSms();
      newAutoSms.message = String(this.message);
      newAutoSms.date = new Date(this.date);
      newAutoSms.contacts = this.contactList.slice(0);
      this.autoSmsCtrl.addPlanifiedSms(newAutoSms);
      this.uiCtrl.displayToast('Votre sms à bien été ajouté dans la liste des sms plannifié');
      this.contactList = [];
      this.message = '';
      this.date = null;
    }
  }

  /**
   * permet de supprimer un sms plannifié de la liste
   *
   * @protected
   * @param {IPlanifiedSms} sms
   * @memberof AutoSmsPage
   */
  protected rmPlanifiedSms(sms: IPlanifiedSms) {
    this.autoSmsCtrl.rmPlanifiedSms(sms);
  }

  /**
   * ouvre la page pour selectionner des contacts
   *
   * @protected
   * @memberof AutoSmsPage
   */
  protected openContactPopup(): void {
    this.uiCtrl.presentModal(
      {
        contacts: this.contactList,
        email: false
      },
      'ContactModalPage'
    );
  }

  /**
   * supprime un contact de la liste des contacts qui recevront une invitation
   *
   * @protected
   * @param {ISimpleContact} contact
   * @memberof AutoSmsPage
   */
  protected deleteContact(contact: ISimpleContact): void {
    const index = this.contactList.findIndex(c => c.id === contact.id);
    if (index !== -1) {
      this.contactList.splice(index, 1);
    }
  }

  /**
   * permet de choisir la date d'envoie du sms
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof AutoSmsPage
   */
  protected async selectDate(): Promise<void> {
    const title: string = "choisissez une date d'envoi";
    let date: Date = new Date();
    if (this.date != null) {
      date = this.date;
    }

    let newDate: Date | null;
    try {
      newDate = await this.datePicker.show({
        date: date,
        mode: 'datetime',
        minDate: new Date().valueOf(),
        is24Hour: true,
        titleText: title,
        locale: 'fr-FR',
        androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_DARK
      });
    } catch (error) {
      newDate = null;
    }

    this.date = newDate;
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**
   * retourne true si le formulaire est valide (toutes les données sont renseignées)
   *
   * @readonly
   * @protected
   * @type {boolean}
   * @memberof AutoSmsPage
   */
  protected get isFormValid(): boolean {
    return this.date != null && this.message.length > 0 && this.contactList.length > 0;
  }

  protected get dateStr(): string {
    if (this.date == null) {
      return 'Définir une Date';
    }
    return this.getDateStr(this.date);
  }
}

/**
 * permet de comparer deux sms planifié par leur date
 *
 * @param {IPlanifiedSms} a
 * @param {IPlanifiedSms} b
 * @returns {number}
 */
function compare(a: IPlanifiedSms, b: IPlanifiedSms): number {
  if (a.date.getTime() < b.date.getTime()) {
    return -1;
  }
  if (a.date.getTime() > b.date.getTime()) {
    return 1;
  }
  return 0;
}
