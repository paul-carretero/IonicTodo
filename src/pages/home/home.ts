import { Component } from '@angular/core';
import {
  AlertController,
  LoadingController,
  NavController
} from 'ionic-angular';
import { Subscription } from 'rxjs';

import { TodoList } from '../../model/todo-list';
import { SpeechRecServiceProvider } from '../../providers/speech-rec-service/speech-rec-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { MenuRequest } from './../../model/menu-request';
import { TodoItem } from './../../model/todo-item';
import { EventServiceProvider } from './../../providers/event/event-service';
import { Global } from './../../shared/global';
import { ListEditPage } from './../list-edit/list-edit';
import { TodoListPage } from './../todo-list/todo-list';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage extends GenericPage {
  public todoList: TodoList[];
  private updateSub: Subscription;
  private menuEvtSub: Subscription;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private todoService: TodoServiceProvider,
    private evtCtrl: EventServiceProvider,
    private ttsCtrl: SpeechSynthServiceProvider,
    private speechCtrl: SpeechRecServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl);
  }

  ionViewWillEnter() {
    this.updateSub = this.todoService.getList().subscribe(data => {
      this.todoList = data;
    });

    const pageData = Global.NO_MENU_PAGE_DATA;
    pageData.title = 'Listes de Tâches';
    this.evtCtrl.getHeadeSubject().next(pageData);

    this.listenForMenuEvent();
  }

  ionViewWillLeave() {
    this.updateSub.unsubscribe();
    this.menuEvtSub.unsubscribe();
  }

  public generateDescription(): string {
    let description = 'Voici vos liste de tâches en cours:';

    description += 'Voici vos liste de tâches terminé:';

    return description;
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
      }
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
