import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { AuthServiceProvider } from './../../../providers/auth-service/auth-service';
import { EventServiceProvider } from './../../../providers/event/event-service';
import { NfcProvider } from './../../../providers/nfc/nfc';
import { SpeechSynthServiceProvider } from './../../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';
import { Global } from '../../../shared/global';
import { SpeechRecServiceProvider } from '../../../providers/speech-rec-service/speech-rec-service';

@IonicPage()
@Component({
  selector: 'page-nfc-sender',
  templateUrl: 'nfc-sender.html'
})
export class NfcSenderPage extends GenericSharer {
  constructor(
    public readonly navParams: NavParams,
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly sprecCtrl: SpeechRecServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly nfcCtrl: NfcProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, sprecCtrl ,todoCtrl, authCtrl, uiCtrl);
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Exporter par NFC';
    pageData.subtitle = this.evtCtrl.getHeader().title;
    this.evtCtrl.setHeader(pageData);
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
