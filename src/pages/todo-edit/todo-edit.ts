import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { TodoItem } from './../../model/model';
import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

/**
 * Generated class for the TodoEditPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-todo-edit',
  templateUrl: 'todo-edit.html'
})
export class TodoEditPage implements OnInit {
  private todoUUID: string;

  private listUUID: string;

  public todo: TodoItem;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public todoService: TodoServiceProvider
  ) {
    this.todoUUID = navParams.get('todoUUID');
    this.listUUID = navParams.get('listUUID');
    this.todo = { name: '', complete: false, desc: '', uuid: this.todoUUID };
  }

  ngOnInit(): void {
    this.todoService.getTodo(this.listUUID, this.todoUUID).subscribe(data => {
      this.todo = {
        name: data.name,
        complete: data.complete,
        desc: data.desc,
        uuid: data.uuid
      };
    });
  }

  public validate(): void {
    this.todoService.editTodo(this.listUUID, this.todo);
    this.navCtrl.pop();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TodoEditPage');
  }
}
