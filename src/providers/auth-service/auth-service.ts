import { Injectable } from '@angular/core';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore } from 'angularfire2/firestore';
import * as firebase from 'firebase';
import { User } from 'firebase/app';
import { BehaviorSubject } from 'rxjs';

import { IAuthor } from './../../model/author';
import { Settings } from './../../model/settings';
import { Global } from './../../shared/global';
import { EventServiceProvider } from './../event/event-service';
import { MapServiceProvider } from './../map-service/map-service';
import { DBServiceProvider } from './../db/db-service';
import { ILatLng } from '@ionic-native/google-maps';

/**
 * offre des méthodes pour les interaction avec l'authentification de l'utilisateur et ses données le concernant
 *
 * @export
 * @class AuthServiceProvider
 */
@Injectable()
export class AuthServiceProvider {
  /**
   * true si l'utilisateur navigue en mode non authentifié
   *
   * @private
   * @memberof AuthServiceProvider
   */
  private useHorsConnexion = false;

  /**
   * sujet des authentification et déconnexion de l'utilisateur (null si pas authentifié)
   *
   * @private
   * @type {(BehaviorSubject<User | null>)}
   * @memberof AuthServiceProvider
   */
  private readonly connexionSubject: BehaviorSubject<User | null>;

  /**
   * service gérant les évenement de l'application
   *
   * @private
   * @type {EventServiceProvider}
   * @memberof AuthServiceProvider
   */
  private evtCtrl: EventServiceProvider;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AuthServiceProvider.
   * @param {AngularFireAuth} fireAuthCtrl
   * @param {UniqueDeviceID} devideIdCtrl
   * @param {DBServiceProvider} settingCtrl
   * @param {AngularFirestore} firestoreCtrl
   * @param {MapServiceProvider} mapCtrl
   * @memberof AuthServiceProvider
   */
  constructor(
    private readonly fireAuthCtrl: AngularFireAuth,
    private readonly devideIdCtrl: UniqueDeviceID,
    private readonly settingCtrl: DBServiceProvider,
    private readonly firestoreCtrl: AngularFirestore,
    private readonly mapCtrl: MapServiceProvider
  ) {
    this.connexionSubject = new BehaviorSubject<User | null>(null);
    this.fireAuthCtrl.auth.useDeviceLanguage();
    this.fireAuthCtrl.auth.setPersistence('local');
  }

  /**
   * permet au service d'évenement de s'enregistrer au démarrage
   *
   * @param {EventServiceProvider} e
   * @memberof AuthServiceProvider
   */
  public registerEvtCtrl(e: EventServiceProvider): void {
    this.evtCtrl = e;
  }

