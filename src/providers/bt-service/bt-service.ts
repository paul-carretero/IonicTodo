import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';

@Injectable()
export class BtServiceProvider {
  constructor(private bluetoothSerial: BluetoothSerial) {
    bluetoothSerial.enable();
  }
}
