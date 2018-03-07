import { HomeOptPage } from './opt/home-opt';
import { Component, ViewChild, ElementRef } from '@angular/core';
import {
  AlertController,
  LoadingController,
  NavController,
  PopoverController
} from 'ionic-angular';

import { TodoList } from '../../model/model';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { TodoItem } from './../../model/model';
import { Global } from './../../shared/global';
import { ListEditPage } from './../list-edit/list-edit';
import { TodoListPage } from './../todo-list/todo-list';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage extends GenericPage {
  public todoList: TodoList[];
  public pageData = Global.PAGES_DATA.get(Global.HOMEPAGE);

  @ViewChild('popoverContent', { read: ElementRef })
  content: ElementRef;
  @ViewChild('popoverText', { read: ElementRef })
  text: ElementRef;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private todoService: TodoServiceProvider,
    private popoverCtrl: PopoverController
  ) {
    super(navCtrl, alertCtrl, loadingCtrl);
    this.pageData.validable = true;
    this.pageData.popoverMenu = HomeOptPage;
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

  public createTodoList(): void {
    this.navCtrl.push(ListEditPage, { uuid: null });
  }

  public deleteTodoList(uuid: string): void {
    this.todoService.deleteList(uuid);
  }
}
