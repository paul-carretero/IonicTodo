import { Component, OnDestroy, OnInit } from '@angular/core';
import { MenuController, PopoverController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { MenuRequestType } from '../../model/menu-request-type';
import { EventServiceProvider } from '../../providers/event/event-service';
import { IPageData } from './../../model/page-data';

@Component({
  selector: 'HeaderComponent',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  public data: IPageData;
  private updateSub: Subscription;

  constructor(
    private readonly popoverCtrl: PopoverController,
    private readonly menuCtrl: MenuController,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.data = this.evtCtrl.getHeadeSubject().getValue();
  }

  ngOnDestroy(): void {
    this.updateSub.unsubscribe();
  }

  ngOnInit(): void {
    this.updateSub = this.evtCtrl.getHeadeSubject().subscribe(newData => {
      this.data = newData;
    });
  }

  public openMenu(): void {
    this.menuCtrl.enable(true, 'menu-left');
    this.menuCtrl.open('menu-left');
  }

  public presentPopover(myEvent): void {
    const popover = this.popoverCtrl.create('PopoverOptionsPage');
    popover.present({
      ev: myEvent
    });
  }

  public valid(): void {
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.VALIDATE });
  }

  public startSpeechRec() {
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.SPEECH_REC });
  }

  public startTTS() {
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.SPEECH_SYNTH });
  }
}
