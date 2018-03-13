import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NFC, Ndef, NdefEvent, NdefRecord } from '@ionic-native/nfc';
import { Subscription } from 'rxjs';

@Injectable()
export class NfcProvider {
  constructor(private nfc: NFC, private ndef: Ndef) {
    this.listenToTag();
  }

  private listenToTag(): void {
    this.nfc
      .addNdefListener(
        () => {
          console.log('successfully attached ndef listener');
        },
        err => {
          console.log('error attaching ndef listener', err);
        }
      )
      .subscribe(event => {
        console.log('received ndef message. the tag contains: ', event.tag);
        console.log('decoded tag id', this.nfc.bytesToHexString(event.tag.id));
      });
  }

  public write(data: any): void {
    const message = this.ndef.textRecord(JSON.stringify(data), 'English', '42');
    this.nfc
      .share([message])
      .then((res: any) =>
        console.log('share success => ' + JSON.stringify(res))
      )
      .catch((res: any) => console.log('share fail => ' + JSON.stringify(res)));
  }
}
