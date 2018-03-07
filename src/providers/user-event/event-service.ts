import { Global } from './../../shared/global';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { PageData } from '../../model/page-data';

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

  constructor() {
    this.userValidation = new Subject<boolean>();
    this.headerData = new BehaviorSubject<PageData>(
      Global.PAGES_DATA.get(Global.HOMEPAGE)
    );
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

  public getHeaderData(): BehaviorSubject<PageData> {
    return this.headerData;
  }

  public updateHeader(data: PageData): void {
    this.headerData.next(data);
  }
}
