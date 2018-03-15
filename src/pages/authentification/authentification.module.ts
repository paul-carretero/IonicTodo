import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AuthentificationPage } from './authentification';
import { ComponentsModule } from '../../components/components.module';

/**
 * @export
 * @class AuthentificationPageModule
 */
@NgModule({
  declarations: [AuthentificationPage],
  imports: [IonicPageModule.forChild(AuthentificationPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class AuthentificationPageModule {}
