import { Injectable } from '@angular/core';
import { Ndef, NFC } from '@ionic-native/nfc';

import { ITodoListPath } from './../../model/todo-list-path';
import { TodoServiceProvider } from './../todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../ui-service/ui-service';

/**
 * observe si un partage de liste par nfc est disponible et fourni des méthodes pour partager des objet (liste) par nfc
 *
 * @export
 * @class NfcProvider
 */
@Injectable()
export class NfcProvider {
  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of NfcProvider.
   * @param {NFC} nfc
   * @param {Ndef} ndef
   * @param {TodoServiceProvider} todoCtrl
   * @param {UiServiceProvider} uiCtrl
   * @memberof NfcProvider
   */
  constructor(
    private readonly nfc: NFC,
    private readonly ndef: Ndef,
    private readonly todoCtrl: TodoServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {}

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * écoute les tag nfc NDEF et si un tag est disponible avec une liste
   *
   * @public
   * @memberof NfcProvider
   */
  public listenForEvents(): void {
    this.nfc
      .addNdefListener(
        () => {
          console.log('successfully attached ndef listener');
        },
        (err: any) => {
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
          const json: ITodoListPath = JSON.parse(tagContent);
          if (json.listUUID != null && json.userUUID != null) {
            this.publishJson(json);
          } else {
            this.uiCtrl.displayToast('Tag détecté mais contenu illisible');
          }
        } catch (error) {
          console.log('Tag détecté mais contenu illisible ( ' + tagContent + ' )');
        }
      });
  }

  /**
   * permet d'écrire un chemin de partage de liste sur un tag nfc
   *
   * @public
   * @param {string} json
   * @returns {Promise<void>}
   * @memberof NfcProvider
   */
  public async write(json: string): Promise<void> {
    const message = this.ndef.textRecord(json, 'en', '42');
    await this.nfc.write([message]);
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * permet de publier au todoservice un chemin vers une liste partagé
   *
   * @private
   * @param {ITodoListPath} json
   * @returns {Promise<void>}
   * @memberof NfcProvider
   */
  private async publishJson(json: ITodoListPath): Promise<void> {
    if (json != null) {
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
  }
}
