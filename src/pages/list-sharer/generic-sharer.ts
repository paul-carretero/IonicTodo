import {
  AlertController,
  LoadingController,
  NavController,
  NavParams,
  ToastController
} from 'ionic-angular';

import { MenuRequest } from '../../model/menu-request';
import { TodoList } from '../../model/todo-list';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';

export class GenericSharer extends GenericPage {
  /**
   * Identifiant unique de la liste à partager
   *
   * @type {string}
   * @memberof GenericSharer
   */
  public listUUID: string;

  public request: MenuRequest.SHARE | MenuRequest.SEND;

  public json: string;

  constructor(
    public navParams: NavParams,
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    public todoCtrl: TodoServiceProvider,
    public toastCtrl: ToastController
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl);
    this.listUUID = navParams.get('uuid');
    this.request = navParams.get('request');
  }

  /**
   * Charge le liste demandé et la stocke dans une promesse de json
   *
   * @memberof QrcodeGeneratePage
   */
  ionViewDidEnter() {
    if (this.request == MenuRequest.SEND) {
      const sub = this.todoCtrl
        .getAList(this.listUUID)
        .subscribe((list: TodoList) => {
          sub.unsubscribe();
          this.json = JSON.stringify(list);
        });
    } else {
      this.json = JSON.stringify(this.todoCtrl.getListLink(this.listUUID));
    }
  }

  public menuEventHandler(req: MenuRequest): void {
    throw new Error('Method not implemented.');
  }
  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }
}
