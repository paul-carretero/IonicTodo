import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@firebase/auth-types';
import { GooglePlus } from '@ionic-native/google-plus';
import * as firebase from 'firebase/app';
import {
  AlertController,
  IonicPage,
  LoadingController,
  NavController,
  ToastController
} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { FirebaseCredentials } from '../../app/firebase.credentials';
import { MenuRequest } from '../../model/menu-request';
import { EventServiceProvider } from '../../providers/event/event-service';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from './../../providers/speech-synth-service/speech-synth-service';
import { GenericPage } from './../../shared/generic-page';
import { Global } from './../../shared/global';
import { SettingServiceProvider } from '../../providers/setting/setting-service';
import { Settings } from '../../model/settings';

@IonicPage()
@Component({
  selector: 'page-authentification',
  templateUrl: 'authentification.html'
})
export class AuthentificationPage extends GenericPage {
  private connSub: Subscription;
  public isConnected: Observable<boolean>;
  public authForm: FormGroup;
  public userProfile: User;
  public offlineDisabled = true;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    public toastCtrl: ToastController,
    private authCtrl: AuthServiceProvider,
    private googlePlus: GooglePlus,
    private formBuilder: FormBuilder,
    private settingCtrl: SettingServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl);
    this.authForm = this.formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.required]
    });
  }

  /**
   * Gère les redirection automatique une fois connecté vers la page principale
   *
   * @memberof AuthentificationPage
   */
  ionViewDidEnter(): void {
    let notLogged = this.authCtrl.getConnexionSubject().getValue() == null;
    this.connSub = this.authCtrl
      .getConnexionSubject()
      .subscribe((user: User) => {
        this.userProfile = user;
        if (notLogged && user != null) {
          this.navCtrl.parent.select(Global.HOMEPAGE);
        }
        notLogged = user == null;
      });
    this.settingCtrl
      .getSetting(Settings.DISABLE_OFFLINE)
      .then((res: string) => {
        this.offlineDisabled = res === 'true';
      });
  }

  ionViewWillLeave(): void {
    if (this.connSub != null) {
      this.connSub.unsubscribe();
    }
  }

  get isEmailValid(): boolean {
    return this.authForm.get('email').valid;
  }

  get isOffline(): boolean {
    return this.authCtrl.isOffline();
  }

  public menuEventHandler(req: MenuRequest): void {}

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
            this.displayToast(
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
    const email: string = this.authForm.get('email').value;
    const password: string = this.authForm.get('password').value;

    try {
      this.showLoading('tentative de login...');
      const result = await firebase
        .auth()
        .signInWithEmailAndPassword(email, password);
      if (result) {
        this.displayToast('Connexion avec votre compte effectuée avec succès!');
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
    await this.authCtrl.logout();
    this.loading.dismiss();
  }

  async createCount(): Promise<void> {
    const email: string = this.authForm.get('email').value;
    const password: string = this.authForm.get('password').value;

    try {
      this.showLoading('création du compte...');
      const result = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password);
      if (result) {
        this.displayToast(
          'Création de votre compte effectuée avec succès!',
          1000
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
    this.displayToast(
      'Mode Hors Connexion activé: Certaines Fonctionalités ne seront pas disponible'
    );
    this.navCtrl.parent.select(Global.HOMEPAGE);
  }
}
