import { UiServiceProvider } from './../../providers/ui-service/ui-service';
import { AdsServiceProvider } from './../../providers/ads-service/ads-service';
import { NotifServiceProvider } from './../../providers/notif-service/notif-service';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';

import { Settings } from '../../model/settings';
import { DBServiceProvider } from './../../providers/db/db-service';

/**
 * page permettant à l'utilisateur de configurer ses préférence locale pour l'application
 *
 * @export
 * @class SettingsPage
 */
@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * AUTO_LOGIN
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected autoLogIn: boolean = false;

  /**
   * DISABLE_OFFLINE
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected disableOffline: boolean = false;

  /**
   * DISABLE_SMS
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected disableSMS: boolean = false;

  /**
   * DISABLE_NOTIF
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected disableNotification: boolean = false;

  /**
   * AUTO_READ_ALERT
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected autoReadAlert: boolean = false;

  /**
   * AUTO_IMPORT
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected autoImport: boolean = false;

  /**
   * IMPORT_STS
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected enableSTS: boolean = false;

  /**
   * ENABLE_UNSURE_MODE
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected enableUnsure: boolean = false;

  /**
   * SHOW_ADS_BANNER
   *
   * @protected
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected enableAds: boolean = false;

  /**
   * enum des paramètre pour template
   *
   * @readonly
   * @protected
   * @memberof SettingsPage
   */
  protected readonly setting = Settings;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of SettingsPage.
   * @param {DBServiceProvider} settingCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {NotifServiceProvider} notifCtrl
   * @memberof SettingsPage
   */
  constructor(
    private readonly settingCtrl: DBServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly notifCtrl: NotifServiceProvider,
    private readonly adsCtrl: AdsServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {}

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * permet de chercher et mettre à jour les réglage existant au démarrage
   *
   * @memberof SettingsPage
   */
  ionViewDidLoad() {
    this.settingCtrl.getSetting(Settings.AUTO_LOG_IN).then(res => {
      this.autoLogIn = res;
    });

    this.settingCtrl.getSetting(Settings.AUTO_READ_ALERT).then(res => {
      this.autoReadAlert = res;
    });

    this.settingCtrl.getSetting(Settings.DISABLE_OFFLINE).then(res => {
      this.disableOffline = res;
    });

    this.settingCtrl.getSetting(Settings.DISABLE_NOTIF).then(res => {
      this.disableNotification = res;
    });

    this.settingCtrl.getSetting(Settings.DISABLE_SMS).then(res => {
      this.disableSMS = res;
    });

    this.settingCtrl.getSetting(Settings.AUTO_IMPORT).then(res => {
      this.autoImport = res;
    });

    this.settingCtrl.getSetting(Settings.ENABLE_STS).then(res => {
      this.enableSTS = res;
    });

    this.settingCtrl.getSetting(Settings.ENABLE_UNSURE_MODE).then(res => {
      this.enableUnsure = res;
    });

    this.settingCtrl.getSetting(Settings.SHOW_ADS_BANNER).then(res => {
      this.enableAds = res;
    });
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************

  /**
   * retourne si l'utilisateur est authentifié
   *
   * @readonly
   * @type {boolean}
   * @memberof SettingsPage
   */
  protected get isConnected(): boolean {
    return this.authCtrl.isConnected();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * permet de définie une nouvelle valeur pour un paramètre.
   * Si il s'agit du paramètre de notification, alors envoie une requête au service de notification
   *
   * @protected
   * @param {*} event
   * @param {Settings} setting
   * @returns {Promise<void>}
   * @memberof SettingsPage
   */
  protected async defSetting(event: any, setting: Settings): Promise<void> {
    await this.settingCtrl.setSetting(setting, event.value);
    if (setting === Settings.DISABLE_NOTIF) {
      this.notifCtrl.redefNotifStatus();
    } else if (setting === Settings.SHOW_ADS_BANNER) {
      this.adsCtrl.refreshBanner();
      if (event.value === 'true' || event.value === true) {
        this.uiCtrl.alert(':)', 'Merci!');
      } else {
        this.uiCtrl.alert(':(', "Okay, pas de pubs :'(");
      }
    } else if (setting === Settings.AUTO_READ_ALERT) {
      return this.uiCtrl.refreshAutoRead();
    }
  }

  /**
   * réinitialise l'ensemble des paramètre (si l'utilisateur est connecté)
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof SettingsPage
   */
  protected async reset(): Promise<void> {
    if (this.isConnected) {
      await this.settingCtrl.resetSettings();
      this.ionViewDidLoad();
    }
  }
}
