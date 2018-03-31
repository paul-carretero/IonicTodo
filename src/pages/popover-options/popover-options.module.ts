import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PopoverOptionsPage } from './popover-options';

/**
 * PopoverOptionsPageModule
 *
 * @export
 * @class PopoverOptionsPageModule
 */
@NgModule({
  declarations: [PopoverOptionsPage],
  imports: [IonicPageModule.forChild(PopoverOptionsPage)]
})
export class PopoverOptionsPageModule {}
