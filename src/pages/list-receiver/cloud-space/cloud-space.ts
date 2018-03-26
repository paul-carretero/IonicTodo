import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { Observable } from 'rxjs';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { GenericPage } from '../../../shared/generic-page';
import { Global } from '../../../shared/global';
import { ICloudSharedList } from './../../../model/cloud-shared-list';
import { CloudServiceProvider } from './../../../providers/cloud-service/cloud-service';

@IonicPage()
@Component({
  selector: 'page-cloud-space',
  templateUrl: 'cloud-space.html'
})
export class CloudSpacePage extends GenericPage {
  /***************************** PUBLIC FIELDS ******************************/
  /**
   * flux des liste disponibles sur le cloud
   *
   * @type {Observable<ICloudSharedList[]>}
   * @memberof CloudSpacePage
   */
  protected readonly cloudList$: Observable<ICloudSharedList[]>;

  /**
   * Flux de recherche utilisateur
   *
   * @type {Observable<string>}
   * @memberof CloudSpacePage
   */
  protected readonly search$: Observable<string>;

  /**************************** PRIVATE FIELDS ******************************/

  /**
   * interval JS pour la detection des changement de la page
   *
   * @private
   * @type {*}
   * @memberof CloudSpacePage
   */
  private changeInterval: any;

  /**
   * timeoutJS a supprimer si la page est détruite trop vite
   *
   * @private
   * @type {*}
   * @memberof CloudSpacePage
   */
  private changeTimeout: any;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of CloudSpacePage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {CloudServiceProvider} cloudCtrl
   * @param {ChangeDetectorRef} changeCtrl
   * @memberof CloudSpacePage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly cloudCtrl: CloudServiceProvider,
    private readonly changeCtrl: ChangeDetectorRef
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.cloudList$ = this.cloudCtrl.getCloudLists();
    this.search$ = this.evtCtrl.getSearchSubject();
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise la page
   *
   * @memberof CloudSpacePage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Listes Publiques';
    pageData.subtitle = 'Listes disponibles';
    pageData.searchable = true;
    pageData.searchPlaceholders = 'chercher par liste ou auteur';
    this.evtCtrl.setHeader(pageData);
  }

  /**
   * Override la detection de changement d'angular (sinon on spin-loop sur les date :/)
   * pour n'effectuer une detection des changemenents que toutes les 3s.
   *
   * @memberof CloudSpacePage
   */
  ionViewDidEnter(): void {
    this.changeTimeout = setTimeout(() => {
      this.changeCtrl.detach();
      this.changeCtrl.detectChanges();
      this.changeInterval = setInterval(() => {
        this.changeCtrl.detectChanges();
      }, 2000);
    }, 500);
  }

  /**
   * réinitialise le détecteur de changement en mode normal et termine le contexte du todo
   *
   * @memberof CloudSpacePage
   */
  ionViewWillLeave(): void {
    if (this.changeTimeout != null) {
      clearTimeout(this.changeTimeout);
    }

    if (this.changeInterval != null) {
      clearInterval(this.changeInterval);
    }
    this.changeCtrl.reattach();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  protected async importList(list: ICloudSharedList): Promise<void> {
    this.uiCtrl.showLoading('Importation de la liste ' + list.name + ' en cours');
    await this.cloudCtrl.importCloudList(list);
    this.uiCtrl.dismissLoading();
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @protected
   * @returns {boolean}
   * @memberof CloudSpacePage
   */
  protected loginAuthRequired(): boolean {
    return true;
  }

  /**
   * @override
   * @protected
   * @returns {boolean}
   * @memberof CloudSpacePage
   */
  protected basicAuthRequired(): boolean {
    return true;
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
