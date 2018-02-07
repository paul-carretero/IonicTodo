import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  Loading,
  LoadingController,
  AlertController
} from 'ionic-angular';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { HomePage } from '../home/home';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { GooglePlus } from '@ionic-native/google-plus';
import FirebaseGooglePlus from 'firebase';

/**
 * Generated class for the AuthentificationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-authentification',
  templateUrl: 'authentification.html'
})
export class AuthentificationPage {
  loading: Loading;

  /*constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public afAuth: AngularFireAuth
  ) {}*/

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private firebase: AngularFireAuth,
    private googlePlus: GooglePlus
  ) {
    /*FirebaseGooglePlus.auth().onAuthStateChanged(user => {
      if (user) {
        this.userProfile = user;
      } else {
        this.userProfile = null;
      }
    });*/
  }

  /*login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  logout() {
    this.afAuth.auth.signOut();
  }*/

  /*public createAccount() {
    this.nav.push('RegisterPage');
  }

  public login() {
    this.navCtrl.setRoot(HomePage);
    this.showLoading();
    /*this.auth.login(this.registerCredentials).subscribe(
      allowed => {
        if (allowed) {
          this.nav.setRoot('HomePage');
        } else {
          this.showError('Access Denied');
        }
      },
      error => {
        this.showError(error);
      }
    );
  }

  /*async asynclogin() {
    try {
      const result = await this.firebase.auth.signInWithEmailAndPassword(
        this.registerCredentials.email,
        this.registerCredentials.password
      );
      if (result) {
        this.navCtrl.setRoot(HomePage);
        console.log('good', result);
      }
    } catch (e) {
      console.error(e);
    }
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...',
      dismissOnPageChange: true
    });
    this.loading.present();
  }*/
}
