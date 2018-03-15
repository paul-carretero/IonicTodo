import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CloudSenderPage } from './cloud-sender';

@NgModule({
  declarations: [
    CloudSenderPage,
  ],
  imports: [
    IonicPageModule.forChild(CloudSenderPage),
  ],
})
export class CloudSenderPageModule {}
