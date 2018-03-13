import { SQLite } from '@ionic-native/sqlite';
import { SettingsPage } from './../pages/settings/settings';
import { QrcodeGeneratePage } from './../pages/list-sender/qrcode-generate/qrcode-generate';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Flashlight } from '@ionic-native/flashlight';
import { GooglePlus } from '@ionic-native/google-plus';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { QRScanner } from '@ionic-native/qr-scanner';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { AlertController, IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { AuthentificationPage } from '../pages/authentification/authentification';
import { HomePage } from '../pages/home/home';
import { ListEditPage } from '../pages/list-edit/list-edit';
import { TabsPage } from '../pages/tabs/tabs';
import { AuthServiceProvider } from '../providers/auth-service/auth-service';
import { MapServiceProvider } from '../providers/map-service/map-service';
import { NotifServiceProvider } from '../providers/notif-service/notif-service';
import { SettingServiceProvider } from '../providers/setting/setting-service';
import { SpeechRecServiceProvider } from '../providers/speech-rec-service/speech-rec-service';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../providers/todo-service-ts/todo-service-ts';
import { HeaderComponent } from './../components/header/header';
import { PopoverOptionsPage } from './../pages/popover-options/popover-options';
import { TodoEditPage } from './../pages/todo-edit/todo-edit';
import { TodoListPage } from './../pages/todo-list/todo-list';
import { TodoPage } from './../pages/todo/todo';
import { EventServiceProvider } from './../providers/event/event-service';
import { MyApp } from './app.component';
import { FirebaseCredentials } from './firebase.credentials';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { CameraPreview } from '@ionic-native/camera-preview';
import { QrReaderPage } from '../pages/list-receiver/qr-reader/qr-reader';
import { NfcProvider } from '../providers/nfc/nfc';
import { NFC, Ndef } from '@ionic-native/nfc';

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
    PopoverOptionsPage,
    QrReaderPage,
    QrcodeGeneratePage,
    SettingsPage
  ],
  imports: [
    BrowserModule,
    NgxQRCodeModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(FirebaseCredentials),
    AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence()
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
    PopoverOptionsPage,
    QrReaderPage,
    QrcodeGeneratePage,
    SettingsPage
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
    EventServiceProvider,
    Flashlight,
    NativeGeocoder,
    QRScanner,
    UniqueDeviceID,
    SettingServiceProvider,
    NgxQRCodeModule,
    CameraPreview,
    ScreenOrientation,
    SQLite,
    NfcProvider,
    NFC,
    Ndef
  ]
})
export class AppModule {}
