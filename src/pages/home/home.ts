import { Component, OnInit } from '@angular/core';
import {
  NavController,
  AlertController,
  Loading,
  LoadingController
} from 'ionic-angular';

import { TodoList } from '../../model/model';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { TodoItem } from './../../model/model';
import { TodoListPage } from './../todo-list/todo-list';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public todoList: TodoList[];
  public newList: FormGroup;
  public displayNewList = false;
  private loading: Loading;

  constructor(
    public navCtrl: NavController,
    private todoService: TodoServiceProvider,
    private formBuilder: FormBuilder,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.newList = this.formBuilder.group({
      name: ['', Validators.required],
      icon: ['checkmark']
    });
  }

  ionViewDidLoad() {
    this.todoService.getList().subscribe(data => {
      this.todoList = data;
    });
  }

  public isOneTodoLate(list: TodoList): boolean {
    return true;
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
    this.showLoading('création de la liste...');
    this.todoService.addList(this.newList.value.name, this.newList.value.icon);
    this.alert(
      'Création',
      'Création de la liste ' +
        this.newList.value.name +
        'effectuée avec succès!'
    );
    this.loading.dismiss();
  }

  private showLoading(text: string) {
    this.loading = this.loadingCtrl.create({
      content: text,
      dismissOnPageChange: true
    });
    this.loading.present();
  }

  private alert(title: string, text: string) {
    this.alertCtrl
      .create({
        title: title,
        subTitle: text,
        buttons: ['OK']
      })
      .present();
  }
}
