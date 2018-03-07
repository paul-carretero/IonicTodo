import { EventServiceProvider } from './../providers/user-event/event-service';
import { HeaderComponent } from './../components/header/header';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GooglePlus } from '@ionic-native/google-plus';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import {
  AlertController,
  IonicApp,
  IonicErrorHandler,
  IonicModule
} from 'ionic-angular';

import { AuthentificationPage } from '../pages/authentification/authentification';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { AuthServiceProvider } from '../providers/auth-service/auth-service';
import { MapServiceProvider } from '../providers/map-service/map-service';
import { NotifServiceProvider } from '../providers/notif-service/notif-service';
import { SpeechRecServiceProvider } from '../providers/speech-rec-service/speech-rec-service';
import { TodoServiceProvider } from '../providers/todo-service-ts/todo-service-ts';
import { TodoEditPage } from './../pages/todo-edit/todo-edit';
import { TodoListPage } from './../pages/todo-list/todo-list';
import { TodoPage } from './../pages/todo/todo';
import { MyApp } from './app.component';
import { FirebaseCredentials } from './firebase.credentials';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { ListEditPage } from '../pages/list-edit/list-edit';
import { HomeOptPage } from '../pages/home/opt/home-opt';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    TodoListPage,
    TabsPage,
    TodoPage,
    TodoEditPage,
    AuthentificationPage,
    HeaderComponent,
    ListEditPage,
    HomeOptPage
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
    HeaderComponent,
    ListEditPage,
    HomeOptPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    TodoServiceProvider,
    AuthServiceProvider,
    GooglePlus,
    AlertController,
    NotifServiceProvider,
    LocalNotifications,
    MapServiceProvider,
    SpeechRecServiceProvider,
    SpeechRecognition,
    SpeechSynthServiceProvider,
    TextToSpeech,
    EventServiceProvider
  ]
})
export class AppModule {}
