import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BtSenderPage } from './bt-sender';

@NgModule({
  declarations: [
    BtSenderPage,
  ],
  imports: [
    IonicPageModule.forChild(BtSenderPage),
  ],
})
export class BtSenderPageModule {}
