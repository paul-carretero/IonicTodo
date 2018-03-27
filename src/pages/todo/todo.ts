import { ChangeDetectorRef, Component } from '@angular/core';
import { DocumentReference } from '@firebase/firestore-types';
import { Calendar } from '@ionic-native/calendar';
import {
  GoogleMap,
  GoogleMapOptions,
  GoogleMaps,
  GoogleMapsEvent,
  ILatLng,
  LatLngBounds,
  Marker
} from '@ionic-native/google-maps';
import { PhotoViewer } from '@ionic-native/photo-viewer';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { IAuthor } from '../../model/author';
import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { ISimpleContact } from '../../model/simple-contact';
import { ITodoItem } from '../../model/todo-item';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { ContactServiceProvider } from './../../providers/contact-service/contact-service';
import { MapServiceProvider } from './../../providers/map-service/map-service';
import { StorageServiceProvider } from './../../providers/storage-service/storage-service';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { Global } from './../../shared/global';
import { Environment } from '@ionic-native/google-maps';

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

  /**
   * si pas de position alors on place la carte centrée sur grenoble environ
   *
   * @private
   * @static
   * @type {GoogleMapOptions}
   * @memberof TodoPage
   */
  private static readonly defaultPos: GoogleMapOptions = {
    camera: {
      target: {
        lat: 45.16,
        lng: 5.7
      },
      zoom: 10,
      tilt: 30
    }
  };

  private readonly todoRef: DocumentReference;

  private readonly fromListUuid: string | null;

  private readonly isExternal: boolean;

  private readonly editable: boolean;

  private todoSub: Subscription;

  private todoObs: Observable<ITodoItem>;

  private isMine: boolean;

  private map: GoogleMap;

  private todoAddressMarker: Marker | null;

  private todoAuthorMapMarker: Marker | null;

  private todoCompleteAuthorMapMarker: Marker | null;

  private todoAddressMarkerSub: Subscription | null;

  private todoAuthorMapMarkerSub: Subscription | null;

  private todoCompleteAuthorMapMarkerSub: Subscription | null;

  private mapLoaded: boolean;

  private bounds: ILatLng[];
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
    private readonly storageCtrl: StorageServiceProvider,
    private readonly mapCtrl: MapServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.todoRef = this.navParams.get('todoRef');
    this.fromListUuid = this.navParams.get('listUuid');

    this.mapLoaded = false;
    this.editable = true;
    this.completeLoading = false;
    this.isMine = false;
    this.isInCalendar = false;
    this.todoAddressMarker = null;
    this.todoAuthorMapMarker = null;
    this.todoCompleteAuthorMapMarker = null;
    this.bounds = [];

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

    Environment.setBackgroundColor('lightgrey');
  }

  /**
   * réinitialise le détecteur de changement en mode normal et termine le contexte du todo
   *
   * @memberof TodoPage
   */
  ionViewWillLeave(): void {
    this.tryUnSub(this.todoSub);
    this.tryUnSub(this.todoAddressMarkerSub);
    this.tryUnSub(this.todoAuthorMapMarkerSub);
    this.tryUnSub(this.todoCompleteAuthorMapMarkerSub);
    this.evtCtrl.setCurrentContext(null, null);

    if (this.changeTimeout != null) {
      clearTimeout(this.changeTimeout);
    }

    if (this.changeInterval != null) {
      clearInterval(this.changeInterval);
    }
    this.changeCtrl.reattach();
  }

  ionViewWillUnload(): void {
    super.ionViewWillUnload();
    if (this.map != null) {
      this.map.removeEventListener();
      this.map.remove();
    }
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
        this.loadMap().then(() => this.resetMarker());
        this.storageCtrl.refreshDownloadLink(this.todo);
        this.evtCtrl.setCurrentContext(todo.uuid, null);
      } else {
        this.evtCtrl.setCurrentContext(null, null);
        this.navCtrl.popToRoot();
        this.uiCtrl.displayToast('Une erreur est survenue');
      }
    });
  }

  protected async updateComplete(): Promise<void> {
    this.completeLoading = true;
    await this.todoCtrl.complete(this.todo);
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

  private async getStartOpts(): Promise<GoogleMapOptions> {
    const myPosP: Promise<ILatLng | null> = this.mapCtrl.getMyPosition();
    let todoAddress: null | ILatLng = null;
    if (this.todo.address != null) {
      try {
        todoAddress = await this.mapCtrl.AddressToCoord(this.todo.address);
      } catch (error) {
        console.log("impossible de convertir l'adresse en coordonnées");
      }
    }
    const myPos = await myPosP;

    this.bounds = [];
    if (todoAddress != null) {
      this.bounds.push(todoAddress);
    }

    if (todoAddress != null) {
      return {
        camera: {
          target: todoAddress,
          zoom: 10,
          tilt: 30
        }
      };
    }

    if (myPos != null) {
      return {
        camera: {
          target: myPos,
          zoom: 10,
          tilt: 30
        }
      };
    }

    if (this.todo.author != null && this.todo.author.coord != null) {
      return {
        camera: {
          target: Global.getILatLng(this.todo.author.coord),
          zoom: 10,
          tilt: 30
        }
      };
    }

    if (this.todo.completeAuthor != null && this.todo.completeAuthor.coord != null) {
      return {
        camera: {
          target: Global.getILatLng(this.todo.completeAuthor.coord),
          zoom: 10,
          tilt: 30
        }
      };
    }

    return TodoPage.defaultPos;
  }

  public async animateCamera(): Promise<void> {
    const myPosP: Promise<ILatLng | null> = this.mapCtrl.getMyPosition();
    let todoAddress: null | ILatLng = null;
    if (this.todo.address != null) {
      try {
        todoAddress = await this.mapCtrl.AddressToCoord(this.todo.address);
      } catch (error) {
        console.log("impossible de convertir l'adresse en coordonnées");
      }
    }
    const myPos = await myPosP;

    const bounds: ILatLng[] = [];
    if (todoAddress != null) {
      bounds.push(todoAddress);
    }
    if (myPos != null) {
      bounds.push(myPos);
    }
    if (this.todo.author != null && this.todo.author.coord != null) {
      bounds.push(Global.getILatLng(this.todo.author.coord));
    }
    if (this.todo.completeAuthor != null && this.todo.completeAuthor.coord != null) {
      bounds.push(Global.getILatLng(this.todo.completeAuthor.coord));
    }

    if (bounds.length > 1) {
      const latlngBounds = new LatLngBounds(bounds);
      const opts = {
        target: latlngBounds,
        tilt: 30,
        duration: 500
      };
      this.map.animateCamera(opts);
    }
  }

  /**
   * créé un marker à l'emplacement de l'adresse de la tâche si celle si est défini.
   * Nettoie et ajoute une alert si l'on clique dessus pour plus d'info
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async addAddressMarker(): Promise<void> {
    if (this.todo.address == null) {
      return;
    }
    let latlnt: ILatLng;
    try {
      latlnt = await this.mapCtrl.AddressToCoord(this.todo.address);
    } catch (error) {
      return;
    }

    this.todoAddressMarker = await this.map.addMarker({
      title: this.todo.address,
      icon: 'blue',
      animation: 'DROP',
      position: latlnt
    });

    if (this.todoAddressMarker == null) {
      return;
    }
    this.tryUnSub(this.todoAddressMarkerSub);

    this.todoAddressMarkerSub = this.todoAddressMarker
      .on(GoogleMapsEvent.MARKER_CLICK)
      .subscribe(() => {
        let adr = this.todo.address;
        if (adr == null) {
          adr = '';
        }

        this.uiCtrl.alert('Addresse de la tâche', adr);
      });
  }

  /**
   * créé un marker à l'emplacement de l'adresse où la tâche à été créée
   * Nettoie et ajoute une alert si l'on clique dessus pour plus d'info
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async addCreateMarker(): Promise<void> {
    if (this.todo.author == null || this.todo.author.coord == null) {
      return;
    }
    const latlnt = Global.getILatLng(this.todo.author.coord);
    this.todoAuthorMapMarker = await this.map.addMarker({
      title: 'Création de la tâche',
      icon: 'green',
      animation: 'DROP',
      position: latlnt
    });

    if (this.todoAuthorMapMarker == null) {
      return;
    }
    this.tryUnSub(this.todoAuthorMapMarkerSub);

    this.todoAuthorMapMarkerSub = this.todoAuthorMapMarker
      .on(GoogleMapsEvent.MARKER_CLICK)
      .subscribe(() => {
        let name = 'un anonyme';
        if (this.todo.author != null && this.todo.author.displayName != null) {
          name = this.todo.author.displayName;
        }
        this.uiCtrl.alert(
          'Création de la tâche',
          'La tâche a été créé le ' + this.getDate(this.todo.author) + ' par ' + name
        );
      });
  }

  /**
   * créé un marker à l'emplacement de l'adresse où la tâche à été terminée
   * Nettoie et ajoute une alert si l'on clique dessus pour plus d'info
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async addCompleteMarker(): Promise<void> {
    if (this.todo.completeAuthor == null || this.todo.completeAuthor.coord == null) {
      return;
    }
    const latlnt = Global.getILatLng(this.todo.completeAuthor.coord);
    this.todoCompleteAuthorMapMarker = await this.map.addMarker({
      title: 'Complétion de la tâche',
      icon: 'red',
      animation: 'DROP',
      position: latlnt
    });

    if (this.todoCompleteAuthorMapMarker == null) {
      return;
    }
    this.tryUnSub(this.todoCompleteAuthorMapMarkerSub);

    this.todoCompleteAuthorMapMarkerSub = this.todoCompleteAuthorMapMarker
      .on(GoogleMapsEvent.MARKER_CLICK)
      .subscribe(() => {
        let name = 'un anonyme';
        if (this.todo.completeAuthor != null && this.todo.completeAuthor.displayName != null) {
          name = this.todo.completeAuthor.displayName;
        }
        this.uiCtrl.alert(
          'Complétion de la tâche',
          'La tâche a été complétée le ' +
            this.getDate(this.todo.completeAuthor) +
            ' par ' +
            name
        );
      });
  }

  private getDate(anAuthor: IAuthor | null): string {
    if (anAuthor == null || anAuthor.timestamp == null) {
      return 'Non définie';
    }
    return moment(anAuthor.timestamp)
      .locale('fr')
      .format('ddd D MMM YYYY, HH:mm');
  }

  private async resetMarker(): Promise<void> {
    if (!this.mapLoaded) {
      return;
    }
    try {
      await this.map.clear();
      this.animateCamera();
      this.addAddressMarker();
      this.addCreateMarker();
      this.addCompleteMarker();
    } catch (error) {
      console.log(error);
    }
  }

  private async loadMap(): Promise<void> {
    if (this.mapLoaded) {
      return;
    }

    const mapOptions = await this.getStartOpts();
    this.map = GoogleMaps.create('mapwrapper', mapOptions);

    try {
      await this.map.one(GoogleMapsEvent.MAP_READY);
      this.map.setMyLocationEnabled(true);
      this.map.setMyLocationButtonEnabled(true);
      this.mapLoaded = true;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Permet de générer une description de la page, notament pour la synthèse vocale
   *
   * @protected
   * @returns {string} une description textuelle de la page
   * @memberof GenericPage
   */
  protected generateDescription(): string {
    let description : string = "";
    description = " Détails de la tâche " + this.todo.name + " . ";
    
    if(this.todo.desc != null) {
      description += " Description de la tâche : " + this.todo.desc + " . ";
    }

    if(this.deadlineStr !== "Non définie"){
      description += " La tâche doit être réalisée avant le " + this.deadlineStr + " . " ;
    }

    if(this.remainingDeadlineStr !== "Non définie"){
      description += "La tâche doit être terminée " + this.remainingDeadlineStr + " . ";
    }

    if(this.notifStr !== "Non définie"){
      description += "La notification est prévue pour le " + this.notifStr + " . ";
    }

    if(this.todo.address != null){
      description += "La tâche à lieu à " + this.todo.address + " . ";
    }

    return description;
  }

}
