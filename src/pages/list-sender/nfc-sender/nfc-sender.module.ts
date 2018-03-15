import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NfcSenderPage } from './nfc-sender';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  declarations: [NfcSenderPage],
  imports: [IonicPageModule.forChild(NfcSenderPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class NfcSenderPageModule {}
