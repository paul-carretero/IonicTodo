import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

/**
 * affiche une  page modal d'aide sur la page
 *
 * @export
 * @class HelpModalPage
 */
@IonicPage()
@Component({
  selector: 'page-help-modal',
  templateUrl: 'help-modal.html'
})
export class HelpModalPage {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * sous titre de la page d'aide
   *
   * @protected
   * @type {string}
   * @memberof HelpModalPage
   */
  protected readonly subtitle: string;

  /**
   * paragraphe de la page d'aide
   *
   * @protected
   * @type {string[]}
   * @memberof HelpModalPage
   */
  protected readonly messages: string[];

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of HelpModalPage.
   * @param {NavParams} navParams
   * @param {ViewController} viewCtrl
   * @memberof HelpModalPage
   */
  constructor(
    private readonly navParams: NavParams,
    private readonly viewCtrl: ViewController
  ) {
    let data: { subtitle: string; messages: string[] };
    data = this.navParams.get('data');
    if (data.subtitle != null) {
      this.subtitle = data.subtitle;
    } else {
      this.subtitle = 'Aide sur la page';
    }

    if (data.messages != null) {
      this.messages = data.messages;
    } else {
      this.messages = [];
    }
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * ferme la fenetre d'aide
   *
   * @protected
   * @memberof HelpModalPage
   */
  protected dismiss(): void {
    this.viewCtrl.dismiss();
  }
}
