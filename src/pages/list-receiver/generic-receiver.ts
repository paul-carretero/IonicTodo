import {
  AlertController,
  LoadingController,
  NavController,
  ToastController
} from 'ionic-angular';

import { MenuRequest } from '../../model/menu-request';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { GenericPage } from '../../shared/generic-page';
import { ListType, TodoList } from './../../model/todo-list';
import { TodoListPath } from './../../model/todo-list-path';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { Global } from './../../shared/global';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';

export abstract class GenericReceiver extends GenericPage {
  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    public toastCtrl: ToastController,
    public todoCtrl: TodoServiceProvider,
    public authCtrl: AuthServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
  }

  private async listPathHandler(data: TodoListPath): Promise<boolean> {
    const resConf: boolean = await this.confirm(
      'Confirmation',
      'Etes vous sur de vouloir liée cette liste à votre compte ?'
    );
    this.showLoading('Import de la liste en cours');
    if (resConf == false) {
      return false;
    }
    await this.todoCtrl.addListLink(data);
    this.loading.dismiss();
    return true;
  }

  private async todoListHandler(data: TodoList): Promise<boolean> {
    const resConf: boolean = await this.confirm(
      'Confirmation',
      'Etes vous sur de vouloir copier cette liste ( ' +
        data.name +
        ' ) sur votre compte ?'
    );
    this.showLoading('Import de la liste en cours');
    if (resConf == false) {
      return false;
    }
    await this.todoCtrl.addList(data, ListType.PRIVATE);
    this.loading.dismiss();
    return true;
  }

  public async importHandler(json: string): Promise<boolean> {
    let listData: any;
    try {
      listData = JSON.parse(json);
    } catch (e) {
      this.displayToast("Erreur lors de l'import, veuillez vérifier la source");
      console.log('impossible à parser => ' + json);
      return false;
    }

    if (listData.magic === Global.TODO_LIST_MAGIC) {
      return await this.todoListHandler(listData);
    } else if (listData.magic === Global.LIST_PATH_MAGIC) {
      return await this.listPathHandler(listData);
    }
    console.log('pas compatible => ' + json);
    this.displayToast("Erreur lors de l'import, veuillez vérifier la source");
    return false;
  }

  public menuEventHandler(req: MenuRequest): void {
    throw new Error('Method not implemented.');
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
