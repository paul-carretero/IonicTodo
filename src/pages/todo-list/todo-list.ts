import { Component } from '@angular/core';
import {
  AlertController,
  IonicPage,
  NavController,
  NavParams
} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { TodoItem, TodoList } from './../../model/model';
import { TodoEditPage } from './../todo-edit/todo-edit';

@IonicPage()
@Component({
  selector: 'page-todo-list',
  templateUrl: 'todo-list.html'
})
export class TodoListPage {
  private ListUUID: string;

  public todoList: Observable<TodoList>;
  public todoItems: Observable<TodoItem[]>;
  public editList = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public todoService: TodoServiceProvider,
    private alertCtrl: AlertController
  ) {
    this.ListUUID = navParams.get('uuid');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TodoListPage');
  }

  ionViewWillEnter() {
    this.todoItems = this.todoService.getTodos(this.ListUUID);
    this.todoList = this.todoService.getAList(this.ListUUID);
  }

  public deleteTodo(todoUUID: string): void {
    this.todoService.deleteTodo(this.ListUUID, todoUUID);
  }

  public selectTodo(todoUUID: string): void {
    this.navCtrl.push(TodoEditPage, {
      todoUUID: todoUUID,
      listUUID: this.ListUUID
    });
  }

  public completeCheck(todo: TodoItem): void {
    if (todo.complete == false) {
      this.todoService.complete(this.ListUUID, todo.uuid, true);
    } else {
      this.todoService.complete(this.ListUUID, todo.uuid, false);
    }
  }

  public createTodo(): void {
    this.navCtrl.push(TodoEditPage, {
      todoUUID: null,
      listUUID: this.ListUUID
    });
  }
}
