import { Injectable } from '@angular/core';
import { TextToSpeech } from '@ionic-native/text-to-speech';

import { EventServiceProvider } from '../event/event-service';
import { MenuRequest } from './../../model/menu-request';

@Injectable()
export class SpeechSynthServiceProvider {
  private synthQueue: string[];

  constructor(
    private readonly tts: TextToSpeech,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.synthQueue = [];
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
    this.evtCtrl.getMenuRequestSubject().subscribe((req: MenuRequest) => {
      if (req === MenuRequest.SPEECH_REC) {
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
