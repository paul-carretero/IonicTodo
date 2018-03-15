import { Injectable } from '@angular/core';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { AngularFireAuth } from 'angularfire2/auth';
import { User } from 'firebase/app';
import { BehaviorSubject } from 'rxjs';

import { Settings } from './../../model/settings';
import { SettingServiceProvider } from './../setting/setting-service';

@Injectable()
export class AuthServiceProvider {
  private useHorsConnexion = false;
  private readonly connexionSubject: BehaviorSubject<User>;

  constructor(
    private readonly firebaseAuth: AngularFireAuth,
    private readonly devideIdCtrl: UniqueDeviceID,
    private readonly settingCtrl: SettingServiceProvider
  ) {
    this.connexionSubject = new BehaviorSubject<User>(null);
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

  public getUser(): User {
    return this.connexionSubject.getValue();
  }

  public getDisplayName(): string {
    if (!this.isConnected()) {
      throw new Error('Utilisateur non connecté');
    }

    if (this.firebaseAuth.auth.currentUser.displayName != null) {
      return this.firebaseAuth.auth.currentUser.displayName;
    }
    return this.firebaseAuth.auth.currentUser.email;
  }

  public getEmail(): string {
    if (!this.isConnected()) {
      throw new Error('Utilisateur non connecté');
    }
    return this.firebaseAuth.auth.currentUser.email;
  }
}
