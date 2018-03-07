import { Coordinates } from './../../model/coordinates';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  NativeGeocoder,
  NativeGeocoderReverseResult,
  NativeGeocoderForwardResult
} from '@ionic-native/native-geocoder';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class MapServiceProvider {
  constructor(private nativeGeocoder: NativeGeocoder) {}

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
        .catch((error: any) => {
          reject();
        });
    });
    return promise;
  }

  public AddressToCoord(address: string): Promise<Coordinates> {
    const promise: Promise<Coordinates> = new Promise<Coordinates>(
      (resolve, reject) => {
        this.nativeGeocoder
          .forwardGeocode(address)
          .then((res: NativeGeocoderForwardResult) => {
            resolve({
              latitude: res[0].latitude,
              longitude: res[0].longitude
            });
          })
          .catch((error: any) => {
            reject();
          });
      }
    );
    return promise;
  }

  public lol() {
    this.AddressToCoord('23 rue du marechal Lyautey 33500 Libourne').then(
      (coordinate: Coordinates) => {
        this.coordToAddress(coordinate.latitude, coordinate.longitude).then(
          (res: string) => {
            console.log(res);
          }
        );
      }
    );
  }
}
