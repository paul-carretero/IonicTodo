import { NgxQRCodeModule } from 'ngx-qrcode2';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { QrcodeGeneratePage } from './qrcode-generate';
import { ComponentsModule } from '../../../components/components.module';

/**
 * QrcodeGeneratePageModule
 *
 * @export
 * @class QrcodeGeneratePageModule
 */
@NgModule({
  declarations: [QrcodeGeneratePage],
  imports: [IonicPageModule.forChild(QrcodeGeneratePage), ComponentsModule, NgxQRCodeModule],
  exports: [ComponentsModule]
})
export class QrcodeGeneratePageModule {}
