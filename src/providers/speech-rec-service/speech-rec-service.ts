import { UiServiceProvider } from './../ui-service/ui-service';
import { EventServiceProvider } from './../event/event-service';
import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { MenuRequestType } from '../../model/menu-request-type';
import { ListType, ITodoList } from '../../model/todo-list';
import { TodoServiceProvider } from '../todo-service-ts/todo-service-ts';

@Injectable()
export class SpeechRecServiceProvider {
  private allOK = false;

  constructor(
    private readonly speechRecognition: SpeechRecognition,
    private readonly evtCtrl: EventServiceProvider,
    private readonly todoService : TodoServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {
    console.log("constructor speech-rec-service");
    this.listenForSpeechRequest();
  }

  private listenForSpeechRequest(): void {
    console.log("av event");
    this.evtCtrl.getMenuRequestSubject().subscribe(req => {
      console.log("dans listen for speech request");
      if (req.request === MenuRequestType.SPEECH_REC) {
        if (this.allOK) {
          this.startListening();
        } else {
          this.speechWrapper();
        }
      }
    });
  }

  private async startListening(): Promise<void> {
    console.log("dans start listening");
    this.speechRecognition.startListening().subscribe(
      (matches: string[]) => {
        this.uiCtrl.dismissLoading();
        console.log(matches);
        let trouve : boolean = false;
        matches.forEach(
            async s => {
              if(s.includes("créer") && !trouve){ 
                if(s.includes("liste")){
                  trouve = true;
                  this.creerListe(s);
                }
              }  
            }
            );
      },
      () => {
        this.uiCtrl.alert('Erreur', 'une erreur inattendue est survenue');
        this.uiCtrl.dismissLoading();
      }
    );
  }

  private async creerListe(s : String) : Promise<void> {
        const nomListe : string = s.slice(s.indexOf("liste") + 6 );
        console.log("Trouvé liste");
        console.log("nom de la liste :" + nomListe);

        const destType: ListType = ListType.LOCAL;
        console.log("type" + destType);

        const iconList = "Default";

        const data : ITodoList = {
          uuid: null,
          name: nomListe,
          icon: iconList,
          author: null,
          order: 0,
          externTodos: []
        }
        console.log("data : " + data);
        const nextUuid = await this.todoService.addList(data, destType);
        console.log("uuid : " + nextUuid);
  }


  private speechWrapper(): void {
    this.uiCtrl.showLoading(
      'Veuillez patienter, préparation de le reconnaissance vocale'
    );
    console.log("speech wrapper");
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
                this.uiCtrl.dismissLoading();
                this.uiCtrl.alert(
                  'Erreur',
                  "Vous devez autoriser l'application à utiliser votre microphone"
                );
              }
            );
          }
        });
      } else {
        this.uiCtrl.dismissLoading();
        this.uiCtrl.alert(
          'Erreur',
          'Fonctinalité de reconnaissance vocale indisponible sur votre terminal'
        );
      }
    });
  }
}
