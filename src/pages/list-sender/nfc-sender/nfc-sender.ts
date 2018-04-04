import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { AuthServiceProvider } from './../../../providers/auth-service/auth-service';
import { EventServiceProvider } from './../../../providers/event/event-service';
import { NfcProvider } from './../../../providers/nfc/nfc';
import { SpeechSynthServiceProvider } from './../../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { GenericSharer } from './../generic-sharer';
import { Global } from '../../../shared/global';

/**
 * permet d'écrire un lien vers une liste sur un tag NFC
 *
 * @export
 * @class NfcSenderPage
 * @extends {GenericSharer}
 */
@IonicPage()
@Component({
  selector: 'page-nfc-sender',
  templateUrl: 'nfc-sender.html'
})
export class NfcSenderPage extends GenericSharer {
  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of NfcSenderPage.
   * @param {NavParams} navParams
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {NfcProvider} nfcCtrl
   * @memberof NfcSenderPage
   */
  constructor(
    public readonly navParams: NavParams,
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly nfcCtrl: NfcProvider
  ) {
    super(navParams, navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise la page et son header
   *
   * @memberof NfcSenderPage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Exporter par NFC';
    if (this.list.listUUID != null) {
      pageData.subtitle = 'Liste ' + this.todoCtrl.getAListSnapshot(this.list.listUUID).name;
    }
    this.evtCtrl.setHeader(pageData);
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * envoie une demande au provider nfc pour écrire le json du partage de la liste sur un tag nfc
   *
   * @returns {Promise<void>}
   * @memberof NfcSenderPage
   */
  public async export(): Promise<void> {
    await this.nfcCtrl.write(this.json);
    this.uiCtrl.displayToast('Votre liste à été écrite sur un Tag NFC');
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @protected
   * @returns {{ subtitle: string; messages: string[] }}
   * @memberof NfcSenderPage
   */
  protected generateHelp(): { subtitle: string; messages: string[] } {
    return {
      subtitle: "Aide sur l'export de liste par NFC",
      messages: [
        "Cette page vous permet d'envoyer des listes sur Un Tag NFC. Attention cette fonctionalité est expérimentale. Pour importer une liste sur un tag NFC, il vous suffit d'approcher votre mobile du tag",
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
