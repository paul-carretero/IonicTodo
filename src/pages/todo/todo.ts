import { Component } from '@angular/core';
import { DocumentReference } from '@firebase/firestore-types';
import { Calendar } from '@ionic-native/calendar';
import {
  Environment,
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
import { Subscription } from 'rxjs/Subscription';

import { IAuthor } from '../../model/author';
import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { Settings } from '../../model/settings';
import { ISimpleContact } from '../../model/simple-contact';
import { ITodoItem } from '../../model/todo-item';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { ContactServiceProvider } from './../../providers/contact-service/contact-service';
import { DBServiceProvider } from './../../providers/db/db-service';
import { MapServiceProvider } from './../../providers/map-service/map-service';
import { StorageServiceProvider } from './../../providers/storage-service/storage-service';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { Global } from './../../shared/global';

/**
 * Affiche un todo et les information qui y sont associé
 *
 * @export
 * @class TodoPage
 * @extends {GenericPage}
 */
@IonicPage()
@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage extends GenericPage {
  /***************************** PUBLIC FIELDS ******************************/
  /**
   * permet d'activer ou de désactiver la possibilité de compléter ou non la tâche le temps que la signature soit générée
   *
   * @protected
   * @type {boolean}
   * @memberof TodoPage
   */
  protected completeLoading: boolean;

  /**
   * objet todo de la page, sera mis à jour par subscription
   *
   * @protected
   * @type {ITodoItem}
   * @memberof TodoPage
   */
  protected todo: ITodoItem;

  /**
   * true si une entrée correspondant à cette tâche à été trouvé dans le calendrier natif
   *
   * @protected
   * @type {boolean}
   * @memberof TodoPage
   */
  protected isInCalendar: boolean;

  /**************************** PRIVATE FIELDS ******************************/

  /**
   * référence firestore vers ce document
   *
   * @private
   * @type {DocumentReference}
   * @memberof TodoPage
   */
  private todoRef: DocumentReference;

  /**
   * référence vers la liste ayant mené ce todo
   *
   * @private
   * @type {(string | null)}
   * @memberof TodoPage
   */
  private fromListUuid: string | null;

  /**
   * true si le todo était un externe de la liste de référence
   *
   * @private
   * @type {boolean}
   * @memberof TodoPage
   */
  private isExternal: boolean;

  /**
   * true si le todo est editable, false sinon
   *
   * @private
   * @type {boolean}
   * @memberof TodoPage
   */
  private editable: boolean;

  /**
   * Subscription aux mise à jour de ce todo
   *
   * @private
   * @type {Subscription}
   * @memberof TodoPage
   */
  private todoSub: Subscription;

  /**
   * true si l'utilisateur courrant à créer le todo
   *
   * @private
   * @type {boolean}
   * @memberof TodoPage
   */
  private isMine: boolean;

  /**
   * carte google map
   *
   * @private
   * @type {GoogleMap}
   * @memberof TodoPage
   */
  private map: GoogleMap;

  /**
   * marker google map de l'addresse de ce todo
   *
   * @private
   * @type {(Marker | null)}
   * @memberof TodoPage
   */
  private todoAddressMarker: Marker | null;

  /**
   * marker googleMap de la position de création
   *
   * @private
   * @type {(Marker | null)}
   * @memberof TodoPage
   */
  private todoAuthorMapMarker: Marker | null;

  /**
   * marker googleMap de la position de complétion
   *
   * @private
   * @type {(Marker | null)}
   * @memberof TodoPage
   */
  private todoCompleteAuthorMapMarker: Marker | null;

  /**
   * subscription au mapMarker de l'addresse du todo
   *
   * @private
   * @type {(Subscription | null)}
   * @memberof TodoPage
   */
  private todoAddressMarkerSub: Subscription | null;

  /**
   * subscription au mapMarker de la position de création
   *
   * @private
   * @type {(Subscription | null)}
   * @memberof TodoPage
   */
  private todoAuthorMapMarkerSub: Subscription | null;

  /**
   * subscription au mapMarker de la position de complétion
   *
   * @private
   * @type {(Subscription | null)}
   * @memberof TodoPage
   */
  private todoCompleteAuthorMapMarkerSub: Subscription | null;

  /**
   * true si la map googleMap et chargé et ready, false sinon
   *
   * @private
   * @type {boolean}
   * @memberof TodoPage
   */
  private mapLoaded: boolean;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of TodoPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {NavParams} navParams
   * @param {TodoServiceProvider} todoCtrl
   * @param {PhotoViewer} photoCtrl
   * @param {ChangeDetectorRef} changeCtrl
   * @param {Calendar} calendarCtrl
   * @param {ContactServiceProvider} contactCtrl
   * @param {StorageServiceProvider} storageCtrl
   * @param {MapServiceProvider} mapCtrl
   * @param {DBServiceProvider} dbCtrl
   * @memberof TodoPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly todoCtrl: TodoServiceProvider,
    private readonly photoCtrl: PhotoViewer,
    private readonly calendarCtrl: Calendar,
    private readonly contactCtrl: ContactServiceProvider,
    private readonly storageCtrl: StorageServiceProvider,
    private readonly mapCtrl: MapServiceProvider,
    private readonly dbCtrl: DBServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.todoRef = this.navParams.get('todoRef');
    this.fromListUuid = this.navParams.get('listUuid');
    this.mapLoaded = false;
    this.todoAddressMarker = null;
    this.todoAuthorMapMarker = null;
    this.todoCompleteAuthorMapMarker = null;
    if (this.navParams.get('isExternal') == null) {
      this.isExternal = false;
    } else {
      if (this.fromListUuid != null) {
        this.editable = !this.todoCtrl.isReadOnly(this.fromListUuid);
      }
      this.isExternal = this.navParams.get('isExternal');
    }
    this.construct();
  }

  /**
   * a chaque nouveau todo, reset les constante de la page (lié à un todo)
   *
   * @private
   * @memberof TodoPage
   */
  private construct(): void {
    this.editable = true;
    this.completeLoading = false;
    this.isMine = false;
    this.isInCalendar = false;
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

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
    this.genericInitView();
  }

  /**
   * Override la detection de changement d'angular (sinon on spin-loop sur les date :/)
   * pour n'effectuer une detection des changemenents que toutes les 3s.
   * Attends quand même 1 seconde avant de le faire pour laisser l'initialisation normal se faire...
   *
   * @memberof TodoPage
   */
  ionViewDidEnter(): void {
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
    this.evtCtrl.resetContext();
  }

  /**
   * termine la map google map lors de la destruction de l'objet
   *
   * @memberof TodoPage
   */
  ionViewWillUnload(): void {
    super.ionViewWillUnload();
    this.tryUnSub(this.todoAddressMarkerSub);
    this.tryUnSub(this.todoAuthorMapMarkerSub);
    this.tryUnSub(this.todoCompleteAuthorMapMarkerSub);
    if (this.map != null) {
      this.map.removeEventListener();
      this.map.empty();
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * initialise la vue, le header etc.
   *
   * @private
   * @memberof TodoPage
   */
  private genericInitView(): void {
    const pageData = Global.getEditCopyPageData();
    pageData.editable = this.editable;
    pageData.subtitle = 'Détail de la tâche';
    this.initPage(pageData);
  }

  /**
   * défini si la tâche à été créer par l'utilisateur courrant ou non
   *
   * @private
   * @param {ITodoItem} todo
   * @memberof TodoPage
   */
  private defIsMine(todo: ITodoItem): void {
    const id = this.authCtrl.getUserId();
    if (id == null || todo == null || todo.author == null || todo.author.uuid == null) {
      this.isMine = false;
    } else {
      this.isMine = todo.author.uuid === id;
    }
  }

  /**
   * initialise la page avec le flux d'information de la tâche
   *
   * @private
   * @param {IPageData} pageData
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async initPage(pageData: IPageData): Promise<void> {
    this.todoSub = this.todoCtrl.getTodo(this.todoRef).subscribe((todo: ITodoItem) => {
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
        this.evtCtrl.setCurrentContext(false, todo.uuid);
      } else {
        this.evtCtrl.resetContext();
        this.navCtrl.popToRoot();
        this.uiCtrl.displayToast('Une erreur est survenue');
      }
    });
  }

  /**
   * méthode permettant de supprimer le todo et éventuellement de demander confirmation à l'utilisateur
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async deleteTodo(): Promise<void> {
    const unsure_mode: boolean = await this.dbCtrl.getSetting(Settings.ENABLE_UNSURE_MODE);
    let confirm: boolean = true;

    if (unsure_mode) {
      const title = 'Suppression de la tâche ' + this.todo.name;
      const message = 'Voulez vous supprimer la tâche ' + this.todo.name;
      confirm = await this.uiCtrl.confirm(title, message);
    }

    if (confirm) {
      if (this.fromListUuid != null && this.isExternal && !this.isMine) {
        this.todoCtrl.removeTodoRef(this.fromListUuid, this.todoRef);
      } else {
        if (this.todo.uuid != null) {
          this.todoCtrl.deleteTodo(this.todoRef, this.todo.uuid);
        }
      }
      this.navCtrl.pop();
    }
  }

  /********************************** MAP ***********************************/

  /**
   * retourne, si possible une position de départ pour la carte
   * dans l'ordre de priorité : l'addresse du todo, le position de la personne, la position de création puis de complétion du todo
   * Si aucune position n'est disponible, alors retourne null
   *
   * @private
   * @returns {(Promise<GoogleMapOptions | null>)}
   * @memberof TodoPage
   */
  private async getStartOpts(): Promise<GoogleMapOptions | null> {
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

    if (todoAddress != null) {
      return {
        camera: {
          target: todoAddress,
          zoom: 40,
          tilt: 30
        }
      };
    }

    if (myPos != null) {
      return {
        camera: {
          target: myPos,
          zoom: 40,
          tilt: 30
        }
      };
    }

    if (this.todo.author != null && this.todo.author.coord != null) {
      return {
        camera: {
          target: Global.getILatLng(this.todo.author.coord),
          zoom: 40,
          tilt: 30
        }
      };
    }

    if (this.todo.completeAuthor != null && this.todo.completeAuthor.coord != null) {
      return {
        camera: {
          target: Global.getILatLng(this.todo.completeAuthor.coord),
          zoom: 40,
          tilt: 30
        }
      };
    }

    return null;
  }

  /**
   * lors de chaque mise à jour, recentre la camera pour voir l'ensemble des maps marker représentés
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async animateCamera(): Promise<void> {
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
    if (this.todo.address == null || this.todo.address === '') {
      if (this.todoAddressMarker != null) {
        try {
          this.todoAddressMarker.removeEventListener();
          this.todoAddressMarker.remove();
          this.todoAddressMarker.destroy();
        } catch (error) {}
        this.todoAddressMarker = null;
      }
      return;
    }

    let latlnt: ILatLng;
    try {
      latlnt = await this.mapCtrl.AddressToCoord(this.todo.address);
    } catch (error) {
      return;
    }

    if (this.todoAddressMarker != null) {
      this.todoAddressMarker.setPosition(latlnt);
      this.todoAddressMarker.setTitle(this.todo.address);
    } else {
      this.todoAddressMarker = await this.map.addMarker({
        title: this.todo.address,
        icon: 'blue',
        animation: 'DROP',
        position: latlnt
      });

      if (this.todoAddressMarker == null) {
        return;
      }

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
      if (this.todoAuthorMapMarker != null) {
        try {
          this.todoAuthorMapMarker.removeEventListener();
          this.todoAuthorMapMarker.remove();
          this.todoAuthorMapMarker.destroy();
        } catch (error) {}
        this.todoAuthorMapMarker = null;
      }
      return;
    }
    const latlnt = Global.getILatLng(this.todo.author.coord);

    if (this.todoAuthorMapMarker != null) {
      this.todoAuthorMapMarker.setPosition(latlnt);
    } else {
      this.todoAuthorMapMarker = await this.map.addMarker({
        title: 'Création de la tâche',
        icon: 'green',
        animation: 'DROP',
        position: latlnt
      });

      if (this.todoAuthorMapMarker == null) {
        return;
      }
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
      if (this.todoCompleteAuthorMapMarker != null) {
        try {
          this.todoCompleteAuthorMapMarker.removeEventListener();
          this.todoCompleteAuthorMapMarker.remove();
          this.todoCompleteAuthorMapMarker.destroy();
        } catch (error) {}
        this.todoCompleteAuthorMapMarker = null;
      }
      return;
    }
    const latlnt = Global.getILatLng(this.todo.completeAuthor.coord);

    if (this.todoCompleteAuthorMapMarker != null) {
      this.todoCompleteAuthorMapMarker.setPosition(latlnt);
    } else {
      this.todoCompleteAuthorMapMarker = await this.map.addMarker({
        title: 'Complétion de la tâche',
        icon: 'red',
        animation: 'DROP',
        position: latlnt
      });

      if (this.todoCompleteAuthorMapMarker == null) {
        return;
      }

      this.todoCompleteAuthorMapMarkerSub = this.todoCompleteAuthorMapMarker
        .on(GoogleMapsEvent.MARKER_CLICK)
        .subscribe(() => {
          let name = 'un anonyme';
          if (
            this.todo.completeAuthor != null &&
            this.todo.completeAuthor.displayName != null
          ) {
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
  }

  /**
   * tente de charger une map GoogleMap si celle si n'est pas déjà chargée
   * Si aucune donnée n'est disponible pour afficher la carte, alors n'affiche pas de carte
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async loadMap(): Promise<void> {
    if (this.mapLoaded) {
      return;
    }

    const mapOptions = await this.getStartOpts();
    if (mapOptions == null) {
      return;
    }
    mapOptions.preferences = { building: true };

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
   * supprime et recréer tout les map marker
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async resetMarker(): Promise<void> {
    if (!this.mapLoaded) {
      return;
    }
    try {
      this.animateCamera();
      this.addAddressMarker();
      this.addCreateMarker();
      this.addCompleteMarker();
    } catch (error) {
      console.log(error);
    }
  }

  /******************************* CALENDRIER ********************************/

  /**
   * retourne une date lislble à partir d'un objet d'authoring
   *
   * @private
   * @param {(IAuthor | null)} anAuthor
   * @returns {string}
   * @memberof TodoPage
   */
  private getDate(anAuthor: IAuthor | null): string {
    if (anAuthor == null || anAuthor.timestamp == null) {
      return 'Non définie';
    }
    return moment(anAuthor.timestamp)
      .locale('fr')
      .format('ddd D MMM YYYY, HH:mm');
  }

  /**
   * vérifie et si besoin demande à l'utilisateur de pouvoir accéder à son calendrier natif
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async askForCalendarPerms(): Promise<void> {
    if (!await this.calendarCtrl.hasReadWritePermission()) {
      try {
        this.calendarCtrl.requestReadWritePermission();
      } catch (error) {
        this.uiCtrl.displayToast('Les fonctionalités lié au calendrier sont désactivée');
      }
    }
  }

  /**
   * méthode permettant de définir si un todo existe dans le calendrier natif du téléphone.
   * L'entrée ou le todo ne doivent pas avoir été modifié depuis leur création...
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
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

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * met à jour le status de la tâche
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  protected async updateComplete(): Promise<void> {
    this.completeLoading = true;
    await this.todoCtrl.complete(this.todo);
    this.completeLoading = false;
  }

  /**
   * retourne une date lisible par un humain
   *
   * @protected
   * @param {Date} d
   * @returns {string}
   * @memberof TodoPage
   */
  protected getHuman(d: Date): string {
    if (d == null) {
      return 'Non définie';
    }
    return moment(d)
      .locale('fr')
      .format('ddd D MMM YYYY');
  }

  /**
   * demande d'ouvrir la messagerie SMS pour préparer un sms à un contact
   *
   * @protected
   * @param {ISimpleContact} contact
   * @returns {void}
   * @memberof TodoPage
   */
  protected openSMS(contact: ISimpleContact): void {
    if (contact == null) {
      return;
    }
    this.contactCtrl.openNativeSMS(contact);
  }

  /**
   * demande d'ouvrir le téléphone natif pour appeler un contact
   *
   * @protected
   * @param {ISimpleContact} contact
   * @returns {void}
   * @memberof TodoPage
   */
  protected call(contact: ISimpleContact): void {
    if (contact == null) {
      return;
    }
    this.contactCtrl.call(contact);
  }

  /**
   * demande d'ouvrir la messagerie native pour envoyer un mail à un contact
   *
   * @protected
   * @param {ISimpleContact} contact
   * @returns {void}
   * @memberof TodoPage
   */
  protected openEmail(contact: ISimpleContact): void {
    if (contact == null) {
      return;
    }
    this.contactCtrl.prepareEmail(contact);
  }

  /**
   * méthode permettant d'afficher une photo à partir de son uri
   *
   * @protected
   * @param {string} uri
   * @returns {void}
   * @memberof TodoPage
   */
  protected showPhoto(uri: string): void {
    if (uri == null) {
      return;
    }
    this.photoCtrl.show(uri);
  }

  /**
   * méthode permettant d'ouvrire le calendrier natif pour y ajouter la tâche
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
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

  /**
   * ouvre le calendrier natif à la page de la deadline du todo ou d'aujourd'hui
   *
   * @protected
   * @memberof TodoPage
   */
  protected openCalendar(): void {
    if (this.todo.deadline == null) {
      this.calendarCtrl.openCalendar(new Date());
    } else {
      this.calendarCtrl.openCalendar(this.todo.deadline);
    }
  }

  /**
   * méthode permettant de supprimer l'entrée associé à cette tâche du calendrier natif de l'utilisateur
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
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

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @protected
   * @param {IMenuRequest} req
   * @memberof TodoPage
   */
  protected menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
      case MenuRequestType.DELETE: {
        this.deleteTodo();
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
      case MenuRequestType.VIEW: {
        if (req.ref != null && req.uuid != null) {
          this.todoRef = req.ref;
          this.fromListUuid = req.uuid;
          this.isExternal = false;
          this.construct();
          this.tryUnSub(this.todoSub);
          this.genericInitView();
        }
        break;
      }
    }
  }

  /**
   * Permet de générer une description de la page, notament pour la synthèse vocale
   *
   * @override
   * @protected
   * @returns {string} une description textuelle de la page
   * @memberof TodoPage
   */
  protected generateDescription(): string {
    let description: string = '';
    description = ' Détails de la tâche ' + this.todo.name + ' . ';

    if (this.todo.desc != null) {
      description += ' Description de la tâche : ' + this.todo.desc + ' . ';
    }

    if (this.deadlineStr !== 'Non définie') {
      description += ' La tâche doit être réalisée avant le ' + this.deadlineStr + ' . ';
    }

    if (this.remainingDeadlineStr !== 'Non définie') {
      description += 'La tâche doit être terminée ' + this.remainingDeadlineStr + ' . ';
    }

    if (this.notifStr !== 'Non définie') {
      description += 'La notification est prévue pour le ' + this.notifStr + ' . ';
    }

    if (this.todo.address != null) {
      description += 'La tâche à lieu à ' + this.todo.address + ' . ';
    }

    return description;
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**
   * retourne la datetime lislble de deadline de la tâche
   *
   * @protected
   * @readonly
   * @type {string}
   * @memberof TodoPage
   */
  protected get deadlineStr(): string {
    if (this.todo.deadline == null) {
      return 'Non définie';
    }
    return moment(this.todo.deadline)
      .locale('fr')
      .format('ddd D MMM YYYY, HH:mm');
  }

  /**
   * retourne la datetime de notification lisible de la tâche
   *
   * @protected
   * @readonly
   * @type {string}
   * @memberof TodoPage
   */
  protected get notifStr(): string {
    if (this.todo.notif == null) {
      return 'Non définie';
    }
    return moment(this.todo.notif)
      .locale('fr')
      .format('ddd D MMM YYYY, HH:mm');
  }

  /**
   * retourne le temps restant d'une date, dans un format lisible par un humain
   *
   * @protected
   * @readonly
   * @type {string}
   * @memberof TodoPage
   */
  protected get remainingDeadlineStr(): string {
    if (this.todo.deadline == null) {
      return 'Non définie';
    }
    return moment(this.todo.deadline)
      .locale('fr')
      .fromNow();
  }
}
