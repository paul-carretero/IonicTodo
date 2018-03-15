import { Component } from '@angular/core';
import {
  AlertController,
  IonicPage,
  LoadingController,
  ModalController,
  NavController,
  NavParams,
  ToastController
} from 'ionic-angular';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { ICloudSharedList } from './../../../model/cloud-shared-list';
import { ISimpleContact } from './../../../model/simple-contact';
import { CloudServiceProvider } from './../../../providers/cloud-service/cloud-service';
import { EventServiceProvider } from './../../../providers/event/event-service';
import { MapServiceProvider } from './../../../providers/map-service/map-service';
import { SpeechSynthServiceProvider } from './../../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { Global } from './../../../shared/global';
import { GenericSharer } from './../generic-sharer';

@IonicPage()
@Component({
  selector: 'page-cloud-sender',
  templateUrl: 'cloud-sender.html'
})
export class CloudSenderPage extends GenericSharer {
  public password: string = null;

  private readonly shareData: ICloudSharedList;

  private readonly contactList: Map<string, ISimpleContact>;

  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly loadingCtrl: LoadingController,
    public readonly alertCtrl: AlertController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider,
    private readonly cloudCtrl: CloudServiceProvider,
    private readonly mapService: MapServiceProvider,
    private readonly modalCtrl: ModalController
  ) {
    super(
      navParams,
      navCtrl,
      loadingCtrl,
      alertCtrl,
      evtCtrl,
      ttsCtrl,
      todoCtrl,
      toastCtrl,
      authCtrl
    );
    this.shareData = Global.getDefaultCloudShareData();
    this.contactList = new Map();
  }

  get sendPartage(): string[] {
    if (this.choice === 'send') {
      return ['envoyer', 'envoyée', 'envoi'];
    }
    return ['partager', 'partagée', 'partage'];
  }

  public async share(): Promise<void> {
    this.showLoading(this.sendPartage[2] + ' de votre liste en cours');
    this.shareData.list = this.list;

    let coord = await this.mapService.getMyPosition();
    coord = Global.roundILatLng(coord);
    this.shareData.coord = coord;

    this.shareData.email = this.authCtrl.getUser().email;
    this.shareData.password = this.password;
    this.shareData.shareWithShake = false;

    await this.cloudCtrl.postNewShareRequest(this.shareData);

    this.loading.dismiss();
    this.displayToast('La liste à été ' + this.sendPartage[1] + ' avec succès');
    this.navCtrl.pop();
  }

  public openContactPopup(): void {
    const contactModal = this.modalCtrl.create('ContactModalPage', {
      contacts: this.contactList,
      onlyEmail: true
    });
    contactModal.present();
  }

  get textContact(): string {
    if (this.contactList.size === 0) {
      return (
        'Cette opération est facultative.<br/> ' +
        'Les contacts choisis seront automatiquement <br/> ' +
        'ajoutés à votre ' +
        this.sendPartage[2] +
        " s'ils possèdent un <br/> " +
        "compte sur l'application"
      );
    }
    return (
      'Vous avez associé ' +
      this.contactList.size +
      ' contacts à ce ' +
      this.sendPartage[2]
    );
  }
}
