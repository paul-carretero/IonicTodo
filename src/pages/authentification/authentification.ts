import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@firebase/auth-types';
import { GooglePlus } from '@ionic-native/google-plus';
import * as firebase from 'firebase/app';
import { IonicPage, NavController } from 'ionic-angular';
import moment from 'moment';
import { Subscription } from 'rxjs/Rx';

import { FirebaseCredentials } from '../../app/firebase.credentials';
import { Settings } from '../../model/settings';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SettingServiceProvider } from '../../providers/setting/setting-service';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { SpeechSynthServiceProvider } from './../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { GenericPage } from './../../shared/generic-page';
import { Global } from './../../shared/global';

@IonicPage()
@Component({
  selector: 'page-authentification',
  templateUrl: 'authentification.html'
})
export class AuthentificationPage extends GenericPage {
  private connSub: Subscription;
  public authForm: FormGroup;
  public userProfile: User;
  public offlineDisabled = true;
  private static autoRedirect = true;

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly googlePlus: GooglePlus,
    private readonly formBuilder: FormBuilder,
    private readonly settingCtrl: SettingServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.authForm = this.formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.required]
    });

    const data = moment().format('YYYYMMDD');
    const time = moment().format('HHmmss');
    console.log('today is: ', data + ' and time: ', time);
  }

  /**
   * Gère les redirection automatique une fois connecté vers la page principale
   *
   * @memberof AuthentificationPage
   */
  ionViewDidEnter(): void {
    this.connSub = this.authCtrl.getConnexionSubject().subscribe((user: User) => {
      this.userProfile = user;
      if (user != null && AuthentificationPage.autoRedirect) {
        AuthentificationPage.autoRedirect = false;
        this.navCtrl.parent.select(Global.HOMEPAGE);
      } else {
        AuthentificationPage.autoRedirect = true;
      }
    });

    this.settingCtrl.getSetting(Settings.DISABLE_OFFLINE).then((res: string) => {
      this.offlineDisabled = res === 'true';
    });

    this.settingCtrl.getSetting(Settings.LAST_FIRE_EMAIL_LOGIN).then((res: string) => {
      if (res != null && res !== '') {
        this.authForm.get('email').setValue(res);
      }
    });

    this.authForm.get('password').setValue('');
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

  public menuEventHandler(): void {
    // nothing special to do
  }

  public loginAuthRequired(): boolean {
    return false;
  }

  public basicAuthRequired(): boolean {
    return false;
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public async loginGooglePlus(): Promise<void> {
    try {
      this.uiCtrl.showLoading('tentative de login...');
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
          .then(() => {
            this.uiCtrl.displayToast(
              'Connexion avec votre compte Google effectuée avec succès!'
            );
          });
      }
    } catch (err) {
      this.uiCtrl.alert(
        'Erreur de connexion',
        'Connexion à votre compte Google impossible' + 'Message : <br/>' + err
      );
      this.uiCtrl.dismissLoading();
    }
  }

  public async firebaseLogin(): Promise<void> {
    const email: string = this.authForm.get('email').value;
    const password: string = this.authForm.get('password').value;

    this.settingCtrl.setSetting(Settings.LAST_FIRE_EMAIL_LOGIN, email);

    try {
      this.uiCtrl.showLoading('tentative de login...');
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      if (result) {
        this.uiCtrl.displayToast('Connexion avec votre compte effectuée avec succès!');
      }
    } catch (err) {
      this.uiCtrl.alert(
        'Erreur de connexion',
        'Connexion à votre compte impossible' + 'Message : <br/>' + err
      );
      this.uiCtrl.dismissLoading();
    }
  }

  public async logout(): Promise<void> {
    if (this.authCtrl.isConnected()) {
      this.uiCtrl.showLoading('Déconnexion en cours');
      await this.authCtrl.logout();
      this.uiCtrl.dismissLoading();
    }
  }

  public async createCount(): Promise<void> {
    const email: string = this.authForm.get('email').value;
    const password: string = this.authForm.get('password').value;

    try {
      this.uiCtrl.showLoading('création du compte...');
      const result = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password);
      if (result) {
        this.uiCtrl.displayToast('Création de votre compte effectuée avec succès!', 1000);
        //firebase.auth().currentUser.updateProfile();
        this.uiCtrl.dismissLoading();
        this.firebaseLogin();
      }
    } catch (err) {
      this.uiCtrl.alert(
        'Erreur de connection',
        'Création de votre compte impossible' + 'Message : <br/>' + err
      );
      this.uiCtrl.dismissLoading();
    }
  }

  /**
   * Permet d'utiliser le programme avec certaines fonctionalités désactivée
   * Active la navigation hors connexion
   *
   * @returns {Promise<void>}
   * @memberof AuthentificationPage
   */
  public async offlineMode(): Promise<void> {
    await this.logout();
    this.authCtrl.allowOffline();
    this.uiCtrl.displayToast(
      'Mode Hors Connexion activé: Certaines Fonctionalités ne seront pas disponible'
    );
    this.navCtrl.parent.select(Global.HOMEPAGE);
  }
}
