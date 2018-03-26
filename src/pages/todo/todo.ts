import { StorageServiceProvider } from './../../providers/storage-service/storage-service';
import { ContactServiceProvider } from './../../providers/contact-service/contact-service';
import { Calendar } from '@ionic-native/calendar';
import { Component, ChangeDetectorRef } from '@angular/core';
import { DocumentReference } from '@firebase/firestore-types';
import { PhotoViewer } from '@ionic-native/photo-viewer';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { ITodoItem } from '../../model/todo-item';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { Global } from './../../shared/global';
import { ISimpleContact } from '../../model/simple-contact';
import {
  GoogleMapOptions,
  GoogleMap,
  GoogleMaps,
  GoogleMapsEvent,
  Marker
} from '@ionic-native/google-maps';

@IonicPage()
@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage extends GenericPage {
  /***************************** PUBLIC FIELDS ******************************/
  protected completeLoading: boolean;

  protected todo: ITodoItem;

  protected isInCalendar: boolean;

  protected readonly mapHeiht: number = window.screen.height;

  /**************************** PRIVATE FIELDS ******************************/

  private readonly todoRef: DocumentReference;

  private readonly fromListUuid: string | null;

  private readonly isExternal: boolean;

  private readonly editable: boolean;

  private todoSub: Subscription;

  private todoObs: Observable<ITodoItem>;

  private isMine: boolean;

  private map: GoogleMap;

  /**
   * interval JS pour la detection des changement de la page
   *
   * @private
   * @type {*}
   * @memberof TodoPage
   */
  private changeInterval: any;

  /**
   * timeoutJS a supprimer si la page est détruite trop vite
   *
   * @private
   * @type {*}
   * @memberof TodoPage
   */
  private changeTimeout: any;

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly todoCtrl: TodoServiceProvider,
    private readonly photoCtrl: PhotoViewer,
    private readonly changeCtrl: ChangeDetectorRef,
    private readonly calendarCtrl: Calendar,
    private readonly contactCtrl: ContactServiceProvider,
    private readonly storageCtrl: StorageServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.todoRef = this.navParams.get('todoRef');
    this.fromListUuid = this.navParams.get('listUuid');
    this.editable = true;
    this.completeLoading = false;
    this.isMine = false;
    this.isInCalendar = false;

    if (this.navParams.get('isExternal') == null) {
      this.isExternal = false;
    } else {
      if (this.fromListUuid != null) {
        this.editable = !this.todoCtrl.isReadOnly(this.fromListUuid);
      }
      this.isExternal = this.navParams.get('isExternal');
    }
  }

  /**
   * Effectue des vérifications sur les entrée.
   * Défini la page.
   *
   * @memberof TodoPage
   */
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

  /**
   * Override la detection de changement d'angular (sinon on spin-loop sur les date :/)
   * pour n'effectuer une detection des changemenents que toutes les 3s.
   * Attends quand même 1 seconde avant de le faire pour laisser l'initialisation normal se faire...
   *
   * @memberof TodoPage
   */
  ionViewDidEnter(): void {
    this.changeTimeout = setTimeout(() => {
      this.changeCtrl.detach();
      this.changeCtrl.detectChanges();
      this.changeInterval = setInterval(() => {
        this.changeCtrl.detectChanges();
      }, 2000);
    }, 500);
    this.askForCalendarPerms();
  }

  /**
   * réinitialise le détecteur de changement en mode normal et termine le contexte du todo
   *
   * @memberof TodoPage
   */
  ionViewWillLeave(): void {
    this.tryUnSub(this.todoSub);
    this.evtCtrl.setCurrentContext(null, null);

    if (this.changeTimeout != null) {
      clearTimeout(this.changeTimeout);
    }

    if (this.changeInterval != null) {
      clearInterval(this.changeInterval);
    }
    this.changeCtrl.reattach();
  }

  private async askForCalendarPerms(): Promise<void> {
    if (!await this.calendarCtrl.hasReadWritePermission()) {
      try {
        this.calendarCtrl.requestReadWritePermission();
      } catch (error) {
        this.uiCtrl.displayToast('Les fonctionalités lié au calendrier sont désactivée');
      }
    }
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
          this.todoExistInCalendar();
        }
      }
      this.storageCtrl.refreshDownloadLink(this.todo);
      this.evtCtrl.setCurrentContext(todo.uuid, null);
      this.loadMap();
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
    if (uri == null) {
      return;
    }
    this.photoCtrl.show(uri);
  }

  protected async exportToCalendar(): Promise<void> {
    if (!await this.calendarCtrl.hasReadWritePermission()) {
      return;
    }
    if (this.todo.name == null) {
      return;
    }

    let address = '';
    let desc = '';
    let start = new Date();
    let end = new Date(start.getTime() + 3600000);
    if (this.todo.address != null) {
      address = this.todo.address;
    }
    if (this.todo.desc != null) {
      desc = this.todo.desc;
    }
    if (this.todo.deadline != null) {
      start = new Date(this.todo.deadline);
      end = new Date(start.getTime() + 3600000);
    }

    try {
      await this.calendarCtrl.createEventInteractively(
        this.todo.name,
        address,
        desc,
        start,
        end
      );
      this.todoExistInCalendar();
    } catch (error) {
      this.uiCtrl.displayToast(
        "Une erreur est survenue lors de la tentative d'ajout au calendrier"
      );
    }
  }

  protected openCalendar(): void {
    if (this.todo.deadline == null) {
      this.calendarCtrl.openCalendar(new Date());
    } else {
      this.calendarCtrl.openCalendar(this.todo.deadline);
    }
  }

  protected async deleteFromCaldendar(): Promise<void> {
    if (!await this.calendarCtrl.hasReadWritePermission()) {
      return;
    }
    if (this.todo.name == null) {
      return;
    }

    let address = '';
    let desc = '';
    let start = new Date();
    let end = new Date(start.getTime() + 3600000);
    if (this.todo.address != null) {
      address = this.todo.address;
    }
    if (this.todo.desc != null) {
      desc = this.todo.desc;
    }
    if (this.todo.deadline != null) {
      start = new Date(this.todo.deadline);
      end = new Date(start.getTime() + 3600000);
    }
    try {
      this.calendarCtrl.deleteEvent(this.todo.name, address, desc, start, end);
      this.uiCtrl.displayToast('Tâche supprimée de votre calendrier');
    } catch (error) {
      this.uiCtrl.displayToast('Une erreur est survenue pendant la suppression de la tâche');
    }
    this.isInCalendar = false;
  }

  private async todoExistInCalendar(): Promise<void> {
    if (!await this.calendarCtrl.hasReadWritePermission()) {
      return;
    }
    if (this.todo.name == null) {
      return;
    }

    let address = '';
    let desc = '';
    let start = new Date();
    let end = new Date(start.getTime() + 3600000);
    if (this.todo.address != null) {
      address = this.todo.address;
    }
    if (this.todo.desc != null) {
      desc = this.todo.desc;
    }
    if (this.todo.deadline != null) {
      start = new Date(this.todo.deadline);
      end = new Date(start.getTime() + 3600000);
    }
    try {
      const res: any[] = await this.calendarCtrl.findEvent(
        this.todo.name,
        address,
        desc,
        start,
        end
      );
      this.isInCalendar = res.length > 0;
    } catch (error) {
      this.isInCalendar = false;
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

  get remainingDeadlineStr(): string {
    if (this.todo.deadline == null) {
      return 'Non définie';
    }
    return moment(this.todo.deadline)
      .locale('fr')
      .fromNow();
  }

  protected getHuman(d: Date): string {
    if (d == null) {
      return 'Non définie';
    }
    return moment(d)
      .locale('fr')
      .format('ddd D MMM YYYY');
  }

  protected openSMS(contact: ISimpleContact): void {
    if (contact == null) {
      return;
    }
    this.contactCtrl.openNativeSMS(contact);
  }

  protected call(contact: ISimpleContact): void {
    if (contact == null) {
      return;
    }
    this.contactCtrl.call(contact);
  }

  protected openEmail(contact: ISimpleContact): void {
    if (contact == null) {
      return;
    }
    this.contactCtrl.prepareEmail(contact);
  }

  private async loadMap(): Promise<void> {
    const mapOptions: GoogleMapOptions = {
      camera: {
        target: {
          lat: 43.0741904,
          lng: -89.3809802
        },
        zoom: 18,
        tilt: 30
      }
    };

    this.map = GoogleMaps.create('mapwrapper', mapOptions);

    try {
      await this.map.one(GoogleMapsEvent.MAP_READY);
      this.map.setMyLocationEnabled(true);
      this.map.setMyLocationButtonEnabled(true);
      const marker: Marker = await this.map.addMarker({
        title: 'Ionic',
        icon: 'blue',
        animation: 'DROP',
        position: {
          lat: 43.0741904,
          lng: -89.3809802
        }
      });
      marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
        alert('clicked');
      });
    } catch (error) {
      console.log(error);
    }
  }
}
