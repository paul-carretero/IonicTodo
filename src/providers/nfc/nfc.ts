import { Injectable } from '@angular/core';
import { Ndef, NFC } from '@ionic-native/nfc';
import {
  AlertController,
  Loading,
  LoadingController,
  ToastController
} from 'ionic-angular';

import { Global } from './../../shared/global';
import { TodoServiceProvider } from './../todo-service-ts/todo-service-ts';

@Injectable()
export class NfcProvider {
  private loading: Loading;

  constructor(
    private readonly nfc: NFC,
    private readonly ndef: Ndef,
    private readonly alertCtrl: AlertController,
    private readonly todoCtrl: TodoServiceProvider,
    private readonly toastCtrl: ToastController,
    private readonly loadingCtrl: LoadingController
  ) {
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

        const payload = event.tag.ndefMessage[0].payload;
        const tagContent = this.nfc.bytesToString(payload).substring(3);
        console.log('tag data', tagContent);
        try {
          const json = JSON.parse(tagContent);
          this.publishJson(json);
        } catch (error) {
          console.log('Tag détecté mais contenu illisible ( ' + tagContent + ' )');
        }
      });
  }

  private async publishJson(json: any): Promise<void> {
    if (json == null || json.magic == null) {
      return;
    }

    const canImport: boolean = await this.confirm();

    if (canImport && json.magic === Global.LIST_PATH_MAGIC) {
      this.showLoading();
      await this.todoCtrl.addListLink(json);
      this.loading.dismiss();
      this.importOK();
    }
    if (canImport && json.magic === Global.TODO_LIST_MAGIC) {
      this.showLoading();
      await this.todoCtrl.addList(json);
      this.loading.dismiss();
      this.importOK();
    }
  }

  private showLoading(): void {
    this.loading = this.loadingCtrl.create({
      content: 'Import de la liste sur votre compte en cours',
      dismissOnPageChange: true,
      duration: 20000
    });
    this.loading.present();
  }

  private importOK(): void {
    this.toastCtrl
      .create({
        message: 'La liste a été importer avec succès',
        duration: 3000,
        position: 'bottom'
      })
      .present();
  }

  private confirm(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.alertCtrl
        .create({
          title: 'import',
          message: "Une liste est disponible pour import NFC, voulez vous l'importer?",
          buttons: [
            {
              text: 'Annuler',
              role: 'cancel',
              handler: () => {
                resolve(false);
              }
            },
            {
              text: 'Valider',
              handler: () => {
                resolve(true);
              }
            }
          ]
        })
        .present();
    });
  }

  public async share(json: string): Promise<void> {
    const message = this.ndef.textRecord(json, 'en', '42');
    await this.nfc.share([message]);
  }

  public async write(json: string): Promise<void> {
    const message = this.ndef.textRecord(json, 'en', '42');
    await this.nfc.write([message]);
  }

  /*this.nfc
  .share([message])
  .then((res: any) => console.log('share success => ' + JSON.stringify(res)))
  .catch((res: any) => console.log('share fail => ' + JSON.stringify(res)));
  */
}
