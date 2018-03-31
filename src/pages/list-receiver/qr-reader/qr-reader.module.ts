import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { QrReaderPage } from './qr-reader';
import { ComponentsModule } from '../../../components/components.module';

/**
 * QrReaderPageModule
 *
 * @export
 * @class QrReaderPageModule
 */
@NgModule({
  declarations: [QrReaderPage],
  imports: [IonicPageModule.forChild(QrReaderPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class QrReaderPageModule {}
