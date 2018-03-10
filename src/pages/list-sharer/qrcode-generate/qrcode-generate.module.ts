import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { QrcodeGeneratePage } from './qrcode-generate';

@NgModule({
  declarations: [
    QrcodeGeneratePage,
  ],
  imports: [
    IonicPageModule.forChild(QrcodeGeneratePage),
  ],
})
export class QrcodeGeneratePageModule {}
