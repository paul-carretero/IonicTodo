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
  public todos: Observable<TodoList[]>;
  public listName: string;

  constructor(
    public navCtrl: NavController,
    private todoService: TodoServiceProvider
  ) {}

  ngOnInit() {
    this.todos = this.todoService.getList();
    this.todos.subscribe();
    this.listName = '';
  }

  public selectTodo(uuid: string): void {
    this.navCtrl.push(TodoListPage, { uuid: uuid });
  }

  public deleteTodoList(uuid: string): void {
    this.todoService.deleteList(uuid);
  }

  public createList(): void {
    if (this.listName !== '') {
      this.todoService.addList(this.listName);
      this.listName = '';
    }
  }
}
