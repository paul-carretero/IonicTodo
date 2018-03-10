import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NFC, Ndef, NdefEvent } from '@ionic-native/nfc';

@Injectable()
export class NfcProvider {
  constructor(private nfc: NFC, private ndef: Ndef) {}

  private doStuff() {
    this.nfc
      .addNdefListener(
        () => {
          console.log('successfully attached ndef listener');
        },
        err => {
          console.log('error attaching ndef listener', err);
        }
      )
      .subscribe((event: NdefEvent) => {
        console.log('received ndef message. the tag contains: ', event.tag);
        console.log('decoded tag id', this.nfc.bytesToHexString(event.tag.id));

        let message = this.ndef.textRecord('Hello world', 'FR-fr', '0');
        this.nfc
          .share([message])
          .then(() => {
            console.log('send OK');
          })
          .catch(() => {
            console.log('send FAIL');
          });
      });
  }

  addListenNFC() {
    this.nfc
      .addTagDiscoveredListener(nfcEvent => this.sesReadNFC(nfcEvent.tag))
      .subscribe(data => {
        if (data && data.tag && data.tag.id) {
          let tagId = this.nfc.bytesToHexString(data.tag.id);
          if (tagId) {
            console.log(tagId);
          } else {
            console.log('NFC_NOT_DETECTED');
          }
        }
      });
  }

  sesReadNFC(data): void {
    console.log('NFC_WORKING');
  }
}
