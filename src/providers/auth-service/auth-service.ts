import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { User } from 'firebase/app';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class AuthServiceProvider {
  private userProfile: User;
  private useHorsConnexion = false;
  private connexionSubject: BehaviorSubject<boolean>;

  constructor(
    private firebaseAuth: AngularFireAuth,
    private devideIdCtrl: UniqueDeviceID
  ) {
    this.connexionSubject = new BehaviorSubject<boolean>(false);
    this.listenForUpdate();
  }

  private listenForUpdate(): void {
    firebase.auth().onAuthStateChanged(user => {
      if (user != null && user.uid != null) {
        this.userProfile = user;
        this.connexionSubject.next(true);
      } else {
        this.userProfile = null;
        this.connexionSubject.next(false);
      }
    });
  }

  public getUserId(): Promise<any> {
    return this.userProfile.getToken();
  }

  public getMachineId(): Promise<any> {
    return this.devideIdCtrl.get();
  }

  public logout() {
    firebase.auth().signOut();
  }

  public getConnexionSubject(): BehaviorSubject<boolean> {
    return this.connexionSubject;
  }
}
