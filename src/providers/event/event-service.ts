import { Injectable } from '@angular/core';
import { Shake } from '@ionic-native/shake';
import { BehaviorSubject, Subject } from 'rxjs';

import { IMenuRequest } from '../../model/menu-request';
import { IPageData } from '../../model/page-data';
import { INavRequest } from './../../model/nav-request';
import { Global } from './../../shared/global';
import { MenuRequestType } from '../../model/menu-request-type';

/**
 * Après analyse, il a été préférer d'implémenter une classe d'Event plutôt que d'utiliser le service Ionic native Events
 * Pro : typé, plus modulable
 *
 * @export
 * @class EventServiceProvider
 */
@Injectable()
export class EventServiceProvider {
  /**
   * Flux des mises à jour de l'affichage du header
   *
   * @readonly
   * @private
   * @type {BehaviorSubject<IPageData>}
   * @memberof EventServiceProvider
   */
  private readonly headerData: IPageData;

  /**
   * Flux des commandes menu de l'utilisateur pour les pages intéressées
   *
   * @readonly
   * @private
   * @type {Subject<IMenuRequest>}
   * @memberof EventServiceProvider
   */
  private readonly menuRequestSubject: Subject<IMenuRequest>;

  /**
   * Flux de commande de navigation, typiquement du menu de gauche
   *
   * @readonly
   * @private
   * @type {Subject<INavRequest>}
   * @memberof EventServiceProvider
   */
  private readonly navRequestSubject: Subject<INavRequest>;

  /**
   * Flux de commande de recherche, typiquement de la searchbar
   *
   * @readonly
   * @private
   * @type {Subject<string>}
   * @memberof EventServiceProvider
   */
  private readonly searchSubject: BehaviorSubject<string>;

  /**
   * Creates an instance of EventServiceProvider.
   * @param {Shake} shakeCtrl
   * @memberof EventServiceProvider
   */
  constructor(private readonly shakeCtrl: Shake) {
    this.headerData = Global.getDefaultPageData();
    this.menuRequestSubject = new Subject<IMenuRequest>();
    this.navRequestSubject = new Subject<INavRequest>();
    this.searchSubject = new BehaviorSubject<string>('#');
    this.shakeDetect();
  }

  /**
   * Ecoute les agiation du téléphone et envoie un évenemnt si l'un est detecté
   *
   * @private
   * @memberof EventServiceProvider
   */
  private shakeDetect(): void {
    this.shakeCtrl.startWatch(60).subscribe(() => {
      this.menuRequestSubject.next({ request: MenuRequestType.SHAKE });
    });
  }

  /**
   * retourne le header
   *
   * @returns {BehaviorSubject<IPageData>}
   * @memberof EventServiceProvider
   */
  public getHeader(): IPageData {
    return this.headerData;
  }

  public setHeader(newHeader: IPageData): void {
    this.headerData.editable = newHeader.editable;
    this.headerData.importable = newHeader.importable;
    this.headerData.searchable = newHeader.searchable;
    this.headerData.searchPlaceholders = newHeader.searchPlaceholders;
    this.headerData.shareable = newHeader.shareable;
    this.headerData.subtitle = newHeader.subtitle;
    this.headerData.title = newHeader.title;
    this.headerData.validable = newHeader.validable;
  }

  /**
   * retourne le sujet de requête menu utilisateur
   *
   * @returns {Subject<IMenuRequest>}
   * @memberof EventServiceProvider
   */
  public getMenuRequestSubject(): Subject<IMenuRequest> {
    return this.menuRequestSubject;
  }

  /**
   * retourne le sujet requetes de navigation interne
   *
   * @returns {Subject<INavRequest>}
   * @memberof EventServiceProvider
   */
  public getNavRequestSubject(): Subject<INavRequest> {
    return this.navRequestSubject;
  }

  /**
   * retourne le sujet de recherche utilisateur
   *
   * @returns {Subject<string>}
   * @memberof EventServiceProvider
   */
  public getSearchSubject(): BehaviorSubject<string> {
    return this.searchSubject;
  }
}
