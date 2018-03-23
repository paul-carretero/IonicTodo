import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentReference } from '@firebase/firestore-types';
import { Contacts } from '@ionic-native/contacts';
import { DatePicker } from '@ionic-native/date-picker';
import { ImagePicker } from '@ionic-native/image-picker';
import { IonicPage, ModalController, NavController, NavParams } from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { ISimpleContact } from '../../model/simple-contact';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { GenericPage } from '../../shared/generic-page';
import { ITodoItem } from './../../model/todo-item';
import { EventServiceProvider } from './../../providers/event/event-service';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Global } from './../../shared/global';

@IonicPage()
@Component({
  selector: 'page-todo-edit',
  templateUrl: 'todo-edit.html'
})
export class TodoEditPage extends GenericPage {
  private readonly todoRef: DocumentReference | null;

  private readonly listUuid: string | null;

  protected todo: ITodoItem;

  protected todoForm: FormGroup;

  protected contactList: ISimpleContact[];

  protected isInModdal = false;

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly todoService: TodoServiceProvider,
    private readonly formBuilder: FormBuilder,
    private readonly datePicker: DatePicker,
    private readonly modalCtrl: ModalController,
    private readonly contactsCtrl: Contacts,
    private readonly galleryCtrl: ImagePicker
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);

    this.todoRef = this.navParams.get('todoRef');
    this.listUuid = this.navParams.get('listUUID');
    this.todo = Global.getBlankTodo();

    if (this.todoRef == null && this.listUuid == null) {
      throw new Error('Invalid Parameters for todoEdit task');
    }

    this.todoForm = this.formBuilder.group({
      name: ['', Validators.required],
      desc: [''],
      address: ['']
    });

    this.contactList = [];
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
      this.initPageForEdit(header);
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
    if (this.isInModdal) {
      return;
    }
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

  private async defJoinContactList(): Promise<void> {
    const contacts = await this.contactsCtrl.find(['displayName', 'phoneNumbers', 'emails'], {
      desiredFields: ['displayName', 'phoneNumbers', 'emails']
    });
    this.contactList = [];
    for (const contact of contacts) {
      if (
        contact.phoneNumbers != null &&
        contact.phoneNumbers.length > 0 &&
        this.todo.SMSNumbers.findIndex(p => p === contact.phoneNumbers[0].value) > -1
      ) {
        const simpleContact: ISimpleContact = {
          displayName: contact.displayName,
          mobile: contact.phoneNumbers[0].value,
          id: contact.id
        };
        this.contactList.push(simpleContact);
      }
    }
  }

  private async initPageForEdit(header: IPageData): Promise<void> {
    if (this.todoRef == null) {
      return;
    }
    const sub = this.todoService.getTodo(this.todoRef).subscribe(todo => {
      this.todo = todo;
      if (this.todo.name != null) {
        header.title = this.todo.name;
      }
      this.evtCtrl.setHeader(header);
      this.defJoinContactList();
      sub.unsubscribe();
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

  protected validate(): void {
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

  protected async selectDate(deadline: boolean): Promise<void> {
    let title: string;
    let date: Date = new Date();

    if (deadline) {
      title = 'choisissez une date de deadline';
      if (this.todo.deadline != null) {
        date = new Date(this.todo.deadline);
      }
    } else {
      title = 'Choisisser une date de notification';
      if (this.todo.deadline != null) {
        date = new Date(this.todo.deadline);
      }
    }

    let newDate: Date | null;
    try {
      newDate = await this.datePicker.show({
        date: date,
        mode: 'datetime',
        minDate: new Date().valueOf(),
        is24Hour: true,
        titleText: title,
        androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_DARK
      });
    } catch (error) {
      newDate = null;
    }

    if (deadline) {
      this.todo.deadline = newDate;
    } else {
      this.todo.notif = newDate;
    }
  }

  get ISOdeadline(): string | null {
    if (this.todo.deadline == null) {
      return null;
    }
    return this.todo.deadline.toISOString();
  }

  get ISOnotif(): string | null {
    if (this.todo.notif == null) {
      return null;
    }
    return this.todo.notif.toISOString();
  }

  protected openContactPopup(): void {
    this.isInModdal = true;
    const contactModal = this.modalCtrl.create('ContactModalPage', {
      contacts: this.contactList,
      onlyMobile: true
    });
    contactModal.present();
    contactModal.onDidDismiss(() => {
      this.isInModdal = false;
    });
  }

  protected deleteContact(id: string): void {
    const index = this.contactList.findIndex(c => c.id === id);
    if (index !== -1) {
      this.contactList.splice(index, 1);
    }
  }

  protected async openGallery(): Promise<void> {
    if (!await this.galleryCtrl.hasReadPermission()) {
      await this.galleryCtrl.requestReadPermission();
    }
    const res: string[] = await this.galleryCtrl.getPictures({});
    for (const uri of res) {
      console.log(uri);
    }
  }
}
