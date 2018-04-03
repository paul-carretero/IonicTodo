import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

import { IMenuRequest } from '../../../model/menu-request';
import { MenuRequestType } from '../../../model/menu-request-type';
import { ISimpleContact } from '../../../model/simple-contact';
import { ContactServiceProvider } from '../../../providers/contact-service/contact-service';
import { Global } from '../../../shared/global';

/**
 * Page orienté modal créée pour permettre de choisir plusieurs contacts parmis la listes des contacts du terminal.
 *
 * @export
 * @class ContactModalPage
 */
@IonicPage()
@Component({
  selector: 'page-contact-modal',
  templateUrl: 'contact-modal.html'
})
export class ContactModalPage {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * vrai si un email est obligatoire
   *
   * @private
   * @type {boolean}
   * @memberof ContactModalPage
   */
  private readonly emailRequired: boolean;

  /**
   * copie de sauvegarde des contacts au cas ou on annule
   *
   * @private
   * @type {ISimpleContact[]}
   * @memberof ContactModalPage
   */
  private readonly previousContacts: ISimpleContact[];

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
   * @param {ContactServiceProvider} contactsCtrl
   * @param {ViewController} viewCtrl
   * @memberof ContactModalPage
   */
  constructor(
    private readonly navParams: NavParams,
    private readonly contactsCtrl: ContactServiceProvider,
    private readonly viewCtrl: ViewController
  ) {
    const data = this.navParams.get('data');
    this.exportedContacts = data.contacts;
    this.emailRequired = data.email;
    if (this.emailRequired == null) {
      this.emailRequired = false;
    }
    this.fullContactList = [];
    this.previousContacts = this.exportedContacts.slice(0);
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
    const header = Global.getValidablePageData();
    header.title = 'Selectionner vos contacts';
    header.subtitle = 'Contacts disponibles';
    this.initSelected();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * annule la selection
   *
   * @protected
   * @memberof ContactModalPage
   */
  protected dismiss(): void {
    this.exportedContacts.splice(0);
    for (const item of this.previousContacts) {
      this.exportedContacts.push(item);
    }
    this.viewCtrl.dismiss();
  }

  /**
   * Valide et termine la saisie des contacts
   *
   * @protected
   * @memberof ContactModalPage
   */
  protected validate() {
    this.viewCtrl.dismiss();
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
