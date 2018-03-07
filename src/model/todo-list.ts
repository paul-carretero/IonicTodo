import { TodoItem } from './todo-item';

export interface TodoList {
  uuid: string;
  name: string;
  items: TodoItem[];
  icon?: string;
}
