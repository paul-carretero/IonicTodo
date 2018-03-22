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
        // phrases clés :
        // créer liste <nom_liste>
        // éditer list <nom_liste>
        // ajouter tâche <nom_tache> dans liste <nom_liste>
        // éditer tâche <nom_tache> dans liste <nom_liste>
        for(const item of matches){
          const mots : string [] = item.split(" ");
          if(mots.includes("créer") && mots.includes("liste")){
            this.creerListe(mots);
            break;
          }
          if(mots.includes("ajouter") && mots.includes("liste") && mots.includes("tâche")){
            this.creerTache(mots);
            break;
          }
          if(mots.includes("éditer") && mots.includes("liste") && !mots.includes("tâche")){
            this.updateListe(mots);
            break;
          }
          if(mots.includes("éditer") && mots.includes("liste") && mots.includes("tâche")){
            this.updateTache(mots);
            break;
          }
          if(mots.includes("supprimer") && mots.includes("liste") && !mots.includes("tâche")){
            this.supprimerListe(mots);
            break;
          }
          if(mots.includes("supprimer") && mots.includes("liste") && mots.includes("tâche")){
            this.supprimerTache(mots);
            break;
          }
        }
      },
      () => {
        this.uiCtrl.alert('Erreur', 'une erreur inattendue est survenue');
        this.uiCtrl.dismissLoading();
      }
    );
  }

  private async creerListe(mots : string[]) : Promise<void> {
    console.log("dans créer liste");
    
    // on récupère le nom de la liste que l'on veut créer
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    
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

  private supprimerListe(mots : string[]) : void {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("supprimer liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    this.todoService.deleteList(uuidListe);
  }

  private async supprimerTache(mots : string[]) : Promise<void> {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    console.log("supprimer tache : " + nomTache +" de la liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    
  }

 
  private async updateListe(mots : string[]) : Promise<void> {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("update de liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    
    this.evtCtrl.getNavRequestSubject().next({page:'ListEditPage', data:{uuid: uuidListe}});
  }

  private async updateTache(mots : string[]) : Promise<void> {
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("update de tache : " + nomTache   +" de la liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    
    this.todoService.goEditTodoByName(nomTache,uuidListe);
    /*
    this.todoService.getTodoRefByName(nomTache,uuidListe).subscribe( ref =>{
      console.log("ref récupérée" + ref);
      //if(ref != null){
      //  this.evtCtrl.getNavRequestSubject().next({page:'TodoEditPage', data:{todoRef: ref}});
      //} 
    })*/
    
    
  }


  private async creerTache(mots : string[]) : Promise<void> {
    // phrase de la forme : ajouter tache <nom_tache> dans liste <nom_liste>
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    
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
