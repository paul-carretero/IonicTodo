import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HelpModalPage } from './help-modal';

/**
 * HelpModalPageModule
 *
 * @export
 * @class HelpModalPageModule
 */
@NgModule({
  declarations: [HelpModalPage],
  imports: [IonicPageModule.forChild(HelpModalPage)]
})
export class HelpModalPageModule {}
