import { DocumentReference } from '@firebase/firestore-types';
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
  private readonly todoRef: DocumentReference | null;

  private readonly listUuid: string | null;

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

    this.todoRef = this.navParams.get('todoRef');
    this.listUuid = this.navParams.get('listUUID');
    this.todo = Global.getBlankTodo();

    if (this.todoRef == null && this.listUuid == null) {
      throw new Error('Invalid Parameters for todoEdit task');
    }

    if (this.isInCreation) {
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

    if (this.todoRef != null) {
      header.subtitle = 'Menu édition';

      this.deleteSub = this.todoService
        .getTodoDeleteSubject(this.todoRef)
        .subscribe(() => this.hasBeenRemoved(false));
    } else {
      header.title = 'Nouvelle Tâche';
      header.subtitle = 'Menu création';
      this.evtCtrl.setHeader(header);
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
    return this.todoRef == null;
  }

  get submitText(): string {
    if (this.isInCreation) {
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

  private async defNewTodo(): Promise<void> {
    if (this.listUuid == null) {
      return;
    }

    this.uiCtrl.showLoading('Création de la tâche...');
    const newTodoRef = await this.todoService.addTodo(this.listUuid, this.todo);
    if (newTodoRef == null) {
      this.uiCtrl.displayToast('unexpected error is unexpected');
      this.navCtrl.popToRoot();
    } else {
      this.navCtrl.pop();
      this.navCtrl.push('TodoPage', { todoRef: newTodoRef });
    }
  }

  private async editTodo(): Promise<void> {
    if (this.todoRef == null) {
      return;
    }

    this.uiCtrl.showLoading('Mise à jour de la tâche...');
    await this.todoService.editTodo(this.todoRef, this.todo);
    this.navCtrl.pop();
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
    this.todo.name = name.value;
    this.todo.desc = desc.value;

    if (this.isInCreation) {
      this.defNewTodo();
    } else {
      this.editTodo();
    }
  }
}
