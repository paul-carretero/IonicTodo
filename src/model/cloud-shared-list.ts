import { ITodoListPath } from './todo-list-path';
import { ITodoList } from './todo-list';

/**
 * Permet d'exporter une liste sur le cloud et de la récupérer avec un mot de passe
 *
 * @export
 * @interface CloudSharedList
 */
export interface ICloudSharedList {
  list: ITodoList | ITodoListPath;
  password: string;
  email: string;
  userUUID: string;
  date: Date;
}
