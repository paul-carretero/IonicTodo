import { ISimpleWeather } from './../../model/weather';
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

  /**
   * météo éventuelle de l'addresse du todo
   *
   * @protected
   * @type {ISimpleWeather}
   * @memberof TodoPage
   */
  protected meteo: ISimpleWeather | null;

  /**
   * tableau des prévision (un seul appel suffit)
   *
   * @protected
   * @type {(ISimpleWeather[] | null)}
   * @memberof TodoPage
   */
  protected meteos: ISimpleWeather[] | null;

  /**************************** PRIVATE FIELDS ******************************/

  /**
   * référence firestore vers ce document
   *
   * @readonly
   * @private
   * @type {DocumentReference}
   * @memberof TodoPage
   */
  private todoRef: DocumentReference;

  /**
   * référence vers la liste ayant mené ce todo
   *
   * @readonly
   * @private
   * @type {(string | null)}
   * @memberof TodoPage
   */
  private fromListUuid: string | null;

  /**
   * true si le todo était un externe de la liste de référence
   *
   * @readonly
   * @private
   * @type {boolean}
   * @memberof TodoPage
   */
  private isExternal: boolean;

  /**
   * true si le todo est editable, false sinon
   *
   * @readonly
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

    if (this.navParams.get('isExternal') == null) {
      this.isExternal = false;
    } else {
      this.isExternal = this.navParams.get('isExternal');
    }
    this.construct();
  }

  /**
   * a chaque affichage de la page reset les paramètres de la map
   *
   * @private
   * @memberof TodoPage
   */
  private resetMap(): void {
    this.mapLoaded = false;
    this.todoAddressMarker = null;
    this.todoAuthorMapMarker = null;
    this.todoCompleteAuthorMapMarker = null;
  }

  /**
   * reset les constantes du todo
   *
   * @private
   * @memberof TodoPage
   */
  private construct(): void {
    this.editable = true;
    this.completeLoading = false;
    this.isMine = false;
    this.isInCalendar = false;
    if (this.fromListUuid != null) {
      this.editable = !this.todoCtrl.isReadOnly(this.fromListUuid);
    }
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
    this.resetMap();
    if (this.todoRef == null) {
      this.navCtrl.popToRoot();
      this.uiCtrl.displayToast('Une erreur est survenue pendant le chargement de la tâche');
    }
    this.genericInitView();
    this.askForCalendarPerms();
    Environment.setBackgroundColor('lightgrey');
  }

  /**
   * réinitialise le détecteur de changement en mode normal et termine le contexte du todo
   *
   * @memberof TodoPage
   */
  ionViewWillLeave(): void {
    super.ionViewWillLeave();
    this.tryUnSub(this.todoSub);
    this.evtCtrl.resetContext();
    this.tryUnSub(this.todoAddressMarkerSub);
    this.tryUnSub(this.todoAuthorMapMarkerSub);
    this.tryUnSub(this.todoCompleteAuthorMapMarkerSub);
    if (this.map != null) {
      this.map.destroy();
      this.map.clear();
      this.map.remove();
      this.resetMap();
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
        this.hasBeenRemoved(false);
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
          this.todoCtrl.deleteTodo(this.todo);
        }
      }
      this.navCtrl.pop();
    }
  }

  /********************************* METEO **********************************/

  private async updateWeather(coords: ILatLng | null): Promise<void> {
    if (coords == null) {
      this.meteo = null;
      this.meteos = null;
    } else {
      this.meteos = await this.mapCtrl.getWeatherPerLatLng(coords);
      if (this.meteos != null && this.meteos.length > 0) {
        this.meteo = this.meteos[0];
      } else {
        this.meteo = null;
      }
    }
  }

  /********************************** MAP ***********************************/

  /**
   * retourne, si possible une position de départ pour la carte
   * dans l'ordre de priorité : l'addresse du todo, le position de la personne, la position de création puis de complétion du todo
   * Si aucune position n'est disponible, alors retourne une position par défault
   *
   * @private
   * @returns {(Promise<GoogleMapOptions | null>)}
   * @memberof TodoPage
   */
  private async getStartOpts(): Promise<GoogleMapOptions> {
    const myPosP: Promise<ILatLng | null> = this.mapCtrl.getMyPosition();
    let todoAddress: null | ILatLng = null;
    if (this.todo.address != null) {
      try {
        todoAddress = await this.mapCtrl.AddressToCoord(this.todo.address);
      } catch (error) {}
    }

    const myPos = await myPosP;
    const res = {
      camera: {
        target: todoAddress,
        zoom: 10,
        tilt: 30
      }
    };

    if (todoAddress != null) {
      res.camera.target = todoAddress;
    } else if (myPos != null) {
      res.camera.target = myPos;
    } else if (this.todo.author != null && this.todo.author.coord != null) {
      res.camera.target = Global.getILatLng(this.todo.author.coord);
    } else if (this.todo.completeAuthor != null && this.todo.completeAuthor.coord != null) {
      res.camera.target = Global.getILatLng(this.todo.completeAuthor.coord);
    }

    return res;
  }

  /**
   * lors de chaque mise à jour, recentre la camera pour voir l'ensemble des maps marker représentés.
   * Met en plus à jour la météo comme on a besoin des latlng de l'addresse du todo
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private async animateCamera(): Promise<void> {
    const myPosP: Promise<ILatLng | null> = this.mapCtrl.getMyPosition();
    let todoAddress: null | ILatLng = null;
    if (this.todo.address != null && this.todo.address !== '') {
      try {
        todoAddress = await this.mapCtrl.AddressToCoord(this.todo.address);
      } catch (error) {
        console.log("impossible de convertir l'adresse en coordonnées");
      }
    }
    const myPos = await myPosP;

    this.updateWeather(todoAddress);

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

    if (bounds.length > 0) {
      const latlngBounds = new LatLngBounds(bounds);
      const opts = {
        target: latlngBounds,
        tilt: 30,
        duration: 500
      };

      if (this.mapLoaded) {
        this.map
          .animateCamera(opts)
          .catch(() => console.log("Impossible d'annimer la caméra, map toujours active ?"));
      }
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
          this.tryUnSub(this.todoAddressMarkerSub);
          this.todoAddressMarker.destroy();
          this.todoAddressMarker.remove();
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
      try {
        if (this.mapLoaded) {
          this.todoAddressMarker = await this.map.addMarker({
            title: this.todo.address,
            icon: 'blue',
            animation: 'DROP',
            position: latlnt
          });
        }
      } catch (error) {
        console.log("Impossible d'ajouter un marker à map, toujours active ?");
        return;
      }

      if (this.todoAddressMarker != null) {
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
          this.tryUnSub(this.todoAuthorMapMarkerSub);
          this.todoAuthorMapMarker.destroy();
          this.todoAuthorMapMarker.remove();
        } catch (error) {}
        this.todoAuthorMapMarker = null;
      }
      return;
    }
    const latlnt = Global.getILatLng(this.todo.author.coord);

    if (this.todoAuthorMapMarker != null) {
      this.todoAuthorMapMarker.setPosition(latlnt);
    } else {
      try {
        if (this.mapLoaded) {
          this.todoAuthorMapMarker = await this.map.addMarker({
            title: 'Création de la tâche',
            icon: 'green',
            animation: 'DROP',
            position: latlnt
          });
        }
      } catch (error) {
        console.log("Impossible d'ajouter un marker à map, toujours active ?");
        return;
      }

      if (this.todoAuthorMapMarker != null) {
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
          this.tryUnSub(this.todoCompleteAuthorMapMarkerSub);
          this.todoCompleteAuthorMapMarker.destroy();
          this.todoCompleteAuthorMapMarker.remove();
        } catch (error) {}
        this.todoCompleteAuthorMapMarker = null;
      }
      return;
    }
    const latlnt = Global.getILatLng(this.todo.completeAuthor.coord);

    if (this.todoCompleteAuthorMapMarker != null) {
      this.todoCompleteAuthorMapMarker.setPosition(latlnt);
    } else {
      try {
        if (this.mapLoaded) {
          this.todoCompleteAuthorMapMarker = await this.map.addMarker({
            title: 'Complétion de la tâche',
            icon: 'red',
            animation: 'DROP',
            position: latlnt,
            preferences: { building: true }
          });
        }
      } catch (error) {
        console.log("Impossible d'ajouter un marker à map, toujours active ?");
        return;
      }

      if (this.todoCompleteAuthorMapMarker != null) {
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
    if (!this.mapLoaded) {
      const mapOptions = await this.getStartOpts();
      this.map = GoogleMaps.create('mapwrapper', mapOptions);
      try {
        await this.map.one(GoogleMapsEvent.MAP_READY);
        this.map.setMyLocationEnabled(true);
        this.map.setMyLocationButtonEnabled(true);
        this.mapLoaded = true;
      } catch (error) {
        console.log('Une erreur est survenue durant la création de la map');
      }
    }
  }

  /**
   * supprime et recréer tout les map marker
   *
   * @private
   * @returns {Promise<void>}
   * @memberof TodoPage
   */
  private resetMarker(): void {
    if (this.mapLoaded) {
      try {
        this.animateCamera();
        this.addAddressMarker();
        this.addCreateMarker();
        this.addCompleteMarker();
      } catch (error) {
        console.log("Une erreur est survenue durant l'animation de la map");
      }
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

  /**
   * affiche si possible de modal de météo
   *
   * @protected
   * @memberof TodoPage
   */
  protected viewDetailWeathers(): void {
    if (this.meteos != null && this.meteos.length > 0) {
      this.uiCtrl.presentModal(this.meteos, 'MeteoModalPage');
    }
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

    if (this.todo.desc != null && this.todo.desc !== '') {
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

    if (this.todo.address != null && this.todo.address !== '') {
      description += 'La tâche à lieu à ' + this.todo.address + ' . ';
    }

    return description;
  }

  /**
   * @override
   * @protected
   * @returns {{ subtitle: string; messages: string[] }}
   * @memberof TodoPage
   */
  protected generateHelp(): { subtitle: string; messages: string[] } {
    return {
      subtitle: 'Aide sur les Tâches OhMyTask',
      messages: [
        'Cette page vous permet visualiser une tâche OhMyTask',
        'Il vous est possible de spécifier le status de la tache en cochant ou décochant le bouton situé à droite de son nom',
        'Si une deadline est spécifié alors celle ci sera afficher et cliquer dessus vous permettra de visualiser votre agenda de ce jour',
        'si une notification est prévue, alors vous recevrez une notification sur votre téléphone à la date indiqué sauf si la tâche est complété',
        'Si des photos sont disponibles alors leur titre et éventuelement leurs auteurs ainsi que leur lieux et dates de prise de vue sont affichés. Vous pouvez cliquer dessus pour les agrandir',
        'Si des contacts ont été associé à la tâche alors vous pouvez les faire glisser pour les appeler, leur envoyer un sms ou un email. Si spécifié et si il possède un numéro de mobile, alors il recevront un sms lors de la complétion de la tâche',
        "Vous avez la possibilité d'ajouter ou de retirer cette entrée de tâche dans votre calendrier. Attention pour pouvoir retirer la tâche du calendrier, celle ci ne doit pas avoit été modifier lors de la création",
        'Si un lieu a été associé à la tâche alors la météo de ce jour sera afficher en dessous, si vous le souhaitez vous pouvez voir les prévision à 5 jour en cliquant sur la barre de météo',
        "Une carte regroupant les différent point d'intérêt lié à cette tâche est disponible, cliquer sur un marqueur pour obtenir une description",
        "Si ces informations ont pûs être généré, vous pouvez visualiser l'auteur de la créatione de la complétion de la tâche ainsi que les jours et lieu où ces opérations ont été réalisées"
      ]
    };
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
