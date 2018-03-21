import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import { ILatLng } from '../../model/latlng';
import { NativeGeocoder } from '@ionic-native/native-geocoder';

@Injectable()
export class MapServiceProvider {
  constructor(
    private readonly nativeGeocoder: NativeGeocoder,
    private readonly geolocCtrl: Geolocation
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

  public lol() {
    this.AddressToCoord('23 rue du marechal Lyautey 33500 Libourne').then(
      (coordinate: ILatLng) => {
        this.coordToAddress(coordinate.lat, coordinate.lng).then((res: string) => {
          console.log(res);
        });
      }
    );
  }

  public async getMyPosition(): Promise<ILatLng | null> {
    try {
      const geoPos = await this.geolocCtrl.getCurrentPosition({ timeout: 5000 });
      return { lat: geoPos.coords.latitude, lng: geoPos.coords.longitude };
    } catch (error) {
      console.log();
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
