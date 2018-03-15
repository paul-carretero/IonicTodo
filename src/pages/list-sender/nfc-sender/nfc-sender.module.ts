import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NfcSenderPage } from './nfc-sender';

@NgModule({
  declarations: [
    NfcSenderPage,
  ],
  imports: [
    IonicPageModule.forChild(NfcSenderPage),
  ],
})
export class NfcSenderPageModule {}
