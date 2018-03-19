import { Global } from './../../shared/global';
import { MapServiceProvider } from './../map-service/map-service';
import { IAuthor } from './../../model/author';
import { Injectable } from '@angular/core';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore } from 'angularfire2/firestore';
import * as firebase from 'firebase';
import { User } from 'firebase/app';
import { BehaviorSubject } from 'rxjs';

import { Settings } from './../../model/settings';
import { SettingServiceProvider } from './../setting/setting-service';
import { ILatLng } from '@ionic-native/google-maps';

@Injectable()
export class AuthServiceProvider {
  private useHorsConnexion = false;
  private readonly connexionSubject: BehaviorSubject<User | null>;

  constructor(
    private readonly firebaseAuth: AngularFireAuth,
    private readonly devideIdCtrl: UniqueDeviceID,
    private readonly settingCtrl: SettingServiceProvider,
    private readonly firestoreCtrl: AngularFirestore,
    private readonly mapCtrl: MapServiceProvider
  ) {
    this.connexionSubject = new BehaviorSubject<User | null>(null);
    this.applyAutoLoginSetting();
  }

  private async applyAutoLoginSetting(): Promise<void> {
    const autoLogin: string = await this.settingCtrl.getSetting(Settings.AUTO_LOG_IN);
    if (autoLogin === 'true') {
      this.listenForUpdate();
    } else {
      this.logout().then(() => {
        this.listenForUpdate();
      });
    }
  }

  private listenForUpdate(): void {
    this.firebaseAuth.auth.onAuthStateChanged(user => {
      this.useHorsConnexion = false;
      if (user != null && user.uid != null) {
        this.connexionSubject.next(user);
      } else {
        this.connexionSubject.next(null);
      }
    });
  }

  public getUserId(): string | null {
    const user = this.connexionSubject.getValue();
    if (user == null) {
      return null;
    }
    return user.uid;
  }

  public getMachineId(): Promise<string> {
    return this.devideIdCtrl.get();
  }

  public logout(): Promise<any> {
    this.useHorsConnexion = false;
    return this.firebaseAuth.auth.signOut();
  }

  public getConnexionSubject(): BehaviorSubject<User | null> {
    return this.connexionSubject;
  }

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

  public navAllowed(): boolean {
    return this.useHorsConnexion || this.isConnected();
  }

  public getUser(): User | null {
    return this.connexionSubject.getValue();
  }

  public getDisplayName(): string | null {
    if (!this.isConnected() || this.firebaseAuth.auth.currentUser == null) {
      throw new Error('Utilisateur non connecté');
    }

    if (this.firebaseAuth.auth.currentUser.displayName != null) {
      return this.firebaseAuth.auth.currentUser.displayName;
    }
    return this.firebaseAuth.auth.currentUser.email;
  }

  public getEmail(): string | null {
    if (!this.isConnected() || this.firebaseAuth.auth.currentUser == null) {
      throw new Error('Utilisateur non connecté');
    }
    return this.firebaseAuth.auth.currentUser.email;
  }

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
    if (!this.isConnected()) {
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
