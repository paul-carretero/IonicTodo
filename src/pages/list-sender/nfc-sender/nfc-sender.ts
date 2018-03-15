import { NfcProvider } from './../../../providers/nfc/nfc';
import { GenericSharer } from './../generic-sharer';
import { AuthServiceProvider } from './../../../providers/auth-service/auth-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { SpeechSynthServiceProvider } from './../../../providers/speech-synth-service/speech-synth-service';
import { EventServiceProvider } from './../../../providers/event/event-service';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  LoadingController,
  AlertController,
  ToastController
} from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-nfc-sender',
  templateUrl: 'nfc-sender.html'
})
export class NfcSenderPage extends GenericSharer {
  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly loadingCtrl: LoadingController,
    public readonly alertCtrl: AlertController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider,
    private readonly nfcCtrl: NfcProvider
  ) {
    super(
      navParams,
      navCtrl,
      loadingCtrl,
      alertCtrl,
      evtCtrl,
      ttsCtrl,
      todoCtrl,
      toastCtrl,
      authCtrl
    );
  }

  public async updateSharedTag(): Promise<void> {
    await this.nfcCtrl.write(this.json);
    this.displayToast(
      'Vous pouvez utiliser un Smartphone NFC pour lire le tag et importer la liste!'
    );
  }

  public async export(): Promise<void> {
    await this.nfcCtrl.write(this.json);
    this.displayToast('Vitre liste à été écrite sur un Tag NFC');
  }
}
