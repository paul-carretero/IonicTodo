import { ITodoItem } from './../../model/todo-item';
import { Media } from './../../model/media';
import { IMenuRequest } from './../../model/menu-request';
import { ITodoList } from '../../model/todo-list';
export interface IParsedRequest {
  sentence: string[];

  newTodoName: string | null;

  newListName: string | null;

  todoFound: ITodoItem | null;

  listFound: ITodoList | null;

  target: string | null;

  request: IMenuRequest | null;

  media: Media | null;
}
