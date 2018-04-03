import { ComponentsModule } from './../../components/components.module';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AutoSmsPage } from './auto-sms';

@NgModule({
  declarations: [AutoSmsPage],
  imports: [IonicPageModule.forChild(AutoSmsPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class AutoSmsPageModule {}
