import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ContactModalPage } from './contact-modal';
import { ComponentsModule } from '../../../components/components.module';

/**
 * ContactModalPageModule
 *
 * @export
 * @class ContactModalPageModule
 */
@NgModule({
  declarations: [ContactModalPage],
  imports: [IonicPageModule.forChild(ContactModalPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class ContactModalPageModule {}
