import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Component, OnInit } from '@angular/core';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { User } from 'firebase/app';
import moment from 'moment';

/**
 * permet de réprésenter un compte utilisateur et les informations qui y sont associées
 *
 * @export
 * @class AccountComponent
 * @implements {OnInit}
 */
@Component({
  selector: 'account',
  templateUrl: 'account.html'
})
export class AccountComponent implements OnInit {
  /**
   * profile utilisateur si il est connecté
   *
   * @protected
   * @type {(User | null)}
   * @memberof AccountComponent
   */
  protected userProfile: User | null;

  /**
   * date humaine de la création du compte utilisateur
   *
   * @protected
   * @type {string}
   * @memberof AccountComponent
   */
  protected createDate: string;

  /**
   * date humaine du dernier login de l'utilisateur
   *
   * @protected
   * @type {string}
   * @memberof AccountComponent
   */
  protected lastLogin: string;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AccountComponent.
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @memberof AccountComponent
   */
  constructor(
    private readonly authCtrl: AuthServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {
    this.userProfile = null;
    this.createDate = '';
    this.lastLogin = '';
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * au chargement du composant, recherche les informations de l'utilisateur
   *
   * @memberof AccountComponent
   */
  ngOnInit(): void {
    this.userProfile = this.authCtrl.getUser();
    if (this.userProfile != null && this.userProfile.metadata != null) {
      if (this.userProfile.metadata.creationTime != null) {
        this.createDate = moment(this.userProfile.metadata.creationTime)
          .locale('fr')
          .format('ddd D MMM, HH:mm');
      }
      if (this.userProfile.metadata.lastSignInTime != null) {
        this.lastLogin = moment(this.userProfile.metadata.lastSignInTime)
          .locale('fr')
          .format('ddd D MMM, HH:mm');
      }
    }
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Si un utilisateur est connecté, le déconnecte
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof AccountComponent
   */
  protected async logout(): Promise<void> {
    if (this.userProfile !== null) {
      this.userProfile.photoURL;
    }
    if (this.authCtrl.isConnected()) {
      this.uiCtrl.showLoading('Déconnexion en cours');
      await this.authCtrl.logout();
      this.uiCtrl.dismissLoading();
    }
  }
}
