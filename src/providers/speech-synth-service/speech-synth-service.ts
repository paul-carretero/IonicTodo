import { Injectable } from '@angular/core';
import { TextToSpeech } from '@ionic-native/text-to-speech';

import { IMenuRequest } from './../../model/menu-request';
import { Events } from 'ionic-angular';
import { MenuRequestType } from '../../model/menu-request-type';
import { Global } from '../../shared/global';

@Injectable()
export class SpeechSynthServiceProvider {
  private synthQueue: string[];

  constructor(private readonly tts: TextToSpeech, private readonly evtCtrl: Events) {
    this.synthQueue = [];
    this.evtCtrl.subscribe(Global.MENU_REQ_TOPIC, this.menuReqHandler);
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

  /**
   * Empêche la reconnaissance vocal d'être active en même temps que la synthèse vocal
   * Stop immédiatement la synthèse vocal si la reconnaissance est activée
   *
   * @private
   * @param {IMenuRequest} req
   * @memberof SpeechSynthServiceProvider
   */
  private menuReqHandler(req: IMenuRequest): void {
    if (req.request === MenuRequestType.SPEECH_REC) {
      this.synthQueue = [];
      this.stop();
    }
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
