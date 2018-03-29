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

@Injectable()
export class SpeechRecServiceProvider {
  private allOK = false;

  /**
   * Contient les mots qui sont reconnus comme mots clés
   *
   * @private
   * @readonly
   * @memberof SpeechRecServiceProvider
   */
  private readonly motClefs = {
    list: ['liste', 'ensemble'],
    todo: ['tâche', 'todo', 'tâches', 'note'],
    create: ['créer', 'ajouter', 'créée', 'créé', 'crée'],
    update: [
      'éditer',
      'modifier',
      'édite',
      'édites',
      'éditait',
      'éditais',
      'éditons',
      'éditez',
      'modifie'
    ],
    delete: ['supprimer', 'enlever', 'retirer', 'retire', 'retirez', 'supprime', 'supprimez'],
    view: ['afficher', 'visionner', 'voir', 'affiche'],
    insulte: ['chier', 'putain', 'merde']
  };

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
      (matches: string[]) => {
        this.uiCtrl.dismissLoading();
        console.log(matches);

        // variable permettant de savoir si :
        // - une action à été reconnue,
        // - si elle a réussi,
        // - et dans le cas contraire, le message d'erreur associé
        let res_rec: ISpeechReqResult;
        res_rec = { reconnu: false, action_success: false, message_error: '' };

        // pour chaque "phrase" possible reconnue par le micro
        this.parser
          .init()
          .then(() => this.parser.parse(matches[0]).then(res => console.log(res)));

        for (const item of matches) {
          // on sépare cette phrase en mots

          //const mots: string[] = item.split(' ');

          // on veux reconnaitre l'action associée

          //res_rec = this.reconnaissanceAction(mots);

          // si une action a réussi, alors on quitte la reconnaissance

          /*if (res_rec.action_success) {
            break;
          }*/
          item;
          this.reconnaissanceAction;
        }
        // si aucune action n'a été reconnue
        if (res_rec.reconnu == null || !res_rec.reconnu) {
          this.speechSynthService.synthText("Je n'ai pas compris");
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
   * Méthode permettant de reconnaitre l'action à réaliser à partir de mots reconnus par le micro
   *
   * @private
   * @param {string[]} mots ensemble des mots à traiter
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private reconnaissanceAction(mots: string[]): ISpeechReqResult {
    // reconnaissance des mots clefs dans les mots entendus
    const contain_list = this.contain_motclef(mots, this.motClefs.list);
    const contain_todo = this.contain_motclef(mots, this.motClefs.todo);
    const contain_create = this.contain_motclef(mots, this.motClefs.create);
    const contain_update = this.contain_motclef(mots, this.motClefs.update);
    const contain_delete = this.contain_motclef(mots, this.motClefs.delete);
    const contain_view = this.contain_motclef(mots, this.motClefs.view);

    let phrase_reconnue = false;
    let resultat_action: { action_success: boolean; message_error: string };
    resultat_action = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };

    // CRÉER UNE NOUVELLE LISTE ?
    if (contain_create && contain_list && !contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.creerListe(mots);
    }
    // AJOUTER UNE TACHE DANS UNE LISTE ?
    if (contain_create && contain_list && contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.creerTache(mots);
    }
    // AJOUTER UNE TACHE CONTEXTUELLEMENT ?
    if (contain_create && !contain_list && contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.creerTacheContext(mots);
    }
    // METTRE A JOUR UNE LISTE ?
    if (contain_update && contain_list && !contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.updateListe(mots);
    }
    // METTRE A JOUR UNE TACHE ?
    if (contain_update && contain_list && contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.updateTache(mots);
    }
    // METTRE A JOUR UNE TACHE CONTEXTUELLEMENT ?
    if (contain_update && !contain_list && contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.updateTacheContext(mots);
    }
    // SUPPRIMER UNE LISTE ?
    if (contain_delete && contain_list && !contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.supprimerListe(mots);
    }
    // SUPPRIMER UNE TACHE ?
    if (contain_delete && contain_list && contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.supprimerTache(mots);
    }
    // SUPPRIMER UNE TACHE CONTEXTUELLEMENT ?
    if (contain_delete && !contain_list && contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.deleteTacheContext(mots);
    }
    //AFFICHER UNE LISTES ?
    if (contain_view && contain_list && !contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.afficherListe(mots);
    }

    //AFFICHER UNE TACHE CONTEXTUELLEMENT ?
    if (contain_view && !contain_list && contain_todo) {
      phrase_reconnue = true;
      resultat_action = this.afficherTodo(mots);
    }

    if (this.contain_motclef(mots, this.motClefs.insulte)) {
      phrase_reconnue = true;
      resultat_action.action_success = true;
      this.speechSynthService.synthText('Veuillez rester polis');
    }
    return {
      reconnu: phrase_reconnue,
      action_success: resultat_action.action_success,
      message_error: resultat_action.message_error
    };
  }

  /********************************************

Méthodes liées à la reconnaissance de mots

*******************************************/

  /**
   * Méthode permettant de reconnaitre un mot clef dans un ensemble de mots
   * @param mots ensemble de mots à vérifier
   * @param motclefs mot clef à trouver (et ses synonymes)
   */
  private contain_motclef(mots: string[], motclefs: string[]): boolean {
    for (const motclef of motclefs) {
      if (mots.indexOf(motclef) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Méthode permettant de récupérer le nom de la liste, dans un ensemble de mots
   */
  private getNameList(mots: string[]): string {
    return mots[mots.indexOf('liste') + 1];
  }

  /**
   * Méthode permettant de récupérer le nom de la tâche, dans un ensemble de mots
   */
  private getNameTodo(mots: string[]): string {
    let name = '';
    for (const todo of this.motClefs.todo) {
      if (mots.includes(todo)) {
        name = mots[mots.indexOf(todo) + 1];
      }
    }
    return name;
  }

  /********************************************

Méthodes de vérification et de recherche

*******************************************/

  /**
   * Méthode permettant de vérifier si une liste existe, la retourne dans ce cas là
   * @param name nom de la liste à rechercher
   */
  private does_list_exist(name: string): { list: ITodoList; exist: boolean } {
    let list_found: ITodoList = Global.getBlankList();
    let is_success: boolean = false;
    this.todoService.getAllList().forEach(liste => {
      if (liste.name === name) {
        list_found = liste;
        is_success = true;
      }
    });
    return { list: list_found, exist: is_success };
  }

  /**
   * Méthode permettant de vérifier si une tâche existe dans une liste donnée, la retourne dans ce cas là
   * @param name le nom de la tâche recherchée
   * @param uuidList l'uuid de la liste où l'on veut chercher la tâche
   */
  private does_todo_existed(
    name: string,
    uuidList: string
  ): { todo: ITodoItem; success: boolean } {
    let todo_found: ITodoItem = Global.getBlankTodo();
    let is_success: boolean = false;
    this.todoService.getAllTodos(uuidList).forEach(todo => {
      if (todo.name === name) {
        todo_found = todo;
        is_success = true;
      }
    });
    return { todo: todo_found, success: is_success };
  }

  /********************************************

Méthodes pour les actions liées aux listes

*******************************************/

  /**
   * Méthode permettant de créer une liste à partir des mots entendus
   *
   * @private
   * @param {string[]} mots ensemble des mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerListe(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";
    const nameList = this.getNameList(mots);
    const liste = this.does_list_exist(nameList);

    if (liste.exist) {
      message_error = 'La liste ' + nameList + ' existe déjà';
    } else {
      this.addNewList(nameList);
      this.speechSynthService.synthText('Liste ' + nameList + ' créée.');
      action_success = true;
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
   * Méthode permettant d'afficher la page d'une liste, à partir des mots entendus
   *
   * @private
   * @param {string[]} mots ensemble de mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private afficherListe(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    const nomListe: string = this.getNameList(mots);

    const liste_search = this.does_list_exist(nomListe);
    if (liste_search.exist) {
      action_success = true;
      this.speechSynthService.synthText('Affichage de la liste ' + nomListe);
      this.evtCtrl
        .getNavRequestSubject()
        .next({ page: 'TodoListPage', data: { uuid: liste_search.list.uuid } });
    } else {
      message_error = 'La liste ' + nomListe + " n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'afficher la page d'édition d'une liste
   *
   * @private
   * @param {string[]} mots ensemble de mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateListe(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";
    const nomListe: string = this.getNameList(mots);
    const liste_search = this.does_list_exist(nomListe);

    if (liste_search.exist) {
      action_success = true;
      this.speechSynthService.synthText('Vous pouvez modifier la liste ' + nomListe);
      this.evtCtrl
        .getNavRequestSubject()
        .next({ page: 'ListEditPage', data: { uuid: liste_search.list } });
    } else {
      message_error = 'La liste ' + nomListe + "n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant de supprimer une liste à partir des mots entendus
   *
   * @private
   * @param {string[]} mots ensemble des mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private supprimerListe(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    const nomListe: string = this.getNameList(mots);

    const liste_search = this.does_list_exist(nomListe);
    if (liste_search.exist && liste_search.list.uuid != null) {
      this.speechSynthService.synthText('Suppression de la liste ' + nomListe);
      this.todoService.deleteList(liste_search.list.uuid);
      action_success = true;
    } else {
      message_error = 'La liste ' + nomListe + "n'a pas étée trouvée. Suppression impossible";
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
   * @param {string[]} mots ensemble de mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerTache(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    const nameList = this.getNameList(mots);
    const list_search = this.does_list_exist(nameList);
    if (list_search.exist && list_search.list.uuid != null) {
      const nameTodo = this.getNameTodo(mots);
      const data: ITodoItem = Global.getBlankTodo();
      data.name = nameTodo;

      const refDoc = this.todoService.addTodo(list_search.list.uuid, data);
      action_success = refDoc != null;

      if (action_success) {
        this.speechSynthService.synthText(
          'Tâche ' + nameTodo + ' a été ajoutée dans la liste ' + list_search.list.name
        );
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoListPage', data: { uuid: list_search.list.uuid } });
      } else {
        message_error = 'La tâche ' + nameTodo + "n'a pas pu être créée";
      }
    } else {
      message_error = 'La liste ' + nameList + "n'a pas étée trouvée";
    }

    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'afficher la page d'édition d'une tâche d'une liste
   *
   * @private
   * @param {string[]} mots ensemble de mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateTache(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'as pas pu être réalisée";

    const nameList = this.getNameList(mots);
    const list_found = this.does_list_exist(nameList);
    if (list_found.exist && list_found.list.uuid != null) {
      const nameTodo = this.getNameTodo(mots);
      const todo_found = this.does_todo_existed(nameTodo, list_found.list.uuid);
      if (todo_found.success) {
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoEditPage', data: { todoRef: todo_found.todo.ref } });
        this.speechSynthService.synthText(
          'Vous pouvez maintenant modifier la tâche ' + nameTodo + ' de la liste ' + nameList
        );
        action_success = true;
      } else {
        message_error =
          'La tâche ' +
          this.getNameTodo(mots) +
          " n'a pas étée trouvée dans la liste " +
          this.getNameList(mots);
      }
    } else {
      message_error = 'La liste ' + this.getNameList(mots) + "n'a pas étée trouvée";
    }

    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant de supprimer une tâche d'une liste, à partir des mots entendus
   *
   * @private
   * @param {string[]} mots ensemble des mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private supprimerTache(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    const nomListe: string = this.getNameList(mots);
    const nomTache: string = this.getNameTodo(mots);

    const liste_search = this.does_list_exist(nomListe);

    if (liste_search.exist && liste_search.list.uuid != null) {
      const todo_search = this.does_todo_existed(nomTache, liste_search.list.uuid);

      if (
        todo_search.success &&
        todo_search.todo.ref != null &&
        todo_search.todo.uuid != null
      ) {
        this.speechSynthService.synthText(
          'Suppression de la tâche ' + nomTache + ' de la liste ' + nomListe
        );
        this.todoService.deleteTodo(todo_search.todo.ref, todo_search.todo.uuid);
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoListPage', data: { uuid: liste_search.list } });
        action_success = true;
      } else {
        message_error = 'La tâche ' + nomTache + " n'a pas été trouvée";
      }
    } else {
      message_error = 'La liste ' + nomListe + " n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /********************************************

Méthodes contextuelles

*******************************************/
  /**
   * Méthode permettant de créer une tâche dans la liste courante, à partir des mots entendus
   *
   * @private
   * @param {string[]} mots ensemble des mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerTacheContext(mots: string[]): ISpeechReqResult {
    const res: ISpeechReqResult = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };

    const nameTodo = this.getNameTodo(mots);
    const uuidList = this.evtCtrl.getCurrentContext(true);

    if (uuidList != null) {
      const todo_found = this.does_todo_existed(nameTodo, uuidList);
      if (!todo_found.success) {
        const new_todo = Global.getBlankTodo();
        new_todo.name = nameTodo;
        this.todoService.addTodo(uuidList, new_todo);
        this.speechSynthService.synthText('Ajout de la tâche ' + nameTodo);
        res.action_success = true;
      } else {
        res.message_error = 'La tâche ' + nameTodo + ' existe déjà dans la liste';
      }
    } else {
      res.message_error =
        'Veuillez indiquer dans quelle liste créer la tâche ' + nameTodo + ' .';
    }
    return res;
  }

  /**
   * Méthode permettant de modifier une tâche dans la liste courante, à partir des mots entendus
   *
   * @private
   * @param {string[]} mots ensemble des mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateTacheContext(mots: string[]): ISpeechReqResult {
    const res: ISpeechReqResult = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };

    const nameTodo = this.getNameTodo(mots);
    const uuidList = this.evtCtrl.getCurrentContext(true);

    if (uuidList != null) {
      const todo_found = this.does_todo_existed(nameTodo, uuidList);
      if (todo_found.success) {
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoEditPage', data: { todoRef: todo_found.todo.ref } });
        this.speechSynthService.synthText(
          'Vous pouvez maintenant modifier la tâche ' + nameTodo
        );
        res.action_success = true;
      } else {
        res.message_error = 'La tâche ' + nameTodo + " n'existe pas dans la liste";
      }
    } else {
      res.message_error =
        'Veuillez indiquer dans quelle liste modifier la tâche ' + nameTodo + ' .';
    }
    return res;
  }

  /**
   * Méthode permettant de supprimer une tâche dans la liste courante, à partir des mots entendus
   *
   * @private
   * @param {string[]} mots ensemble des mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private deleteTacheContext(mots: string[]): ISpeechReqResult {
    const res: ISpeechReqResult = {
      action_success: false,
      message_error: "L'action n'a pas pu être réalisée"
    };

    const nameTodo = this.getNameTodo(mots);
    const uuidList = this.evtCtrl.getCurrentContext(true);

    if (uuidList != null) {
      const todo_found = this.does_todo_existed(nameTodo, uuidList);
      if (todo_found.success && todo_found.todo.ref != null && todo_found.todo.uuid != null) {
        this.todoService.deleteTodo(todo_found.todo.ref, todo_found.todo.uuid);
        this.speechSynthService.synthText('La tâche ' + nameTodo + ' a été supprimée. ');
        res.action_success = true;
      } else {
        res.message_error = 'La tâche ' + nameTodo + " n'existe pas dans la liste";
      }
    } else {
      res.message_error =
        'Veuillez indiquer dans quelle liste supprimer la tâche ' + nameTodo + ' .';
    }
    return res;
  }

  /**
   * Méthode permettant d'afficher la page d'une tâche, de la liste courante
   *
   * @private
   * @param {string[]} mots ensemble de mots entendus par le micro
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private afficherTodo(mots: string[]): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    const nomTodo: string = this.getNameTodo(mots);
    const list_uuid = this.evtCtrl.getCurrentContext(true);
    if (list_uuid != null) {
      const todo_search = this.does_todo_existed(nomTodo, list_uuid);
      if (todo_search.success) {
        action_success = true;
        this.speechSynthService.synthText('Affichage de la tâche ' + nomTodo);
        this.evtCtrl.getNavRequestSubject().next({
          page: 'TodoPage',
          data: {
            todoRef: todo_search.todo.ref,
            listUuid: list_uuid,
            isExternal: false
          }
        });
      } else {
        message_error = 'La tâche ' + nomTodo + " n'a pas été trouvée. ";
      }
    } else {
      message_error = 'Veuillez préciser la liste où se trouve la tâche ' + nomTodo;
    }
    return { action_success: action_success, message_error: message_error };
  }
}
