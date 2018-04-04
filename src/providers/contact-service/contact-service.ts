import { EmailComposer } from '@ionic-native/email-composer';
import { Injectable } from '@angular/core';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { SMS, SmsOptions } from '@ionic-native/sms';

import { Settings } from '../../model/settings';
import { UiServiceProvider } from '../ui-service/ui-service';
import { ISimpleContact } from './../../model/simple-contact';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { DBServiceProvider } from './../db/db-service';
import { ITodoItem } from '../../model/todo-item';
import { Contacts, Contact } from '@ionic-native/contacts';
import { CallNumber } from '@ionic-native/call-number';

/**
 * fourni des services permettant de gérer les contacts du téléphone et les evenements (appel etc.) associés
 *
 * @export
 * @class ContactServiceProvider
 */
@Injectable()
export class ContactServiceProvider {
  /**
   * option pour la création de sms
   *
   * @private
   * @static
   * @type {SmsOptions}
   * @memberof ContactServiceProvider
   */
  private static readonly smsOpts: SmsOptions = {
    replaceLineBreaks: true
  };

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of ContactServiceProvider.
   * @param {SMS} smsCtrl
   * @param {DBServiceProvider} dbCtrl
   * @param {AndroidPermissions} permsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {Contacts} contactsCtrl
   * @param {CallNumber} callCtrl
   * @param {EmailComposer} emailCtrl
   * @memberof ContactServiceProvider
   */
  constructor(
    private readonly smsCtrl: SMS,
    private readonly dbCtrl: DBServiceProvider,
    private readonly permsCtrl: AndroidPermissions,
    private readonly authCtrl: AuthServiceProvider,
    private readonly uiCtrl: UiServiceProvider,
    private readonly contactsCtrl: Contacts,
    private readonly callCtrl: CallNumber,
    private readonly emailCtrl: EmailComposer,
    private readonly androidPermsCtrl: AndroidPermissions
  ) {}

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * permet d'envoyer un sms à un contact, vérifie les autorisation et la validité des données
   *
   * @param {ISimpleContact} contact
   * @param {string} message
   * @returns {Promise<void>}
   * @memberof ContactServiceProvider
   */
  public async sendSMS(contact: ISimpleContact, message: string): Promise<void> {
    if (
      contact.mobile == null ||
      (contact.mobile.charAt(1) !== '6' && contact.mobile.charAt(1) !== '7')
    ) {
      console.log(
        "Impossible d'envoyer un message à " + contact.displayName + ', aucun mobile connu'
      );
    } else {
      const permsOKP = this.smsCtrl.hasPermission();

      if (!await this.dbCtrl.getSetting(Settings.DISABLE_SMS)) {
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
    }
  }

  /**
   * permet d'envoyer des sms d'invitation à créer un compte dans l'application lors de la réalisation d'un partage par addresse mail
   *
   * @param {ISimpleContact[]} contacts
   * @returns {void}
   * @memberof ContactServiceProvider
   */
  public sendInviteSms(contacts: ISimpleContact[]): void {
    if (this.authCtrl.isConnected() && this.authCtrl.getDisplayName() != null) {
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
        this.sendSMS(contact, message);
      }
    }
  }

