import { HeaderComponent } from './header/header';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { AuthorDisplayComponent } from './author-display/author-display';
@NgModule({
  declarations: [HeaderComponent,
    AuthorDisplayComponent],
  imports: [IonicPageModule.forChild(HeaderComponent), CommonModule],
  exports: [HeaderComponent,
    AuthorDisplayComponent]
})
export class ComponentsModule {}
