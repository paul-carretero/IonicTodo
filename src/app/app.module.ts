import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Base64 } from '@ionic-native/base64';
import { CameraPreview } from '@ionic-native/camera-preview';
import { Contacts } from '@ionic-native/contacts';
import { DatePicker } from '@ionic-native/date-picker';
import { File } from '@ionic-native/file';
import { Flashlight } from '@ionic-native/flashlight';
import { Geolocation } from '@ionic-native/geolocation';
import { GooglePlus } from '@ionic-native/google-plus';
import { Keyboard } from '@ionic-native/keyboard';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { Network } from '@ionic-native/network';
import { Ndef, NFC } from '@ionic-native/nfc';
import { PhotoViewer } from '@ionic-native/photo-viewer';
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
import { AngularFireStorageModule } from 'angularfire2/storage';
import { AlertController, IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { NgxQRCodeModule } from 'ngx-qrcode2';

import { ComponentsModule } from '../components/components.module';
import { AuthServiceProvider } from '../providers/auth-service/auth-service';
import { CloudServiceProvider } from '../providers/cloud-service/cloud-service';
import { DBServiceProvider } from '../providers/db/db-service';
import { MapServiceProvider } from '../providers/map-service/map-service';
import { NfcProvider } from '../providers/nfc/nfc';
import { NotifServiceProvider } from '../providers/notif-service/notif-service';
import { SpeechRecServiceProvider } from '../providers/speech-rec-service/speech-rec-service';
import { SpeechSynthServiceProvider } from '../providers/speech-synth-service/speech-synth-service';
import { StorageServiceProvider } from '../providers/storage-service/storage-service';
import { TodoServiceProvider } from '../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from '../providers/ui-service/ui-service';
import { EventServiceProvider } from './../providers/event/event-service';
import { MyApp } from './app.component';
import { FirebaseCredentials } from './firebase.credentials';
import { Camera } from '@ionic-native/camera';

const dateLocal = {
  monthNames: [
    'Janvier',
    'Fevrier',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Aout',
    'Septembre',
    'Octobre',
    'Novembre',
    'Decembre'
  ],
  monthShortNames: [
    'jan',
    'fev',
    'mar',
    'avr',
    'mai',
    'jun',
    'jui',
    'aou',
    'sep',
    'oct',
    'nov',
    'dec'
  ],
  dayNames: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  dayShortNames: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']
};

@NgModule({
  declarations: [MyApp],
  imports: [
    BrowserModule,
    NgxQRCodeModule,
    IonicModule.forRoot(MyApp, dateLocal),
    AngularFireModule.initializeApp(FirebaseCredentials),
    AngularFireAuthModule,
    AngularFirestoreModule.enablePersistence(),
    AngularFireStorageModule,
    ComponentsModule,
    HttpClientModule
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
    DBServiceProvider,
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
    UiServiceProvider,
    Network,
    DatePicker,
    Base64,
    File,
    AndroidPermissions,
    StorageServiceProvider,
    PhotoViewer,
    HttpClientModule,
    Camera
  ]
})
export class AppModule {}