  /**
   * au démarrage de l'application vérifie si le paramètre est sur une déconnexion automatique (dans ce cas se déconnecte tout de suite)
   *
   * @public
   * @returns {Promise<void>}
   * @memberof AuthServiceProvider
   */
  public async applyAutoLoginSetting(): Promise<void> {
    const autoLogin: boolean = await this.settingCtrl.getSetting(Settings.AUTO_LOG_IN);
    if (autoLogin) {
      this.listenForUpdate();
    } else {
      this.logout().then(() => {
        this.listenForUpdate();
      });
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * surveille les authentification de déconnexion et l'utilisateur et met à jour le sujet
   *
   * @private
   * @memberof AuthServiceProvider
   */
  private listenForUpdate(): void {
    this.fireAuthCtrl.auth.onAuthStateChanged(user => {
      this.useHorsConnexion = false;
      if (user != null && user.uid != null) {
        this.connexionSubject.next(user);
      } else {
        this.connexionSubject.next(null);
      }
    });
  }

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * retourne l'id de l'utilisateur ou null si il n'est pas connecté
   *
   * @returns {(string | null)}
   * @memberof AuthServiceProvider
   */
  public getUserId(): string | null {
    const user = this.connexionSubject.getValue();
    if (user == null) {
      return null;
    }
    return user.uid;
  }

  /**
   * retourne l'id unique de la machine courrante
   *
   * @returns {Promise<string>}
   * @memberof AuthServiceProvider
   */
  public getMachineId(): Promise<string> {
    return this.devideIdCtrl.get();
  }

  /**
   * met fin à une authentification de l'utilisateur
   *
   * @returns {Promise<any>}
   * @memberof AuthServiceProvider
   */
  public logout(): Promise<any> {
    this.useHorsConnexion = false;
    return this.fireAuthCtrl.auth.signOut();
  }

  /**
   * sujet des connexion - déconnexion de l'utilisateur
   *
   * @returns {(BehaviorSubject<User | null>)}
   * @memberof AuthServiceProvider
   */
  public getConnexionSubject(): BehaviorSubject<User | null> {
    return this.connexionSubject;
  }

  /**
   * retourne true si l'utilisateur est authentifié
   *
   * @returns {boolean}
   * @memberof AuthServiceProvider
   */
  public isConnected(): boolean {
    return this.connexionSubject.getValue() != null;
  }

  /**
   * permet de récupéré le flag pour savoir si on peut utiliser la machine hors connexion (local seulement)
   *
   * @returns {boolean} true si l'utilisateur à autoriser l'utilisation hors connexion
   * @memberof AuthServiceProvider
   */
  public isOffline(): boolean {
    return this.useHorsConnexion;
  }

  /**
   * Met à jour le flag pour autoriser l'utilisation de l'application hors connexion
   *
   * @memberof AuthServiceProvider
   */
  public allowOffline(): void {
    this.useHorsConnexion = true;
  }

  /**
   * retourne si l'utilisateur utilise le mode hors connexion ou s'est connecté
   *
   * @returns {boolean}
   * @memberof AuthServiceProvider
   */
  public navAllowed(): boolean {
    return this.useHorsConnexion || this.isConnected();
  }

  /**
   * retourne l'utilisateur firebase courrant ou null si pas connecté
   *
   * @returns {(User | null)}
   * @memberof AuthServiceProvider
   */
  public getUser(): User | null {
    return this.connexionSubject.getValue();
  }

  /**
   * retourne le nom de l'utilisateur courrant ou null si pas connecté
   *
   * @returns {(string | null)}
   * @memberof AuthServiceProvider
   */
  public getDisplayName(): string | null {
    if (!this.isConnected() || this.fireAuthCtrl.auth.currentUser == null) {
      throw new Error('Utilisateur non connecté');
    }

    if (this.fireAuthCtrl.auth.currentUser.displayName != null) {
      return this.fireAuthCtrl.auth.currentUser.displayName;
    }
    return this.fireAuthCtrl.auth.currentUser.email;
  }

  /**
   * retourne l'email utilisateur courrant ou null si pas connecté
   *
   * @returns {(string | null)}
   * @memberof AuthServiceProvider
   */
  public getEmail(): string | null {
    if (!this.isConnected() || this.fireAuthCtrl.auth.currentUser == null) {
      throw new Error('Utilisateur non connecté');
    }
    return this.fireAuthCtrl.auth.currentUser.email;
  }

  /**
   * retourne un timestamp du serveur firebase
   *
   * @returns {Promise<Date>}
   * @memberof AuthServiceProvider
   */
  public async getServerTimestamp(): Promise<Date> {
    const doc = this.firestoreCtrl.doc<{ timestamp: any }>('timestamp/ts');
    const sts = firebase.firestore.FieldValue.serverTimestamp();
    await doc.set({ timestamp: sts });
    const ref = await doc.ref.get();
    const ts = ref.get('timestamp');
    return new Date(ts);
  }

  /**
   * retourne une promise d'un IAuthor pour l'utilisateur courrant à l'emplacement courrant.
   * Permet génralement de signer des objets
   *
   * @param {boolean} roundUp précise si les coordonnées doivent être arrondie ou non
   * @returns {Promise<IAuthor>}
   * @memberof AuthServiceProvider
   */
  public async getAuthor(roundUp: boolean): Promise<IAuthor | null> {
    if (!this.isConnected() || !this.evtCtrl.getNetStatus()) {
      return null;
    }

    let myPos: ILatLng | null = await this.mapCtrl.getMyPosition();
    const ts: Date = await this.getServerTimestamp();

    if (myPos == null) {
      return {
        displayName: this.getDisplayName(),
        email: this.getEmail(),
        timestamp: ts,
        uuid: this.getUserId(),
        city: null,
        coord: null
      };
    }

    const myCity: string | null = await this.mapCtrl.getCity(myPos);
    if (roundUp) {
      myPos = Global.roundILatLng(myPos);
    }

    return {
      displayName: this.getDisplayName(),
      city: myCity,
      coord: Global.getGeoPoint(myPos),
      email: this.getEmail(),
      timestamp: ts,
      uuid: this.getUserId()
    };
  }
}
