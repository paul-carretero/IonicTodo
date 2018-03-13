import { Component } from '@angular/core';
import {
  AlertController,
  IonicPage,
  LoadingController,
  NavController,
  NavParams,
  ToastController
} from 'ionic-angular';

import { EventServiceProvider } from '../../../providers/event/event-service';
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
    public navParams: NavParams,
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    public todoCtrl: TodoServiceProvider,
    public toastCtrl: ToastController,
    public authCtrl: AuthServiceProvider
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
