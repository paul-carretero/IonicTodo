import { MapServiceProvider } from './../providers/map-service/map-service';
import { AuthServiceProvider } from './../providers/auth-service/auth-service';
import { AdsServiceProvider } from './../providers/ads-service/ads-service';
import { SpeechRecServiceProvider } from './../providers/speech-rec-service/speech-rec-service';
import { NotifServiceProvider } from './../providers/notif-service/notif-service';
import { Component } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Platform } from 'ionic-angular';

import { NfcProvider } from '../providers/nfc/nfc';
import { CloudServiceProvider } from './../providers/cloud-service/cloud-service';

/**
 * base de l'application OhMyTask, initialise les services et la gestion des pages
 *
 * @export
 * @class MyApp
 */
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * page de base de l'application
   *
   * @protected
   * @type {*}
   * @memberof MyApp
   */
  protected readonly rootPage = 'TabsPage';

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of MyApp.
   * @param {Platform} platform
   * @param {StatusBar} statusBar
   * @param {SplashScreen} splashScreen
   * @param {CloudServiceProvider} cloudCtrl
   * @param {NfcProvider} nfcCtrl
   * @param {NotifServiceProvider} notifCtrl
   * @param {SpeechRecServiceProvider} speechCtrl
   * @param {AdsServiceProvider} adsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @memberof MyApp
   */
  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private readonly cloudCtrl: CloudServiceProvider,
    private readonly nfcCtrl: NfcProvider,
    private readonly notifCtrl: NotifServiceProvider,
    private readonly speechCtrl: SpeechRecServiceProvider,
    private readonly adsCtrl: AdsServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly mapCtrl: MapServiceProvider
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      statusBar.overlaysWebView(false);
      statusBar.show();
      splashScreen.hide();
      this.startListeners();
    });
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * démarre les listener des service démarrant au démarrage de l'application.
   * Demande également la position pour en avoir une dans le cache
   *
   * @private
   * @memberof MyApp
   */
  private startListeners(): void {
    this.cloudCtrl.listenForUpdate();
    this.nfcCtrl.listenForEvents();
    this.notifCtrl.listenForEvents();
    this.speechCtrl.listenForSpeechRequest();
    this.adsCtrl.refreshBanner();
    this.authCtrl.applyAutoLoginSetting();
    this.mapCtrl.getMyPosition();
  }
}
