import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Component, OnInit } from '@angular/core';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { User } from 'firebase/app';
import moment from 'moment';

@Component({
  selector: 'account',
  templateUrl: 'account.html'
})
export class AccountComponent implements OnInit {
  protected userProfile: User | null;

  protected createDate: string;

  protected lastLogin: string;

  constructor(
    private readonly authCtrl: AuthServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {
    this.userProfile = null;
    this.createDate = '';
    this.lastLogin = '';
  }

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
