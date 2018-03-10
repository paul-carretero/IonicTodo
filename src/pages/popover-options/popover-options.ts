import { Media } from './../../model/media';
import { PageData } from './../../model/page-data';
import { Subscription } from 'rxjs';
import { EventServiceProvider } from './../../providers/event/event-service';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
  ActionSheetController
} from 'ionic-angular';
import { MenuRequest } from '../../model/menu-request';

@IonicPage()
@Component({
  selector: 'page-popover-options',
  templateUrl: 'popover-options.html'
})
export class PopoverOptionsPage {
  private updateSub: Subscription;
  private helpOnly: boolean;
  private importable: boolean;

  constructor(
    private viewCtrl: ViewController,
    private evtCtrl: EventServiceProvider,
    public actionSheetCtrl: ActionSheetController
  ) {}

  ionViewDidEnter() {
    this.updateSub = this.evtCtrl
      .getHeadeSubject()
      .subscribe((newData: PageData) => {
        this.helpOnly = newData.helpOnly;
        this.importable = newData.importable;
      });
  }

  ionViewWillLeave() {
    this.updateSub.unsubscribe();
  }

  private openSendMenu(): void {
    const actionSheet = this.actionSheetCtrl.create({
      title: '⇄ Envoyer Cette liste',
      subTitle:
        'Vos destinataires recevront une copie de cette liste. Les listes seront complètement indépendante',
      buttons: [
        {
          text: 'Envoyer par Bluetooth',
          icon: 'bluetooth',
          handler: () => {
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SEND);
            this.evtCtrl.defMedia(Media.BLUETOOTH);
          }
        },
        {
          text: 'Envoyer par NFC',
          icon: 'logo-rss',
          handler: () => {
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SEND);
            this.evtCtrl.defMedia(Media.NFC);
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
          text: 'Partager par Bluetooth',
          icon: 'bluetooth',
          handler: () => {
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SHARE);
            this.evtCtrl.defMedia(Media.BLUETOOTH);
          }
        },
        {
          text: 'Partager par NFC',
          icon: 'logo-rss',
          handler: () => {
            this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SHARE);
            this.evtCtrl.defMedia(Media.NFC);
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
