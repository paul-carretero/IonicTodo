import { ITodoListPath } from './../../model/todo-list-path';
import { Global } from './../../shared/global';
import {
  AlertController,
  LoadingController,
  NavController,
  NavParams,
  ToastController
} from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { ITodoList } from '../../model/todo-list';
import { EventServiceProvider } from '../../providers/event/event-service';
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

  public listShare: ITodoListPath;

  public listSend: ITodoList;

  public choice: 'lock' | 'unlock' | 'send';

  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly loadingCtrl: LoadingController,
    public readonly alertCtrl: AlertController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
    this.listUUID = navParams.get('uuid');
    this.request = navParams.get('request');
    this.sendListHandler();
    this.shareListHandler();
  }

  /**
   * Charge le liste demandé et la stocke dans un json
   *
   * @memberof GenericSharer
   */
  ionViewDidEnter() {
    console.log(JSON.stringify(this.request));
    if (this.request.request === MenuRequestType.SEND) {
      this.choice = 'send';
    } else {
      this.choice = 'unlock';
    }
  }

  get creatingLink(): boolean {
    return this.request.request === MenuRequestType.SHARE;
  }

  get json(): string {
    if (this.choice === 'send') {
      return JSON.stringify(this.listSend);
    }
    if (this.choice === 'lock') {
      this.listShare.locked = true;
    } else {
      this.listShare.locked = false;
    }
    return JSON.stringify(this.listShare);
  }

  private shareListHandler(): void {
    this.listShare = this.todoCtrl.getListLink(this.listUUID);
    this.listShare.magic = Global.LIST_PATH_MAGIC;
    this.listShare.locked = false;
  }

  private sendListHandler(): void {
    this.listSend = this.todoCtrl.getAListSnapshot(this.listUUID);
    this.listSend.magic = Global.TODO_LIST_MAGIC;
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
