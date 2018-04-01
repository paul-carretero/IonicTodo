import { MenuRequestType } from './../../model/menu-request-type';
import { Media } from './../../model/media';
import { TodoServiceProvider } from './../todo-service-ts/todo-service-ts';
import { IParsedRequest } from '../../model/parsed-req';
import { ITodoItem } from '../../model/todo-item';
import { ITodoList } from '../../model/todo-list';
import { ISimpleContact } from '../../model/simple-contact';
import { ContactServiceProvider } from '../contact-service/contact-service';
import { EventServiceProvider } from '../event/event-service';

/**
 * parse un phrase d'un utilisateur à la recherche de mot clé et de requête applicative
 *
 * @export
 * @class SpeechParser
 */
export class SpeechParser {
  /***************************** STATIC FIELDS ******************************/

  /**
   * map des mot clé par type de requête
   *
   * @private
   * @static
   * @type {Map<MenuRequestType,string[]>}
   * @memberof SpeechParser
   */
  private static readonly keywords: Map<MenuRequestType, string[]> = new Map([
    [MenuRequestType.CREATE, ['créer', 'créé', 'crée', 'ajouter', 'ajoute']],
    [MenuRequestType.EDIT, ['éditer', 'édite', 'modifier', 'modifie']],
    [
      MenuRequestType.DELETE,
      ['supprimer', 'supprime', 'enlever', 'enlève', 'retirer', 'retire']
    ],
    [
      MenuRequestType.VIEW,
      ['afficher', 'visionner', 'voire', 'voir', 'affiche', 'ouvrir', 'ouvre']
    ],
    [MenuRequestType.SEND, ['envoie', 'envoyer', 'envoi', 'clone']],
    [MenuRequestType.SHARE, ['partage', 'partager', 'lier', 'lie']],
    [MenuRequestType.HELP, ['aide', 'aider', 'help', 'aidez', 'aidé']],
    [MenuRequestType.COMPLETE, ['termine', 'complete', 'terminer', 'completer']]
  ]);

  /**
   * mots clés désignant des média
   *
   * @private
   * @static
   * @type {Map<Media, string[]>}
   * @memberof SpeechParser
   */
  private static readonly medias: Map<Media, string[]> = new Map([
    [Media.CLOUD, ['internet', 'cloud']],
    [Media.OCR, ['ocr']],
    [Media.QR_CODE, ['qrcode', 'code']],
    [Media.NFC, ['nfc']]
  ]);

  /**
   * mot clé désignant des listes
   *
   * @private
   * @static
   * @memberof SpeechParser
   */
  private static readonly listKeywords = ['liste', 'ensemble'];

  /**
   * mots clés désignants des todo
   *
   * @private
   * @static
   * @memberof SpeechParser
   */
  private static readonly todoKeywords = ['tâche', 'tâches', 'note', 'notes'];

  /**
   * mot clé reservé, généralement indiquant une liaison dans la phrase
   *
   * @private
   * @static
   * @memberof SpeechParser
   */
  private static readonly stopKeywords = ['dans', 'la', 'le', 'avec', 'cette', 'ce'];

  /**************************** PRIVATE FIELDS ******************************/

  /**
   * todos présentement affichés
   *
   * @private
   * @type {ITodoItem[]}
   * @memberof SpeechParser
   */
  private currentTodos: ITodoItem[];

  /**
   * Toutes les listes
   *
   * @private
   * @type {ITodoList[]}
   * @memberof SpeechParser
   */
  private currentLists: ITodoList[];

  /**
   * contact disponible sur l'appareil
   *
   * @private
   * @type {ISimpleContact[]}
   * @memberof SpeechParser
   */
  private currentContacts: ISimpleContact[];

  /**
   * listez présentement affiché
   *
   * @private
   * @type {(ITodoList | null)}
   * @memberof SpeechParser
   */
  private currentList: ITodoList | null;

  /**
   * todo (unique) présentement affiché
   *
   * @private
   * @type {(ITodoItem | null)}
   * @memberof SpeechParser
   */
  private currentTodo: ITodoItem | null;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of SpeechParser.
   * @param {TodoServiceProvider} todoCtrl
   * @param {ContactServiceProvider} contactCtrl
   * @param {EventServiceProvider} evtCtrl
   * @memberof SpeechParser
   */
  constructor(
    private readonly todoCtrl: TodoServiceProvider,
    private readonly contactCtrl: ContactServiceProvider,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.clear();
  }

