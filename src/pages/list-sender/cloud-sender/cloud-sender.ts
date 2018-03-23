import { Component } from '@angular/core';
import { IonicPage, ModalController, NavController, NavParams } from 'ionic-angular';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { ICloudSharedList } from './../../../model/cloud-shared-list';
import { ISimpleContact } from './../../../model/simple-contact';
import { CloudServiceProvider } from './../../../providers/cloud-service/cloud-service';
import { EventServiceProvider } from './../../../providers/event/event-service';
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
  public password: string;

  private readonly shareData: ICloudSharedList;

  protected readonly contactList: ISimpleContact[];

  protected sendSMS: boolean = false;

  constructor(
    public readonly navParams: NavParams,
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly cloudCtrl: CloudServiceProvider,
    private readonly modalCtrl: ModalController
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
    this.shareData = Global.getDefaultCloudShareData();
    this.contactList = [];
  }

  ionViewDidEnter() {
    super.ionViewDidEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Exporter en ligne';
    pageData.subtitle = this.evtCtrl.getHeader().title;
    this.evtCtrl.setHeader(pageData);
  }

  get sendPartage(): string[] {
    if (this.choice === 'send') {
      return ['envoyer', 'envoyée', 'envoi'];
    }
    return ['partager', 'partagée', 'partage'];
  }

  public async share(email: string): Promise<void> {
    this.uiCtrl.showLoading(this.sendPartage[2] + ' de votre liste en cours');
    this.shareData.list = this.list;

    this.shareData.author = await this.authCtrl.getAuthor(true);
    this.shareData.email = email;
    this.shareData.password = this.password;
    this.shareData.shakeToShare = false;
    this.shareData.name = await this.cloudCtrl.getListName(this.list);

    await this.cloudCtrl.postNewShareRequest(this.shareData);

    this.uiCtrl.dismissLoading();
    this.uiCtrl.displayToast('La liste à été ' + this.sendPartage[1] + ' avec succès');
    this.navCtrl.pop();
  }

  public shareWrapper(): void {
    if (this.contactList.length > 0) {
      for (const contact of this.contactList) {
        if (contact.email == null) {
          this.share('');
        } else {
          this.share(contact.email);
        }
      }
    } else {
      this.share('');
    }
  }

  public openContactPopup(): void {
    const contactModal = this.modalCtrl.create('ContactModalPage', {
      contacts: this.contactList,
      onlyEmail: true
    });
    contactModal.present();
  }

  get textContact(): string {
    if (this.contactList.length === 0) {
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
      'Vous avez associé ' + this.contactList.length + ' contacts à ce ' + this.sendPartage[2]
    );
  }

  /**
   * @override
   * @protected
   * @returns {boolean}
   * @memberof CloudSenderPage
   */
  protected networkRequired(): boolean {
    return true;
  }
}
