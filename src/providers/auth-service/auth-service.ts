import { Settings } from './../../model/settings';
import { SettingServiceProvider } from './../setting/setting-service';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { User } from 'firebase/app';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { BehaviorSubject } from 'rxjs';
import { GooglePlus } from '@ionic-native/google-plus';
import { FirebaseCredentials } from '../../app/firebase.credentials';

@Injectable()
export class AuthServiceProvider {
  private useHorsConnexion = false;
  private connexionSubject: BehaviorSubject<User>;

  constructor(
    private firebaseAuth: AngularFireAuth,
    private devideIdCtrl: UniqueDeviceID,
    private setingCtrl: SettingServiceProvider,
    private googlePlus: GooglePlus
  ) {
    this.connexionSubject = new BehaviorSubject<User>(null);
    this.applyAutoLoginSetting();
  }

  private applyAutoLoginSetting(): void {
    this.setingCtrl.getSetting().then((setting: Settings) => {
      if (setting.autoLogIn) {
        this.listenForUpdate();
      } else {
        this.logout().then(() => {
          this.listenForUpdate();
        });
      }
    });
  }

  private listenForUpdate(): void {
    this.firebaseAuth.auth.onAuthStateChanged(user => {
      if (user != null && user.uid != null) {
        this.connexionSubject.next(user);
      } else {
        this.connexionSubject.next(null);
      }
    });
  }

  public getUserId(): string {
    return this.connexionSubject.getValue().uid;
  }

  public getMachineId(): Promise<any> {
    return this.devideIdCtrl.get();
  }

  public logout(): Promise<any> {
    this.useHorsConnexion = false;
    return this.firebaseAuth.auth.signOut();
  }

  public getConnexionSubject(): BehaviorSubject<User> {
    return this.connexionSubject;
  }

  public isConnected(): boolean {
    return this.connexionSubject.getValue() != null;
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
   * permet de récupéré le flag pour savoir si on peut utiliser la machine hors connexion (local seulement)
   *
   * @returns {boolean} true si l'utilisateur à autoriser l'utilisation hors connexion
   * @memberof AuthServiceProvider
   */
  public getOfflineStatus(): boolean {
    return this.useHorsConnexion;
  }
}
