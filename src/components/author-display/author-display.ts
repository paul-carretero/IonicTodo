import { IAuthor } from './../../model/author';
import { Component, Input } from '@angular/core';
import moment from 'moment';

@Component({
  selector: 'author-display',
  templateUrl: 'author-display.html'
})
export class AuthorDisplayComponent {
  @Input() author: IAuthor;

  constructor() {}

  get dateDiff(): string {
    const now = new Date().getTime();
    const duration = moment.duration(now - this.author.timestamp.getTime());
    return duration.locale('fr').humanize();
  }

  get dateCalendar(): string {
    return this.author.timestamp.toLocaleDateString();
  }
}
