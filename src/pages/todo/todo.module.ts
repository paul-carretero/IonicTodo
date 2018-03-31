import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TodoPage } from './todo';
import { ComponentsModule } from '../../components/components.module';

/**
 * TodoPageModule
 *
 * @export
 * @class TodoPageModule
 */
@NgModule({
  declarations: [TodoPage],
  imports: [IonicPageModule.forChild(TodoPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class TodoPageModule {}
