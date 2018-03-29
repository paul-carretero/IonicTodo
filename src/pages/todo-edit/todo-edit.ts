import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentReference } from '@firebase/firestore-types';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Base64 } from '@ionic-native/base64';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { DatePicker } from '@ionic-native/date-picker';
import { File } from '@ionic-native/file';
import { IonicPage, ModalController, NavController, NavParams } from 'ionic-angular';
import moment from 'moment';
import { v4 as uuid } from 'uuid';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { ISimpleContact } from '../../model/simple-contact';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { GenericPage } from '../../shared/generic-page';
import { IAuthor } from './../../model/author';
import { IPicture } from './../../model/picture';
import { ITodoItem } from './../../model/todo-item';
import { EventServiceProvider } from './../../providers/event/event-service';
import { StorageServiceProvider } from './../../providers/storage-service/storage-service';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Global } from './../../shared/global';
import { Observable } from 'rxjs/Observable';

@IonicPage()
@Component({
  selector: 'page-todo-edit',
  templateUrl: 'todo-edit.html'
})
export class TodoEditPage extends GenericPage {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * le todo à éditer
   *
   * @protected
   * @type {ITodoItem}
   * @memberof TodoEditPage
   */
  protected todo: ITodoItem;

  /**
   * le forumlaire de contrôle
   *
   * @protected
   * @type {FormGroup}
   * @memberof TodoEditPage
   */
  protected todoForm: FormGroup;

  /**
   * true si la page est dans le moddal de contact pour les evt
   *
   * @protected
   * @type {boolean}
   * @memberof TodoEditPage
   */
  protected isInModdal: boolean = false;

  /**
   * true si l'on est en train d'envoyer un fichier
   *
   * @protected
   * @type {boolean}
   * @memberof TodoEditPage
   */
  protected uploading: boolean = false;

  /**
   * observable du status de la connexion réseau
   *
   * @protected
   * @type {Observable<boolean>}
   * @memberof TodoEditPage
   */
  protected netStatus$: Observable<boolean>;

  /**************************** PRIVATE FIELDS ******************************/

  /**
   * référence non null vers un todo à éditer, ou null si il s'agit d'une création
   *
   * @private
   * @type {(DocumentReference | null)}
   * @memberof TodoEditPage
   */
  private readonly todoRef: DocumentReference | null;

  /**
   * uuid de la liste d'où provient le todo
   *
   * @private
   * @type {(string | null)}
   * @memberof TodoEditPage
   */
  private readonly listUuid: string | null;

  /**
   * options pour la caméra pour ajouter des photos
   *
   * @private
   * @type {CameraOptions}
   * @memberof TodoEditPage
   */
  private readonly cameraOpts: CameraOptions;

  /**
   * false si certaines photo n'ont pas été synchronisé avec la liste des photo présente sur le cloud
   *
   * @private
   * @type {boolean}
   * @memberof TodoEditPage
   */
  private imgCacheClean: boolean = true;

