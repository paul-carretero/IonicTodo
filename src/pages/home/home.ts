import { Component } from '@angular/core';
import {
  AlertController,
  Loading,
  LoadingController,
  NavController
} from 'ionic-angular';

import { TodoList } from '../../model/model';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { TodoItem } from './../../model/model';
import { TodoListPage } from './../todo-list/todo-list';
import { GenericPage } from '../../shared/generic-page';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage extends GenericPage {
  public todoList: TodoList[];
  public displayNewList = false;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private todoService: TodoServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl);
  }

  ionViewDidLoad() {
    this.todoService.getList().subscribe(data => {
      this.todoList = data;
    });
  }

  public isOneTodoLate(list: TodoList): boolean {
    return true;
    //TODO
  }

  public getCompleted(list: TodoItem[]): Number {
    let res = 0;
    for (const item of list) {
      if (item.complete) {
        res++;
      }
    }
    return res;
  }

  public selectTodoList(uuid: string): void {
    this.navCtrl.push(TodoListPage, { uuid: uuid });
  }

  public deleteTodoList(uuid: string): void {
    this.todoService.deleteList(uuid);
  }
}
