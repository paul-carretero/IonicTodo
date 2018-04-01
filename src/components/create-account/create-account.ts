import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { User } from '@firebase/auth-types';
import { GooglePlus } from '@ionic-native/google-plus';
import { AngularFireAuth } from 'angularfire2/auth';
import { NavController } from 'ionic-angular';

import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { DBServiceProvider } from '../../providers/db/db-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { LoginAccountComponent } from '../login-account/login-account';
import { EventServiceProvider } from './../../providers/event/event-service';

/**
 * composant permettant à un utilisateur non connecté de créer un compte sur l'application ou de le mettre à jour si il est connecté
 *
 * @export
 * @class CreateAccountComponent
 * @extends {LoginAccountComponent}
 * @implements {OnInit}
 */
@Component({
  selector: 'create-account',
  templateUrl: 'create-account.html'
})
export class CreateAccountComponent extends LoginAccountComponent implements OnInit {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * user firebase courrant si il est connecté, false sinon
   *
   * @private
   * @type {(User | null)}
   * @memberof CreateAccountComponent
   */
  private account: User | null;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * text pour la validation du formulaire
   *
   * @protected
   * @type {('Mettre à jour mon compte' | 'Créer mon compte')}
   * @memberof CreateAccountComponent
   */
  protected validText: 'Mettre à jour mon compte' | 'Créer mon compte';

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of CreateAccountComponent.
   * @param {NavController} navCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {GooglePlus} googlePlus
   * @param {FormBuilder} formBuilder
   * @param {DBServiceProvider} settingCtrl
   * @param {AngularFireAuth} fireAuthCtrl
   * @param {EventServiceProvider} evtCtrl
   * @memberof CreateAccountComponent
   */
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
    super(
      navCtrl,
      authCtrl,
      uiCtrl,
      googlePlus,
      formBuilder,
      settingCtrl,
      fireAuthCtrl,
      evtCtrl
    );
    this.authForm = this.formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.minLength(6)],
      name: ['', Validators.required],
      photo: ['']
    });
    this.validText = 'Créer mon compte';
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * lors du chargement du composant, recherche si l'utilisateur est connecté et adapte le formulaire pour une création ou une mise à jour
   *
   * @memberof CreateAccountComponent
   */
  ngOnInit(): void {
    this.account = this.authCtrl.getUser();
    super.ngOnInit();
    this.prepareForEdit();
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * Initialise l'email avec soit rien, soit la valeur du compte courrant
   *
   * @override
   * @protected
   * @memberof CreateAccountComponent
   */
  protected setDefaultEmail(): void {
    if (this.account == null) {
      const email = this.authForm.get('email');
      if (email != null) {
        email.setValue('');
      }
    } else {
      const email = this.authForm.get('email');
      if (email != null) {
        email.setValue(this.account.email);
      }
    }
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * permet de valider les informations saisies et créer ou mettre à jour le compte
   *
   * @protected
   * @returns {void}
   * @memberof CreateAccountComponent
   */
  protected validate(): void {
    if (this.authForm.valid) {
      if (this.account == null) {
        this.createCount();
      } else {
        this.editCount();
      }
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * configure le formulaire pour éditer certaine informations d'un utilisateur connecté
   *
   * @private
   * @returns {void}
   * @memberof CreateAccountComponent
   */
  private prepareForEdit(): void {
    if (this.account != null) {
      this.validText = 'Mettre à jour mon compte';
      const emailForm = this.authForm.get('email');
      const passForm = this.authForm.get('password');
      const nameForm = this.authForm.get('name');
      const photoForm = this.authForm.get('photo');
      if (emailForm != null && passForm != null && nameForm != null && photoForm != null) {
        passForm.setValue('');
        nameForm.setValue(this.account.displayName);
        photoForm.setValue(this.account.photoURL);
        passForm.setValidators(null);
        emailForm.disable();
        passForm.disable();
      }
    }
  }

  /**
   * Tente de créer un compte avec les informations du formulaire
   *
   * @private
   * @returns {Promise<void>}
   * @memberof CreateAccountComponent
   */
  private async createCount(): Promise<void> {
    const emailForm = this.authForm.get('email');
    const passForm = this.authForm.get('password');
    const nameForm = this.authForm.get('name');
    const photoForm = this.authForm.get('name');

    if (emailForm != null && passForm != null && nameForm != null && photoForm != null) {
      const email: string = emailForm.value;
      const password: string = passForm.value;
      const name: string = nameForm.value;
      let photo: string | null = photoForm.value;
      if (photo === '') {
        photo = null;
      }

      try {
        this.uiCtrl.showLoading('création du compte...');
        const result = await this.fireAuthCtrl.auth.createUserWithEmailAndPassword(
          email,
          password
        );

        if (result) {
          this.uiCtrl.displayToast('Création de votre compte effectuée avec succès!', 1000);
          this.uiCtrl.dismissLoading();
          await this.firebaseLogin();
          const u = this.fireAuthCtrl.auth.currentUser;
          if (u != null) {
            try {
              u.updateProfile({ displayName: name, photoURL: photo });
            } catch (error) {}
          }
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

  /**
   * Tente de mettre à jour les informations du compte courrant
   *
   * @private
   * @returns {Promise<void>}
   * @memberof CreateAccountComponent
   */
  private async editCount(): Promise<void> {
    const nameForm = this.authForm.get('name');
    const photoForm = this.authForm.get('photo');

    if (nameForm != null && photoForm != null && this.account != null) {
      this.uiCtrl.showLoading('Mise à jour des informations de votre compte');

      let photo = photoForm.value;
      const name = nameForm.value;

      if (photo === '') {
        photo = null;
      }

      try {
        await this.account.updateProfile({ displayName: name, photoURL: photo });
      } catch (error) {
        this.uiCtrl.alert('Echec', 'Impossible de mettre à jour votre compte');
        console.log(error);
      }
      this.uiCtrl.dismissLoading();
    }
  }
}
