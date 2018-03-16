import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CameraPreview } from '@ionic-native/camera-preview';
import { Contacts } from '@ionic-native/contacts';
import { Flashlight } from '@ionic-native/flashlight';
import { Geolocation } from '@ionic-native/geolocation';
import { GooglePlus } from '@ionic-native/google-plus';
import { Keyboard } from '@ionic-native/keyboard';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { Ndef, NFC } from '@ionic-native/nfc';
import { QRScanner } from '@ionic-native/qr-scanner';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Shake } from '@ionic-native/shake';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SQLite } from '@ionic-native/sqlite';
import { StatusBar } from '@ionic-native/status-bar';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AlertController, IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { NgxQRCodeModule } from 'ngx-qrcode2';

import { ComponentsModule } from '../components/components.module';
import { AuthServiceProvider } from '../providers/auth-service/auth-service';
import { CloudServiceProvider } from '../providers/cloud-service/cloud-service';
import { MapServiceProvider } from '../providers/map-service/map-service';
import { NfcProvider } from '../providers/nfc/nfc';
import { NotifServiceProvider } from '../providers/notif-service/notif-service';
import { SettingServiceProvider } from '../providers/setting/setting-service';
import { SpeechRecServiceProvider } from '../providers/speech-rec-service/speech-rec-service';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../providers/todo-service-ts/todo-service-ts';
import { EventServiceProvider } from './../providers/event/event-service';
import { MyApp } from './app.component';
import { FirebaseCredentials } from './firebase.credentials';
import { UiServiceProvider } from '../providers/ui-service/ui-service';

@NgModule({
  declarations: [MyApp],
  imports: [
    BrowserModule,
    NgxQRCodeModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(FirebaseCredentials),
    AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence(),
    ComponentsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp],
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
    Ndef,
    Shake,
    CloudServiceProvider,
    Geolocation,
    Keyboard,
    Contacts,
    UiServiceProvider
  ]
})
export class AppModule {}
