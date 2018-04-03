import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

import { ISimpleWeather } from './../../model/weather';

@IonicPage()
@Component({
  selector: 'page-meteo-modal',
  templateUrl: 'meteo-modal.html'
})
export class MeteoModalPage {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * tableau des météos à afficher
   *
   * @private
   * @type {IWeather[]}
   * @memberof MeteoModalPage
   */
  protected readonly weathers: ISimpleWeather[];

  /**
   * sous titre (ville de la météo)
   *
   * @protected
   * @type {string}
   * @memberof MeteoModalPage
   */
  protected readonly subtitle: string;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of MeteoModalPage.
   * @param {NavParams} navParams
   * @param {ViewController} viewCtrl
   * @memberof MeteoModalPage
   */
  constructor(
    private readonly navParams: NavParams,
    private readonly viewCtrl: ViewController
  ) {
    this.weathers = this.navParams.get('data');
    if (this.weathers == null || this.weathers.length === 0) {
      this.weathers = [];
      this.subtitle = '';
    } else {
      this.subtitle = this.weathers[0].city;
    }
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * ferme la fenetre d'aide
   *
   * @protected
   * @memberof MeteoModalPage
   */
  protected dismiss(): void {
    this.viewCtrl.dismiss();
  }
}
