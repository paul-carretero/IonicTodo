import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';
import { Global } from './../../shared/global';
import { GenericPage } from './../../shared/generic-page';
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
import { EventServiceProvider } from '../../providers/event/event-service';
import { User } from '@firebase/auth-types';

@IonicPage()
@Component({
  selector: 'page-authentification',
  templateUrl: 'authentification.html'
})
export class AuthentificationPage extends GenericPage {
  private connSub: Subscription;
  public isConnected: Observable<boolean>;
  public email: string;
  public password: string;
  public userProfile: User;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider,
    private navParams: NavParams,
    private authCtrl: AuthServiceProvider,
    private googlePlus: GooglePlus
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl);
  }

  ionViewWillEnter() {
    this.authCtrl.getConnexionSubject().subscribe((user: User) => {
      this.userProfile = user;
    });

    if (!this.authCtrl.getConnexionSubject().getValue()) {
      this.connSub = this.authCtrl
        .getConnexionSubject()
        .subscribe((user: User) => {
          if (user != null) {
            this.navCtrl.parent.select(Global.HOMEPAGE);
          }
        });
    }
  }

  ionViewWillLeave() {
    if (this.connSub != null) {
      this.connSub.unsubscribe();
    }
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  async loginGooglePlus(): Promise<void> {
    try {
      this.showLoading('tentative de login...');
      const result = await this.googlePlus.login({
        webClientId: FirebaseCredentials.webClientId,
        offline: false
      });
      if (result) {
        const googleCredential = firebase.auth.GoogleAuthProvider.credential(
          result.idToken
        );
        firebase
          .auth()
          .signInWithCredential(googleCredential)
          .then((res: any) => {
            this.alert(
              'Connexion',
              'Connexion avec votre compte Google effectuée avec succès!'
            );
          });
      }
    } catch (err) {
      this.alert(
        'Erreur de connexion',
        'Connexion à votre compte Google impossible' + 'Message : <br/>' + err
      );
      this.loading.dismiss();
    }
  }

  async firebaseLogin(): Promise<void> {
    try {
      this.showLoading('tentative de login...');
      const result = await firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password);
      if (result) {
        this.alert(
          'Connexion',
          'Connexion avec votre compte effectuée avec succès!'
        );
      }
    } catch (err) {
      this.alert(
        'Erreur de connexion',
        'Connexion à votre compte impossible' + 'Message : <br/>' + err
      );
      this.loading.dismiss();
    }
  }

  async logout(): Promise<void> {
    this.showLoading('Déconnexion en cours');
    await firebase.auth().signOut();
    this.loading.dismiss();
  }

  async createCount(): Promise<void> {
    try {
      this.showLoading('création du compte...');
      const result = await firebase
        .auth()
        .createUserWithEmailAndPassword(this.email, this.password);
      if (result) {
        this.alert(
          'Connexion',
          'Création de votre compte effectuée avec succès!'
        );
        this.loading.dismiss();
        this.firebaseLogin();
      }
    } catch (err) {
      this.alert(
        'Erreur de connection',
        'Création de votre compte impossible' + 'Message : <br/>' + err
      );
      this.loading.dismiss();
    }
  }

  async offlineMode(): Promise<void> {
    await this.logout();
    this.authCtrl.allowOffline();
    this.navCtrl.parent.select(Global.HOMEPAGE);
  }
}
