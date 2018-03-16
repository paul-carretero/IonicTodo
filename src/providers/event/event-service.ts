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

  constructor(private readonly shake: Shake) {
    this.headerData = new BehaviorSubject<IPageData>(Global.getDefaultPageData());
    this.menuRequestSubject = new Subject<IMenuRequest>();
    this.navRequestSubject = new Subject<INavRequest>();
    this.shakeDetect();
  }

  private shakeDetect(): void {
    this.shake.startWatch(60).subscribe(() => {
      this.menuRequestSubject.next({ request: MenuRequestType.SHAKE });
    });
  }

  public getHeadeSubject(): BehaviorSubject<IPageData> {
    return this.headerData;
  }

  public getMenuRequestSubject(): Subject<IMenuRequest> {
    return this.menuRequestSubject;
  }

  public getNavRequestSubject(): Subject<INavRequest> {
    return this.navRequestSubject;
  }
}
