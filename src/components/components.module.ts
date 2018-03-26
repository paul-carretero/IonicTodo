import { HeaderComponent } from './header/header';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { AuthorDisplayComponent } from './author-display/author-display';
import { AccountComponent } from './account/account';
import { CreateAccountComponent } from './create-account/create-account';
import { LoginAccountComponent } from './login-account/login-account';
@NgModule({
  declarations: [HeaderComponent,
    AuthorDisplayComponent,
    AccountComponent,
    CreateAccountComponent,
    LoginAccountComponent,
    LoginAccountComponent],
  imports: [IonicPageModule.forChild(HeaderComponent), CommonModule],
  exports: [HeaderComponent,
    AuthorDisplayComponent,
    AccountComponent,
    CreateAccountComponent,
    LoginAccountComponent,
    LoginAccountComponent]
})
export class ComponentsModule {}