  /**
   * réinitialise les constante d'environement
   *
   * @private
   * @memberof SpeechParser
   */
  private clear(): void {
    this.currentTodos = [];
    this.currentLists = [];
    this.currentContacts = [];
    this.currentList = null;
    this.currentTodo = null;
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * retourne la requête de type MenuRequestType si elle existe et défini par des mot clés
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {(MenuRequestType | null)}
   * @memberof SpeechParser
   */
  private getMenuRequest(req: IParsedRequest): MenuRequestType | null {
    for (const word of req.sentence) {
      const keys = Array.from(SpeechParser.keywords.keys());
      for (const key of keys) {
        if (SpeechParser.strArrayInclude(word, SpeechParser.keywords.get(key))) {
          return key;
        }
      }
    }
    return null;
  }

  /**
   * recherche et retourne un media si il existe et défini par des mot clés
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {(Media | null)}
   * @memberof SpeechParser
   */
  private getMediaType(req: IParsedRequest): Media | null {
    for (const word of req.sentence) {
      const keys = Array.from(SpeechParser.medias.keys());
      for (const key of keys) {
        if (SpeechParser.strArrayInclude(word, SpeechParser.medias.get(key))) {
          return key;
        }
      }
    }
    return null;
  }

  /**
   * recherche et associe la requête IMenuRequest d'une phrase de l'utilisateur, le media n'est rechercher que si une requête à été trouvée
   *
   * @see IMenuRequest
   * @private
   * @param {IParsedRequest} req
   * @returns {void}
   * @memberof SpeechParser
   */
  private defMenuRequest(req: IParsedRequest): void {
    const menuReq = this.getMenuRequest(req);
    if (menuReq == null) {
      return;
    }

    req.request = {
      media: this.getMediaType(req),
      request: menuReq
    };
  }

  /**
   * recherche si l'utilisateur a spécifié le nom de l'un de ses contacts
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {void}
   * @memberof SpeechParser
   */
  private defContact(req: IParsedRequest): void {
    for (const contact of this.currentContacts) {
      if (SpeechParser.strInclude(req.origSentence, contact.displayName)) {
        req.contact = contact;
        return;
      }
    }
  }

  /**
   * recherche un todo auquel l'utilisateur à pu faire allusion, se base sur le nom de chaque todo
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {void}
   * @memberof SpeechParser
   */
  private defTodoFind(req: IParsedRequest): void {
    if (
      this.currentTodo != null &&
      SpeechParser.strInclude(req.origSentence, this.currentTodo.name)
    ) {
      req.todoFound = this.currentTodo;
      return;
    }
    for (const todo of this.currentTodos) {
      if (SpeechParser.strInclude(req.origSentence, todo.name)) {
        req.todoFound = todo;
        return;
      }
    }
  }

  /**
   * recherche et défini une liste à laquelle l'utilisateur se rapporte
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {void}
   * @memberof SpeechParser
   */
  private defListFind(req: IParsedRequest): void {
    if (
      this.currentList != null &&
      SpeechParser.strInclude(req.origSentence, this.currentList.name)
    ) {
      req.listFound = this.currentList;
      return;
    }

    for (const list of this.currentLists) {
      if (SpeechParser.strInclude(req.origSentence, list.name)) {
        req.listFound = list;
        return;
      }
    }
  }

  /**
   * recherche un nouveau de liste spécifié par l'utilisateur
   * Peut être confondu avec une liste existante...
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {void}
   * @memberof SpeechParser
   */
  private defNewListName(req: IParsedRequest): void {
    let listKeyIndex: number = -1;

    for (let i = 0; i < req.sentence.length; i++) {
      const word: string = req.sentence[i];
      if (SpeechParser.strArrayInclude(word, SpeechParser.listKeywords)) {
        listKeyIndex = i;
        break;
      }
    }

    if (listKeyIndex === -1) {
      return;
    }

    const remainingWords: string[] = req.sentence.slice(listKeyIndex);
    if (remainingWords.length < 2) {
      return;
    }

    req.newListName = this.buildName(remainingWords, 'liste ');
  }

  /**
   * recherche un nouveau nom de todo spécifié par l'utilisateur
   * Peut être confondu avec un todo existant
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {void}
   * @memberof SpeechParser
   */
  private defNewTodoName(req: IParsedRequest): void {
    let todoKeyIndex: number = -1;

    for (let i = 0; i < req.sentence.length; i++) {
      const word: string = req.sentence[i];
      if (SpeechParser.strArrayInclude(word, SpeechParser.todoKeywords)) {
        todoKeyIndex = i;
        break;
      }
    }

    if (todoKeyIndex === -1) {
      return;
    }

    const remainingWords: string[] = req.sentence.slice(todoKeyIndex);
    if (remainingWords.length < 2) {
      return;
    }

    req.newTodoName = this.buildName(remainingWords, 'tâche ');
  }

  /**
   * construit un nom de liste ou de todo à partir d'une occurence d'un mot clé de todo ou liste et jusqu'a la prochaine occurence d'un mot clé (max 3)
   * Aujoute automatiquement le mot tache ou liste si le mot qui suit est une coordination ('de' par exemple)
   *
   * @private
   * @param {string[]} remainingWords
   * @param {('liste ' | 'tâche ')} type
   * @returns {string}
   * @memberof SpeechParser
   */
  private buildName(remainingWords: string[], type: 'liste ' | 'tâche '): string {
    let res = '';

    if (remainingWords.length === 2) {
      res = remainingWords[1];
    } else {
      if (remainingWords[1].length < 4) {
        res += type;
      }
      res += remainingWords[1];
      res += ' ';

      if (remainingWords[2] != null && !SpeechParser.isKeyword(remainingWords[2])) {
        res += remainingWords[2];
        if (remainingWords[3] != null && !SpeechParser.isKeyword(remainingWords[3])) {
          res += ' ';
          res += remainingWords[3];
        }
      }
    }

    return SpeechParser.UpFirst(res);
  }

  /**
   * un ensemble de règles non générique à appliquer à la requête
   * Principalement pour définir si l'utilisateur se rapport au contexte courrant
   *
   * @private
   * @param {IParsedRequest} req
   * @returns {void}
   * @memberof SpeechParser
   */
  private specialRules(req: IParsedRequest): void {
    if (req.request == null) {
      return;
    } else if (
      req.todoFound == null &&
      this.currentTodo != null &&
      (req.request.request === MenuRequestType.COMPLETE ||
        (req.request.request === MenuRequestType.CREATE && req.listFound == null) ||
        (req.request.request === MenuRequestType.DELETE && req.listFound == null) ||
        (req.request.request === MenuRequestType.EDIT && req.listFound == null))
    ) {
      req.todoFound = this.currentTodo;
    } else if (
      req.listFound == null &&
      this.currentList != null &&
      (req.request.request === MenuRequestType.DELETE ||
        req.request.request === MenuRequestType.EDIT ||
        req.request.request === MenuRequestType.IMPORT ||
        req.request.request === MenuRequestType.OCR ||
        req.request.request === MenuRequestType.CREATE ||
        req.request.request === MenuRequestType.SEND ||
        req.request.request === MenuRequestType.VIEW ||
        req.request.request === MenuRequestType.COMPLETE ||
        req.request.request === MenuRequestType.SHARE)
    ) {
      req.listFound = this.currentList;
    }
  }

  /**************************************************************************/
  /****************************** STATIC HELPER *****************************/
  /**************************************************************************/

  /**
   * recherche si un mot est un mot clé
   *
   * @private
   * @static
   * @param {string} str true si le mot à été trouvé dans la liste des mot clé
   * @returns {boolean}
   * @memberof SpeechParser
   */
  private static isKeyword(str: string): boolean {
    const keysKeywords = Array.from(SpeechParser.keywords.keys());
    for (const key of keysKeywords) {
      if (SpeechParser.strArrayInclude(str, SpeechParser.keywords.get(key))) {
        return true;
      }
    }

    const keysMedia = Array.from(SpeechParser.medias.keys());
    for (const key of keysMedia) {
      if (SpeechParser.strArrayInclude(str, SpeechParser.medias.get(key))) {
        return true;
      }
    }

    return (
      SpeechParser.strArrayInclude(str, SpeechParser.listKeywords) ||
      SpeechParser.strArrayInclude(str, SpeechParser.todoKeywords) ||
      SpeechParser.strArrayInclude(str, SpeechParser.stopKeywords)
    );
  }

  /**
   * retourne une requête non initialisée
   *
   * @static
   * @private
   * @returns {IParsedRequest}
   * @memberof SpeechParser
   */
  private static getBlankParsedRequest(): IParsedRequest {
    return {
      sentence: [],
      origSentence: '',
      todoFound: null,
      listFound: null,
      newTodoName: null,
      newListName: null,
      contact: null,
      request: null
    };
  }

  /**
   * retourne true si str1 est contenu dans str2 ou l'inverse sans prise en compte des accents, majuscule etc.
   *
   * @private
   * @static
   * @param {(string | null)} str1
   * @param {(string | null)} str2
   * @returns {boolean}
   * @memberof SpeechParser
   */
  private static strInclude(str1: string | null, str2: string | null): boolean {
    if (str1 == null && str2 == null) {
      return true;
    }
    if (str1 == null || str2 == null) {
      return false;
    }

    str1 = SpeechParser.normalize(str1);
    str2 = SpeechParser.normalize(str2);

    return str1.includes(str2) || str2.includes(str1);
  }

  /**
   * retourne true si str est contenu dans le tableau strArray sans prise en compte des accents, majuscule etc.
   *
   * @private
   * @static
   * @param {(string | null)} str
   * @param {(string[] | null | undefined)} strArray
   * @returns {boolean}
   * @memberof SpeechParser
   */
  private static strArrayInclude(
    str: string | null,
    strArray: string[] | null | undefined
  ): boolean {
    if (str == null || strArray == null) {
      return false;
    }

    str = SpeechParser.normalize(str);
    const arr: string[] = [];

    for (const item of strArray) {
      arr.push(SpeechParser.normalize(item));
    }

    return arr.indexOf(str) !== -1;
  }

  /**
   * retourne la chaine de caractère normalisée sans accents, majuscule ou caractère spéciaux ou pluriel
   *
   * @private
   * @static
   * @param {string} str
   * @returns {string}
   * @memberof SpeechParser
   */
  private static normalize(str: string): string {
    let s = str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z ]/g, '');
    if (s.endsWith('s')) {
      s = s.slice(0, -1);
    }
    return s;
  }

  /**
   * permet de mettre en capitale la première lettre d'une chaine
   *
   * @private
   * @static
   * @param {string} s
   * @returns {string}
   * @memberof SpeechParser
   */
  private static UpFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * parse la phrase et retourne une requête parsée avec les informations pertinante mise en évidence
   *
   * @see IParsedRequest
   * @param {string} speech
   * @returns {IParsedRequest}
   * @memberof SpeechParser
   */
  public async parse(speech: string): Promise<IParsedRequest> {
    const parsedRes = SpeechParser.getBlankParsedRequest();
    parsedRes.sentence = speech.split(' ').map(x => x.trim());
    parsedRes.origSentence = speech;
    this.defMenuRequest(parsedRes);
    this.defContact(parsedRes);

    this.defListFind(parsedRes);
    if (parsedRes.listFound != null) {
      this.currentTodos = this.todoCtrl.getAllTodos(parsedRes.listFound.uuid);
    }
    this.defNewListName(parsedRes);
    this.defTodoFind(parsedRes);
    this.defNewTodoName(parsedRes);

    this.specialRules(parsedRes);
    return parsedRes;
  }

  /**
   * met à jour les constantes de ce parser de recherche.
   * doit être appelé et attendu avant de pouvoir utiliser parse
   *
   * @returns {Promise<void>}
   * @memberof SpeechParser
   */
  public async init(): Promise<void> {
    this.clear();
    const CPromise = this.contactCtrl.getContactList(false);
    const listUuid = this.evtCtrl.getCurrentContext(true);
    const todoUuid = this.evtCtrl.getCurrentContext(false);
    this.currentLists = this.todoCtrl.getAllList();

    if (listUuid != null) {
      this.currentList = this.todoCtrl.getAListSnapshot(listUuid);
      this.currentTodos = this.todoCtrl.getAllTodos(listUuid);
    }

    if (todoUuid != null) {
      const res = this.todoCtrl.getAllTodos().find(t => t.uuid === todoUuid);
      if (res != null) {
        this.currentTodo = res;
      }
    }

    this.currentContacts = await CPromise;
  }
}
