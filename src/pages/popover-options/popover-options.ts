import { Observable } from 'rxjs/Rx';
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
  protected editable: boolean;
  protected shareable: boolean;
  protected importable: boolean;
  protected pastable: boolean;
  protected copiable: boolean;
  protected isList: boolean;
  protected onLine: Observable<boolean>;

  protected request = MenuRequestType;

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
  ) {
    this.onLine = this.evtCtrl.getNetStatusObs();
  }

  ionViewDidLoad() {
    this.editable = this.evtCtrl.getHeader().editable;
    this.shareable = this.evtCtrl.getHeader().shareable;
    this.importable = this.evtCtrl.getHeader().importable;
    this.copiable = this.evtCtrl.getHeader().copiable;
    this.isList = this.evtCtrl.getHeader().isList;
    this.pastable =
      this.evtCtrl.getHeader().pastable && this.evtCtrl.getCopiedTodoRef() != null;
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

  protected close() {
    this.viewCtrl.dismiss();
  }

  /**
   * Demande utilisateur pour partager une liste par référence
   *
   * @memberof PopoverOptionsPage
   */
  protected share() {
    this.viewCtrl.dismiss();
    this.openShareMenu();
  }

  /**
   * Demande utilisateur pour partager une liste par valeur
   *
   * @memberof PopoverOptionsPage
   */
  protected send() {
    this.viewCtrl.dismiss();
    this.openSendMenu();
  }

  /**
   * envoi une notification d'action menu d'un type défini
   *
   * @protected
   * @param {MenuRequestType} type
   * @returns {void}
   * @memberof PopoverOptionsPage
   */
  protected basicRequest(type: MenuRequestType): void {
    if (type == null) {
      return;
    }
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next({ request: type });
  }
}
