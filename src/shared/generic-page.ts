import { NavRequest } from './../model/nav-request';
import { Subscription } from 'rxjs';
import { Component } from '@angular/core';
import {
  AlertController,
  Loading,
  LoadingController,
  NavController
} from 'ionic-angular';
import { EventServiceProvider } from '../providers/event/event-service';

export abstract class GenericPage {
  public loading: Loading;

  private navSub: Subscription;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider
  ) {
    this.listenForLeftMenu();
  }

  private listenForLeftMenu(): void {}

  /**
   * utiliser super.ionViewDidLoad() si besoin dans les classe filles.
   * ecoute les demande de nav du menu et les traite dans l'onglet courant.
   * @memberof GenericPage
   */
  ionViewDidLoad() {
    this.navSub = this.evtCtrl
      .getNavRequestSubject()
      .subscribe((navReq: NavRequest) => {
        this.navCtrl.push(navReq.page);
      });
  }

  ionViewWillUnload() {
    this.navSub.unsubscribe();
  }

  /**
   * affiche un élément modal de chargement
   *
   * @param {string} text le texte affiché lors du chargement
   * @memberof GenericPage
   */
  public showLoading(text: string) {
    this.loading = this.loadingCtrl.create({
      content: text,
      dismissOnPageChange: true
    });
    this.loading.present();
  }

  /**
   * affiche une fenêtre d'information
   * @param {string} title le titre de la fenêtre d'alerte
   * @param {string} text le texte de le fenêtre d'alerte
   */
  public alert(title: string, text: string) {
    this.alertCtrl
      .create({
        title: title,
        subTitle: text,
        buttons: ['OK']
      })
      .present();
  }

  public abstract generateDescription(): string;
}
