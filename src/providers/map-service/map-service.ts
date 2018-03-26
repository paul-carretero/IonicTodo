import { ILatLng } from '@ionic-native/google-maps';
import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { UiServiceProvider } from '../ui-service/ui-service';

@Injectable()
export class MapServiceProvider {
  private myPosition: null | ILatLng;
  private timeoutPos: any;

  constructor(
    private readonly nativeGeocoder: NativeGeocoder,
    private readonly geolocCtrl: Geolocation,
    private readonly uiCtrl: UiServiceProvider
  ) {}

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
   * reset la position courrante au bout d'une certaine durée, (100s par défault)
   *
   * @private
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

  /**
   * en cas d'échec de géoposition, si le téléphone est en fait un grille-pain on alloue plus de temps et on conserve le résultat plus longtemps
   *
   * @private
   * @returns {Promise<void>}
   * @memberof MapServiceProvider
   */
  private async trySilentUpdate(): Promise<void> {
    try {
      const geoPos = await this.geolocCtrl.getCurrentPosition({
        timeout: 30000,
        enableHighAccuracy: false
      });
      this.myPosition = { lat: geoPos.coords.latitude, lng: geoPos.coords.longitude };
      this.resetMyPosition(1000000);
    } catch (error) {
      console.log(error);
    }
  }

  public async getMyPosition(): Promise<ILatLng | null> {
    if (this.myPosition != null) {
      return this.myPosition;
    }
    try {
      const geoPos = await this.geolocCtrl.getCurrentPosition({
        timeout: 5000,
        enableHighAccuracy: true
      });
      this.myPosition = { lat: geoPos.coords.latitude, lng: geoPos.coords.longitude };
      this.resetMyPosition();
      return this.myPosition;
    } catch (error) {
      this.uiCtrl.displayToast(
        "Impossible d'obtenir votre position, veuillez vérifier vos paramètres"
      );
      console.log(error);
      this.trySilentUpdate();
      return null;
    }
  }

  public async getCity(coord: ILatLng): Promise<string | null> {
    try {
      const res: any = await this.nativeGeocoder.reverseGeocode(coord.lat, coord.lng);
      return res[0].locality;
    } catch (error) {
      return null;
    }
  }
}
