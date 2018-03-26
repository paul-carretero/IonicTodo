/*import { TodoServiceProvider } from './../todo-service-ts/todo-service-ts';
import { IParsedRequest } from './parsed-req';
import { ITodoItem } from '../../model/todo-item';
import { ITodoList } from '../../model/todo-list';
import { ISimpleContact } from '../../model/simple-contact';
import { ContactServiceProvider } from '../contact-service/contact-service';
import { EventServiceProvider } from '../event/event-service';

export class SpeechParser {
  private static readonly keywords = {
    list: ['liste', 'ensemble'],
    todo: ['tâche', 'todo', 'tâches', 'note'],
    create: ['créer', 'ajouter', 'créée', 'créé', 'crée'],
    update: ['éditer', 'modifier', 'édite', 'édites', 'éditait', 'éditez', 'modifie'],
    delete: ['supprimer', 'enlever', 'retirer', 'retire', 'retirez', 'supprime', 'supprimez'],
    view: ['afficher', 'visionner', 'voir', 'affiche'],
    media: ['qrcode', 'nfc', 'cloud']
  };

  private currentTodos: ITodoItem[];

  private currentLists: ITodoList[];

  private currentContacts: ISimpleContact[];

  private currentList: ITodoList | null = null;

  private currentTodo: ITodoItem | null = null;

  constructor(
    private readonly todoCtrl: TodoServiceProvider,
    private readonly contactCtrl: ContactServiceProvider,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.currentTodos = [];
    this.currentLists = [];
    this.currentContacts = [];
    this.currentList = null;
    this.currentTodo = null;
    this.initCurrents();
  }

  private async initCurrents(): Promise<void> {
    const CPromise = this.contactCtrl.getContactList(false, false);
    const listUuid = this.evtCtrl.getCurrentContext(true);
    const todoUuid = this.evtCtrl.getCurrentContext(false);
    this.currentLists = this.todoCtrl.getAllList();

    if (listUuid != null) {
      this.currentList = this.todoCtrl.getAListSnapshot(listUuid);
      this.currentTodos = this.todoCtrl.getAllTodos(listUuid);
    } else {
      this.currentTodos = this.todoCtrl.getAllTodos();
    }

    if (todoUuid != null) {
      const res = this.currentTodos.find(t => t.uuid === todoUuid);
      if (res != null) {
        this.currentTodo = res;
      }
    }

    this.currentContacts = await CPromise;
  }

  /**
   * retourne une requête non initialisée
   *
   * @private
   * @returns {IParsedRequest}
   * @memberof SpeechParser
   *
  private getBlankParsedRequest(): IParsedRequest {
    return {
      sentence: [],
      todoFound: null,
      listFound: null,
      newTodoName: null,
      newListName: null,
      target: null,
      request: null,
      media: null
    };
  }

  private searchName(userTab: string[], refTab: string[]): string | null {
    let pos = -1;
    let trouve = false;

    for (const keyword of refTab) {
      pos = userTab.indexOf(keyword);
      if (pos !== -1) {
        trouve = true;
        break;
      }
    }
    return null;
  }

  /**
   * parse la phrase et retourne une requête parsée avec les informations pertinante mise en évidence
   *
   * @param {string} speech
   * @returns {IParsedRequest}
   * @memberof SpeechParser
   *
  public async parse(speech: string): Promise<IParsedRequest> {
    const parsedRes = this.getBlankParsedRequest();
    parsedRes.sentence = speech.split(' ');
    const editableSentence = speech.split(' ');

    return parsedRes;
  }
}*/
