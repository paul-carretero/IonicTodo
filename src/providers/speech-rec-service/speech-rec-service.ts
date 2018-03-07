import { MenuRequest } from './../../model/menu-request';
import { EventServiceProvider } from './../event/event-service';
import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Subject } from 'rxjs';
import { LoadingController, Loading, AlertController } from 'ionic-angular';

@Injectable()
export class SpeechRecServiceProvider {
  private userInputSubject: Subject<any>;
  private loading: Loading;
  private allOK = false;

  constructor(
    private speechRecognition: SpeechRecognition,
    private loadCtrl: LoadingController,
    private evtCtrl: EventServiceProvider,
    private alertCtrl: AlertController
  ) {
    this.userInputSubject = new Subject();
    this.listenForSpeechRequest();
  }

  private listenForSpeechRequest(): void {
    this.evtCtrl.getMenuRequestSubject().subscribe(req => {
      if (req == MenuRequest.SPEECH_REC) {
        if (this.allOK) {
          this.startListening();
        } else {
          this.speechWrapper();
        }
      }
    });
  }

  private startListening(): void {
    this.speechRecognition.startListening().subscribe(
      (matches: Array<string>) => {
        this.loading.dismiss();
        console.log(matches);
      },
      onerror => {
        this.alert('Erreur', 'une erreur inattendue est survenue');
        this.loading.dismiss();
      }
    );
  }

  private speechWrapper(): void {
    this.showLoading();
    this.speechRecognition
      .isRecognitionAvailable()
      .then((available: boolean) => {
        if (available) {
          this.speechRecognition
            .hasPermission()
            .then((hasPermission: boolean) => {
              if (hasPermission) {
                this.startListening();
              } else {
                this.speechRecognition.requestPermission().then(
                  () => this.startListening(),
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
