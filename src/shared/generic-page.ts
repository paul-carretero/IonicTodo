import { Component } from '@angular/core';
import {
  AlertController,
  Loading,
  LoadingController,
  NavController
} from 'ionic-angular';

export abstract class GenericPage {
  public loading: Loading;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {}

  /**
   * affiche un élément modal de chargement
   * @param text le texte affiché lors du chargement
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
   * @param title le titre de la fenêtre d'alerte
   * @param text le texte de le fenêtre d'alerte
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