  /**
   * author en train d'éditer ce todo
   *
   * @private
   * @type {IAuthor}
   * @memberof TodoEditPage
   */
  private curAuthor: IAuthor;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of TodoEditPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {NavParams} navParams
   * @param {TodoServiceProvider} todoService
   * @param {FormBuilder} formBuilder
   * @param {DatePicker} datePicker
   * @param {ModalController} modalCtrl
   * @param {Base64} base64Ctrl
   * @param {File} fileCtrl
   * @param {AndroidPermissions} permsCtrl
   * @param {StorageServiceProvider} storageCtrl
   * @param {Camera} cameraCtrl
   * @memberof TodoEditPage
   */
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
    private readonly base64Ctrl: Base64,
    private readonly fileCtrl: File,
    private readonly permsCtrl: AndroidPermissions,
    private readonly storageCtrl: StorageServiceProvider,
    private readonly cameraCtrl: Camera
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);

    this.todoRef = this.navParams.get('todoRef');
    this.listUuid = this.navParams.get('listUUID');
    this.todo = Global.getBlankTodo();
    this.netStatus$ = this.evtCtrl.getNetStatusObs();

    if (this.todoRef == null && this.listUuid == null) {
      throw new Error('Invalid Parameters for todoEdit task');
    }

    this.todoForm = this.formBuilder.group({
      name: ['', Validators.required],
      desc: [''],
      address: [''],
      sendSMS: [false, Validators.required]
    });

    this.cameraOpts = {
      quality: 100,
      correctOrientation: true,
      allowEdit: true,
      targetHeight: 1280,
      destinationType: this.cameraCtrl.DestinationType.FILE_URI,
      encodingType: this.cameraCtrl.EncodingType.JPEG,
      mediaType: this.cameraCtrl.MediaType.PICTURE
    };
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewWillEnter(): void {
    super.ionViewWillEnter();
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
      this.todo.uuid = uuid();
    }

    this.authCtrl.getAuthor(false).then((res: IAuthor) => {
      this.curAuthor = res;
    });
  }

  ionViewWillLeave(): void {
    this.todoService.unsubDeleteSubject();
    if (!this.imgCacheClean) {
      this.todoService.updateTodoPictures(this.todo);
    }
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

      const name = this.todoForm.get('name');
      const desc = this.todoForm.get('desc');
      const address = this.todoForm.get('address');
      const sendSMS = this.todoForm.get('sendSMS');
      if (name != null && desc != null && address != null && sendSMS != null) {
        name.setValue(this.todo.name);
        desc.setValue(this.todo.desc);
        address.setValue(this.todo.address);
        sendSMS.setValue(this.todo.sendSMS);
      }
      this.storageCtrl.refreshDownloadLink(this.todo);
      sub.unsubscribe();
    });
  }

  private async defNewTodo(): Promise<void> {
    if (this.listUuid == null) {
      return;
    }

    this.uiCtrl.showLoading('Création de la tâche...');
    const newTodoRef = await this.todoService.addTodo(this.listUuid, this.todo, true);
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
    await this.todoService.editTodo(this.todo);
    this.navCtrl.pop();
  }

  protected validate(): void {
    if (!this.todoForm.valid || this.uploading) {
      this.uiCtrl.displayToast('Opération impossible, veuillez vérifier le formulaire');
      return;
    }

    const name = this.todoForm.get('name');
    const desc = this.todoForm.get('desc');
    const address = this.todoForm.get('address');
    const sendSMS = this.todoForm.get('sendSMS');

    if (name == null || desc == null || address == null || sendSMS == null) {
      return;
    }
    this.todo.name = name.value;
    this.todo.desc = desc.value;
    this.todo.address = address.value;
    this.todo.sendSMS = sendSMS.value;

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
      if (this.todo.notif != null) {
        date = new Date(this.todo.notif);
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
        locale: 'fr-FR',
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

  get deadlineStr(): string {
    if (this.todo.deadline == null) {
      return 'Non définie';
    }
    return moment(this.todo.deadline)
      .locale('fr')
      .format('ddd D MMM YYYY, HH:mm');
  }

  get notifStr(): string {
    if (this.todo.notif == null) {
      return 'Non définie';
    }
    return moment(this.todo.notif)
      .locale('fr')
      .format('ddd D MMM YYYY, HH:mm');
  }

  protected openContactPopup(): void {
    this.isInModdal = true;
    const contactModal = this.modalCtrl.create('ContactModalPage', {
      contacts: this.todo.contacts,
      onlyMobile: true
    });
    contactModal.present();
    contactModal.onDidDismiss(() => {
      this.isInModdal = false;
    });
  }

  protected deleteContact(contact: ISimpleContact): void {
    const index = this.todo.contacts.findIndex(c => c.id === contact.id);
    if (index !== -1) {
      this.todo.contacts.splice(index, 1);
    }
  }

  private async imgResultHandler(URIs: string[], author: IAuthor | null): Promise<void> {
    this.imgCacheClean = false;
    const prepareUploadedPics: { uuid: string; url: string | null; dl: number }[] = [];
    this.uploading = true;

    for (const uri of URIs) {
      const uriTab = uri.split('/');
      const name = uriTab[uriTab.length - 1].substring(4, 20);
      const entry: IPicture = { uuid: uuid(), dl: 0, url: null, author: author, name: name };
      prepareUploadedPics.push(entry);
      this.todo.pictures.push(entry);
    }

    for (const uri of URIs) {
      const entry = prepareUploadedPics.pop();
      if (entry == null) {
        return;
      }
      let content: 'image/png' | 'image/jpg' = 'image/jpg';
      if (uri.toUpperCase().includes('.PNG')) {
        content = 'image/png';
      }

      const base64_full = await this.base64Ctrl.encodeFile(uri);
      const base64_split = base64_full.split(',');
      const base64 = base64_split[base64_split.length - 1];
      this.uploadImage(base64, entry.uuid, content);
      this.fileCtrl
        .resolveLocalFilesystemUrl(uri)
        .then(f => f.remove(() => {}, () => console.log('suppression PAS OK :/')));
    }

    this.uploading = false;
  }

  private async requestPerms(): Promise<void> {
    try {
      await this.permsCtrl.checkPermission(this.permsCtrl.PERMISSION.READ_EXTERNAL_STORAGE);
      await this.permsCtrl.checkPermission(this.permsCtrl.PERMISSION.WRITE_EXTERNAL_STORAGE);
    } catch (error) {
      this.permsCtrl.requestPermissions([
        this.permsCtrl.PERMISSION.READ_EXTERNAL_STORAGE,
        this.permsCtrl.PERMISSION.WRITE_EXTERNAL_STORAGE
      ]);
    }
  }

  protected openGalleryWrapper(): void {
    this.requestPerms();
    (<any>window).imagePicker.getPictures(
      (res: string[]) => {
        this.imgResultHandler(res, null);
      },
      (error: any) => {
        console.log('Erreur dans ImagePicker: ' + error);
      },
      {
        maximumImagesCount: 10,
        width: 800
      }
    );
  }

  protected deleteUploadedPic(uuidPic: string): void {
    if (this.todo.uuid === null) {
      return;
    }
    this.imgCacheClean = false;
    this.storageCtrl.deleteMedia(this.todo.uuid, uuidPic);
    const i = this.todo.pictures.findIndex(u => u.uuid === uuidPic);
    if (i !== -1) {
      this.todo.pictures.splice(i, 1);
    }
  }

  private uploadImage(
    base64Pic: string,
    uuidPic: string,
    content: 'image/jpg' | 'image/png'
  ): void {
    if (this.todo.uuid == null) {
      return;
    }
    const upload = this.storageCtrl.uploadMedia(this.todo.uuid, uuidPic, base64Pic, content);

    upload.percentageChanges().subscribe((n: number) => {
      const entry = this.todo.pictures.find(pic => pic.uuid === uuidPic);
      if (entry == null) {
        this.todo.pictures.push({ uuid: uuidPic, dl: n, url: null, name: null, author: null });
      } else {
        entry.dl = n;
      }
    });

    upload.then().then((res: { downloadURL: string }) => {
      const entry = this.todo.pictures.find(pic => pic.uuid === uuidPic);
      if (entry == null) {
        this.todo.pictures.push({
          uuid: uuidPic,
          url: res.downloadURL,
          dl: 100,
          name: null,
          author: null
        });
      } else {
        entry.url = res.downloadURL;
      }
    });
  }

  protected updateName(pic: IPicture, name: string): void {
    pic.name = name;
  }

  protected takePicture(): void {
    this.cameraCtrl.getPicture(this.cameraOpts).then(
      imageData => {
        this.imgResultHandler([imageData], this.curAuthor);
      },
      () => this.uiCtrl.alert('Erreur', "Impossible d'acceder à la camera")
    );
  }
}
