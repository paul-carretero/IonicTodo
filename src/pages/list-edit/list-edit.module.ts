import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ListEditPage } from './list-edit';
import { ComponentsModule } from '../../components/components.module';

/**
 * @export
 * @class ListEditPageModule
 */
@NgModule({
  declarations: [ListEditPage],
  imports: [IonicPageModule.forChild(ListEditPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class ListEditPageModule {}
