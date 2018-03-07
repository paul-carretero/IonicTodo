import { Component, OnDestroy, OnInit } from '@angular/core';
import { MenuController, PopoverController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { EventServiceProvider } from '../../providers/user-event/event-service';
import { PageData } from './../../model/page-data';

@Component({
  selector: 'HeaderComponent',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  public data: PageData;
  private updateSub: Subscription;

  constructor(
    private popoverCtrl: PopoverController,
    private menuCtrl: MenuController,
    private evtCtrl: EventServiceProvider
  ) {
    this.data = this.evtCtrl.getHeaderData().getValue();
  }

  ngOnDestroy(): void {
    this.updateSub.unsubscribe();
  }

  ngOnInit(): void {
    this.updateSub = this.evtCtrl.getHeaderData().subscribe(newData => {
      this.data = newData;
    });
  }

  public openMenu(): void {
    this.menuCtrl.enable(true, 'menu-left');
    this.menuCtrl.open('menu-left');
  }

  public presentPopover(myEvent): void {
    const popover = this.popoverCtrl.create(this.data.popoverMenu);
    popover.present({
      ev: myEvent
    });
  }

  public valid(): void {
    this.evtCtrl.userValid();
  }
}
