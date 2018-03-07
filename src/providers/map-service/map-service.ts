import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GeocoderRequest, Geocoder } from '@ionic-native/google-maps';

/*
  Generated class for the MapServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MapServiceProvider {
  constructor() {}

  public showLocation() {
    Geocoder.geocode({
      address: '23 rue du marechal Lyautey, 33500 Libourne, France'
    }).then(coord => {
      console.log(JSON.stringify(coord));
    });
  }
}
