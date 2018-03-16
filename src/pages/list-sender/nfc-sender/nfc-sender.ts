import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { AuthServiceProvider } from './../../../providers/auth-service/auth-service';
import { EventServiceProvider } from './../../../providers/event/event-service';
import { NfcProvider } from './../../../providers/nfc/nfc';
import { SpeechSynthServiceProvider } from './../../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';

@IonicPage()
@Component({
  selector: 'page-nfc-sender',
  templateUrl: 'nfc-sender.html'
})
export class NfcSenderPage extends GenericSharer {
  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly authCtrl: AuthServiceProvider,
    public readonly uiCtrl: UiServiceProvider,
    private readonly nfcCtrl: NfcProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
  }

  public async updateSharedTag(): Promise<void> {
    await this.nfcCtrl.write(this.json);
    this.uiCtrl.displayToast(
      'Vous pouvez utiliser un Smartphone NFC pour lire le tag et importer la liste!'
    );
  }

  public async export(): Promise<void> {
    await this.nfcCtrl.write(this.json);
    this.uiCtrl.displayToast('Vitre liste à été écrite sur un Tag NFC');
  }
}
