import {
  AlertController,
  LoadingController,
  NavController,
  ToastController
} from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { GenericPage } from '../../shared/generic-page';
import { ListType } from './../../model/todo-list';
import { ITodoListPath } from './../../model/todo-list-path';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';

export abstract class GenericReceiver extends GenericPage {
  constructor(
    public readonly navCtrl: NavController,
    public readonly alertCtrl: AlertController,
    public readonly loadingCtrl: LoadingController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly authCtrl: AuthServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
  }

  private async listPathHandler(path: ITodoListPath): Promise<boolean> {
    const resConf: boolean = await this.confirm(
      'Confirmation',
      'Etes vous sur de vouloir liée cette liste à votre compte ?'
    );
    this.showLoading('Import de la liste en cours');
    if (resConf === false) {
      return false;
    }
    await this.todoCtrl.addListLink(path);
    this.loading.dismiss();
    return true;
  }

  private async todoListHandler(path: ITodoListPath): Promise<boolean> {
    const data = await this.todoCtrl.getAListSnapshotFromPath(path);
    data.order = -1;
    data.uuid = null;

    const resConf: boolean = await this.confirm(
      'Confirmation',
      'Etes vous sur de vouloir copier cette liste ( ' +
        data.name +
        ' ) sur votre compte ?'
    );
    this.showLoading('Import de la liste en cours');
    if (resConf === false) {
      return false;
    }
    await this.todoCtrl.addList(data, ListType.PRIVATE);
    this.loading.dismiss();
    return true;
  }

  public async importHandler(json: string): Promise<boolean> {
    let listData: ITodoListPath;
    try {
      listData = JSON.parse(json);
    } catch (e) {
      this.displayToast("Erreur lors de l'import, veuillez vérifier la source");
      console.log('impossible à parser => ' + json);
      return false;
    }

    if (listData.shareByReference === true) {
      return this.todoListHandler(listData);
    } else {
      return this.listPathHandler(listData);
    }
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
