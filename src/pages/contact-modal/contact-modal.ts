import { Component } from '@angular/core';
import { Contact, Contacts, IContactField } from '@ionic-native/contacts';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { ISimpleContact } from './../../model/simple-contact';
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
   * Optionnel, permet de spécifier s'il ne faut afficher que les contacts ayant un mobile
   *
   * @private
   * @type {boolean}
   * @memberof ContactModalPage
   */
  private readonly onlyMobile: boolean = false;

  /**
   * Optionnel, permet de spécifier s'il ne faut afficher que les contacts ayant un email
   *
   * @private
   * @type {boolean}
   * @memberof ContactModalPage
   */
  private readonly onlyEmail: boolean = false;

  /**
   * Header de la dernière page (si elle ne le redéfini pas, permet de le conserver)
   *
   * @private
   * @type {IPageData}
   * @memberof ContactModalPage
   */
  private lastHeader: IPageData;

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
   * @type {Promise<Contact[]>}
   * @memberof ContactModalPage
   */
  protected contactList: Promise<Contact[]>;

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
    private readonly contactsCtrl: Contacts
  ) {
    super(navCtrl, evtCtrl, ttsCtrl ,authCtrl, uiCtrl);

    this.exportedContacts = this.navParams.get('contacts');

    if (this.navParams.get('onlyEmail') != null) {
      this.onlyEmail = this.navParams.get('onlyEmail');
    }

    if (this.navParams.get('onlyMobile')) {
      this.onlyMobile = this.navParams.get('onlyMobile');
    }
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * Initialise le header et recherches les contacts du téléphone
   *
   * @memberof ContactModalPage
   */
  ionViewDidEnter() {
    this.contactList = this.contactsCtrl.find(['displayName', 'emails', 'phoneNumbers'], {
      desiredFields: ['displayName', 'emails', 'phoneNumbers']
    });

    this.lastHeader = this.evtCtrl.getHeader();
    const header = Global.getValidablePageData();
    header.title = 'Vos contacts';
    this.evtCtrl.setHeader(header);
  }

  /**
   * Redéfini le header comme il l'était avant (pas nécessairement utile...)
   *
   * @memberof ContactModalPage
   */
  ionViewWillLeave() {
    this.evtCtrl.setHeader(this.lastHeader);
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
   * retourne true si le contact satisfait les critère de filtre (sms et/ou email)
   *
   * @protected
   * @param {Contact} contact
   * @returns {boolean}
   * @memberof ContactModalPage
   */
  protected shouldDisplay(contact: Contact): boolean {
    if (this.onlyEmail && contact.emails == null) {
      return false;
    }

    if (this.onlyMobile && contact.phoneNumbers == null) {
      return false;
    }

    if (this.onlyMobile && !this.haveMobile(contact.phoneNumbers)) {
      return false;
    }

    return true;
  }

  /**
   * retourne true si le contact est selectionné
   *
   * @protected
   * @param {Contact} contact
   * @returns {boolean}
   * @memberof ContactModalPage
   */
  protected isSelected(contact: Contact): boolean {
    const finded = this.exportedContacts.find(c => c.id === contact.id);
    return finded != null;
  }

  private deleteFromContact(contactId: string): void {
    const id = this.exportedContacts.findIndex(c => c.id === contactId);
    if (id !== -1) {
      this.exportedContacts.splice(id, 1);
    }
  }

  /**
   * permet de selectionné ou de déselectionné un contact
   *
   * @protected
   * @param {Contact} contact
   * @memberof ContactModalPage
   */
  protected select(contact: Contact): void {
    if (this.isSelected(contact)) {
      this.deleteFromContact(contact.id);
    } else {
      let email: string | undefined;
      if (contact.emails != null) {
        email = contact.emails[0].value;
      }

      const newSimpleContact: ISimpleContact = {
        id: contact.id,
        displayName: contact.displayName,
        email: email,
        mobile: this.getMobile(contact)
      };

      this.exportedContacts.push(newSimpleContact);
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * retourne le numéro de téléphone mobile associé à ce contact (si précisé)
   *
   * @private
   * @param {Contact} contact
   * @returns {string}
   * @memberof ContactModalPage
   */
  private getMobile(contact: Contact): string | null {
    for (const phone of contact.phoneNumbers) {
      if (phone.type != null && phone.type === 'mobile' && phone.value != null) {
        return phone.value;
      }
    }
    return null;
  }

  /**
   * return true si le contact dispose d'au moins un mobile
   *
   * @private
   * @param {IContactField[]} phones
   * @returns {boolean}
   * @memberof ContactModalPage
   */
  private haveMobile(phones: IContactField[]): boolean {
    for (const phone of phones) {
      if (phone.type != null && phone.type === 'mobile') {
        return true;
      }
    }
    return false;
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

  /**
   * @override
   * @returns {string}
   * @memberof ContactModalPage
   */
  protected generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   * @returns {boolean}
   * @memberof ContactModalPage
   */
  protected loginAuthRequired(): boolean {
    return false;
  }

  /**
   * @override
   * @returns {boolean}
   * @memberof ContactModalPage
   */
  protected basicAuthRequired(): boolean {
    return false;
  }
}
