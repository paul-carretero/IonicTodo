import { Injectable } from '@angular/core';
import { TextToSpeech } from '@ionic-native/text-to-speech';

import { EventServiceProvider } from '../event/event-service';
import { IMenuRequest } from './../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';

/**
 * class fournissant une file d'attente pour synthétiser du texte en voix
 *
 * @export
 * @class SpeechSynthServiceProvider
 */
@Injectable()
export class SpeechSynthServiceProvider {
  /**
   * file fifo de texte à synthéiser
   *
   * @private
   * @type {string[]}
   * @memberof SpeechSynthServiceProvider
   */
  private synthQueue: string[];

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of SpeechSynthServiceProvider.
   * @param {TextToSpeech} tts
   * @param {EventServiceProvider} evtCtrl
   * @memberof SpeechSynthServiceProvider
   */
  constructor(
    private readonly tts: TextToSpeech,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.synthQueue = [];
    this.listenForStop();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * Workaround pour corriger un bug sur la fonction TextToSpeech.stop()
   * @see https://github.com/ionic-team/ionic-native/issues/2137
   * @private
   * @memberof SpeechSynthServiceProvider
   */
  private stop() {
    this.synthQueue = [];
    this.tts.speak('');
  }

  /**
   * permet d'annuler la synthèse vocale si la reconnaissance vocale est activée
   *
   * @private
   * @memberof SpeechSynthServiceProvider
   */
  private listenForStop(): void {
    this.evtCtrl.getMenuRequestSubject().subscribe((req: IMenuRequest) => {
      if (req.request === MenuRequestType.SPEECH_REC) {
        this.stop();
      }
    });
  }

  /**
   * permet de lire du texte à synthétiser tant qu'il y en a dans la file
   *
   * @private
   * @memberof SpeechSynthServiceProvider
   */
  private play(): void {
    if (this.synthQueue.length > 0) {
      this.tts.speak({ text: this.synthQueue[0], locale: 'fr-FR' }).then(() => {
        this.synthQueue.shift();
        this.play();
      });
    }
  }

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * permet d'ajouter du texte à synthétiser
   *
   * @param {string} text
   * @memberof SpeechSynthServiceProvider
   */
  public synthText(text: string) {
    if (this.synthQueue.indexOf(text) !== -1) {
      this.stop();
    } else if (this.synthQueue.push(text) === 1) {
      this.play();
    }
  }
}
