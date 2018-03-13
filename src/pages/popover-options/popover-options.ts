import { Component } from '@angular/core';
import { ActionSheetController, IonicPage, ViewController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { MenuRequest } from '../../model/menu-request';
import { Media } from './../../model/media';
import { IPageData } from './../../model/page-data';
import { EventServiceProvider } from './../../providers/event/event-service';

@IonicPage()
@Component({
  selector: 'page-popover-options',
  templateUrl: 'popover-options.html'
})
export class PopoverOptionsPage {
  private updateSub: Subscription;
  public editable: boolean;
  public shareable: boolean;
  public importable: boolean;

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
    this.updateSub = this.evtCtrl.getHeadeSubject().subscribe((newData: IPageData) => {
      this.editable = newData.editable;
      this.shareable = newData.shareable;
      this.importable = newData.importable;
    });
  }

  ionViewWillUnload() {
    this.updateSub.unsubscribe();
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
            this.evtCtrl.defMedia(Media.CLOUD);
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SEND);
          }
        },
        {
          text: 'Envoyer par NFC',
          icon: 'phone-portrait',
          handler: () => {
            this.evtCtrl.defMedia(Media.NFC);
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SEND);
          }
        },
        {
          text: 'Afficher un QRCode à flasher',
          icon: 'qr-scanner',
          handler: () => {
            this.evtCtrl.defMedia(Media.QR_CODE);
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SEND);
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
            this.evtCtrl.defMedia(Media.CLOUD);
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SHARE);
          }
        },
        {
          text: 'Partager par NFC',
          icon: 'logo-rss',
          handler: () => {
            this.evtCtrl.defMedia(Media.NFC);
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SHARE);
          }
        },
        {
          text: 'Afficher un QRCode à flasher',
          icon: 'qr-scanner',
          handler: () => {
            this.evtCtrl.defMedia(Media.QR_CODE);
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SHARE);
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
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.DELETE);
  }

  public edit() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.EDIT);
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
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.HELP);
  }

  public import() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.IMPORT);
  }
}
