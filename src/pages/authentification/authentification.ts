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
import { FirebaseCredentials } from '../../app/firebase.credentials';

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
  private email: string;
  private password: string;
  private userProfile: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private firebase: AngularFireAuth,
    private googlePlus: GooglePlus,
    private alert: AlertController
  ) {
    FirebaseGooglePlus.auth().onAuthStateChanged(user => {
      if (user) {
        this.alert
          .create({
            title: 'Connection',
            subTitle: 'googleplus-connexion-success-message',
            buttons: ['Have fun']
          })
          .present();
        this.userProfile = user;
      } else {
        this.userProfile = null;
      }
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  loginGooglePlus(): void {
    this.googlePlus
      .login({
        webClientId: FirebaseCredentials.webClientId,
        offline: true
      })
      .then(res => {
        this.alert
          .create({
            title: 'Connection',
            subTitle: 'googleplus-connexion-success-message',
            buttons: ['Have fun']
          })
          .present();
      })
      .catch(err => {
        this.alert
          .create({
            title: 'Erreur de connection',
            subTitle:
              'googleplus-connexion-failed-message' + '\nMessage : ' + err,
            buttons: ['OK']
          })
          .present();
      });
  }

  async loginSample() {
    try {
      const result = await this.firebase.auth.signInWithEmailAndPassword(
        this.email,
        this.password
      );
      if (result) {
        this.alert
          .create({
            title: 'Connection',
            subTitle: 'sample-connexion-success-message',
            buttons: ['Have fun']
          })
          .present();
        this.navCtrl.setRoot(HomePage);
      }
    } catch (e) {
      this.alert
        .create({
          title: 'Erreur de connection',
          subTitle: 'sample-connexion-success-message' + '\nMessage : ' + e,
          buttons: ['OK']
        })
        .present();
    }
  }
}
