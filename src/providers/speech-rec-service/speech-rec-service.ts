import { IMenuRequest } from './../../model/menu-request';
import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Subject } from 'rxjs';
import { LoadingController, Loading, AlertController, Events } from 'ionic-angular';
import { Global } from '../../shared/global';
import { MenuRequestType } from '../../model/menu-request-type';

@Injectable()
export class SpeechRecServiceProvider {
  private readonly userInputSubject: Subject<any>;
  private loading: Loading;
  private allOK = false;

  constructor(
    private readonly speechRecognition: SpeechRecognition,
    private readonly loadCtrl: LoadingController,
    private readonly evtCtrl: Events,
    private readonly alertCtrl: AlertController
  ) {
    this.userInputSubject = new Subject();
    this.evtCtrl.subscribe(Global.MENU_REQ_TOPIC, this.menuReqHandler);
  }

  /**
   * Démarre immadiatement la reconnaissance vocale si la recherche le demande
   * ou lance le wrapper si des paramètres ne sont pas OK (ou première utilisation)
   *
   * @private
   * @param {IMenuRequest} req
   * @memberof SpeechRecServiceProvider
   */
  private menuReqHandler(req: IMenuRequest): void {
    if (req.request === MenuRequestType.SPEECH_REC) {
      if (this.allOK) {
        this.startListening();
      } else {
        this.speechWrapper();
      }
    }
  }

  private startListening(): void {
    this.speechRecognition.startListening().subscribe(
      (matches: string[]) => {
        this.loading.dismiss();
        console.log(matches);
      },
      () => {
        this.alert('Erreur', 'une erreur inattendue est survenue');
        this.loading.dismiss();
      }
    );
  }

  private speechWrapper(): void {
    this.showLoading();
    this.speechRecognition.isRecognitionAvailable().then((available: boolean) => {
      if (available) {
        this.speechRecognition.hasPermission().then((hasPermission: boolean) => {
          if (hasPermission) {
            this.allOK = true;
            this.startListening();
          } else {
            this.speechRecognition.requestPermission().then(
              () => {
                this.allOK = true;
                this.startListening();
              },
              () => {
                this.loading.dismiss();
                this.alert(
                  'Erreur',
                  "Vous devez autoriser l'application à utiliser votre microphone"
                );
              }
            );
          }
        });
      } else {
        this.loading.dismiss();
        this.alert(
          'Erreur',
          'Fonctinalité de reconnaissance vocale indisponible sur votre terminal'
        );
      }
    });
  }

  /**
   * affiche un élément modal de chargement
   * @param text le texte affiché lors du chargement
   */
  public showLoading() {
    this.loading = this.loadCtrl.create({
      content: 'Veuillez patienter, préparation de le reconnaissance vocale'
    });
    this.loading.present();
  }

  public alert(title: string, text: string) {
    this.alertCtrl
      .create({
        title: title,
        subTitle: text,
        buttons: ['OK']
      })
      .present();
  }

  public getUserRequest(): Subject<any> {
    return this.userInputSubject;
  }
}
