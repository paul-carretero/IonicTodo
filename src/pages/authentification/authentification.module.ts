import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AuthentificationPage } from './authentification';

/**
 * @export
 * @class AuthentificationPageModule
 */
@NgModule({
  declarations: [AuthentificationPage],
  imports: [IonicPageModule.forChild(AuthentificationPage)]
})
export class AuthentificationPageModule {}
