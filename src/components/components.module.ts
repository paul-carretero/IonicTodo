import { HeaderComponent } from './header/header';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
@NgModule({
  declarations: [HeaderComponent],
  imports: [IonicPageModule.forChild(HeaderComponent), CommonModule],
  exports: [HeaderComponent]
})
export class ComponentsModule {}
