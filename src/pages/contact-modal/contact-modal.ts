import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

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
 * En fait ce n'est plus un moddal désolé pour le nom, une page normale c'est mieux...
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
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {NavParams} navParams
   * @param {ContactServiceProvider} contactsCtrl
   * @memberof ContactModalPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly contactsCtrl: ContactServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.exportedContacts = this.navParams.get('contacts');
    this.emailRequired = false;
    if (this.navParams.get('onlyEmail') != null) {
      this.emailRequired = this.navParams.get('onlyEmail');
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
    header.title = 'Selectionner vos contacts';
    header.subtitle = 'Contacts disponibles';
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
  protected validate() {
    this.navCtrl.pop();
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
    this.headerize();
  }

  /**
   * tri par ordre alphabétique et ajoute des header à la liste des contacts
   *
   * @private
   * @memberof ContactModalPage
   */
  private headerize(): void {
    if (this.fullContactList.length > 0) {
      this.fullContactList.sort(compare);

      const listWithHeaders: ISimpleContact[] = [];
      let lastFirstChar: string = '';
      for (const contact of this.fullContactList) {
        if (normalize(contact.displayName).charAt(0) !== lastFirstChar) {
          lastFirstChar = normalize(contact.displayName).charAt(0);
          const header: ISelectableSimpleContact = Global.getBlankContact();
          header.displayName = lastFirstChar;
          header.isSelected = false;
          header.isHeader = true;
          listWithHeaders.push(header);
        }
        listWithHeaders.push(contact);
      }
      this.fullContactList = listWithHeaders;
    }
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
        this.validate();
        break;
    }
  }
}

/**************************************************************************/
/*********************** ISelectableSimpleContact *************************/
/**************************************************************************/

/**
 * permet d'ajouter un champs de selection sur les contact afin d'éviter un refresh en boucle sur le template
 *
 * @export
 * @interface ISelectableSimpleContact
 * @extends {ISimpleContact}
 */
export interface ISelectableSimpleContact extends ISimpleContact {
  /**
   * true si le contact est selectionné, false ou undefined sinon
   *
   * @type {boolean}
   * @memberof ISelectableSimpleContact
   */
  isSelected?: boolean;
  /**
   * true si il s'agit d'un header, false ou undefined sinon
   *
   * @type {boolean}
   * @memberof ISelectableSimpleContact
   */
  isHeader?: boolean;
}

/**************************************************************************/
/******************************* FUNCTIONS ********************************/
/**************************************************************************/

/**
 * permet de comparer deux ISimpleContact en fonction de leut nom affiché
 *
 * @param {ISimpleContact} a
 * @param {ISimpleContact} b
 * @returns {number} -1 si a est plus petit, 1 si b est plus petit, 0 si il sont égaux
 */
function compare(a: ISimpleContact, b: ISimpleContact): number {
  const aname = normalize(a.displayName);
  const bname = normalize(b.displayName);

  if (aname < bname) {
    return -1;
  }
  if (aname > bname) {
    return 1;
  }
  return 0;
}

/**
 * fonction de normalisation, utilisé notament pour comparer deux chaines
 *
 * @param {(string | null)} str
 * @returns {string}
 */
function normalize(str: string | null): string {
  if (str == null) {
    return '';
  }
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}
