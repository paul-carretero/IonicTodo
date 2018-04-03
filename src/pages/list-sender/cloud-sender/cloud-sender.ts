import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { ICloudSharedList } from './../../../model/cloud-shared-list';
import { ISimpleContact } from './../../../model/simple-contact';
import { CloudServiceProvider } from './../../../providers/cloud-service/cloud-service';
import { EventServiceProvider } from './../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from './../../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { Global } from './../../../shared/global';
import { GenericSharer } from './../generic-sharer';
import { ContactServiceProvider } from '../../../providers/contact-service/contact-service';
import { AlertInputOptions } from 'ionic-angular/components/alert/alert-options';

/**
 * page permettant d'envoyer une liste à des contacts ou sur le cloud ohmytask
 *
 * @export
 * @class CloudSenderPage
 * @extends {GenericSharer}
 */
@IonicPage()
@Component({
  selector: 'page-cloud-sender',
  templateUrl: 'cloud-sender.html'
})
export class CloudSenderPage extends GenericSharer {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * donnée de la liste pour export sur le cloud, contient notament une référence vers cette liste
   *
   * @private
   * @type {ICloudSharedList}
   * @memberof CloudSenderPage
   */
  private readonly shareData: ICloudSharedList;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * listes, éventuellement vide, des contacts associés à ce partage (si vide alors on utilise le cloud publique, sinon seul les contact peuvent voir la liste)
   *
   * @protected
   * @type {ISimpleContact[]}
   * @memberof CloudSenderPage
   */
  protected readonly contactList: ISimpleContact[];

  /**
   * true si l'on doit envoyer un sms aux contacts selectionné ayant un mobile lors de la création du partage
   *
   * @protected
   * @type {boolean}
   * @memberof CloudSenderPage
   */
  protected sendSMS: boolean = false;

  /**
   * mot de passe éventuelement null protégeant l'envoie si il s'agit d'un envoie vers le cloud publique
   *
   * @protected
   * @type {(string | null)}
   * @memberof CloudSenderPage
   */
  protected password: string | null;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of CloudSenderPage.
   * @param {NavParams} navParams
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {CloudServiceProvider} cloudCtrl
   * @param {ContactServiceProvider} contactCtrl
   * @memberof CloudSenderPage
   */
  constructor(
    public readonly navParams: NavParams,
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly cloudCtrl: CloudServiceProvider,
    private readonly contactCtrl: ContactServiceProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
    this.shareData = Global.getDefaultCloudShareData();
    this.contactList = [];
    this.password = null;
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * au chargement de la page, met à jour le header
   *
   * @memberof CloudSenderPage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Exporter en ligne';
    if (this.list.listUUID != null) {
      pageData.subtitle = 'Liste ' + this.todoCtrl.getAListSnapshot(this.list.listUUID).name;
    }
    this.evtCtrl.setHeader(pageData);
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**
   * retourne un tableau désignant plus précisément l'opération en cours
   *
   * @readonly
   * @protected
   * @type {string[]}
   * @memberof CloudSenderPage
   */
  protected get sendPartage(): string[] {
    if (this.choice === 'send') {
      return ['envoyer', 'envoyée', 'envoi'];
    }
    return ['partager', 'partagée', 'partage'];
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * créer l'objet de partage et l'envoie sur le cloud ohmytask
   *
   * @private
   * @param {(string | null)} email
   * @returns {Promise<void>}
   * @memberof CloudSenderPage
   */
  private async share(email: string | null): Promise<void> {
    this.uiCtrl.showLoading(this.sendPartage[2] + ' de votre liste en cours');
    this.shareData.list = this.list;

    if (this.password === '' || this.password === undefined) {
      this.password = null;
    }

    this.shareData.author = await this.authCtrl.getAuthor(true);
    this.shareData.email = email;
    this.shareData.password = this.password;
    this.shareData.shakeToShare = false;
    this.shareData.name = await this.cloudCtrl.getListName(this.list);

    await this.cloudCtrl.postNewShareRequest(this.shareData);

    this.uiCtrl.dismissLoading();
    this.uiCtrl.displayToast('La liste à été ' + this.sendPartage[1] + ' avec succès');
    this.navCtrl.pop();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * gère le partage, soit aux contacts selectionné, soit sur le
   *
   * @protected
   * @memberof CloudSenderPage
   */
  protected shareWrapper(): void {
    if (this.contactList.length > 0) {
      for (const contact of this.contactList) {
        if (contact.email == null) {
          this.share(null);
        } else {
          this.share(contact.email);
        }
      }
    } else {
      this.share(null);
    }
    if (this.sendSMS) {
      this.contactCtrl.sendInviteSms(this.contactList);
    }
  }

  /**
   * ouvre la page pour selectionner des contacts
   *
   * @protected
   * @memberof CloudSenderPage
   */
  protected openContactPopup(): void {
    this.uiCtrl.presentModal(
      {
        contacts: this.contactList,
        email: true
      },
      'ContactModalPage'
    );
  }

  /**
   * supprime un contact de la liste des contacts qui recevront une invitation
   *
   * @protected
   * @param {ISimpleContact} contact
   * @memberof CloudSenderPage
   */
  protected deleteContact(contact: ISimpleContact): void {
    const index = this.contactList.findIndex(c => c.id === contact.id);
    if (index !== -1) {
      this.contactList.splice(index, 1);
    }
  }

  /**
   * ouvre un popup pour créer un contact et si possible, l'ajoute à la liste des contacts de ce todo
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof CloudSenderPage
   */
  protected async openCreateContact(): Promise<void> {
    const inputs: AlertInputOptions[] = [
      {
        name: 'name',
        placeholder: 'Nom (requis)',
        type: 'text'
      },
      {
        name: 'email',
        placeholder: 'E-Mail (requis)',
        type: 'email'
      },
      {
        name: 'mobile',
        placeholder: 'Mobile (optionnel)',
        type: 'phone'
      }
    ];

    try {
      const res = await this.uiCtrl.presentPrompt(
        'Nouveau Contact',
        'Associer un contact à ce partage ',
        inputs
      );

      const newContact = Global.getBlankContact();
      if (
        res != null &&
        res.name != null &&
        res.name !== '' &&
        res.email != null &&
        res.email !== ''
      ) {
        newContact.displayName = res.name;
        newContact.email = res.email;
        if (res.mobile !== '' && res.mobile !== undefined) {
          newContact.mobile = res.mobile;
        }

        this.contactList.push(newContact);
      } else {
        this.uiCtrl.alert('Echec', "Vous devez renseigner le nom et l'email du contact");
      }
    } catch (error) {
      // l'ajout à été annulé
    }
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @protected
   * @returns {boolean}
   * @memberof CloudSenderPage
   */
  protected networkRequired(): boolean {
    return true;
  }
}
