import { ComponentsModule } from '../../../components/components.module';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OcrModdalPage } from './ocr-moddal';

@NgModule({
  declarations: [OcrModdalPage],
  imports: [IonicPageModule.forChild(OcrModdalPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class OcrModdalPageModule {}
