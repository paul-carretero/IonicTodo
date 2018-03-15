import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SettingsPage } from './settings';
import { ComponentsModule } from '../../components/components.module';

/**
 * @export
 * @class SettingsPageModule
 */
@NgModule({
  declarations: [SettingsPage],
  imports: [IonicPageModule.forChild(SettingsPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class SettingsPageModule {}
