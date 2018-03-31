import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TabsPage } from './tabs';

/**
 * TabsPageModule
 *
 * @export
 * @class TabsPageModule
 */
@NgModule({
  declarations: [TabsPage],
  imports: [IonicPageModule.forChild(TabsPage)],
  exports: [TabsPage]
})
export class TabsPageModule {}
