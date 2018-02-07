import { TodoItem } from './../../model/model';
import { TodoListPage } from './../todo-list/todo-list';
import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { TodoList } from '../../model/model';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {
  public todoList: TodoList[];

  public listName: String;

  constructor(
    public navCtrl: NavController,
    private todoService: TodoServiceProvider
  ) {
    this.listName = '';
  }

  ngOnInit() {
    this.todoService.getList().subscribe(data => {
      this.todoList = data;
    });
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

  public selectTodo(uuid: string): void {
    this.navCtrl.push(TodoListPage, { uuid: uuid });
  }

  public deleteTodoList(uuid: string): void {
    this.todoService.deleteList(uuid);
  }

  public createList(): void {
    if (this.listName !== '') {
      this.todoService.addList(this.listName.toString());
      this.listName = '';
    }
  }
}
