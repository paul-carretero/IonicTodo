import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { GenericPage } from '../../shared/generic-page';
import { ITodoItem } from './../../model/todo-item';
import { EventServiceProvider } from './../../providers/event/event-service';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Global } from './../../shared/global';
import { MenuRequestType } from '../../model/menu-request-type';

@IonicPage()
@Component({
  selector: 'page-todo-edit',
  templateUrl: 'todo-edit.html'
})
export class TodoEditPage extends GenericPage {
  private readonly todoUUID: string;
  private readonly listUUID: string;

  public todo: ITodoItem;
  public todoForm: FormGroup;

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly todoService: TodoServiceProvider,
    private readonly formBuilder: FormBuilder
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);

    this.todoUUID = this.navParams.get('todoUUID');
    this.listUUID = this.navParams.get('listUUID');
    this.todo = Global.getBlankTodo();

    if (this.listUUID == null) {
      this.initBlankForm();
    } else {
      this.initForm(this.todo);
    }
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewDidEnter(): void {
    const header = Global.getValidablePageData();

    if (this.todoUUID != null) {
      header.subtitle = 'Menu édition';
      this.deleteSub = this.todoService
        .getTodoDeleteSubject(this.listUUID, this.todoUUID)
        .subscribe(() => this.hasBeenRemoved(false));
    } else {
      header.title = 'Nouvelle Tâche';
      header.subtitle = 'Menu création';
      this.evtCtrl.getHeadeSubject().next(header);
    }
  }

  ionViewWillLeave(): void {
    this.todoService.unsubDeleteSubject();
  }

  protected menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.VALIDATE:
        this.validate();
        break;
    }
  }

  get isInCreation(): boolean {
    return this.todoUUID == null;
  }

  get submitText(): string {
    if (this.listUUID == null) {
      return 'Créer une nouvelle tâche';
    }
    return 'Mettre à jour cette tâche';
  }

  private initForm(todo: ITodoItem): void {
    this.todoForm = this.formBuilder.group({
      name: [todo.name, Validators.required],
      desc: [todo.desc]
    });
  }

  private initBlankForm(): void {
    this.todoForm = this.formBuilder.group({
      name: ['', Validators.required],
      desc: ['']
    });
  }

  protected generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public validate(): void {
    if (!this.todoForm.valid) {
      this.uiCtrl.displayToast('Opération impossible, veuillez vérifier le formulaire');
      return;
    }

    const name = this.todoForm.get('name');
    const desc = this.todoForm.get('desc');

    if (name == null || desc == null) {
      return;
    }

    if (this.isInCreation) {
      this.todo = {
        name: name.value,
        desc: desc.value,
        uuid: null,
        author: null,
        complete: false
      };
      this.todoService.addTodo(this.listUUID, this.todo);
    } else {
      this.todoService.editTodo(this.listUUID, this.todo);
    }
    this.navCtrl.pop();
  }

  protected loginAuthRequired(): boolean {
    return false;
  }

  protected basicAuthRequired(): boolean {
    return true;
  }
}
