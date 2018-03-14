import { Global } from './../../shared/global';
import {
  AlertController,
  LoadingController,
  NavController,
  NavParams,
  ToastController,
  Events
} from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { ITodoList } from '../../model/todo-list';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { MenuRequestType } from '../../model/menu-request-type';

export class GenericSharer extends GenericPage {
  /**
   * Identifiant unique de la liste à partager
   *
   * @readonly
   * @type {string}
   * @memberof GenericSharer
   */
  public readonly listUUID: string;

  public readonly request: IMenuRequest;

  public json: string;

  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly loadingCtrl: LoadingController,
    public readonly alertCtrl: AlertController,
    public readonly evtCtrl: Events,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
    this.listUUID = navParams.get('uuid');
    this.request = navParams.get('request');
  }

  /**
   * Charge le liste demandé et la stocke dans un json
   *
   * @memberof QrcodeGeneratePage
   */
  ionViewDidEnter() {
    if (this.request.request === MenuRequestType.SEND) {
      this.sendListHandler();
    } else {
      const link = this.todoCtrl.getListLink(this.listUUID);
      link.magic = Global.LIST_PATH_MAGIC;
      this.json = JSON.stringify(link);
    }
  }

  private async sendListHandler(): Promise<void> {
    const todoList = await this.todoCtrl.getAList(this.listUUID);
    const sub = todoList.subscribe((list: ITodoList) => {
      sub.unsubscribe();
      list.magic = Global.TODO_LIST_MAGIC;
      list.uuid = null;
      this.json = JSON.stringify(list);
    });
  }

  public menuEventHandler(req: IMenuRequest): void {
    switch (req) {
    }
  }
  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public loginAuthRequired(): boolean {
    return true;
  }

  public basicAuthRequired(): boolean {
    return true;
  }
}
