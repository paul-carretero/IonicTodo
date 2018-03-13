import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { QrReaderPage } from './qr-reader';

/**
 * @export
 * @class QrReaderPageModule
 */
@NgModule({
  declarations: [QrReaderPage],
  imports: [IonicPageModule.forChild(QrReaderPage)]
})
export class QrReaderPageModule {}
