import { Injectable } from '@angular/core';
import {
  AdMobFree,
  AdMobFreeBannerConfig,
  AdMobFreeInterstitialConfig
} from '@ionic-native/admob-free';

import { Settings } from './../../model/settings';
import { DBServiceProvider } from './../db/db-service';

/**
 * gère des bannières et page de pubs
 *
 * @export
 * @class AdsServiceProvider
 */
@Injectable()
export class AdsServiceProvider {
  /**
   * paramètre pour la bannière top
   *
   * @private
   * @static
   * @type {AdMobFreeBannerConfig}
   * @memberof AdsServiceProvider
   */
  private static readonly bannerConfig: AdMobFreeBannerConfig = {
    isTesting: false,
    autoShow: false,
    bannerAtTop: true,
    id: 'ca-app-pub-6084326990034246/5632218137'
  };

  /**
   * paramètres pour la page de pub intersticiel
   *
   * @private
   * @static
   * @type {AdMobFreeInterstitialConfig}
   * @memberof AdsServiceProvider
   */
  private static readonly interstitialConfig: AdMobFreeInterstitialConfig = {
    isTesting: false,
    autoShow: true,
    id: 'ca-app-pub-6084326990034246/4133759041'
  };

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AdsServiceProvider.
   * @param {AdMobFree} adsCtrl
   * @param {DBServiceProvider} dbCtrl
   * @memberof AdsServiceProvider
   */
  constructor(
    private readonly adsCtrl: AdMobFree,
    private readonly dbCtrl: DBServiceProvider
  ) {}

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * en fonction des paramètres locaux, affiche ou masque la bannière top
   *
   * @public
   * @returns {Promise<void>}
   * @memberof AdsServiceProvider
   */
  public async refreshBanner(): Promise<void> {
    const showBanner = await this.dbCtrl.getSetting(Settings.SHOW_ADS_BANNER);
    if (showBanner) {
      this.showBanner();
    } else {
      this.hideBanner();
    }
  }

  /**
   * affiche une pub de type insterstitial au bout d'un petit moment
   *
   * @returns {Promise<void>}
   * @memberof AdsServiceProvider
   */
  public async showInterstitial(): Promise<void> {
    this.adsCtrl.interstitial.config(AdsServiceProvider.interstitialConfig);
    try {
      await this.adsCtrl.interstitial.prepare();
    } catch (error) {}
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * prépare et affiche la bannière top
   *
   * @private
   * @returns {Promise<void>}
   * @memberof AdsServiceProvider
   */
  private async showBanner(): Promise<void> {
    this.adsCtrl.banner.config(AdsServiceProvider.bannerConfig);
    try {
      await this.adsCtrl.banner.prepare();
      this.adsCtrl.banner.show();
    } catch (error) {}
  }

  /**
   * masque la bannière top
   *
   * @private
   * @returns {Promise<void>}
   * @memberof AdsServiceProvider
   */
  private hideBanner(): void {
    this.adsCtrl.banner.remove().catch();
  }
}
