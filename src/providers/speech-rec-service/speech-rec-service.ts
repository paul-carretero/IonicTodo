import { UiServiceProvider } from './../ui-service/ui-service';
import { EventServiceProvider } from './../event/event-service';
import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { MenuRequestType } from '../../model/menu-request-type';
import { ListType, ITodoList } from '../../model/todo-list';
import { TodoServiceProvider } from '../todo-service-ts/todo-service-ts';
import { Global } from '../../shared/global';
import { ITodoItem } from '../../model/todo-item';
//import { TodoListPage } from '../../pages/todo-list/todo-list';

@Injectable()
export class SpeechRecServiceProvider {
  private allOK = false;

  constructor(
    private readonly speechRecognition: SpeechRecognition,
    private readonly evtCtrl: EventServiceProvider,
    private readonly todoService : TodoServiceProvider,
    //private readonly navCtrl : NavController,
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
        // phrases clés :
        // créer liste <nom_liste>
        // éditer list <nom_liste>
        // ajouter tache <nom_tache> dans liste <nom_liste>
        // éditer tache 
        matches.forEach(
            async s => {
              if(s.includes("créer liste") && !trouve){ 
                  trouve = true;
                  this.creerListe(s);
              }
              if(s.includes("éditer liste") && !trouve){
                  trouve = true;
                  this.updateListe(s);
              }
              if(s.includes("éditer tache") && !trouve){ 
                if(s.includes("liste")){
                  trouve = true;
                  this.updateTache(s);
                }
              }
              if(s.includes("ajouter tâche") && !trouve){ 
                if(s.includes("liste")){
                  trouve = true;
                  this.creerTache(s);
                }
              }   
            }
         );
        if(!trouve){
          console.log("pas de mots clés reconnus");
          this.uiCtrl.alert('Erreur', 'Aucun mot clé n a été reconnu');
          this.uiCtrl.dismissLoading();
        }
        
      },
      () => {
        this.uiCtrl.alert('Erreur', 'une erreur inattendue est survenue');
        this.uiCtrl.dismissLoading();
      }
    );
  }

  private async creerListe(s : String) : Promise<void> {
    console.log("dans créer liste");
    
    // on récupère le nom de la liste que l'on veut créer
    const nomListe : string = s.slice(s.indexOf("liste") + 6 );
    console.log("Trouvé liste");
    console.log("nom de la liste :" + nomListe);

    const destType: ListType = ListType.LOCAL;
    console.log("type" + destType);

    const iconList = "list-box";

    const data : ITodoList = Global.getBlankList();
    data.name = nomListe;
    data.icon = iconList;
    console.log("data : " + data);
    const nextUuid = await this.todoService.addList(data, destType);
    console.log("uuid : " + nextUuid);
  }

 
  private async updateListe(s : String) : Promise<void> {
    const nomListe : string = s.slice(s.indexOf("liste") + 6 );
    console.log("update de liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    
    this.evtCtrl.getNavRequestSubject().next({page:'ListEditPage', data:{uuid: uuidListe}});
  }

  private async updateTache(s : String) : Promise<void> {
    const nomTache : string = s.slice(s.indexOf("tâche") + 6 );
    const nomListe : string = s.slice(s.indexOf("liste") + 6 );
    console.log("update de tache : " + nomTache   +" de la liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    console.log("type liste récupérée : " + this.todoService.getListType(uuidListe));
    //this.evtCtrl.getNavRequestSubject().next({page:'TodoEditPage', data:{todoRef: uuidListe}});
  }


  private async creerTache(s : String) : Promise<void> {
    // phrase de la forme : ajouter tache <nom_tache> dans liste <nom_liste>
    const nomTache : string = s.slice(s.indexOf("tâche") + 6 );
    const nomListe : string = s.slice(s.indexOf("liste") + 6 );
    console.log("créer todo : " + nomTache + " dans la liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);

    const data : ITodoItem = Global.getBlankTodo();
    data.name = nomTache;

    const refDoc = await this.todoService.addTodo(uuidListe, data);  
    console.log("ref doc : " + refDoc);

    this.evtCtrl.getNavRequestSubject().next({page:'TodoListPage', data:{uuid: uuidListe}});

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
