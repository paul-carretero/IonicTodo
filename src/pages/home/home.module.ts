import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';
import { ComponentsModule } from '../../components/components.module';

/**
 * HomePageModule
 *
 * @export
 * @class HomePageModule
 */
@NgModule({
  declarations: [HomePage],
  imports: [IonicPageModule.forChild(HomePage), ComponentsModule],
  exports: [ComponentsModule]
})
export class HomePageModule {}
