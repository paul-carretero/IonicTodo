import { Injectable } from '@angular/core';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { SMS, SmsOptions } from '@ionic-native/sms';

import { Settings } from '../../model/settings';
import { UiServiceProvider } from '../ui-service/ui-service';
import { ISimpleContact } from './../../model/simple-contact';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { DBServiceProvider } from './../db/db-service';
import { ITodoItem } from '../../model/todo-item';

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
    private readonly uiCtrl: UiServiceProvider
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
}
