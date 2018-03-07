import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { Subject } from 'rxjs';

/*
  Generated class for the SpeechSynthServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SpeechSynthServiceProvider {
  private synthQueue: string[];

  constructor(private tts: TextToSpeech) {
    this.synthQueue = [];
  }

  public synthText(text: string) {
    if (this.synthQueue.push(text) == 1) {
      this.play();
    }
  }

  private play(): void {
    if (this.synthQueue.length > 0) {
      this.tts.speak(this.synthQueue[0]).then(() => {
        this.synthQueue.shift();
        this.play();
      });
    }
  }
}
