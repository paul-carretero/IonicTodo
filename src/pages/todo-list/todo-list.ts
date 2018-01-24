import { TodoPage } from './../todo/todo';
import { Observable } from 'rxjs/Observable';
import { TodoList, TodoItem } from './../../model/model';
import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { AlertController } from 'ionic-angular';

/**
 * Generated class for the TodoListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-todo-list',
  templateUrl: 'todo-list.html'
})
export class TodoListPage implements OnInit {
  private ListUUID: string;

  public todoList: Observable<TodoList>;

  public todoItems: Observable<TodoItem[]>;

  public newTodo: TodoItem;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public todoService: TodoServiceProvider,
    private alertCtrl: AlertController
  ) {
    this.ListUUID = navParams.get('uuid');
    this.newTodo = { name: '', complete: false, desc: '' };
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TodoListPage');
  }

  ngOnInit(): void {
    this.todoItems = this.todoService.getTodos(this.ListUUID);
    this.todoList = this.todoService.getAList(this.ListUUID);
  }

  public deleteTodo(todoUUID: string): void {
    console.log(todoUUID);
    this.todoService.deleteTodo(this.ListUUID, todoUUID);
  }

  public selectTodo(todoUUID: string): void {
    this.navCtrl.push(TodoPage, {
      todoUUID: todoUUID,
      listUUID: this.ListUUID
    });
  }

  public createTodo(): void {
    this.todoService.addTodo(this.ListUUID, this.newTodo);
    console.log('done');
  }

  public edit(): void {
    let alert = this.alertCtrl.create({
      title: 'Modifier une liste',
      message: 'Vous pouvez entrer un nouvau nom pour la liste',
      inputs: [
        {
          name: 'name',
          placeholder: 'nouveau nom'
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Appliquer',
          handler: data => {
            console.log(data.name);
            this.todoList.subscribe(list => (list.name = data.name));
          }
        }
      ]
    });
    alert.present();
  }
}
