import { Component } from '@angular/core';
import {
  AlertController,
  IonicPage,
  LoadingController,
  NavController,
  NavParams,
  ToastController,
  Events
} from 'ionic-angular';

import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';
import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';

@IonicPage()
@Component({
  selector: 'page-qrcode-generate',
  templateUrl: 'qrcode-generate.html'
})
export class QrcodeGeneratePage extends GenericSharer {
  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly loadingCtrl: LoadingController,
    public readonly alertCtrl: AlertController,
    public readonly evtCtrl: Events,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider
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
}
