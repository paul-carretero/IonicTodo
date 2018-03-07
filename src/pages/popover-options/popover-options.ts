import { Subscription } from 'rxjs';
import { EventServiceProvider } from './../../providers/event/event-service';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular';
import { MenuRequest } from '../../model/menu-request';

@IonicPage()
@Component({
  selector: 'page-popover-options',
  templateUrl: 'popover-options.html'
})
export class PopoverOptionsPage {
  private updateSub: Subscription;
  private helpOnly: boolean;
  constructor(
    private viewCtrl: ViewController,
    private evtCtrl: EventServiceProvider
  ) {}

  ionViewWillEnter() {
    this.updateSub = this.evtCtrl.getHeadeSubject().subscribe(newData => {
      this.helpOnly = newData.helpOnly;
    });
  }

  ionViewWillLeave() {}

  public close() {
    this.viewCtrl.dismiss();
  }

  public delete() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.DELETE);
  }

  public edit() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.EDIT);
  }

  public share() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SHARE);
  }

  public send() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.SEND);
  }

  public help() {
    this.viewCtrl.dismiss();
    this.evtCtrl.getMenuRequestSubject().next(MenuRequest.HELP);
  }
}
