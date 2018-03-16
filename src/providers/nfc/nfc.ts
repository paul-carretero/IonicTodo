import { Injectable } from '@angular/core';
import { Ndef, NFC } from '@ionic-native/nfc';

import { ITodoListPath } from './../../model/todo-list-path';
import { TodoServiceProvider } from './../todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../ui-service/ui-service';

@Injectable()
export class NfcProvider {
  constructor(
    private readonly nfc: NFC,
    private readonly ndef: Ndef,
    private readonly todoCtrl: TodoServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {}

  public listenForEvents(): void {
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

  private async publishJson(json: ITodoListPath): Promise<void> {
    if (json == null) {
      return;
    }

    const canImport: boolean = await this.uiCtrl.confirm(
      'Import',
      "Une liste est disponible pour import NFC, voulez vous l'importer?"
    );

    if (canImport) {
      this.uiCtrl.showLoading('Import de la liste sur votre compte en cours');
      if (json.shareByReference === true) {
        await this.todoCtrl.addListLink(json);
      } else {
        await this.todoCtrl.importList(json);
      }
      this.uiCtrl.dismissLoading();
      this.uiCtrl.displayToast('La liste a été importer avec succès');
    }
  }

  public async share(json: string): Promise<void> {
    const message = this.ndef.textRecord(json, 'en', '42');
    await this.nfc.share([message]);
  }

  public async write(json: string): Promise<void> {
    const message = this.ndef.textRecord(json, 'en', '42');
    await this.nfc.write([message]);
  }
}

/*this.nfc
  .share([message])
  .then((res: any) => console.log('share success => ' + JSON.stringify(res)))
  .catch((res: any) => console.log('share fail => ' + JSON.stringify(res)));
  */
