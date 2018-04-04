import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';
import { Global } from '../../../shared/global';

/**
 * page permettant d'afficher le qr code pour envoyer ou partager une liste passé en paramètre
 *
 * @export
 * @class QrcodeGeneratePage
 * @extends {GenericSharer}
 */
@IonicPage()
@Component({
  selector: 'page-qrcode-generate',
  templateUrl: 'qrcode-generate.html'
})
export class QrcodeGeneratePage extends GenericSharer {
  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of QrcodeGeneratePage.
   * @param {NavParams} navParams
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @memberof QrcodeGeneratePage
   */
  constructor(
    protected readonly navParams: NavParams,
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise la page et son header
   *
   * @memberof QrcodeGeneratePage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Exporter par QR Code';
    if (this.list.listUUID != null) {
      pageData.subtitle = 'Liste ' + this.todoCtrl.getAListSnapshot(this.list.listUUID).name;
    }
    this.evtCtrl.setHeader(pageData);
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @protected
   * @returns {{ subtitle: string; messages: string[] }}
   * @memberof QrcodeGeneratePage
   */
  protected generateHelp(): { subtitle: string; messages: string[] } {
    return {
      subtitle: "Aide sur l'export de liste par QR Code",
      messages: [
        "Cette page vous permet d'exporter des listes par QR Code. Il suffira à vos destinataire de scanner ce QR Code depuis leur application",
        "Pour cela il vous suffit de choisir un type de partage et un type d'envoi",
        'Les listes peuvent être partagée en partage, partage en lecture seule ou envoi.',
        'Si vous spécifiez des destinataires parmis vos contacts alors ceux si verront la liste automatiquement ajoutée à leur compte lors de leur prochaine connexion. Vous pouvez choisir de leur envoyer un sms pour les prévenir',
        'Si vous ne spécifiez pas de destinatires alors la liste sera disponible sur le cloud OhMyTask pendant 24h. Vous pouvez choisir de protéger votre partage par un mot de passe. Toutes personne ayant un compte pourra alors importer votre liste',
        "Les partage et partage en lecture seul vous permette d'observer une unique liste avec l'auteur de partage C'est à dire de lier vos listes.",
        'vos modification seront visible et inversement. Si vous importé une liste partagée en lecture seule, vous ne pourrez pas la modifier ou modifier les tâche associée. Vous pourrez toutefois validé une tâche que vous auriez complété',
        "Les listes disponible en envoie sont cloner lors de l'import et vos modification se seront pas répercuter sur la liste original et inversement"
      ]
    };
  }
}
