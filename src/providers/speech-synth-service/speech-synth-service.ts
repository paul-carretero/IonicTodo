import { MenuRequest } from './../../model/menu-request';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { Subject } from 'rxjs';
import { EventServiceProvider } from '../event/event-service';

@Injectable()
export class SpeechSynthServiceProvider {
  private synthQueue: string[];

  constructor(
    private tts: TextToSpeech,
    private evtCtrl: EventServiceProvider
  ) {
    this.synthQueue = [];
    this.listenForStop();
  }

  /**
   * Workaround pour corriger un bug sur la fonction tts.stop()
   * @see https://github.com/ionic-team/ionic-native/issues/2137
   * @private
   * @memberof SpeechSynthServiceProvider
   */
  private stop() {
    this.tts.speak('');
  }

  private listenForStop(): void {
    this.evtCtrl.getMenuRequestSubject().subscribe((req: MenuRequest) => {
      if (req == MenuRequest.SPEECH_REC) {
        this.synthQueue = [];
        this.stop();
      }
    });
  }

  public synthText(text: string) {
    if (this.synthQueue.push(text) == 1) {
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
