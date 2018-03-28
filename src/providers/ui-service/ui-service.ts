import { MapServiceProvider } from './../map-service/map-service';
import { Injectable } from '@angular/core';
import {
  Alert,
  AlertController,
  Loading,
  LoadingController,
  ToastController
} from 'ionic-angular';
import { AlertInputOptions } from 'ionic-angular/components/alert/alert-options';

import { Settings } from './../../model/settings';
import { DBServiceProvider } from './../db/db-service';
import { SpeechSynthServiceProvider } from './../speech-synth-service/speech-synth-service';
import { EventServiceProvider } from '../event/event-service';

/**
 * Propose plusieurs méthode de type helper pour l'interface utilisateur (alert etc.)
 *
 * @export
 * @class UiServiceProvider
 */
@Injectable()
export class UiServiceProvider {
  /**
   * chargement présent (ou dernier créé)
   *
   * @private
   * @type {Loading}
   * @memberof UiServiceProvider
   */
  private loading: Loading;

  private autoRead: boolean;

  /**
   * Creates an instance of UiServiceProvider.
   * @param {AlertController} alertCtrl
   * @param {LoadingController} loadingCtrl
   * @param {ToastController} toastCtrl
   * @memberof UiServiceProvider
   */
  constructor(
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly synthCtrl: SpeechSynthServiceProvider,
    private readonly dbCtrl: DBServiceProvider,
    private readonly mapCtrl: MapServiceProvider,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.refreshAutoRead();
    this.mapCtrl.registerUiCtrl(this);
    this.evtCtrl.registerUiCtrl(this);
  }

  public async refreshAutoRead(): Promise<void> {
    this.autoRead = await this.dbCtrl.getSetting(Settings.AUTO_READ_ALERT);
  }

  /**
   * retourne une promise permettant d'obtenir confirmation ou annulation d'un message
   *
   * @param {string} title
   * @param {string} message
   * @returns {Promise<boolean>}
   * @memberof UiServiceProvider
   */
  public confirm(title: string, message: string): Promise<boolean> {
    if (this.autoRead) {
      this.synthCtrl.synthText(title);
      this.synthCtrl.synthText(message);
      this.synthCtrl.synthText('Voulez vous confirmer ou annuler ?');
    }

    return new Promise<boolean>(resolve => {
      this.alertCtrl
        .create({
          title: title,
          message: message,
          buttons: [
            {
              text: 'Annuler',
              role: 'cancel',
              handler: () => {
                resolve(false);
              }
            },
            {
              text: 'Valider',
              handler: () => {
                resolve(true);
              }
            }
          ]
        })
        .present();
    });
  }

  /**
   * affiche un élément modal de chargement
   *
   * @param {string} text le texte affiché lors du chargement
   * @param {number} [duration]
   * @memberof UiServiceProvider
   */
  public showLoading(text: string, duration?: number): void {
    if (this.loading != null) {
      this.loading.dismissAll();
    }

    if (duration == null) {
      duration = 30000; // 30sec max default
    }

    this.loading = this.loadingCtrl.create({
      content: text,
      dismissOnPageChange: true,
      duration: duration
    });
    this.loading.present();
  }

  public dismissLoading(): void {
    if (this.loading != null) {
      this.loading.dismiss();
    }
  }

  /**
   * affiche une fenêtre d'information
   * @param {string} title le titre de la fenêtre d'alerte
   * @param {string} text le texte de le fenêtre d'alerte
   * @memberof UiServiceProvider
   */
  public alert(title: string, text: string): void {
    if (this.autoRead) {
      this.synthCtrl.synthText(title);
      this.synthCtrl.synthText(text);
    }

    this.alertCtrl
      .create({
        title: title,
        subTitle: text,
        buttons: ['OK']
      })
      .present();
  }

  /**
   * Affiche un message 'toast' en bas de l'écran
   *
   * @param {string} message
   * @param {number} [duration]
   * @memberof UiServiceProvider
   */
  public displayToast(message: string, duration?: number): void {
    if (this.autoRead) {
      this.synthCtrl.synthText(message);
    }

    if (duration == null) {
      duration = 4000;
    }
    this.toastCtrl
      .create({ message: message, duration: duration, position: 'bottom' })
      .present();
  }

  /**
   * Présente un prompt à l'utilisateur et fourni sa réponse sous forme de promise.
   * La promise et rejected si l'utilisateur annule le prompt
   *
   * @param {title} title
   * @param {string} message
   * @param {AlertInputOptions[]} inputs
   * @returns {Promise<string>}
   * @memberof UiServiceProvider
   */
  public presentPrompt(
    title: string,
    message: string,
    inputs: AlertInputOptions[]
  ): Promise<any> {
    if (this.autoRead) {
      this.synthCtrl.synthText(title);
      this.synthCtrl.synthText(message);
    }

    return new Promise<string>((resolve, reject) => {
      const alert = this.alertCtrl.create({
        title: title,
        subTitle: message,
        inputs: inputs,
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel',
            handler: () => {
              reject();
            }
          },
          {
            text: 'Valider',
            handler: data => {
              resolve(data);
            }
          }
        ]
      });
      alert.present();
    });
  }

  public getBasicAlert(): Alert {
    return this.alertCtrl.create();
  }
}
