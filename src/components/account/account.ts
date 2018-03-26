import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { Component, OnInit } from '@angular/core';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { User } from 'firebase/app';

@Component({
  selector: 'account',
  templateUrl: 'account.html'
})
export class AccountComponent implements OnInit {
  protected userProfile: User | null;

  constructor(
    private readonly authCtrl: AuthServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {
    this.userProfile = null;
  }

  ngOnInit(): void {
    this.userProfile = this.authCtrl.getUser();
  }

  /**
   * Si un utilisateur est connecté, le déconnecte
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof AccountComponent
   */
  protected async logout(): Promise<void> {
    if (this.authCtrl.isConnected()) {
      this.uiCtrl.showLoading('Déconnexion en cours');
      await this.authCtrl.logout();
      this.uiCtrl.dismissLoading();
    }
  }
}
