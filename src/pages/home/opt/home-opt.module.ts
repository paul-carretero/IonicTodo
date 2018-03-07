import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomeOptPage } from './home-opt';

@NgModule({
  declarations: [
    HomeOptPage,
  ],
  imports: [
    IonicPageModule.forChild(HomeOptPage),
  ],
})
export class HomeOptPageModule {}
