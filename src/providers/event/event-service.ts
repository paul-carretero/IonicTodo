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
  private readonly headerData: BehaviorSubject<IPageData>;

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
  private readonly searchSubject: Subject<string>;

  /**
   * Creates an instance of EventServiceProvider.
   * @param {Shake} shakeCtrl
   * @memberof EventServiceProvider
   */
  constructor(private readonly shakeCtrl: Shake) {
    this.headerData = new BehaviorSubject<IPageData>(Global.getDefaultPageData());
    this.menuRequestSubject = new Subject<IMenuRequest>();
    this.navRequestSubject = new Subject<INavRequest>();
    this.searchSubject = new Subject<string>();
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
   * retourne le sujet de mise à jour du header
   *
   * @returns {BehaviorSubject<IPageData>}
   * @memberof EventServiceProvider
   */
  public getHeadeSubject(): BehaviorSubject<IPageData> {
    return this.headerData;
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
  public getSearchSubject(): Subject<string> {
    return this.searchSubject;
  }
}
