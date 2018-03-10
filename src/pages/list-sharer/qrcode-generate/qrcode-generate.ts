import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  LoadingController,
  AlertController
} from 'ionic-angular';
import { GenericPage } from '../../../shared/generic-page';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { MenuRequest } from '../../../model/menu-request';

/**
 * Generated class for the QrcodeGeneratePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

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
    public todoCtrl: TodoServiceProvider
  ) {
    super(
      navParams,
      navCtrl,
      loadingCtrl,
      alertCtrl,
      evtCtrl,
      ttsCtrl,
      todoCtrl
    );
  }
}
