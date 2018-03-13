import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SettingsPage } from './settings';

/**
 * @export
 * @class SettingsPageModule
 */
@NgModule({
  declarations: [SettingsPage],
  imports: [IonicPageModule.forChild(SettingsPage)]
})
export class SettingsPageModule {}
