import { NavController } from 'ionic-angular';

import { IMenuRequest } from '../../model/menu-request';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { ListType } from './../../model/todo-list';
import { ITodoListPath } from './../../model/todo-list-path';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';

export abstract class GenericReceiver extends GenericPage {
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
  }

  private async listPathHandler(path: ITodoListPath): Promise<boolean> {
    const resConf: boolean = await this.uiCtrl.confirm(
      'Confirmation',
      'Etes vous sur de vouloir liée cette liste à votre compte ?'
    );
    this.uiCtrl.showLoading('Import de la liste en cours');
    if (resConf === false) {
      return false;
    }
    await this.todoCtrl.addListLink(path);
    this.uiCtrl.dismissLoading();
    return true;
  }

  private async todoListHandler(path: ITodoListPath): Promise<boolean> {
    const data = await this.todoCtrl.getAListSnapshotFromPath(path);
    data.order = 0;
    data.uuid = null;

    const resConf: boolean = await this.uiCtrl.confirm(
      'Confirmation',
      'Etes vous sur de vouloir copier cette liste ( ' +
        data.name +
        ' ) sur votre compte ?'
    );
    this.uiCtrl.showLoading('Import de la liste en cours');
    if (resConf === false) {
      return false;
    }
    await this.todoCtrl.addList(data, ListType.PRIVATE);
    this.uiCtrl.dismissLoading();
    return true;
  }

  public async importHandler(json: string): Promise<boolean> {
    let listData: ITodoListPath;
    try {
      listData = JSON.parse(json);
    } catch (e) {
      this.uiCtrl.displayToast("Erreur lors de l'import, veuillez vérifier la source");
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
