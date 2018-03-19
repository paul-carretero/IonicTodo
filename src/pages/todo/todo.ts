import { Subscription } from 'rxjs/Rx';
import { Global } from './../../shared/global';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { Component } from '@angular/core';
import { DocumentReference } from '@firebase/firestore-types';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { IMenuRequest } from '../../model/menu-request';
import { ITodoItem } from '../../model/todo-item';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { SpeechRecServiceProvider } from '../../providers/speech-rec-service/speech-rec-service';

@IonicPage()
@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage extends GenericPage {
  private readonly todoRef: DocumentReference;

  private readonly fromListUuid: string;

  private readonly isExternal: boolean;

  private todoSub: Subscription;

  public todo: Observable<ITodoItem>;

  private isMine: boolean = false;

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly sprecCtrl: SpeechRecServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly todoCtrl: TodoServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, sprecCtrl ,authCtrl, uiCtrl);
    this.todoRef = this.navParams.get('todoRef');
    this.fromListUuid = this.navParams.get('listUuid');
    this.isExternal = this.navParams.get('isExternal');
  }

  ionViewDidEnter() {
    if (this.todoRef == null) {
      this.navCtrl.popToRoot();
      this.uiCtrl.displayToast(
        'Une erreur est survenue pendant le chargement de la tâche'
      );
    }

    this.todo = this.todoCtrl.getTodo(this.todoRef);
    const pageData = Global.getEditCopyPageData();
    pageData.subtitle = 'Détail de la tâche';
    this.initPage(pageData);
  }

  ionViewWillLeave() {
    this.tryUnSub(this.todoSub);
  }

  private defIsMine(todo: ITodoItem): void {
    const id = this.authCtrl.getUserId();
    if (id == null || todo == null || todo.author == null || todo.author.uuid == null) {
      this.isMine = false;
    } else {
      this.isMine = todo.author.uuid === id;
    }
  }

  private async initPage(pageData: IPageData): Promise<void> {
    this.todoSub = this.todo.subscribe((todo: ITodoItem) => {
      this.defIsMine(todo);
      if (todo != null) {
        if (todo.name != null) {
          if (this.isExternal && !this.isMine) {
            pageData.title = '🔗 ' + todo.name;
          } else {
            pageData.title = todo.name;
          }
          this.evtCtrl.setHeader(pageData);
        }
      }
    });
  }

  protected menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.DELETE: {
        if (this.isExternal && !this.isMine) {
          this.todoCtrl.removeTodoRef(this.fromListUuid, this.todoRef);
        } else {
          this.todoCtrl.deleteTodo(this.todoRef);
        }
        this.navCtrl.pop();
        break;
      }
      case MenuRequestType.EDIT: {
        this.navCtrl.push('TodoEditPage', { todoRef: this.todoRef });
        break;
      }
      case MenuRequestType.COPY: {
        this.evtCtrl.setCopiedTodoRef(this.todoRef);
        this.uiCtrl.displayToast('Cette à tâche à bien été copiée');
        break;
      }
    }
  }
  protected generateDescription(): string {
    throw new Error('Method not implemented.');
  }
  protected loginAuthRequired(): boolean {
    return false;
  }
  protected basicAuthRequired(): boolean {
    return true;
  }
}
