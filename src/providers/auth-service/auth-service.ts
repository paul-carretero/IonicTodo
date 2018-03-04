import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { Credential } from './../../model/credentials';
import { GooglePlus } from '@ionic-native/google-plus';
import { FirebaseCredentials } from '../../app/firebase.credentials';
import { AlertController } from 'ionic-angular';

@Injectable()
export class AuthServiceProvider {
  private userProfile: any;

  constructor(
    private firebaseAuth: AngularFireAuth,
    private googlePlus: GooglePlus,
    private alert: AlertController
  ) {
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
