import { UiServiceProvider } from './../ui-service/ui-service';
import { EventServiceProvider } from './../event/event-service';
import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { MenuRequestType } from '../../model/menu-request-type';
import { ListType, ITodoList } from '../../model/todo-list';
import { TodoServiceProvider } from '../todo-service-ts/todo-service-ts';
import { Global } from '../../shared/global';
import { ITodoItem } from '../../model/todo-item';
import { AuthServiceProvider } from '../auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../speech-synth-service/speech-synth-service';
//import { TodoListPage } from '../../pages/todo-list/todo-list';

@Injectable()
export class SpeechRecServiceProvider {
  private allOK = false;


  private readonly motClefs = {
    list :["liste", "ensemble"],
    todo :["tâche", "todo"],
    create :["créer", "ajouter"], 
    update : ["éditer", "modifier"], 
    delete :["supprimer", "enlever"],
    view : ["afficher", "visionner"],
    insulte : ["chier", "putain", "merde"]
  };


  constructor(
    private readonly speechRecognition: SpeechRecognition,
    private readonly evtCtrl: EventServiceProvider,
    private readonly todoService : TodoServiceProvider,
    private readonly uiCtrl: UiServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly speechSynthService : SpeechSynthServiceProvider
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
        let trouve = false;
        for(const item of matches){
          const mots : string [] = item.split(" ");
          trouve = this.reconnaissanceVocale(mots); 
          if(trouve){
            break;
          }
        }
        if(!trouve){
          this.speechSynthService.synthText("Aucun mot clé n'a été reconnu. Veuillez réésayer");
        }
      },
      () => {
        this.uiCtrl.alert('Erreur', 'une erreur inattendue est survenue');
        this.uiCtrl.dismissLoading();
      }
    );
  }

  /**
   * Méthode permettant d'agir selon les mots enregistrés reconnus
   * @param mots ensemble de mots enregistrés par le micro
   */
  public reconnaissanceVocale(mots : string[]) : boolean{
    const contain_list = this.contain_motclef(mots, this.motClefs.list);
    const contain_todo = this.contain_motclef(mots, this.motClefs.todo);
    const contain_create = this.contain_motclef(mots, this.motClefs.create);
    const contain_update = this.contain_motclef(mots, this.motClefs.update);
    const contain_delete = this.contain_motclef(mots, this.motClefs.delete);
    const contain_view = this.contain_motclef(mots, this.motClefs.view);


    let trouve = false;
    if(contain_create && contain_list && !contain_todo){
      this.creerListe(mots);
      trouve = true;
    }
    if(contain_create && contain_list && contain_todo){
      this.creerTache(mots);
      trouve = true;
    }
    if(contain_update && contain_list && !contain_todo){
      this.updateListe(mots);
      trouve = true;
    }
    if(contain_update && contain_list && contain_todo){
      this.updateTache(mots);
      trouve = true;
    }
    if(contain_delete && contain_list && !contain_todo){
      this.supprimerListe(mots);
      trouve = true;
    }
    if(contain_delete && contain_list && contain_todo){
      this.supprimerTache(mots);
      trouve = true;
    }
    if(contain_view && contain_list && !contain_todo){
      this.afficherListe(mots);
      trouve = true;
    }
    if(this.contain_motclef(mots, this.motClefs.insulte)){
      trouve = true;
      this.speechSynthService.synthText("Veuillez rester polis");
    }
    return trouve;
  }

  /**
   * Méthode permettant de reconnaitre un mot clef dans un ensemble de mots
   * @param mots ensemble de mots à vérifier
   * @param motclefs mot clef à trouvé (et ses synonymes)
   */
  public contain_motclef(mots : string[], motclefs : string[]) : boolean {
    let contain : boolean = false;
    for(const motclef of motclefs){
      if(mots.includes(motclef)){
        contain = true;
      }
    }
    return contain;
  }



  private async creerListe(mots : string[]) : Promise<void> {
    console.log("dans créer liste");
    
    // on récupère le nom de la liste que l'on veut créer
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    
    console.log("Trouvé liste");
    console.log("nom de la liste :" + nomListe);

    let destType: ListType = ListType.LOCAL;
    if(this.authCtrl.isConnected()){
      destType = ListType.PRIVATE;
    }
    
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

  private supprimerTache(mots : string[]) : void {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    console.log("supprimer tache : " + nomTache +" de la liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    this.todoService.deleteTodoByName(nomTache, uuidListe);    
    this.evtCtrl.getNavRequestSubject().next({page:'TodoListPage', data:{uuid: uuidListe}});

  }

  private afficherListe(mots : string[]) : void {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("afficher liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    this.evtCtrl.getNavRequestSubject().next({page:'TodoListPage', data:{uuid: uuidListe}});

  }
 
  private updateListe(mots : string[]) : void {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("update de liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    
    this.evtCtrl.getNavRequestSubject().next({page:'ListEditPage', data:{uuid: uuidListe}});
  }

  private updateTache(mots : string[]) : void {
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("update de tache : " + nomTache   +" de la liste : " + nomListe);
    
    const uuidListe = this.todoService.getListUUIDByName(nomListe);
    console.log("uuid liste : " + uuidListe);
    
    this.todoService.goEditTodoByName(nomTache,uuidListe);    
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
