import { Component, ViewChild } from '@angular/core';

import { HomePage } from '../home/home';
import { AuthentificationPage } from './../authentification/authentification';
import { NavController, Tabs } from 'ionic-angular';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  private tab1Root = HomePage;
  private tab2Root = AuthentificationPage;
  public static Me: TabsPage;
  @ViewChild('navTabs') tabRef: Tabs;

  constructor(public navCtrl: NavController) {
    TabsPage.Me = this;
  }

  public setRoot(root: number) {
    this.tabRef.select(root);
  }
}
