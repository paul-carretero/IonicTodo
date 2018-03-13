import { Media } from './../../model/media';
import { INavRequest } from './../../model/nav-request';
import { Global } from './../../shared/global';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { IPageData } from '../../model/page-data';
import { MenuRequest } from '../../model/menu-request';

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
   * @type {Subject<MenuRequest>}
   * @memberof EventServiceProvider
   */
  private readonly menuRequestSubject: Subject<MenuRequest>;

  /**
   * Flux de commande de navigation, typiquement du menu de gauche
   *
   * @readonly
   * @private
   * @type {Subject<INavRequest>}
   * @memberof EventServiceProvider
   */
  private readonly navRequestSubject: Subject<INavRequest>;

  private media: Media;

  constructor() {
    this.headerData = new BehaviorSubject<IPageData>(Global.DEFAULT_PAGE_DATA);
    this.menuRequestSubject = new Subject<MenuRequest>();
    this.navRequestSubject = new Subject<INavRequest>();
  }

  public getHeadeSubject(): BehaviorSubject<IPageData> {
    return this.headerData;
  }

  public getMenuRequestSubject(): Subject<MenuRequest> {
    return this.menuRequestSubject;
  }

  public getNavRequestSubject(): Subject<INavRequest> {
    return this.navRequestSubject;
  }

  public defMedia(media: Media): void {
    this.media = media;
  }

  public getMedia(): Media {
    return this.media;
  }
}
