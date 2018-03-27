import { Subscription } from 'rxjs/Subscription';
import { EventServiceProvider } from './../../providers/event/event-service';
import { AngularFireAuth } from 'angularfire2/auth';
import { AlertInputOptions } from 'ionic-angular/components/alert/alert-options';
import { Component, OnInit } from '@angular/core';
import { DBServiceProvider } from '../../providers/db/db-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GooglePlus } from '@ionic-native/google-plus';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { NavController } from 'ionic-angular';
import { Global } from '../../shared/global';
import { Settings } from '../../model/settings';
import { FirebaseCredentials } from '../../app/firebase.credentials';
import * as firebase from 'firebase/app';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  selector: 'login-account',
  templateUrl: 'login-account.html'
})
export class LoginAccountComponent implements OnInit, OnDestroy {
  /**
   * Formulaire de connexion
   *
   * @protected
   * @type {FormGroup}
   * @memberof LoginAccountComponent
   */
  protected authForm: FormGroup;

  /**
   * défini si l'on peut se connecté hors ligne
   *
   * @protected
   * @type {boolean}
   * @memberof AuthentificationPage
   */
  protected offlineDisabled: boolean = true;

  protected netStatus: boolean;

  private netSub: Subscription;

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    protected readonly googlePlus: GooglePlus,
    protected readonly formBuilder: FormBuilder,
    protected readonly settingCtrl: DBServiceProvider,
    protected readonly fireAuthCtrl: AngularFireAuth,
    protected readonly evtCtrl: EventServiceProvider
  ) {
    this.authForm = this.formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.required]
    });
    this.netStatus = false;
  }

  ngOnInit(): void {
    this.setDefaultEmail();

    const pass = this.authForm.get('password');
    if (pass != null) {
      pass.setValue('');
    }

    this.settingCtrl.getSetting(Settings.DISABLE_OFFLINE).then((res: boolean) => {
      this.offlineDisabled = res;
    });

    this.netSub = this.evtCtrl.getNetStatusObs().subscribe(res => {
      this.netStatus = res;
      if (!this.netStatus) {
        this.uiCtrl.alert(
          'Information',
          'Sans connexion réseau, il ne vous sera pas possible de vous authentifier ou de créer un compte'
        );
      }
    });
  }

  ngOnDestroy(): void {
    if (this.netSub != null) {
      this.netSub.unsubscribe();
    }
  }

  /**
   * return true si l'application est utilisé en mode hors ligne
   *
   * @readonly
   * @type {boolean}
   * @memberof AuthentificationPage
   */
  get isOffline(): boolean {
    return this.authCtrl.isOffline();
  }

  protected setDefaultEmail(): void {
    this.settingCtrl.getSettingStr(Settings.LAST_FIRE_EMAIL_LOGIN).then((res: string) => {
      const email = this.authForm.get('email');
      if (email != null) {
        email.setValue(res);
      }
    });
  }

  /**
   * Permet d'utiliser le programme avec certaines fonctionalités désactivée
   * Active la navigation hors connexion
   *
   * @returns {Promise<void>}
   * @memberof LoginAccountComponent
   */
  protected offlineMode(): void {
    this.authCtrl.allowOffline();
    this.uiCtrl.displayToast(
      'Mode Hors Connexion activé: Certaines Fonctionalités ne seront pas disponible'
    );
    this.navCtrl.parent.select(Global.HOMEPAGE);
  }

  /**
   * Tente de se connecter à firebase avec un couple email-password du formulaire
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof LoginAccountComponent
   */
  protected async firebaseLogin(): Promise<void> {
    const emailForm = this.authForm.get('email');
    const passForm = this.authForm.get('password');
    if (emailForm == null || passForm == null) {
      return;
    }
    const email: string = emailForm.value;
    const password: string = passForm.value;

    this.settingCtrl.setSetting(Settings.LAST_FIRE_EMAIL_LOGIN, email);

    try {
      this.uiCtrl.showLoading('tentative de login...');
      const result = await this.fireAuthCtrl.auth.signInWithEmailAndPassword(email, password);
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

  /**
   * Tente de se connecter à firebase authomatiquement avec un compte Google
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof LoginAccountComponent
   */
  protected async loginGooglePlus(): Promise<void> {
    try {
      this.uiCtrl.showLoading('tentative de login...');
      const result = await this.googlePlus.login({
        webClientId: FirebaseCredentials.webClientId,
        offline: false
      });
      if (result) {
        const googleCredential = firebase.auth.GoogleAuthProvider.credential(result.idToken);
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

  protected async resetPassword(): Promise<void> {
    const emailForm = this.authForm.get('email');
    let email = '';
    if (emailForm != null) {
      email = emailForm.value;
    }

    const opts: AlertInputOptions[] = [
      {
        name: 'email',
        placeholder: 'email',
        type: 'email',
        value: email
      }
    ];

    const emailInput = await this.uiCtrl.presentPrompt(
      'Réinitialisation du mot de passe',
      'Veuillez saisir votre adresse mail afin de vous envoyer un email contenant votre nouveau mot de passe',
      opts
    );

    email = emailInput.email;

    try {
      const res = this.fireAuthCtrl.auth.sendPasswordResetEmail(email);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }
}
