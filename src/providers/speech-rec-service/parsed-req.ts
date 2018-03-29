import { ISimpleContact } from './../../model/simple-contact';
import { ITodoItem } from './../../model/todo-item';
import { IMenuRequest } from './../../model/menu-request';
import { ITodoList } from '../../model/todo-list';
export interface IParsedRequest {
  sentence: string[];

  origSentence: string;

  newTodoName: string | null;

  newListName: string | null;

  todoFound: ITodoItem | null;

  listFound: ITodoList | null;

  contact: ISimpleContact | null;

  request: IMenuRequest | null;
}
