import { ILatLng } from '@ionic-native/google-maps';
import { Injectable } from '@angular/core';
import {
  NativeGeocoder,
  NativeGeocoderForwardResult,
  NativeGeocoderReverseResult
} from '@ionic-native/native-geocoder';

@Injectable()
export class MapServiceProvider {
  constructor(private readonly nativeGeocoder: NativeGeocoder) {}

  public coordToAddress(lat: number, long: number): Promise<string> {
    const promise: Promise<string> = new Promise<string>((resolve, reject) => {
      this.nativeGeocoder
        .reverseGeocode(lat, long)
        .then((res: NativeGeocoderReverseResult) => {
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
        .then((res: NativeGeocoderForwardResult) => {
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
}
