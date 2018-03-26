import { Component } from '@angular/core';
import { LoginAccountComponent } from '../login-account/login-account';
import { NavController } from 'ionic-angular';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GooglePlus } from '@ionic-native/google-plus';
import { FormBuilder, Validators } from '@angular/forms';
import { DBServiceProvider } from '../../providers/db/db-service';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'create-account',
  templateUrl: 'create-account.html'
})
export class CreateAccountComponent extends LoginAccountComponent {
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    protected readonly googlePlus: GooglePlus,
    protected readonly formBuilder: FormBuilder,
    protected readonly settingCtrl: DBServiceProvider,
    protected readonly fireAuthCtrl: AngularFireAuth
  ) {
    super(navCtrl, authCtrl, uiCtrl, googlePlus, formBuilder, settingCtrl, fireAuthCtrl);
    this.authForm = this.formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.required],
      name: ['', Validators.required]
    });
  }

  /**
   * Tente de créer un compte avec les informations du formulaire
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof CreateAccountComponent
   */
  protected async createCount(): Promise<void> {
    const emailForm = this.authForm.get('email');
    const passForm = this.authForm.get('password');
    const nameForm = this.authForm.get('name');
    if (emailForm == null || passForm == null || nameForm == null) {
      return;
    }
    const email: string = emailForm.value;
    const password: string = passForm.value;
    const name: string = nameForm.value;

    try {
      this.uiCtrl.showLoading('création du compte...');
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      if (result) {
        this.uiCtrl.displayToast('Création de votre compte effectuée avec succès!', 1000);
        const u = firebase.auth().currentUser;
        if (u != null) {
          u.updateProfile({ displayName: name, photoURL: null });
        }
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
}
