import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { ITodoItem } from '../../model/todo-item';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';

@IonicPage()
@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage implements OnInit {
  private readonly todoUUID: string;

  private readonly listUUID: string;

  private todo: Observable<ITodoItem>;

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
    //this.todo = this.todoService.getTodo(this.listUUID, this.todoUUID);
    this.todo;
  }

  public edit(todoUUID: string): void {
    this.navCtrl.push('TodoEditPage', {
      todoUUID: todoUUID,
      listUUID: this.listUUID
    });
  }
}
