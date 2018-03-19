import { Injectable } from '@angular/core';
import { TextToSpeech } from '@ionic-native/text-to-speech';

import { EventServiceProvider } from '../event/event-service';
import { IMenuRequest } from './../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';

@Injectable()
export class SpeechSynthServiceProvider {
  private synthQueue: string[];

  constructor(
    private readonly tts: TextToSpeech,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.synthQueue = [];
    console.log("constructor speech-synth-service");
    this.listenForStop();
  }

  /**
   * Workaround pour corriger un bug sur la fonction TextToSpeech.stop()
   * @see https://github.com/ionic-team/ionic-native/issues/2137
   * @private
   * @memberof SpeechSynthServiceProvider
   */
  private stop() {
    this.tts.speak('');
  }

  private listenForStop(): void {
    this.evtCtrl.getMenuRequestSubject().subscribe((req: IMenuRequest) => {
      console.log("evt menu");
      if (req.request === MenuRequestType.SPEECH_SYNTH) {
        console.log("speech synth");
        this.synthQueue = [];
        this.stop();
      }
    });
  }

  public synthText(text: string) {
    if (this.synthQueue.push(text) === 1) {
      this.play();
    }
  }

  private play(): void {
    if (this.synthQueue.length > 0) {
      this.tts.speak({ text: this.synthQueue[0], locale: 'fr-FR' }).then(() => {
        this.synthQueue.shift();
        this.play();
      });
    }
  }
}
