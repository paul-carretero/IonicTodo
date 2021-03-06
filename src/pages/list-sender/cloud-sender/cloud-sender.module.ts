import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CloudSenderPage } from './cloud-sender';
import { ComponentsModule } from '../../../components/components.module';

/**
 * CloudSenderPageModule
 *
 * @export
 * @class CloudSenderPageModule
 */
@NgModule({
  declarations: [CloudSenderPage],
  imports: [IonicPageModule.forChild(CloudSenderPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class CloudSenderPageModule {}
