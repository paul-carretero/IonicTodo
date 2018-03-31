import { ISimpleContact } from './../../model/simple-contact';
import { ITodoItem } from './../../model/todo-item';
import { IMenuRequest } from './../../model/menu-request';
import { ITodoList } from '../../model/todo-list';

/**
 * représente une requête utilisateur parsé comprenant notament les informations auquel il fait référence
 *
 * @export
 * @interface IParsedRequest
 */
export interface IParsedRequest {
  /**
   * le tableau de mot de la phrase
   *
   * @type {string[]}
   * @memberof IParsedRequest
   */
  sentence: string[];

  /**
   * la phrase d'origine
   *
   * @type {string}
   * @memberof IParsedRequest
   */
  origSentence: string;

  /**
   * le nom d'un nouveau todo auquel l'utilisateur à fait référence
   *
   * @type {(string | null)}
   * @memberof IParsedRequest
   */
  newTodoName: string | null;

  /**
   * le nom d'une nouvelle liste a laquelle l'utilisateur à fait référence
   *
   * @type {(string | null)}
   * @memberof IParsedRequest
   */
  newListName: string | null;

  /**
   * le nom d'une tâche existante à laquelle l'utilisateur à fait référence, éventuelement la tâche en cours
   *
   * @type {(ITodoItem | null)}
   * @memberof IParsedRequest
   */
  todoFound: ITodoItem | null;

  /**
   * le nom d'une liste existante à laquelle l'utilisateur à fait référence, éventuellement la liste en cours
   *
   * @type {(ITodoList | null)}
   * @memberof IParsedRequest
   */
  listFound: ITodoList | null;

  /**
   * un contact auquel l'utilisateur à fait référence
   *
   * @type {(ISimpleContact | null)}
   * @memberof IParsedRequest
   */
  contact: ISimpleContact | null;

  /**
   * la requête de type IMenuRequest demandé par l'utilisateur
   *
   * @type {(IMenuRequest | null)}
   * @memberof IParsedRequest
   */
  request: IMenuRequest | null;
}
