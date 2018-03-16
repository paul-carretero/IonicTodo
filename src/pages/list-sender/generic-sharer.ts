import { NavController, NavParams } from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { MenuRequestType } from '../../model/menu-request-type';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { ITodoListPath } from './../../model/todo-list-path';

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

  public listSend: ITodoListPath;

  public choice: 'lock' | 'unlock' | 'send';

  constructor(
    public readonly navParams: NavParams,
    public readonly navCtrl: NavController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly authCtrl: AuthServiceProvider,
    public readonly uiCtrl: UiServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
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

  get list(): ITodoListPath {
    if (this.choice === 'send') {
      return this.listSend;
    }

    if (this.choice === 'lock') {
      this.listShare.locked = true;
    } else {
      this.listShare.locked = false;
    }
    return this.listShare;
  }

  private shareListHandler(): void {
    this.listShare = this.todoCtrl.getListLink(this.listUUID);
    this.listShare.locked = false;
    this.listShare.shareByReference = true;
  }

  private sendListHandler(): void {
    this.listSend = this.todoCtrl.getListLink(this.listUUID);
    this.listSend.locked = false;
    this.listSend.shareByReference = false;
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
