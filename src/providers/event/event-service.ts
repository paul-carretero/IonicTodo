import { Global } from './../../shared/global';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { PageData } from '../../model/page-data';
import { MenuRequest } from '../../model/menu-request';

@Injectable()
export class EventServiceProvider {
  /**
   * flux des actions de validation de l'utilisateur, vrai si validation, faux si cancel
   */
  private userValidation: Subject<boolean>;

  /**
   * Flux des mises à jour de l'affichage du header
   */
  private headerData: BehaviorSubject<PageData>;

  /**
   * Flux des commandes menu de l'utilisateur pour les pages intéressées
   */
  private menuRequestSubject: Subject<MenuRequest>;

  /**
   * Flux spécial de demande de reconnaissance vocale
   */
  private speechRequestSubject: Subject<void>;

  constructor() {
    this.userValidation = new Subject<boolean>();
    this.headerData = new BehaviorSubject<PageData>(Global.DEFAULT_PAGE_DATA);
    this.menuRequestSubject = new Subject<MenuRequest>();
    this.speechRequestSubject = new Subject<void>();
  }

  public getUserValidation(): Subject<boolean> {
    return this.userValidation;
  }

  public userValid(): void {
    this.userValidation.next(true);
  }

  public userCancel(): void {
    this.userValidation.next(false);
  }

  public getHeadeSubject(): BehaviorSubject<PageData> {
    return this.headerData;
  }

  public getMenuRequestSubject(): Subject<MenuRequest> {
    return this.menuRequestSubject;
  }

  public getSpeechRequestSubject(): Subject<void> {
    return this.speechRequestSubject;
  }
}
