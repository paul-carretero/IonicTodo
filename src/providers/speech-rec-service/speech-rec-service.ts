import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Subject } from 'rxjs';

@Injectable()
export class SpeechRecServiceProvider {
  private userInputSubject: Subject<any>;

  constructor(private speechRecognition: SpeechRecognition) {
    this.userInputSubject = new Subject();
  }
}
