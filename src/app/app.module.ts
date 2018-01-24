import { TodoEditPage } from './../pages/todo-edit/todo-edit';
import { TodoPage } from './../pages/todo/todo';
import { TodoListPage } from './../pages/todo-list/todo-list';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePage } from '../pages/home/home';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TodoServiceProvider } from '../providers/todo-service-ts/todo-service-ts';
import { TabsPage } from '../pages/tabs/tabs';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    TodoListPage,
    TabsPage,
    TodoPage,
    TodoEditPage
  ],
  imports: [BrowserModule, IonicModule.forRoot(MyApp)],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TodoListPage,
    HomePage,
    TabsPage,
    TodoPage,
    TodoEditPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    TodoServiceProvider
  ]
})
export class AppModule {}
