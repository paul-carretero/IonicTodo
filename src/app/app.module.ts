import { EditListComponent } from './../components/edit-list/edit-list';
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
import { AuthentificationPage } from '../pages/authentification/authentification';
import { AuthServiceProvider } from '../providers/auth-service/auth-service';

import { FirebaseCredentials } from './firebase.credentials';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { GooglePlus } from '@ionic-native/google-plus';
import { AlertController } from 'ionic-angular';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    TodoListPage,
    TabsPage,
    TodoPage,
    TodoEditPage,
    AuthentificationPage,
    EditListComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(FirebaseCredentials),
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TodoListPage,
    HomePage,
    TabsPage,
    TodoPage,
    TodoEditPage,
    AuthentificationPage,
    EditListComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    TodoServiceProvider,
    AuthServiceProvider,
    GooglePlus,
    AlertController
  ]
})
export class AppModule {}
