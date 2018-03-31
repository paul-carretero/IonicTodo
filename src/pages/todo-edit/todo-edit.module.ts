import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TodoEditPage } from './todo-edit';
import { ComponentsModule } from '../../components/components.module';

/**
 * TodoEditPageModule
 *
 * @export
 * @class TodoEditPageModule
 */
@NgModule({
  declarations: [TodoEditPage],
  imports: [IonicPageModule.forChild(TodoEditPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class TodoEditPageModule {}
