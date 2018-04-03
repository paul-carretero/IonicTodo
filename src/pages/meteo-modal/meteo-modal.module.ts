import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MeteoModalPage } from './meteo-modal';
import { ComponentsModule } from '../../components/components.module';

/**
 * MeteoModalPageModule
 *
 * @export
 * @class MeteoModalPageModule
 */
@NgModule({
  declarations: [MeteoModalPage],
  imports: [IonicPageModule.forChild(MeteoModalPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class MeteoModalPageModule {}
