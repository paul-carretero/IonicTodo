import { Global } from './../../app/global';
import { Component } from '@angular/core';
import { GooglePlus } from '@ionic-native/google-plus';
import * as firebase from 'firebase/app';
import {
  AlertController,
  IonicPage,
  NavController,
  NavParams,
  Loading,
  LoadingController
} from 'ionic-angular';

import { FirebaseCredentials } from '../../app/firebase.credentials';
import { HomePage } from '../home/home';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { TabsPage } from '../tabs/tabs';

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
  private loading: Loading;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private authServiceProvider: AuthServiceProvider,
    private googlePlus: GooglePlus,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  async loginGooglePlus(): Promise<void> {
    try {
      this.showLoading();
      const result = await this.googlePlus.login({
        webClientId: FirebaseCredentials.webClientId,
        offline: true
      });
      if (result) {
        const googleCredential = firebase.auth.GoogleAuthProvider.credential(
          result.idToken
        );
        firebase.auth().signInWithCredential(googleCredential);
        this.alert(
          'Connexion',
          'Connexion avec votre compte Google effectuée avec succès!'
        );
        this.navCtrl.parent.select(Global.HOMEPAGE);
      }
    } catch (err) {
      this.alert(
        'Erreur de connexion',
        'Connexion à votre compte Google impossible' + 'Message : ' + err
      );
      this.loading.dismiss();
    }
  }

  async firebaseLogin(): Promise<void> {
    try {
      this.showLoading();
      const result = await firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password);
      if (result) {
        this.alert(
          'Connexion',
          'Connexion avec votre compte effectuée avec succès!'
        );
        this.navCtrl.parent.select(Global.HOMEPAGE);
      }
    } catch (err) {
      this.alert(
        'Erreur de connexion',
        'Connexion à votre compte impossible' + 'Message : ' + err
      );
      this.loading.dismiss();
    }
  }

  async createCount(): Promise<void> {
    try {
      this.showLoading();
      const result = await firebase
        .auth()
        .createUserWithEmailAndPassword(this.email, this.password);
      if (result) {
        this.alert(
          'Connexion',
          'Création de votre compte effectuée avec succès!'
        );
        this.loading.dismiss();
      }
    } catch (err) {
      this.alert(
        'Erreur de connection',
        'Création de votre compte impossible' + 'Message : ' + err
      );
      this.loading.dismiss();
    }
  }

  private alert(title: string, text: string) {
    this.alertCtrl
      .create({
        title: title,
        subTitle: text,
        buttons: ['OK']
      })
      .present();
  }

  private showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Chargement...',
      dismissOnPageChange: true
    });
    this.loading.present();
  }
}
