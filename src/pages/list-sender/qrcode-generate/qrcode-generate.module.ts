import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { QrcodeGeneratePage } from './qrcode-generate';

/**
 * @export
 * @class QrcodeGeneratePageModule
 */
@NgModule({
  declarations: [QrcodeGeneratePage],
  imports: [IonicPageModule.forChild(QrcodeGeneratePage)]
})
export class QrcodeGeneratePageModule {}
