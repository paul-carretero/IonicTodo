import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TodoEditPage } from './todo-edit';

/**
 * @export
 * @class TodoEditPageModule
 */
@NgModule({
  declarations: [TodoEditPage],
  imports: [IonicPageModule.forChild(TodoEditPage)]
})
export class TodoEditPageModule {}
