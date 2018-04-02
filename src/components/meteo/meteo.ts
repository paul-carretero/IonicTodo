import { ISimpleWeather } from './../../model/weather';
import { Component, Input, OnInit } from '@angular/core';
import moment from 'moment';

/**
 * affiche une card de météo
 *
 * @export
 * @class MeteoComponent
 */
@Component({
  selector: 'meteo',
  templateUrl: 'meteo.html'
})
export class MeteoComponent implements OnInit {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * la météo à afficher
   *
   * @type {ISimpleWeather}
   * @memberof MeteoComponent
   */
  @Input() weather: ISimpleWeather;

  /**
   * le jour en format humain de la météo
   *
   * @protected
   * @type {string}
   * @memberof MeteoComponent
   */
  protected date: string;

  /**
   * url de l'icone
   *
   * @protected
   * @type {string}
   * @memberof MeteoComponent
   */
  protected iconSrc: string;

  /**
   * température en string et arrondie
   *
   * @protected
   * @type {string}
   * @memberof MeteoComponent
   */
  protected temp: string;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of MeteoComponent.
   * @memberof MeteoComponent
   */
  constructor() {}

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise les constante du template
   *
   * @memberof MeteoComponent
   */
  ngOnInit(): void {
    this.date = moment(this.weather.date)
      .locale('fr')
      .format('dddd DD MMMM YYYY');

    this.temp = this.weather.temp.toFixed(0);

    this.iconSrc = 'http://openweathermap.org/img/w/' + this.weather.icon + '.png';
  }
}
