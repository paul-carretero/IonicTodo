import { Component } from '@angular/core';
import { ActionSheetController, IonicPage, ViewController } from 'ionic-angular';

import { Media } from './../../model/media';
import { EventServiceProvider } from './../../providers/event/event-service';
import { MenuRequestType } from '../../model/menu-request-type';

@IonicPage()
@Component({
  selector: 'page-popover-options',
  templateUrl: 'popover-options.html'
})
export class PopoverOptionsPage {
  public editable: boolean;
  public shareable: boolean;
  public importable: boolean;
  public pastable: boolean;
  public copiable: boolean;

  /**
   * Creates an instance of PopoverOptionsPage.
   * @param {ViewController} viewCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {ActionSheetController} actionSheetCtrl
   * @memberof PopoverOptionsPage
   */
  constructor(
    private readonly viewCtrl: ViewController,
    private readonly evtCtrl: EventServiceProvider,
    public readonly actionSheetCtrl: ActionSheetController
  ) {}

  ionViewDidLoad() {
    this.editable = this.evtCtrl.getHeader().editable;
    this.shareable = this.evtCtrl.getHeader().shareable;
    this.importable = this.evtCtrl.getHeader().importable;
    this.copiable = this.evtCtrl.getHeader().copiable;
    this.pastable =
      this.evtCtrl.getHeader().pastable && this.evtCtrl.getCopiedTodoRef != null;
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
            this.evtCtrl
              .getMenuRequestSubject()
              .next({ request: MenuRequestType.SEND, media: Media.CLOUD });
          }
        },
        {
          text: 'Envoyer par NFC',
          icon: 'phone-portrait',
          handler: () => {
            this.evtCtrl
              .getMenuRequestSubject()
              .next({ request: MenuRequestType.SEND, media: Media.NFC });
          }
        },
        {
          text: 'Afficher un QRCode à flasher',
          icon: 'qr-scanner',
          handler: () => {
            this.evtCtrl
              .getMenuRequestSubject()
              .next({ request: MenuRequestType.SEND, media: Media.QR_CODE });
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
            this.evtCtrl
              .getMenuRequestSubject()
              .next({ request: MenuRequestType.SHARE, media: Media.CLOUD });
          }
        },
        {
          text: 'Partager par NFC',
          icon: 'logo-rss',
          handler: () => {
            this.evtCtrl
              .getMenuRequestSubject()
              .next({ request: MenuRequestType.SHARE, media: Media.NFC });
          }
        },
        {
          text: 'Afficher un QRCode à flasher',
          icon: 'qr-scanner',
          handler: () => {
            this.evtCtrl
              .getMenuRequestSubject()
              .next({ request: MenuRequestType.SHARE, media: Media.QR_CODE });
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
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.DELETE });
  }

  public edit() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.EDIT });
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
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.HELP });
  }

  public import() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.IMPORT });
  }

  public copy() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.COPY });
  }

  public paste() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.PASTE });
  }
}
