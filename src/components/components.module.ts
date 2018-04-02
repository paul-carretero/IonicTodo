import { HeaderComponent } from './header/header';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { AuthorDisplayComponent } from './author-display/author-display';
import { AccountComponent } from './account/account';
import { CreateAccountComponent } from './create-account/create-account';
import { LoginAccountComponent } from './login-account/login-account';
import { MeteoComponent } from './meteo/meteo';

/**
 * ComponentsModule
 *
 * @export
 * @class ComponentsModule
 */
@NgModule({
  declarations: [
    HeaderComponent,
    AuthorDisplayComponent,
    AccountComponent,
    CreateAccountComponent,
    LoginAccountComponent,
    LoginAccountComponent,
    MeteoComponent,
    MeteoComponent
  ],
  imports: [IonicPageModule.forChild(HeaderComponent), CommonModule],
  exports: [
    HeaderComponent,
    AuthorDisplayComponent,
    AccountComponent,
    CreateAccountComponent,
    LoginAccountComponent,
    LoginAccountComponent,
    MeteoComponent,
    MeteoComponent
  ]
})
export class ComponentsModule {}
