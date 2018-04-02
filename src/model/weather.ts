/**
 * données météos de l'api openweather
 * les données inutiles ont été tronquées...
 *
 * @export
 * @interface IWeather
 */
export interface IRawWeather {
  /**
   * liste de météo pour les 5 jours a venir
   *
   * @type {IWeather[]}
   * @memberof IRawWeather
   */
  list: IWeather[];

  /**
   * ville de la météo
   *
   * @type {{name:string}}
   * @memberof IRawWeather
   */
  city: { name: string };
}

export interface IWeather {
  /**
   * identifiant unique de la météo dans la liste
   *
   * @type {number}
   * @memberof IWeather
   */
  id: number;

  /**
   * timestamp utc unix
   *
   * @type {number}
   * @memberof IWeather
   */
  dt: number;

  /**
   * objet qui donne des température (on garde la principale)
   *
   * @type {{ temp: number }}
   * @memberof IWeather
   */
  main: { temp: number };

  /**
   * description de la météo (un tableau de une case...)
   *
   * @type {[{ description: string; icon: string }]}
   * @memberof IWeather
   */
  weather: [{ description: string; icon: string }];
}

/**
 * représente une météo à une date donné en format simple (seule les infos utile sont conservées)
 *
 * @export
 * @interface ISimpleWeather
 */
export interface ISimpleWeather {
  /**
   * date de cette météo
   *
   * @type {Date}
   * @memberof ISimpleWeather
   */
  date: Date;

  /**
   * température lors de cette date
   *
   * @type {number}
   * @memberof ISimpleWeather
   */
  temp: number;

  /**
   * description de la météo
   *
   * @type {string}
   * @memberof ISimpleWeather
   */
  desc: string;

  /**
   * icone de la météo
   *
   * @type {string}
   * @memberof ISimpleWeather
   */
  icon: string;

  /**
   * ville de la météo
   *
   * @type {string}
   * @memberof ISimpleWeather
   */
  city: string;
}
