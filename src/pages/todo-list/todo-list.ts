import { Global } from './../../shared/global';
import { Component } from '@angular/core';
import {
  AlertController,
  IonicPage,
  NavController,
  NavParams,
  LoadingController
} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { TodoItem } from './../../model/todo-item';
import { TodoList } from './../../model/todo-list';
import { TodoEditPage } from './../todo-edit/todo-edit';
import { EventServiceProvider } from '../../providers/event/event-service';
import { Subscription } from 'rxjs';
import { MenuRequest } from '../../model/menu-request';
import { GenericPage } from '../../shared/generic-page';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { ListEditPage } from '../list-edit/list-edit';

@IonicPage()
@Component({
  selector: 'page-todo-list',
  templateUrl: 'todo-list.html'
})
export class TodoListPage extends GenericPage {
  private ListUUID: string;
  private menuEvtSub: Subscription;

  public todoList: Observable<TodoList>;
  public todoItems: Observable<TodoItem[]>;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public evtCtrl: EventServiceProvider,
    private todoService: TodoServiceProvider,
    private navParams: NavParams,
    private ttsCtrl: SpeechSynthServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl);
    this.ListUUID = navParams.get('uuid');
  }

  ionViewWillEnter() {
    const pageData = Global.DEFAULT_PAGE_DATA;
    //this.todoItems = this.todoService.getTodos(this.ListUUID);
    this.todoItems = Observable.of([]);
    this.todoList = this.todoService.getAList(this.ListUUID);
    this.todoList
      .subscribe(res => {
        pageData.title = 'Liste "' + res.name + '"';
        this.evtCtrl.getHeadeSubject().next(pageData);
      })
      .unsubscribe();
    this.listenForMenuEvent();
  }

  ionViewWillLeave() {
    if (this.menuEvtSub != null) {
      this.menuEvtSub.unsubscribe();
    }
  }

  private listenForMenuEvent(): void {
    this.menuEvtSub = this.evtCtrl.getMenuRequestSubject().subscribe(req => {
      switch (req) {
        case MenuRequest.HELP: {
          this.alert(
            'Aide sur la page',
            "TODO: ecrire de l'aide<br/>nouvelle ligne !"
          );
          break;
        }
        case MenuRequest.SPEECH_SYNTH: {
          this.ttsCtrl.synthText(this.generateDescription());
          break;
        }
        case MenuRequest.DELETE: {
          this.todoService.deleteList(this.ListUUID);
          this.navCtrl.popToRoot();
          break;
        }
        case MenuRequest.EDIT: {
          this.navCtrl.push(ListEditPage, { uuid: this.ListUUID });
          break;
        }
      }
    });
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
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
