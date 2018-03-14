import { Component } from '@angular/core';
import { ActionSheetController, IonicPage, ViewController, Events } from 'ionic-angular';

import { Media } from './../../model/media';
import { Global } from '../../shared/global';
import { MenuRequestType } from '../../model/menu-request-type';

@IonicPage()
@Component({
  selector: 'page-popover-options',
  templateUrl: 'popover-options.html'
})
export class PopoverOptionsPage {
  /**
   * Creates an instance of PopoverOptionsPage.
   * @param {ViewController} viewCtrl
   * @param {Events} evtCtrl
   * @param {ActionSheetController} actionSheetCtrl
   * @memberof PopoverOptionsPage
   */
  constructor(
    private readonly viewCtrl: ViewController,
    private readonly evtCtrl: Events,
    private readonly actionSheetCtrl: ActionSheetController
  ) {}

  get editable(): boolean {
    return Global.HEADER.editable;
  }

  get shareable(): boolean {
    return Global.HEADER.shareable;
  }

  get importable(): boolean {
    return Global.HEADER.importable;
  }

  private openSendMenu(): void {
    const actionSheet = this.actionSheetCtrl.create({
      title: '⇄ Envoyer Cette liste',
      subTitle:
        'Vos destinataires recevront une copie de cette liste. Les listes seront complètement indépendante',
      buttons: [
        {
          text: 'Envoyer sur le cloud',
          icon: 'cloud-upload',
          handler: () => {
            this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
              request: MenuRequestType.SEND,
              media: Media.CLOUD
            });
          }
        },
        {
          text: 'Envoyer par NFC',
          icon: 'phone-portrait',
          handler: () => {
            this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
              request: MenuRequestType.SEND,
              media: Media.NFC
            });
          }
        },
        {
          text: 'Afficher un QRCode à flasher',
          icon: 'qr-scanner',
          handler: () => {
            this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
              request: MenuRequestType.SEND,
              media: Media.QR_CODE
            });
          }
        },
        {
          text: 'Annuler',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });
    actionSheet.present();
  }

  private openShareMenu(): void {
    const actionSheet = this.actionSheetCtrl.create({
      title: '⇄ Partager Cette liste',
      subTitle:
        'Vos destinataires recevront un lien de cette liste. Les listes seront complètement synchronisée',
      buttons: [
        {
          text: 'Partager sur le cloud',
          icon: 'cloud-upload',
          handler: () => {
            this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
              request: MenuRequestType.SHARE,
              media: Media.CLOUD
            });
          }
        },
        {
          text: 'Partager par NFC',
          icon: 'logo-rss',
          handler: () => {
            this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
              request: MenuRequestType.SHARE,
              media: Media.NFC
            });
          }
        },
        {
          text: 'Afficher un QRCode à flasher',
          icon: 'qr-scanner',
          handler: () => {
            this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
              request: MenuRequestType.SHARE,
              media: Media.QR_CODE
            });
          }
        },
        {
          text: 'Annuler',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });
    actionSheet.present();
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public delete() {
    this.viewCtrl.dismiss();
    this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
      request: MenuRequestType.DELETE
    });
  }

  public edit() {
    this.viewCtrl.dismiss();
    this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
      request: MenuRequestType.EDIT
    });
  }

  /**
   * Demande utilisateur pour partager une liste par référence
   *
   * @memberof PopoverOptionsPage
   */
  public share() {
    this.viewCtrl.dismiss();
    this.openShareMenu();
  }

  /**
   * Demande utilisateur pour partager une liste par valeur
   *
   * @memberof PopoverOptionsPage
   */
  public send() {
    this.viewCtrl.dismiss();
    this.openSendMenu();
  }

  public help() {
    this.viewCtrl.dismiss();
    this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
      request: MenuRequestType.HELP
    });
  }

  public import() {
    this.viewCtrl.dismiss();
    this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
      request: MenuRequestType.IMPORT
    });
  }
}
