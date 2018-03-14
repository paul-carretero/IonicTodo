import { Global } from './../../shared/global';
import { PopoverOptionsPage } from './../../pages/popover-options/popover-options';
import { Component } from '@angular/core';
import { MenuController, PopoverController, Events } from 'ionic-angular';

import { IPageData } from './../../model/page-data';
import { MenuRequestType } from '../../model/menu-request-type';

@Component({
  selector: 'HeaderComponent',
  templateUrl: 'header.html'
})
export class HeaderComponent {
  constructor(
    private readonly popoverCtrl: PopoverController,
    private readonly menuCtrl: MenuController,
    private readonly evtCtrl: Events
  ) {}

  get data(): IPageData {
    return Global.HEADER;
  }

  public openMenu(): void {
    this.menuCtrl.enable(true, 'menu-left');
    this.menuCtrl.open('menu-left');
  }

  public presentPopover(myEvent): void {
    const popover = this.popoverCtrl.create(PopoverOptionsPage);
    popover.present({
      ev: myEvent
    });
  }

  public valid(): void {
    this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
      request: MenuRequestType.VALIDATE
    });
  }

  public startSpeechRec() {
    this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
      request: MenuRequestType.SPEECH_REC
    });
  }

  public startTTS() {
    this.evtCtrl.publish(Global.MENU_REQ_TOPIC, {
      request: MenuRequestType.SPEECH_SYNTH
    });
  }
}
