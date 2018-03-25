import { Component } from '@angular/core';
import { ActionSheetController, IonicPage, ViewController } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';

import { MenuRequestType } from '../../model/menu-request-type';
import { Media } from './../../model/media';
import { EventServiceProvider } from './../../providers/event/event-service';

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
  protected onLine: boolean;

  protected request = MenuRequestType;

  private onlineSub: Subscription;

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
    this.onLine = true;
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * défini les constante du header en fonction de la page
   *
   * @memberof PopoverOptionsPage
   */
  ionViewDidLoad() {
    this.editable = this.evtCtrl.getHeader().editable;
    this.shareable = this.evtCtrl.getHeader().shareable;
    this.importable = this.evtCtrl.getHeader().importable;
    this.copiable = this.evtCtrl.getHeader().copiable;
    this.isList = this.evtCtrl.getHeader().isList;
    this.pastable =
      this.evtCtrl.getHeader().pastable && this.evtCtrl.getCopiedTodoRef() != null;
  }

  /**
   * s'ajoute en observer du status de la connexion
   *
   * @memberof PopoverOptionsPage
   */
  ionViewWillEnter(): void {
    this.onlineSub = this.evtCtrl.getNetStatusObs().subscribe(res => {
      this.onLine = res;
    });
  }

  /**
   * se désinscrit du sujet du status de la connexion
   *
   * @memberof PopoverOptionsPage
   */
  ionViewWillExit(): void {
    if (this.onlineSub != null) {
      this.onlineSub.unsubscribe();
    }
  }

  private openShareMenu(): void {
    const actionSheet = this.actionSheetCtrl.create({
      title: '⇄ Partager Cette liste',
      subTitle:
        'Vos destinataires recevront un lien de cette liste. Vous pourrez choisir de cloner ou lier votre liste',
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