  /**
   * permet d'envoyer un sms à un contact lorsq'une tâche à été créée
   *
   * @private
   * @param {ISimpleContact} contact
   * @param {string} todoName
   * @param {string} todoDesc
   * @memberof ContactServiceProvider
   */
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
    this.sendSMS(contact, message);
  }

  /**
   * permet d'envoyer un sms de complétion de tâche à tout les contact de la tâche disposant d'un mobile
   *
   * @param {ITodoItem} todo
   * @returns {void}
   * @memberof ContactServiceProvider
   */
  public publishCompleteSms(todo: ITodoItem): void {
    if (
      this.authCtrl.isConnected() &&
      this.authCtrl.getDisplayName() != null &&
      todo != null &&
      todo.name != null &&
      todo.contacts != null
    ) {
      for (const contact of todo.contacts) {
        let desc = '';
        if (todo.desc != null) {
          desc = todo.desc;
        }
        this.sendCompleteSms(contact, todo.name, desc);
      }
    }
  }

  /**
   * permet de récupérer tout les contact de l'appareil sous certaines options
   *
   * @param {boolean} emailRequired
   * @returns {Promise<ISimpleContact[]>}
   * @memberof ContactServiceProvider
   */
  public async getContactList(emailRequired: boolean): Promise<ISimpleContact[]> {
    let permsOk: boolean = false;
    try {
      permsOk = (await this.androidPermsCtrl.checkPermission(
        this.androidPermsCtrl.PERMISSION.READ_CONTACTS
      )).hasPermission;
      if (!permsOk) {
        permsOk = (await this.androidPermsCtrl.requestPermission(
          this.androidPermsCtrl.PERMISSION.READ_CONTACTS
        )).hasPermission;
      }
    } catch (error) {
      permsOk = false;
    }

    if (!permsOk) {
      return [];
    }

    const nativesContact = await this.contactsCtrl.find(
      ['displayName', 'emails', 'phoneNumbers'],
      {
        desiredFields: ['displayName', 'emails', 'phoneNumbers']
      }
    );

    const res: ISimpleContact[] = [];

    for (const contact of nativesContact) {
      if (this.canAdd(contact, emailRequired)) {
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

  /**
   * permet de préparer l'envoi d'un sms par le service de sms natif d'android.
   * Il s'agit d'un simplecontact, une vérification simple est effectuée
   *
   * @param {ISimpleContact} contact
   * @returns {void}
   * @memberof ContactServiceProvider
   */
  public async openNativeSMS(contact: ISimpleContact): Promise<void> {
    if (contact.mobile != null) {
      const permsOK = await this.smsCtrl.hasPermission();
      if (!permsOK) {
        try {
          this.permsCtrl.requestPermission(this.permsCtrl.PERMISSION.SEND_SMS);
        } catch (error) {
          console.log('pas de permission pour envoyer un sms :/');
          return;
        }
      }

      this.smsCtrl.send(contact.mobile, '', {
        replaceLineBreaks: true,
        android: { intent: 'INTENT' }
      });
    }
  }

  /**
   * permet de préparer un appel vers un contact
   *
   * @param {ISimpleContact} contact
   * @returns {void}
   * @memberof ContactServiceProvider
   */
  public async call(contact: ISimpleContact): Promise<void> {
    if (contact.mobile != null) {
      if (await this.callCtrl.isCallSupported()) {
        this.callCtrl.callNumber(contact.mobile, true);
      } else {
        this.uiCtrl.alert('Echec', 'Votre appareil ne supporte pas la gestion des appels');
      }
    }
  }

  /**
   * permet de créer un email pour un contact et d'ouvrire la boite mail
   *
   * @param {ISimpleContact} contact
   * @returns {Promise<void>}
   * @memberof ContactServiceProvider
   */
  public async prepareEmail(contact: ISimpleContact): Promise<void> {
    if (contact.email != null) {
      let perm = await this.emailCtrl.hasPermission();
      if (!perm) {
        perm = await this.emailCtrl.requestPermission();
        if (!perm) {
          this.uiCtrl.displayToast(
            "Vous devez authoriser l'application à utiliser votre boîte mail pour pouvoir utiliser ce service"
          );
          return;
        }
      }

      const email = {
        to: contact.email,
        subject: "message d'OhMyTask",
        body: 'Bonjour ' + contact.displayName + ',',
        isHtml: true
      };

      try {
        this.emailCtrl.open(email);
      } catch (error) {
        console.log("Impossible d'ouvrir la boîte mail");
      }
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * retourne true si le contact natif rempli des conditions pour être ajouter à la liste des contacts demandée
   *
   * @private
   * @param {Contact} contact
   * @param {boolean} mobileRequired
   * @param {boolean} emailRequired
   * @returns {boolean}
   * @memberof ContactServiceProvider
   */
  private canAdd(contact: Contact, emailRequired: boolean): boolean {
    if (emailRequired && (contact.emails == null || contact.emails.length === 0)) {
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
    if (
      contact.phoneNumbers != null &&
      typeof contact.phoneNumbers[Symbol.iterator] === 'function'
    ) {
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
    }
    return null;
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
