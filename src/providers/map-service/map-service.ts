import { ILatLng } from '@ionic-native/google-maps';
import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { UiServiceProvider } from '../ui-service/ui-service';

/**
 * fourni des services relatif à la localisation de l'utilisateur et aux addresses
 *
 * @export
 * @class MapServiceProvider
 */
@Injectable()
export class MapServiceProvider {
  /**
   * dernière position connue dans le cache
   *
   * @private
   * @type {(null | ILatLng)}
   * @memberof MapServiceProvider
   */
  private myPosition: null | ILatLng;

  /**
   * timeout pour clear le cache de position
   *
   * @private
   * @type {*}
   * @memberof MapServiceProvider
   */
  private timeoutPos: any;

  /**
   * controlleur ui pour registration
   *
   * @private
   * @type {UiServiceProvider}
   * @memberof MapServiceProvider
   */
  private uiCtrl: UiServiceProvider;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of MapServiceProvider.
   * @param {NativeGeocoder} nativeGeocoder
   * @param {Geolocation} geolocCtrl
   * @memberof MapServiceProvider
   */
  constructor(
    private readonly nativeGeocoder: NativeGeocoder,
    private readonly geolocCtrl: Geolocation
  ) {}

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * permet au controlleur ui de s'enregistrer sur ce service à la création
   *
   * @param {UiServiceProvider} u
   * @memberof MapServiceProvider
   */
  public registerUiCtrl(u: UiServiceProvider): void {
    this.uiCtrl = u;
  }

  /**
   * converti une coordonnée en addresse
   *
   * @param {number} lat
   * @param {number} long
   * @returns {Promise<string>}
   * @memberof MapServiceProvider
   */
  public coordToAddress(lat: number, long: number): Promise<string> {
    const promise: Promise<string> = new Promise<string>((resolve, reject) => {
      this.nativeGeocoder
        .reverseGeocode(lat, long)
        .then((res: any) => {
          resolve(
            res[0].subThoroughfare +
              ' ' +
              res[0].thoroughfare +
              ' ' +
              res[0].postalCode +
              ' ' +
              res[0].locality +
              ' - ' +
              res[0].countryName
          );
        })
        .catch(() => {
          reject();
        });
    });
    return promise;
  }

  /**
   * converti une addresse en coordonné
   *
   * @param {string} address
   * @returns {Promise<ILatLng>}
   * @memberof MapServiceProvider
   */
  public AddressToCoord(address: string): Promise<ILatLng> {
    const promise: Promise<ILatLng> = new Promise<ILatLng>((resolve, reject) => {
      this.nativeGeocoder
        .forwardGeocode(address)
        .then((res: any) => {
          resolve({
            lat: res[0].latitude,
            lng: res[0].longitude
          });
        })
        .catch(() => {
          reject();
        });
    });
    return promise;
  }

  /**
   * retourne la position courrante de l'utilisateur et la garde en cache pour quelque temps
   *
   * @returns {(Promise<ILatLng | null>)}
   * @memberof MapServiceProvider
   */
  public async getMyPosition(): Promise<ILatLng | null> {
    if (this.myPosition != null) {
      return this.myPosition;
    }
    try {
      const geoPos = await this.geolocCtrl.getCurrentPosition({
        timeout: 6000,
        enableHighAccuracy: true
      });
      this.myPosition = { lat: geoPos.coords.latitude, lng: geoPos.coords.longitude };
      this.resetMyPosition();
      return this.myPosition;
    } catch (error) {
      this.uiCtrl.displayToast(
        "Impossible d'obtenir votre position, veuillez vérifier vos paramètres"
      );
      return null;
    }
  }

  /**
   * retourne la ville d'une coordonné
   *
   * @param {ILatLng} coord
   * @returns {(Promise<string | null>)}
   * @memberof MapServiceProvider
   */
  public async getCity(coord: ILatLng): Promise<string | null> {
    try {
      const res: any = await this.nativeGeocoder.reverseGeocode(coord.lat, coord.lng);
      return res[0].locality;
    } catch (error) {
      return null;
    }
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * reset la position courrante au bout d'une certaine durée, (100s par défault)
   *
   * @private
   * @param {number} [timeout]
   * @memberof MapServiceProvider
   */
  private resetMyPosition(timeout?: number): void {
    if (timeout == null) {
      timeout = 100000;
    }
    if (this.timeoutPos != null) {
      clearTimeout(this.timeoutPos);
      this.timeoutPos = null;
    }
    this.timeoutPos = setTimeout(() => {
      this.myPosition = null;
    }, timeout);
  }
}
