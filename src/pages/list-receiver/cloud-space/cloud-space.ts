import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { Observable } from 'rxjs';

import { IMenuRequest } from '../../../model/menu-request';
import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { GenericPage } from '../../../shared/generic-page';
import { ICloudSharedList } from './../../../model/cloud-shared-list';
import { CloudServiceProvider } from './../../../providers/cloud-service/cloud-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { Global } from '../../../shared/global';

@IonicPage()
@Component({
  selector: 'page-cloud-space',
  templateUrl: 'cloud-space.html'
})
export class CloudSpacePage extends GenericPage {
  /**
   * flux des liste disponibles sur le cloud
   *
   * @type {Observable<ICloudSharedList[]>}
   * @memberof CloudSpacePage
   */
  public readonly cloudList$: Observable<ICloudSharedList[]>;

  /**
   * Flux de recherche utilisateur
   *
   * @type {Observable<string>}
   * @memberof CloudSpacePage
   */
  public readonly search$: Observable<string>;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly cloudCtrl: CloudServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.cloudList$ = this.cloudCtrl.getCloudLists();
    this.search$ = this.evtCtrl.getSearchSubject();
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewDidEnter() {
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Listes Publiques';
    pageData.subtitle = 'Listes disponibles';
    pageData.searchable = true;
    pageData.searchPlaceholders = 'chercher par liste ou auteur';
    this.evtCtrl.getHeadeSubject().next(pageData);
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  public async importList(list: ICloudSharedList): Promise<void> {
    this.uiCtrl.showLoading('Importation de la liste ' + list.name + ' en cours');
    await this.cloudCtrl.importCloudList(list);
    this.uiCtrl.dismissLoading();
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  public menuEventHandler(req: IMenuRequest): void {
    switch (req.request) {
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
