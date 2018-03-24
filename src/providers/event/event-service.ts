import { Injectable } from '@angular/core';
import { DocumentReference } from '@firebase/firestore-types';
import { Network } from '@ionic-native/network';
import { Shake } from '@ionic-native/shake';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { IPageData } from '../../model/page-data';
import { UiServiceProvider } from '../ui-service/ui-service';
import { INavRequest } from './../../model/nav-request';
import { Global } from './../../shared/global';
import { AuthServiceProvider } from './../auth-service/auth-service';

/**
 * Après analyse, il a été préférer d'implémenter une classe d'Event plutôt que d'utiliser le service Ionic native Events
 * Pro : typé, plus modulable
 *
 * @export
 * @class EventServiceProvider
 */
@Injectable()
export class EventServiceProvider {
  /**
   * Flux des mises à jour de l'affichage du header
   *
   * @readonly
   * @private
   * @type {BehaviorSubject<IPageData>}
   * @memberof EventServiceProvider
   */
  private readonly headerData: IPageData;

  /**
   * Reference vers un todo que l'utilisateur à copier
   *
   * @private
   * @type {DocumentReference}
   * @memberof EventServiceProvider
   */
  private copiedTodoRef: DocumentReference | null;

  /**
   * Flux des commandes menu de l'utilisateur pour les pages intéressées
   *
   * @readonly
   * @private
   * @type {Subject<IMenuRequest>}
   * @memberof EventServiceProvider
   */
  private readonly menuRequestSubject: Subject<IMenuRequest>;

  /**
   * Flux de commande de navigation, typiquement du menu de gauche
   *
   * @readonly
   * @private
   * @type {Subject<INavRequest>}
   * @memberof EventServiceProvider
   */
  private readonly navRequestSubject: Subject<INavRequest>;

  /**
   * Flux de commande de recherche, typiquement de la searchbar
   *
   * @readonly
   * @private
   * @type {Subject<string>}
   * @memberof EventServiceProvider
   */
  private readonly searchSubject: BehaviorSubject<string>;

  /**
   * True si on dispose d'une connexion aux intertubes, faux sinon
   *
   * @readonly
   * @private
   * @type {boolean}
   * @memberof EventServiceProvider
   */
  private readonly netSubject: BehaviorSubject<boolean>;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of EventServiceProvider.
   * @param {Shake} shakeCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {Network} netCtrl
   * @memberof EventServiceProvider
   */
  constructor(
    private readonly shakeCtrl: Shake,
    private readonly authCtrl: AuthServiceProvider,
    private readonly netCtrl: Network,
    private readonly uiCtrl: UiServiceProvider
  ) {
    this.authCtrl.registerEvtCtrl(this);
    this.headerData = Global.getDefaultPageData();
    this.menuRequestSubject = new Subject<IMenuRequest>();
    this.navRequestSubject = new Subject<INavRequest>();
    this.searchSubject = new BehaviorSubject<string>('#');
    this.netSubject = new BehaviorSubject<boolean>(this.netCtrl.type !== 'none');
    this.shakeDetect();
    this.listenForResetAuth();
    this.listenForNetworkChange();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  private listenForNetworkChange(): void {
    this.netCtrl.onConnect().subscribe(() => {
      if (!this.netSubject.getValue()) {
        this.netSubject.next(true);
        this.uiCtrl.displayToast(
          'vous êtes maintenant connecté aux intertubes en "' +
            this.netCtrl.type +
            '". Certaines fonctionalités sont de nouveau disponibles!'
        );
      }
    });
    this.netCtrl.onDisconnect().subscribe(() => {
      if (this.netSubject.getValue()) {
        this.netSubject.next(false);
        this.uiCtrl.displayToast(
          "vous n'êtes plus connecté aux intertubes, certaines fonctionalités sont désactivées :/"
        );
      }
    });
  }

  /**
   * réinitialise la référence d'un document copier lors de chaque déconnexion
   * réinitialise la dernière snapshot des todos lors d'une déconnexion
   *
   * @private
   * @memberof EventServiceProvider
   */
  private listenForResetAuth() {
    this.authCtrl.getConnexionSubject().subscribe(user => {
      if (user == null) {
        this.copiedTodoRef = null;
      }
    });
  }

  /**
   * Ecoute les agiation du téléphone et envoie un évenemnt si l'un est detecté
   *
   * @private
   * @memberof EventServiceProvider
   */
  private shakeDetect(): void {
    this.shakeCtrl.startWatch(50).subscribe(() => {
      this.menuRequestSubject.next({ request: MenuRequestType.SHAKE });
    });
  }

  /**************************************************************************/
  /************************ METHODES PUBLIQUE/GETTER ************************/
  /**************************************************************************/

  /**
   * retourne un observable sur status de la connexion (true si online, false sinon)
   *
   * @public
   * @returns {Observable<boolean>}
   * @memberof EventServiceProvider
   */
  public getNetStatusObs(): Observable<boolean> {
    return this.netSubject.asObservable();
  }

  /**
   * Donne le status de la connexion instantané
   *
   * @returns {boolean}
   * @memberof EventServiceProvider
   */
  public getNetStatus(): boolean {
    return this.netSubject.getValue();
  }

  /**
   * retourne la référence vers le dernier todo copié
   *
   * @public
   * @returns {DocumentReference | null}
   * @memberof EventServiceProvider
   */
  public getCopiedTodoRef(): DocumentReference | null {
    return this.copiedTodoRef;
  }

  /**
   * défini le todo en suspens d'être coller
   *
   * @public
   * @param {DocumentReference} ref
   * @memberof EventServiceProvider
   */
  public setCopiedTodoRef(ref: DocumentReference): void {
    this.copiedTodoRef = ref;
  }

  /**
   * retourne le header
   *
   * @public
   * @returns {IPageData}
   * @memberof EventServiceProvider
   */
  public getHeader(): IPageData {
    return this.headerData;
  }

  /**
   * permet de redéfinir les données du header
   *
   * @public
   * @param {IPageData} newHeader
   * @memberof EventServiceProvider
   */
  public setHeader(newHeader: IPageData): void {
    this.headerData.editable = newHeader.editable;
    this.headerData.importable = newHeader.importable;
    this.headerData.searchable = newHeader.searchable;
    this.headerData.searchPlaceholders = newHeader.searchPlaceholders;
    this.headerData.shareable = newHeader.shareable;
    this.headerData.subtitle = newHeader.subtitle;
    this.headerData.title = newHeader.title;
    this.headerData.validable = newHeader.validable;
    this.headerData.copiable = newHeader.copiable;
    this.headerData.pastable = newHeader.pastable;
    this.headerData.isList = newHeader.isList;
  }

  /**
   * retourne le sujet de requête menu utilisateur
   *
   * @public
   * @returns {Subject<IMenuRequest>}
   * @memberof EventServiceProvider
   */
  public getMenuRequestSubject(): Subject<IMenuRequest> {
    return this.menuRequestSubject;
  }

  /**
   * retourne le sujet requetes de navigation interne
   *
   * @public
   * @returns {Subject<INavRequest>}
   * @memberof EventServiceProvider
   */
  public getNavRequestSubject(): Subject<INavRequest> {
    return this.navRequestSubject;
  }

  /**
   * retourne le sujet de recherche utilisateur
   *
   * @public
   * @returns {Subject<string>}
   * @memberof EventServiceProvider
   */
  public getSearchSubject(): BehaviorSubject<string> {
    return this.searchSubject;
  }
}
