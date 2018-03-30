import { ContactServiceProvider } from './../contact-service/contact-service';
import { ISpeechReqResult } from '../../model/speech-req-res';
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
import { SpeechParser } from './parser';
import { IParsedRequest } from './parsed-req';


@Injectable()
export class SpeechRecServiceProvider {
  private allOK = false;

  private readonly nb_essais_pour_aide = 3;
  private nb_essais_courant = 0;   
  private readonly message_aide_page_home = " Exemples d'utilisation depuis la page de l'ensemble des listes : \n" + 
  " Créer la liste maison. \n" +
  " Afficher la liste maison. \n " +
  " Modifier la liste maison. \n " +
  " Ajouter la tâche repassage dans la liste maison. \n"+
  " Supprimer la tâche repassage dans la liste maison. \n" +
  " Supprimer la liste maison. \n" ; 
  private readonly message_aide_page_todo_list = "Exemples d'utilisation depuis la page d'une liste : \n" + 
  " Ajouter la tâche repassage. \n"+
  " Afficher la tâche repassage. \n" +
  " Supprimer la tâche repassage. \n" ; 

  private readonly parser: SpeechParser;

  /**
   * Creates an instance of SpeechRecServiceProvider.
   * @param {SpeechRecognition} speechRecognition
   * @param {EventServiceProvider} evtCtrl
   * @param {TodoServiceProvider} todoService
   * @param {UiServiceProvider} uiCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {SpeechSynthServiceProvider} speechSynthService
   * @memberof SpeechRecServiceProvider
   */
  constructor(
    private readonly speechRecognition: SpeechRecognition,
    private readonly evtCtrl: EventServiceProvider,
    private readonly todoService: TodoServiceProvider,
    private readonly uiCtrl: UiServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly speechSynthService: SpeechSynthServiceProvider,
    contactCtrl: ContactServiceProvider
  ) {
    this.parser = new SpeechParser(todoService, contactCtrl, evtCtrl);
  }

  /**
   * démarre le service reconnaissance vocale lorsque l'utilisateur utilise la fonction du menu.
   * Si la reconnaissance vocale à déjà été utilisé alors tente de l'utiliser directement
   *
   * @public
   * @memberof SpeechRecServiceProvider
   */
  public listenForSpeechRequest(): void {
    this.evtCtrl.getMenuRequestSubject().subscribe(req => {
      if (req.request === MenuRequestType.SPEECH_REC) {
        if (this.allOK) {
          this.startListening();
        } else {
          this.speechWrapper();
        }
      }
    });
  }

