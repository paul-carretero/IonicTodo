import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TodoListPage } from './todo-list';
import { ComponentsModule } from '../../components/components.module';

/**
 * TodoListPageModule
 *
 * @export
 * @class TodoListPageModule
 */
@NgModule({
  declarations: [TodoListPage],
  imports: [IonicPageModule.forChild(TodoListPage), ComponentsModule],
  exports: [ComponentsModule]
})
export class TodoListPageModule {}
