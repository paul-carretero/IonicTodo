import { ComponentsModule } from './../../../components/components.module';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CloudSpacePage } from './cloud-space';

/**
 * CloudSpacePageModule
 *
 * @export
 * @class CloudSpacePageModule
 */
@NgModule({
  declarations: [CloudSpacePage],
  imports: [IonicPageModule.forChild(CloudSpacePage), ComponentsModule],
  exports: [ComponentsModule]
})
export class CloudSpacePageModule {}
