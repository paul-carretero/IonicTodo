import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';
import { Global } from '../../../shared/global';

@IonicPage()
@Component({
  selector: 'page-qrcode-generate',
  templateUrl: 'qrcode-generate.html'
})
export class QrcodeGeneratePage extends GenericSharer {
  constructor(
    public readonly navParams: NavParams,
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Exporter par QR Code';
    pageData.subtitle = this.evtCtrl.getHeader().title;
    this.evtCtrl.setHeader(pageData);
  }
}
