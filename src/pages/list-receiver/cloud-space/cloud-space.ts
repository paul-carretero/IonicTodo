import { Subscription } from 'rxjs/Rx';
import { Component } from '@angular/core';
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

/**
 * page permettant de récupérer des liste disponible sur le cloud ohmytask
 *
 * @export
 * @class CloudSpacePage
 * @extends {GenericPage}
 */
@IonicPage()
@Component({
  selector: 'page-cloud-space',
  templateUrl: 'cloud-space.html'
})
export class CloudSpacePage extends GenericPage {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * Liste disponibles sur le cloud
   *
   * @type {ICloudSharedList[]}
   * @memberof CloudSpacePage
   */
  protected cloudList: ICloudSharedList[];

  /**
   * Flux de recherche utilisateur
   *
   * @type {Observable<string>}
   * @memberof CloudSpacePage
   */
  protected readonly search$: Observable<string>;

  /***************************** PRIVATE FIELDS *****************************/

  /**
   * Subscription au flux de liste partagée dans le cloud
   *
   * @private
   * @type {Subscription}
   * @memberof CloudSpacePage
   */
  private cloudListSub: Subscription;

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
    private readonly cloudCtrl: CloudServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.cloudList = [];
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
    pageData.title = 'Cloud OhMyTask';
    pageData.subtitle = 'Listes publiques';
    pageData.searchable = true;
    pageData.searchPlaceholders = 'chercher par liste ou auteur';
    this.evtCtrl.setHeader(pageData);

    this.cloudListSub = this.cloudCtrl.getCloudLists().subscribe(lists => {
      this.cloudList = lists;
    });
  }

  /**
   * termine la subscription au flux des lists du cloud ohmytask
   *
   * @memberof CloudSpacePage
   */
  ionViewWillLeave(): void {
    super.ionViewWillLeave();
    this.tryUnSub(this.cloudListSub);
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * permet d'importer dans le compte utilisateur courrant une liste du cloud ohmytask
   *
   * @protected
   * @param {ICloudSharedList} list
   * @returns {Promise<void>}
   * @memberof CloudSpacePage
   */
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

  /**
   * @override
   * @protected
   * @returns {string}
   * @memberof CloudSpacePage
   */
  protected generateDescription(): string {
    if (this.cloudList.length === 0) {
      return "Aucune listes n'est actuellement disponible sur le cloud OhMyTask";
    }

    let res = 'Les listes disponibles sur le cloud OhMyTask sont:';

    if (this.cloudList.length === 1) {
      res = 'La liste disponible sur le cloud OhMyTask est:';
    }

    for (const list of this.cloudList) {
      res += list.name;
      if (
        list.author != null &&
        list.author.displayName != null &&
        list.author.displayName !== ''
      ) {
        res += ' de ' + list.author.displayName;
      }
      res += ';';
    }

    return res;
  }

  /**
   * @override
   * @protected
   * @returns {{ subtitle: string; messages: string[] }}
   * @memberof ListEditPage
   */
  protected generateHelp(): { subtitle: string; messages: string[] } {
    return {
      subtitle: 'Aide sur le Cloud OhMyTask',
      messages: [
        "Cette page vous présente les listes que d'autre utilisateur ont partagé sur le cloud OhMyTask",
        'Les listes peuvent avoir été partagé en partage, partage en lecture seule ou envoi.',
        "Les partage et partage en lecture seul vous permette d'observer une unique liste avec l'auteur de partage C'est à dire de lier vos listes.",
        'vos modification seront visible et inversement. Si vous importé une liste partagée en lecture seule, vous ne pourrez pas la modifier ou modifier les tâche associée. Vous pourrez toutefois validé une tâche que vous auriez complété',
        "Les listes disponible en envoie sont cloner lors de l'import et vos modification se seront pas répercuter sur la liste original et inversement",
        'Certaines liste sont partagée par un mot de passe. Les liste restent disponible sur le cloud OhMyTask pendant 24h environ'
      ]
    };
  }
}
