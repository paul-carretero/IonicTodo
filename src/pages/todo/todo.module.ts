import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TodoPage } from './todo';

/**
 * @export
 * @class TodoPageModule
 */
@NgModule({
  declarations: [TodoPage],
  imports: [IonicPageModule.forChild(TodoPage)]
})
export class TodoPageModule {}
