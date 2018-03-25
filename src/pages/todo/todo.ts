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
import { PhotoViewer } from '@ionic-native/photo-viewer';

@IonicPage()
@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage extends GenericPage {
  private readonly todoRef: DocumentReference;

  private readonly fromListUuid: string | null;

  private readonly isExternal: boolean;

  private todoSub: Subscription;

  protected todo: ITodoItem;

  private todoObs: Observable<ITodoItem>;

  private isMine: boolean = false;

  protected completeLoading: boolean = false;

  private readonly editable: boolean = true;

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly todoCtrl: TodoServiceProvider,
    private readonly photoCtrl: PhotoViewer
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.todoRef = this.navParams.get('todoRef');
    this.fromListUuid = this.navParams.get('listUuid');

    if (this.navParams.get('isExternal') == null) {
      this.isExternal = false;
    } else {
      if (this.fromListUuid != null) {
        this.editable = !this.todoCtrl.isReadOnly(this.fromListUuid);
      }
      this.isExternal = this.navParams.get('isExternal');
    }
  }

  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    if (this.todoRef == null) {
      this.navCtrl.popToRoot();
      this.uiCtrl.displayToast('Une erreur est survenue pendant le chargement de la tâche');
    }

    this.todoObs = this.todoCtrl.getTodo(this.todoRef);
    const pageData = Global.getEditCopyPageData();
    pageData.editable = this.editable;
    pageData.subtitle = 'Détail de la tâche';
    this.initPage(pageData);
  }

  ionViewWillLeave() {
    this.tryUnSub(this.todoSub);
    this.evtCtrl.setCurrentContext(null, null);
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
    this.todoSub = this.todoObs.subscribe((todo: ITodoItem) => {
      this.todo = todo;
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
      this.evtCtrl.setCurrentContext(todo.uuid, null);
    });
  }

  protected async updateComplete(): Promise<void> {
    this.completeLoading = true;
    await this.todoCtrl.complete(this.todoRef, this.todo.complete);
    this.completeLoading = false;
  }

  /**
   * @override
   * @protected
   * @param {IMenuRequest} req
   * @memberof TodoPage
   */
  protected menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.DELETE: {
        if (this.fromListUuid != null && this.isExternal && !this.isMine) {
          this.todoCtrl.removeTodoRef(this.fromListUuid, this.todoRef);
        } else {
          if (this.todo.uuid != null) {
            this.todoCtrl.deleteTodo(this.todoRef, this.todo.uuid);
          }
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

  protected showPhoto(uri: string): void {
    this.photoCtrl.show(uri);
  }
}
