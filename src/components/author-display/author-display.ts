import { IAuthor } from './../../model/author';
import { Component, Input, ChangeDetectorRef } from '@angular/core';
import moment from 'moment';
import { AfterViewInit, OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';

/**
 * permet de réprésenter un autheur d'un objet
 * ATTENTION: détacher le decteur de changement angular dans les pages l'appelant pour ne pas avoir de busy-loop sur les valeur des dates...
 *
 * @export
 * @class AuthorDisplayComponent
 */
@Component({
  selector: 'author-display',
  templateUrl: 'author-display.html'
})
export class AuthorDisplayComponent implements AfterViewInit, OnDestroy {
  /***************************** PUBLIC FIELDS ******************************/
  /**
   * autheur à représenter
   *
   * @type {IAuthor}
   * @memberof AuthorDisplayComponent
   */
  @Input() author: IAuthor;

  private changeTimeout: any;

  private changeInterval: any;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AuthorDisplayComponent.
   * @memberof AuthorDisplayComponent
   */
  constructor(private readonly changeCtrl: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.changeTimeout = setTimeout(() => {
      this.changeCtrl.detach();
      this.changeCtrl.detectChanges();
      this.changeInterval = setInterval(() => {
        try {
          this.changeCtrl.detectChanges();
        } catch (error) {
          console.log(error);
        }
      }, 2000);
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.changeTimeout != null) {
      clearTimeout(this.changeTimeout);
    }

    if (this.changeInterval != null) {
      clearInterval(this.changeInterval);
    }
  }

  /**************************************************************************/
  /********************************* GETTER *********************************/
  /**************************************************************************/

  /**
   * retourne la différence de temps entre maintenant et la création de l'objet
   *
   * @readonly
   * @type {string}
   * @memberof AuthorDisplayComponent
   */
  get dateDiff(): string {
    if (this.author.timestamp == null) {
      return '';
    }

    const now = new Date().getTime();
    const duration = moment.duration(now - this.author.timestamp.getTime());
    return duration.locale('fr').humanize();
  }

  /**
   * retourne la date du calendrier à laquelle l'objet à été créé
   *
   * @readonly
   * @type {string}
   * @memberof AuthorDisplayComponent
   */
  get dateCalendar(): string {
    if (this.author.timestamp == null) {
      return '';
    }

    return this.author.timestamp.toLocaleDateString();
  }
}
