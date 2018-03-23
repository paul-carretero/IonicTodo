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
//import { DocumentReference } from '@firebase/firestore-types';
//import { TodoListPage } from '../../pages/todo-list/todo-list';

@Injectable()
export class SpeechRecServiceProvider {
  private allOK = false;


  private readonly motClefs = {
    list :["liste", "ensemble"],
    todo :["tâche", "todo", "tâches"],
    create :["créer", "ajouter"], 
    update : ["éditer", "modifier"], 
    delete :["supprimer", "enlever"],
    view : ["afficher", "visionner", "voir"],
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
        let res_rec : {reconnu :boolean, success : boolean, message_error : string};
        res_rec = {reconnu : false, success :false, message_error : ""};
        for(const item of matches){
          const mots : string [] = item.split(" ");
          res_rec = this.reconnaissanceVocale(mots); 
          if(res_rec.success){
            break;
          }
        }
        if(!res_rec.reconnu){
          this.speechSynthService.synthText("Aucun mot clé n'a été reconnu. Veuillez réésayer");
        }
        if(res_rec.reconnu && !res_rec.success){
          this.speechSynthService.synthText(res_rec.message_error);
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
  public reconnaissanceVocale(mots : string[]) : {reconnu :boolean, success : boolean, message_error : string}{
    const contain_list = this.contain_motclef(mots, this.motClefs.list);
    const contain_todo = this.contain_motclef(mots, this.motClefs.todo);
    const contain_create = this.contain_motclef(mots, this.motClefs.create);
    const contain_update = this.contain_motclef(mots, this.motClefs.update);
    const contain_delete = this.contain_motclef(mots, this.motClefs.delete);
    const contain_view = this.contain_motclef(mots, this.motClefs.view);


    let action_success = false;
    let phrase_reconnue = false;
    let message_error = "L'action n'a pas pu être réalisée";
    if(contain_create && contain_list && !contain_todo){
      phrase_reconnue = true;
      this.creerListe(mots);
      action_success = true;
    }
    if(contain_create && contain_list && contain_todo){
      phrase_reconnue = true;
      const list = this.name_list_existed(this.getNameList(mots)); 
      if(list.success){
        action_success = this.creerTache(mots);
      }
      else{
        message_error = "La liste " + this.getNameList(mots) + "n'a pas étée trouvée";
      }   
      
    }

    if(contain_update && contain_list && !contain_todo){
      phrase_reconnue = true;
      action_success = this.updateListe(mots);
    }

    if(contain_update && contain_list && contain_todo){
      phrase_reconnue = true;
      const list = this.name_list_existed(this.getNameList(mots)); 
      if(list.success){
        if(this.name_todo_existed(this.getNameTodo(mots), list.uuid).success){
          action_success = true;
          action_success = this.updateTache(mots);
        }
        else{
          message_error = "La tâche " + this.getNameTodo(mots) + " n'a pas étée trouvée dans la liste " + this.getNameList(mots);
        }
      }
      else{
        message_error = "La liste " + this.getNameList(mots) + "n'a pas étée trouvée";
      }  
    }

    if(contain_delete && contain_list && !contain_todo){
      phrase_reconnue = true;
      action_success = this.supprimerListe(mots);
    }
    if(contain_delete && contain_list && contain_todo){
      phrase_reconnue = true;
      action_success = this.supprimerTache(mots);
    }
    if(contain_view && contain_list && !contain_todo){
      phrase_reconnue = true;
      action_success = this.afficherListe(mots);
    }
    if(this.contain_motclef(mots, this.motClefs.insulte)){
      phrase_reconnue = true;
      action_success = true;
      this.speechSynthService.synthText("Veuillez rester polis");
    }
    return {reconnu : phrase_reconnue, success : action_success, message_error : message_error};
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

  private getNameList(mots : string[]) : string {
    return mots[mots.indexOf("liste")+1];
  }

  private getNameTodo(mots : string[]) : string {
    return mots[mots.indexOf("tâche")+1];
  }

  private name_list_existed(name : string) : {uuid : string , success : boolean } {
    let uuidList : string | null ="";
    let is_success : boolean = false;
    this.todoService.getAllList().forEach(
          liste => {
            if(liste.name === name){
              uuidList = liste.uuid;
              is_success = true;
            }
          }
        );
    return {uuid : uuidList, success : is_success};
  }

  /**
   * 
   * @param name le nom de la tâche recherchée
   * @param uuidList l'uuid de la liste où l'on veut chercher la tache
   */
  private name_todo_existed(name : string, uuidList : string) : {todo : ITodoItem , success : boolean } {
    let todo_found : ITodoItem = Global.getBlankTodo();
    let is_success : boolean = false;
    this.todoService.getAllTodos(uuidList).forEach(
          todo => {
            if(todo.name === name){
              todo_found = todo;
              is_success = true;
            }
          }
        );
    return {todo : todo_found, success : is_success};
  }

////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
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
    this.speechSynthService.synthText("Liste " + nomListe + " créée.");
    console.log("uuid : " + nextUuid);
  }

  private supprimerListe(mots : string[]) : boolean {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("supprimer liste : " + nomListe);
    
    const uuidListe_search = this.name_list_existed(nomListe);
    console.log("uuid liste : " + uuidListe_search.uuid);
    if(uuidListe_search.success){
      this.speechSynthService.synthText("Suppression de la liste " + nomListe);
      this.todoService.deleteList(uuidListe_search.uuid);
    }
    return uuidListe_search.success;
  }  

  private supprimerTache(mots : string[]) : boolean {
    let success : boolean = false;
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    console.log("supprimer tache : " + nomTache +" de la liste : " + nomListe);
    
    const liste_search = this.name_list_existed(nomListe);
    console.log("uuid liste : " + liste_search.uuid);
    if(liste_search.success){
      console.log("liste trouvée");
      const todo_search = this.name_todo_existed(nomTache, liste_search.uuid);
      if(todo_search.success){
        if(todo_search.todo.ref != null && todo_search.todo.uuid != null){
          this.speechSynthService.synthText("Suppression de la tâche " + nomTache + " de la liste " + nomListe);
          this.todoService.deleteTodo(todo_search.todo.ref, todo_search.todo.uuid); 
          this.evtCtrl.getNavRequestSubject().next({page:'TodoListPage', data:{uuid: liste_search.uuid}});
          success = true;
        }      
      }
    }
    return success;
  }

  private afficherListe(mots : string[]) : boolean {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("afficher liste : " + nomListe);
    
    const liste_search = this.name_list_existed(nomListe);
    console.log("uuid liste : " + liste_search.uuid);
    if(liste_search.success){
      this.speechSynthService.synthText("Affichage de la liste " + nomListe);
      this.evtCtrl.getNavRequestSubject().next({page:'TodoListPage', data:{uuid: liste_search.uuid}});
    }
    return liste_search.success;
  }
 
  private updateListe(mots : string[]) : boolean {
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("update de liste : " + nomListe);
    
    const liste_search = this.name_list_existed(nomListe);
    console.log("uuid liste : " + liste_search.uuid);
    if(liste_search.success){
      this.evtCtrl.getNavRequestSubject().next({page:'ListEditPage', data:{uuid: liste_search.uuid}});
    }
    return liste_search.success;
  }

  private updateTache(mots : string[]) : boolean {
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    console.log("update de tache : " + nomTache   +" de la liste : " + nomListe);
    
    const liste_search = this.name_list_existed(nomListe);
    console.log("uuid liste : " + liste_search.uuid);
    let success = false;
    if(liste_search.success){
      const todo_search = this.name_todo_existed(nomTache, liste_search.uuid);
      if(todo_search.success){
        this.evtCtrl.getNavRequestSubject().next({page:'TodoEditPage', data:{todoRef: todo_search.todo.ref}});
        success = true;
      }
    }
    return success;
  }


  private creerTache(mots : string[]) : boolean {
    // phrase de la forme : ajouter tache <nom_tache> dans liste <nom_liste>
    const nomTache : string = mots[mots.indexOf("tâche") + 1];
    
    const nomListe : string = mots[mots.indexOf("liste") + 1];
    
    console.log("créer todo : " + nomTache + " dans la liste : " + nomListe);
    
    const liste_search = this.name_list_existed(nomListe);
    console.log("uuid liste : " + liste_search.uuid);

    const data : ITodoItem = Global.getBlankTodo();
    data.name = nomTache;

    if(liste_search.success){
      const refDoc = this.todoService.addTodo(liste_search.uuid, data);  
      console.log("ref doc : " + refDoc);
      this.speechSynthService.synthText("Tâche " + nomTache + " a été ajoutée dans la liste " + nomListe);
      this.evtCtrl.getNavRequestSubject().next({page:'TodoListPage', data:{uuid: liste_search.uuid}});
    }
    
    return liste_search.success;
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
