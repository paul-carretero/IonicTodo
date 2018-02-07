import { AuthentificationPage } from './../authentification/authentification';
import { Component } from '@angular/core';

import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  tab1Root = HomePage;
  authentification = AuthentificationPage;

  constructor() {}
}
