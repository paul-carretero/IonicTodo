import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { TodoItem } from '../../model/todo-item';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { TodoEditPage } from './../todo-edit/todo-edit';

/**
 * Generated class for the TodoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage implements OnInit {
  private todoUUID: string;

  private listUUID: string;

  private todo: Observable<TodoItem>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public todoService: TodoServiceProvider
  ) {
    this.todoUUID = navParams.get('todoUUID');
    this.listUUID = navParams.get('listUUID');
  }

  ngOnInit(): void {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad TodoPage');
  }

  ionViewWillEnter() {
    this.todo = this.todoService.getTodo(this.listUUID, this.todoUUID);
  }

  public edit(todoUUID: string): void {
    this.navCtrl.push(TodoEditPage, {
      todoUUID: todoUUID,
      listUUID: this.listUUID
    });
  }
}
