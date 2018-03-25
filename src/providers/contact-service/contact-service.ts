import { Injectable } from '@angular/core';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { SMS, SmsOptions } from '@ionic-native/sms';

import { Settings } from '../../model/settings';
import { UiServiceProvider } from '../ui-service/ui-service';
import { ISimpleContact } from './../../model/simple-contact';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { DBServiceProvider } from './../db/db-service';
import { ITodoItem } from '../../model/todo-item';
import { Contacts, Contact, IContactField } from '@ionic-native/contacts';

@Injectable()
export class ContactServiceProvider {
  private static readonly smsOpts: SmsOptions = {
    replaceLineBreaks: true
  };

  constructor(
    private readonly smsCtrl: SMS,
    private readonly dbCtrl: DBServiceProvider,
    private readonly permsCtrl: AndroidPermissions,
    private readonly authCtrl: AuthServiceProvider,
    private readonly uiCtrl: UiServiceProvider,
    private readonly contactsCtrl: Contacts
  ) {}

  public async sendSMS(
    contact: ISimpleContact,
    message: string,
    displayLog: boolean
  ): Promise<void> {
    if (
      contact.mobile == null ||
      (contact.mobile.charAt(1) !== '6' && contact.mobile.charAt(1) !== '7')
    ) {
      if (displayLog) {
        this.uiCtrl.alert(
          'Echec',
          "Impossible d'envoyer un message à " + contact.displayName + ', aucun mobile connu'
        );
      } else {
        console.log(
          "Impossible d'envoyer un message à " + contact.displayName + ', aucun mobile connu'
        );
      }
      return;
    }

    const permsOKP = this.smsCtrl.hasPermission();
    const cancel = await this.dbCtrl.getSetting(Settings.DISABLE_SMS);
    if (cancel) {
      return;
    }

    const permsOK = await permsOKP;
    if (!permsOK) {
      try {
        this.permsCtrl.requestPermission(this.permsCtrl.PERMISSION.SEND_SMS);
      } catch (error) {
        console.log('pas de permission pour envoyer un sms :/');
        return;
      }
    }

    this.smsCtrl.send(contact.mobile, message, ContactServiceProvider.smsOpts);
  }

  public sendInviteSms(contacts: ISimpleContact[]): void {
    if (!this.authCtrl.isConnected() || this.authCtrl.getDisplayName() == null) {
      return;
    }
    const MyName = this.authCtrl.getDisplayName();
    for (const contact of contacts) {
      let message = 'Bonjour ' + contact.displayName + '\n';
      message += '\n';
      message += 'Je souhaite partager une liste de tâches avec vous. \n';
      message += '\n';
      message +=
        "Si ce n'est pas déjà fait, installez l'application OhMyTask et connectez vous avec votre adresse mail (" +
        contact.email +
        ') \n';
      message += '\n';
      message += 'Le partage restera disponible 24h';
      message += '\n';
      message += '--\n';
      message += MyName;
      this.sendSMS(contact, message, false);
    }
  }

  private sendCompleteSms(contact: ISimpleContact, todoName: string, todoDesc: string): void {
    const MyName = this.authCtrl.getDisplayName();
    let message = 'Bonjour ' + contact.displayName + '\n';
    message += '\n';
    message += "J'ai terminé la tâche: \n";
    message += '\n';
    message += '' + todoName + ':\n';
    message += '' + todoDesc + '\n';
    message += '\n';
    message += '--\n';
    message += MyName;
    this.sendSMS(contact, message, false);
  }

  public publishCompleteSms(todo: ITodoItem): void {
    if (
      !this.authCtrl.isConnected() ||
      this.authCtrl.getDisplayName() == null ||
      todo == null ||
      todo.name == null ||
      todo.contacts == null
    ) {
      return;
    }

    for (const contact of todo.contacts) {
      let desc = '';
      if (todo.desc != null) {
        desc = todo.desc;
      }
      this.sendCompleteSms(contact, todo.name, desc);
    }
  }

  public async getContactList(
    mobileRequired: boolean,
    emailRequired: boolean
  ): Promise<ISimpleContact[]> {
    const nativesContact = await this.contactsCtrl.find(
      ['displayName', 'emails', 'phoneNumbers'],
      {
        desiredFields: ['displayName', 'emails', 'phoneNumbers']
      }
    );

    const res: ISimpleContact[] = [];

    for (const contact of nativesContact) {
      if (this.canAdd(contact, mobileRequired, emailRequired)) {
        const id = await this.getHashID(contact.id);

        let email: string | null | undefined = null;
        if (contact.emails != null && contact.emails.length > 0) {
          email = contact.emails[0].value;
        }
        if (email === undefined) {
          email = null;
        }

        const sContact: ISimpleContact = {
          id: id,
          displayName: contact.displayName,
          email: email,
          mobile: this.getMobile(contact)
        };

        res.push(sContact);
      }
    }

    return res;
  }

  private canAdd(contact: Contact, mobileRequired: boolean, emailRequired: boolean): boolean {
    if (emailRequired && (contact.emails == null || contact.emails.length === 0)) {
      return false;
    }

    if (mobileRequired && contact.phoneNumbers == null) {
      return false;
    }

    if (mobileRequired && !this.haveMobile(contact.phoneNumbers)) {
      return false;
    }

    return true;
  }

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
      if (
        phone.type != null &&
        phone.type === 'mobile' &&
        phone.value != null &&
        (phone.value.charAt(1) === '6' || phone.value.charAt(1) === '7')
      ) {
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
      if (
        phone.type != null &&
        phone.type === 'mobile' &&
        phone.value != null &&
        (phone.value.charAt(1) === '6' || phone.value.charAt(1) === '7')
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * retourne un identifiant quasi unique pour un contact (non critique et plus performant)
   *
   * @private
   * @param {string} contactId
   * @returns {Promise<number>}
   * @memberof ContactServiceProvider
   */
  private async getHashID(contactId: string): Promise<number> {
    const machineId = await this.authCtrl.getMachineId();
    return this.getHash(machineId + ' - ' + contactId);
  }

  /**
   * retourne un hash d'une chaine de caractère.
   * Basé sur http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
   *
   * @private
   * @param {string} str
   * @returns {number}
   * @memberof ContactServiceProvider
   */
  private getHash(str: string): number {
    let hash = 0;

    if (str.length === 0) {
      return hash;
    }

    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }

    return hash;
  }
}
