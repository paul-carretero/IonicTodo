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

  private static readonly interstitialConfig: AdMobFreeInterstitialConfig = {
    isTesting: false,
    //autoShow: false
    id: 'ca-app-pub-6084326990034246/4133759041'
  };

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

  public async showInterstitial(): Promise<void> {
    this.adsCtrl.interstitial.config(AdsServiceProvider.interstitialConfig);
    try {
      const lol = await this.adsCtrl.interstitial.prepare();
      console.log(lol);
      const res = await this.adsCtrl.interstitial.isReady();
      console.log(res);
      console.log('----------------');
      if (res) {
        this.adsCtrl.interstitial.show();
      }
    } catch (error) {}
  }

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
  private async hideBanner(): Promise<void> {
    this.adsCtrl.banner.hide();
  }
}
