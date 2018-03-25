import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { ISimpleContact } from './../../model/simple-contact';
import { ContactServiceProvider } from './../../providers/contact-service/contact-service';
import { Global } from './../../shared/global';

/**
 * Page orienté modal créée pour permettre de choisir plusieurs contacts parmis la listes des contacts du terminal.
 *
 * @export
 * @class ContactModalPage
 * @extends {GenericPage}
 */
@IonicPage()
@Component({
  selector: 'page-contact-modal',
  templateUrl: 'contact-modal.html'
})
export class ContactModalPage extends GenericPage {
  /**************************** PRIVATE FIELDS ******************************/
  /**
   * vrai si un mobile est obligatoire
   *
   * @private
   * @type {boolean}
   * @memberof ContactModalPage
   */
  private readonly mobileRequired: boolean;

  /**
   * vrai si un email est obligatoire
   *
   * @private
   * @type {boolean}
   * @memberof ContactModalPage
   */
  private readonly emailRequired: boolean;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * Map (ID=>contact)
   * Associe un id de contact à un objet de contact simplifié
   *
   * @type {ISimpleContact[]}
   * @memberof ContactModalPage
   */
  protected exportedContacts: ISimpleContact[];

  /**
   * Ensemble des contacts du terminal
   *
   * @type {Promise<ISimpleContact[]>}
   * @memberof ContactModalPage
   */
  protected fullContactList: ISelectableSimpleContact[];

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of ContactModalPage.
   * @param {NavParams} navParams
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {ViewController} viewCtrl
   * @param {Contacts} contactsCtrl
   * @memberof ContactModalPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly viewCtrl: ViewController,
    private readonly navParams: NavParams,
    private readonly contactsCtrl: ContactServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);

    this.exportedContacts = this.navParams.get('contacts');

    this.emailRequired = false;
    if (this.navParams.get('onlyEmail') != null) {
      this.emailRequired = this.navParams.get('onlyEmail');
    }

    this.mobileRequired = false;
    if (this.navParams.get('onlyMobile') != null) {
      this.mobileRequired = this.navParams.get('onlyMobile');
    }

    this.fullContactList = [];
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * Initialise le header et recherches les contacts du téléphone
   *
   * @memberof ContactModalPage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    const header = Global.getValidablePageData();
    header.title = 'Vos contacts';
    this.evtCtrl.setHeader(header);
    this.initSelected();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Valide et termine la saisie des contacts
   *
   * @protected
   * @memberof ContactModalPage
   */
  protected dismiss() {
    const data = {};
    this.viewCtrl.dismiss(data);
  }

  /**
   * permet de selectionné ou de déselectionné un contact
   *
   * @protected
   * @param {ISimpleContact} contact
   * @memberof ContactModalPage
   */
  protected select(contact: ISelectableSimpleContact): void {
    if (this.isSelected(contact)) {
      this.deleteFromContact(contact);
      contact.isSelected = false;
    } else {
      this.exportedContacts.push(contact);
      contact.isSelected = true;
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * ne réalise les opération de sélection qu'au début
   *
   * @private
   * @memberof ContactModalPage
   */
  private async initSelected(): Promise<void> {
    const contactList: ISelectableSimpleContact[] = await this.contactsCtrl.getContactList(
      this.mobileRequired,
      this.emailRequired
    );

    for (const entry of contactList) {
      if (this.isSelected(entry)) {
        entry.isSelected = true;
      } else {
        entry.isSelected = false;
      }
    }

    this.fullContactList = contactList;
  }

  /**
   * retourne true si le contact est selectionné
   * A fixer, attente active pas top :/
   *
   * @private
   * @param {ISimpleContact} contact
   * @returns {boolean}
   * @memberof ContactModalPage
   */
  private isSelected(contact: ISimpleContact): boolean {
    return this.exportedContacts.find(c => c.id === contact.id) != null;
  }

  /**
   * Supprime un contact de la liste des contacts exportés
   *
   * @private
   * @param {ISimpleContact} contact
   * @memberof ContactModalPage
   */
  private deleteFromContact(contact: ISimpleContact): void {
    const id = this.exportedContacts.findIndex(c => c.id === contact.id);
    if (id !== -1) {
      this.exportedContacts.splice(id, 1);
    }
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @param {IMenuRequest} req
   * @memberof ContactModalPage
   */
  protected menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.VALIDATE:
        this.dismiss();
        break;
    }
  }
}

/**
 * permet d'ajouter un champs de selection sur les contact afin d'éviter un refresh en boucle sur le template
 *
 * @export
 * @interface ISelectableSimpleContact
 * @extends {ISimpleContact}
 */
export interface ISelectableSimpleContact extends ISimpleContact {
  isSelected?: boolean;
}