  /**
   * Appelé au début pour vérification des authorisations de la reconnaissance vocale
   *
   * @private
   * @memberof SpeechRecServiceProvider
   */
  private speechWrapper(): void {
    this.uiCtrl.showLoading('Veuillez patienter, préparation de le reconnaissance vocale');
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

  /**
   * Méthode appelée lorsque la reconnaissance vocale est activée
   *
   * @private
   * @returns {Promise<void>}
   * @memberof SpeechRecServiceProvider
   */
  private async startListening(): Promise<void> {
    this.speechRecognition.startListening().subscribe(
      async (matches: string[]) => {
        this.uiCtrl.dismissLoading();
        console.log(matches);

        // variable permettant de savoir si :
        // - une action à été reconnue,
        // - si elle a réussi,
        // - et dans le cas contraire, le message d'erreur associé
        let res_rec: ISpeechReqResult;
        res_rec = { reconnu: false, action_success: false, message_error: '' };

        // pour chaque "phrase" possible reconnue par le micro
        for (const item of matches) {
          await this.parser.init();
          // on parse cette phrase
          const sentence : IParsedRequest = await this.parser.parse(item);
          console.log(sentence);
          
          res_rec = this.reconnaissanceAction(sentence);
          if(res_rec.action_success){
            break;
          }       
       }
       
        // si aucune action n'a été reconnue
        if (res_rec.reconnu == null || !res_rec.reconnu) {    
          this.speechSynthService.synthText("Je n'ai pas compris");
          this.nb_essais_courant ++;
          if(this.nb_essais_courant >= this.nb_essais_pour_aide){
            this.speechSynthService.synthText("Si vous voulez de l'aide, dites aide");
          }
          
        }
        // si l'action a été reconnue mais n'a pas pu être réalisée
        // on affiche son message d'erreur
        if (res_rec.reconnu != null && res_rec.reconnu && !res_rec.action_success) {
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
   * Méthode permettant de reconnaitre l'action à réaliser 
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private reconnaissanceAction(sentence : IParsedRequest): ISpeechReqResult {
 
    let phrase_reconnue = false;
    let resultat_action: { action_success: boolean; message_error: string };
    resultat_action = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };


    if(sentence.request != null){
      // reconnaissance des mots clefs dans les mots entendus
      const contain_list = (sentence.newListName != null || sentence.listFound != null);
      const contain_todo = (sentence.newTodoName != null || sentence.todoFound != null);
      const contain_create = (sentence.request.request === MenuRequestType.CREATE);
      const contain_update = (sentence.request.request === MenuRequestType.EDIT);
      const contain_delete = (sentence.request.request === MenuRequestType.DELETE);
      const contain_view = (sentence.request.request === MenuRequestType.VIEW);
      const contain_aide = (sentence.request.request === MenuRequestType.HELP);
    
      // CRÉER UNE NOUVELLE LISTE ?
      if(contain_create && contain_list && !contain_todo){
        phrase_reconnue = true;
        resultat_action = this.creerListe(sentence);
      }
      // AJOUTER UNE TACHE DANS UNE LISTE ?
      if (contain_create && contain_list && contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.creerTache(sentence);
      }
      // AJOUTER UNE TACHE CONTEXTUELLEMENT ?
      if (contain_create && !contain_list && contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.creerTacheContext(sentence);
      }
      // METTRE A JOUR UNE LISTE ?
      if (contain_update && contain_list && !contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.updateListe(sentence);
      }
      // METTRE A JOUR UNE TACHE ?
      if (contain_update && contain_list && contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.updateTache(sentence);
      }
      // METTRE A JOUR UNE TACHE CONTEXTUELLEMENT ?
      if (contain_update && !contain_list && contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.updateTacheContext(sentence);
      }
      // SUPPRIMER UNE LISTE ?
      if (contain_delete && contain_list && !contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.supprimerListe(sentence);
      }
      // SUPPRIMER UNE TACHE ?
      if (contain_delete && contain_list && contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.supprimerTache(sentence);
      }
      // SUPPRIMER UNE TACHE CONTEXTUELLEMENT ?
      if (contain_delete && !contain_list && contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.deleteTacheContext(sentence);
      }
      //AFFICHER UNE LISTES ?
      if (contain_view && contain_list && !contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.afficherListe(sentence);
      }
      //AFFICHER UNE TACHE CONTEXTUELLEMENT ?
      if (contain_view && !contain_list && contain_todo) {
        phrase_reconnue = true;
        resultat_action = this.afficherTodo(sentence);
      }
      // DEMANDER L'AIDE
      if(contain_aide){
        phrase_reconnue = true;
        if(this.evtCtrl.getCurrentContext(true) != null){
          this.speechSynthService.synthText(this.message_aide_page_todo_list);
        }
        else{
          this.speechSynthService.synthText(this.message_aide_page_home);
        }
        resultat_action = {action_success : true, message_error : ""};
      }
    }

    return {
      reconnu: phrase_reconnue,
      action_success: resultat_action.action_success,
      message_error: resultat_action.message_error
    };
  }
  

/********************************************

Méthodes pour les actions liées aux listes

*******************************************/

  /**
   * Méthode permettant de créer une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";
    const nameList = sentence.newListName;
  
    if (nameList == null) {
      message_error = "Je n'ai pas compris le nom de la liste à créer. Veuillez essayer de nouveau.";
    } else {
      if(sentence.listFound != null){
        message_error = 'La liste ' + nameList + ' existe déjà';
      }
      else {
        this.addNewList(nameList);
        this.speechSynthService.synthText('Liste ' + nameList + ' créée.');
        action_success = true;
      }
    }

    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'ajouter une nouvelle liste
   *
   * @private
   * @param {string} nameList nom de la liste à ajouter
   * @memberof SpeechRecServiceProvider
   */
  private addNewList(nameList: string): void {
    let destType: ListType = ListType.LOCAL;
    if (this.authCtrl.isConnected()) {
      destType = ListType.PRIVATE;
    }
    const iconList = 'list-box';
    const data: ITodoList = Global.getBlankList();
    data.name = nameList;
    data.icon = iconList;
    this.todoService.addList(data, destType);
  }

  /**
   * Méthode permettant d'afficher la page d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private afficherListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null) {
      action_success = true;
      this.speechSynthService.synthText('Affichage de la liste ' + sentence.listFound.name);
      this.evtCtrl
        .getNavRequestSubject()
        .next({ page: 'TodoListPage', data: { uuid: sentence.listFound.uuid } });
    } else {
      message_error = 'La liste ' + sentence.newListName + " n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'afficher la page d'édition d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null) {
      action_success = true;
      this.speechSynthService.synthText('Vous pouvez modifier la liste ' + sentence.listFound.name);
      this.evtCtrl
        .getNavRequestSubject()
        .next({ page: 'ListEditPage', data: { uuid: sentence.listFound.uuid } });
    } else {
      message_error = 'La liste ' + sentence.newListName + "n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant de supprimer une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private supprimerListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      this.speechSynthService.synthText('Suppression de la liste ' + sentence.listFound.name);
      this.todoService.deleteList(sentence.listFound.uuid);
      action_success = true;
    } else {
      message_error = 'La liste ' + sentence.newListName + "n'a pas étée trouvée. Suppression impossible";
    }
    return { action_success: action_success, message_error: message_error };
  }




  /********************************************

Méthodes pour les actions liées aux tâches

*******************************************/

  /**
   * Méthode permettant de créer une tâche associée à une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerTache(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null){ 
      if(sentence.listFound.uuid != null) {      
        const data: ITodoItem = Global.getBlankTodo();
        data.name = sentence.newTodoName;
        const refDoc = this.todoService.addTodo(sentence.listFound.uuid, data);
        action_success = (refDoc != null);

        if (action_success) {
          this.speechSynthService.synthText(
            'Tâche ' + sentence.newTodoName + ' a été ajoutée dans la liste ' + sentence.listFound.name
          );
          this.evtCtrl
            .getNavRequestSubject()
            .next({ page: 'TodoListPage', data: { uuid: sentence.listFound.uuid } });
      
          } else {
          message_error = 'La tâche ' + sentence.newTodoName + "n'a pas pu être créée";
        }

      } else {
        message_error = 'La liste ' + sentence.listFound.name + "n'a pas étée trouvée";
      }
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'afficher la page d'édition d'une tâche d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateTache(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'as pas pu être réalisée";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      if (sentence.todoFound != null) {
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoEditPage', data: { todoRef: sentence.todoFound.ref } });
        this.speechSynthService.synthText(
          'Vous pouvez maintenant modifier la tâche ' + sentence.todoFound.name + ' de la liste ' + sentence.listFound.name
        );
        action_success = true;
      } else {
        message_error =
          'La tâche ' +
          sentence.newTodoName +
          " n'a pas étée trouvée dans la liste " +
          sentence.listFound.name;
      }
    } else {
      message_error = 'La liste ' + sentence.newListName + "n'a pas étée trouvée";
    }

    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant de supprimer une tâche d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private supprimerTache(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      
      if (
        sentence.todoFound != null &&
        sentence.todoFound.ref != null &&
        sentence.todoFound.uuid != null
      ) {
        this.speechSynthService.synthText(
          'Suppression de la tâche ' + sentence.todoFound.name + ' de la liste ' + sentence.listFound.name
        );
        this.todoService.deleteTodo(sentence.todoFound.ref, sentence.todoFound.uuid);
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoListPage', data: { uuid: sentence.listFound.uuid } });
        action_success = true;
      } else {
        message_error = 'La tâche ' + sentence.newTodoName + " n'a pas été trouvée";
      }
    } else {
      message_error = 'La liste ' + sentence.newListName + " n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }




  /********************************************

Méthodes contextuelles

*******************************************/
  /**
   * Méthode permettant de créer une tâche dans la liste courante
   * 
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerTacheContext(sentence: IParsedRequest): ISpeechReqResult {
    const res: ISpeechReqResult = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };

    const uuidList = this.evtCtrl.getCurrentContext(true);

    if (uuidList != null) {
      if (sentence.todoFound == null) {
        const new_todo = Global.getBlankTodo();
        new_todo.name = sentence.newTodoName;
        this.todoService.addTodo(uuidList, new_todo);
        this.speechSynthService.synthText('Ajout de la tâche ' + sentence.newTodoName);
        res.action_success = true;
      } else {
        res.message_error = 'La tâche ' + sentence.newTodoName + ' existe déjà dans la liste';
      }
    } else {
      res.message_error =
        'Veuillez indiquer dans quelle liste créer la tâche ' + sentence.newTodoName + ' .';
    }
    return res;
  }

  /**
   * Méthode permettant de modifier une tâche dans la liste courante
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateTacheContext(sentence: IParsedRequest): ISpeechReqResult {
    const res: ISpeechReqResult = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };

    const list_uuid = this.evtCtrl.getCurrentContext(true);
    if (list_uuid != null) {
      if (sentence.todoFound != null) {
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoEditPage', data: { todoRef: sentence.todoFound.ref } });
        this.speechSynthService.synthText(
          'Vous pouvez maintenant modifier la tâche ' + sentence.todoFound.name
        );
        res.action_success = true;
      } else {
        res.message_error = 'La tâche ' + sentence.newTodoName + " n'existe pas dans la liste";
      }
    } else {
      res.message_error =
        'Veuillez indiquer dans quelle liste modifier la tâche ' + sentence.newTodoName + ' .';
    }
    return res;
  }

  /**
   * Méthode permettant de supprimer une tâche dans la liste courante
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private deleteTacheContext(sentence: IParsedRequest): ISpeechReqResult {
    const res: ISpeechReqResult = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };

    const list_uuid = this.evtCtrl.getCurrentContext(true);
    if (list_uuid != null) {
      if (sentence.todoFound != null && sentence.todoFound.ref != null && sentence.todoFound.uuid != null) {
        this.todoService.deleteTodo(sentence.todoFound.ref, sentence.todoFound.uuid);
        this.speechSynthService.synthText('La tâche ' + sentence.todoFound.name + ' a été supprimée. ');
        res.action_success = true;
      } else {
        res.message_error = 'La tâche ' + sentence.newTodoName + " n'existe pas dans la liste";
      }
    } else {
      res.message_error =
        'Veuillez indiquer dans quelle liste supprimer la tâche ' + sentence.newTodoName + ' .';
    }
    return res;
  }

  /**
   * Méthode permettant d'afficher la page d'une tâche
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private afficherTodo(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    const list_uuid = this.evtCtrl.getCurrentContext(true);

    if (list_uuid != null) {
      if (sentence.todoFound != null) {
        action_success = true;
        this.speechSynthService.synthText('Affichage de la tâche ' + sentence.todoFound.name);
        this.evtCtrl.getNavRequestSubject().next({
          page: 'TodoPage',
          data: {
            todoRef: sentence.todoFound.ref,
            listUuid: list_uuid,
            isExternal: false
          }
        });
      } else {
        message_error = 'La tâche ' + sentence.newTodoName + " n'a pas été trouvée. ";
      }
    } else {
      message_error = 'Veuillez préciser la liste où se trouve la tâche ' + sentence.newTodoName;
    }
    return { action_success: action_success, message_error: message_error };
  }
}
