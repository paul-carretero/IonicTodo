import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Injectable()
export class AuthServiceProvider {
  private userProfile: any;

  constructor(private firebaseAuth: AngularFireAuth) {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.userProfile = user;
        console.log('OMG SO GOOD OMG GOMG GOMGOMGOMGOMG');
      } else {
        this.userProfile = null;
      }
    });
  }

  get connexionStatus(): boolean {
    return this.firebaseAuth.auth.currentUser != null;
  }

  logout() {
    firebase.auth().signOut();
  }
}
