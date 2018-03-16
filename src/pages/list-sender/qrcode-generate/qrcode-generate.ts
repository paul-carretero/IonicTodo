import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';

@IonicPage()
@Component({
  selector: 'page-qrcode-generate',
  templateUrl: 'qrcode-generate.html'
})
export class QrcodeGeneratePage extends GenericSharer {
  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly authCtrl: AuthServiceProvider,
    public readonly uiCtrl: UiServiceProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
  }
}
