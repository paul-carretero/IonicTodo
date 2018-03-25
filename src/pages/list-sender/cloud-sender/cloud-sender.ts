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
import { ContactServiceProvider } from '../../../providers/contact-service/contact-service';

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
    private readonly modalCtrl: ModalController,
    private readonly contactCtrl: ContactServiceProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
    this.shareData = Global.getDefaultCloudShareData();
    this.contactList = [];
  }

  ionViewWillEnter(): void {
    super.ionViewWillEnter();
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

  private async share(email: string | null): Promise<void> {
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

  protected shareWrapper(): void {
    if (this.contactList.length > 0) {
      for (const contact of this.contactList) {
        if (contact.email == null) {
          this.share(null);
        } else {
          this.share(contact.email);
        }
      }
    } else {
      this.share(null);
    }
    if (this.sendSMS) {
      this.contactCtrl.sendInviteSms(this.contactList);
    }
  }

  protected openContactPopup(): void {
    const contactModal = this.modalCtrl.create('ContactModalPage', {
      contacts: this.contactList,
      onlyEmail: true
    });
    contactModal.present();
  }

  protected deleteContact(contact: ISimpleContact): void {
    const index = this.contactList.findIndex(c => c.id === contact.id);
    if (index !== -1) {
      this.contactList.splice(index, 1);
    }
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
