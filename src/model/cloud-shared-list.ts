import { TodoListPath } from './todo-list-path';
import { TodoList } from './todo-list';

/**
 * Permet d'exporter une liste sur le cloud et de la récupérer avec un mot de passe
 *
 * @export
 * @interface CloudSharedList
 */
export interface CloudSharedList {
  list: TodoList | TodoListPath;
  password: string;
  email: string;
  userUUID: string;
  date: Date;
}
