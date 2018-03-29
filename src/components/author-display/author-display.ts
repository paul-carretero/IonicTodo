import { IAuthor } from './../../model/author';
import { Component, Input, OnInit } from '@angular/core';
import moment from 'moment';

/**
 * permet de réprésenter un autheur d'un objet
 *
 * @export
 * @class AuthorDisplayComponent
 */
@Component({
  selector: 'author-display',
  templateUrl: 'author-display.html'
})
export class AuthorDisplayComponent implements OnInit {
  /***************************** PUBLIC FIELDS ******************************/
  /**
   * autheur à représenter
   *
   * @type {IAuthor}
   * @memberof AuthorDisplayComponent
   */
  @Input() author: IAuthor;

  /**
   * différence de la date author avec maintenant
   *
   * @protected
   * @type {string}
   * @memberof AuthorDisplayComponent
   */
  protected dateDiff: string;

  /**
   * date de l'authoring
   *
   * @protected
   * @type {string}
   * @memberof AuthorDisplayComponent
   */
  protected dateCalendar: string;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AuthorDisplayComponent.
   * @memberof AuthorDisplayComponent
   */
  constructor() {}

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise les constantes de date de l'objet
   *
   * @memberof AuthorDisplayComponent
   */
  ngOnInit(): void {
    this.defDateDiff();
    this.defDateCalendar();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * définie la différence de temps entre maintenant et la création de l'objet
   *
   * @private
   * @memberof AuthorDisplayComponent
   */
  private defDateDiff(): void {
    if (this.author.timestamp == null) {
      this.dateDiff = '';
    } else {
      this.dateDiff = moment(this.author.timestamp)
        .locale('fr')
        .fromNow();
    }
  }

  /**
   * définie la date du calendrier à laquelle l'objet à été créé
   *
   * @private
   * @memberof AuthorDisplayComponent
   */
  private defDateCalendar(): void {
    if (this.author.timestamp == null) {
      this.dateCalendar = '';
    } else {
      this.dateCalendar = this.author.timestamp.toLocaleDateString();
    }
  }
}
