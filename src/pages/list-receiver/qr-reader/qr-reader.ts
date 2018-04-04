import { Component } from '@angular/core';
import { CameraPreview, CameraPreviewOptions } from '@ionic-native/camera-preview';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { IonicPage, NavController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { Global } from '../../../shared/global';
import { GenericReceiver } from '../generic-receiver';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../../../providers/ui-service/ui-service';

/**
 * page permettant de lire un qrcode d'export de liste et de l'envoyer au service pour importer la liste par valeur ou référence
 *
 * @export
 * @class QrReaderPage
 * @extends {GenericReceiver}
 */
@IonicPage()
@Component({
  selector: 'page-qr-reader',
  templateUrl: 'qr-reader.html'
})
export class QrReaderPage extends GenericReceiver {
  /**************************** PRIVATE FIELDS ******************************/

  /**
   * Options pour la preview
   *
   * @private
   * @static
   * @type {CameraPreviewOptions}
   * @memberof QrReaderPage
   */
  private static readonly CAMERA_OPTS: CameraPreviewOptions = {
    x: 0,
    y: 120,
    width: window.screen.width,
    height: window.screen.height / 2,
    camera: 'rear',
    tapPhoto: false,
    previewDrag: false,
    toBack: true,
    alpha: 1
  };

  /**
   * Durée maximum avant d'abandonner la recherche de code QRCode
   *
   * @private
   * @static
   * @memberof QrReaderPage
   */
  private static readonly MAX_SCAN_TIME = 10000;

  /**
   * vrai si la visualisation est activée, faux sinon
   *
   * @private
   * @memberof QrReaderPage
   */
  private cameraOn = false;

  /**
   * subscription aux résultat d'un scan de qr code
   *
   * @private
   * @type {Subscription}
   * @memberof QrReaderPage
   */
  private scanSub: Subscription;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * vrai si on peut démarrer le scan de qr code == si la class de scan est prepared
   *
   * @protected
   * @memberof QrReaderPage
   */
  protected okToScan = false;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of QrReaderPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {QRScanner} qrScanner
   * @param {CameraPreview} cameraPreview
   * @param {ScreenOrientation} screenCtrl
   * @memberof QrReaderPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly todoCtrl: TodoServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    private readonly qrScanner: QRScanner,
    private readonly cameraPreview: CameraPreview,
    private readonly screenCtrl: ScreenOrientation
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, todoCtrl, authCtrl, uiCtrl);
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise la page une fois qu'on est entrée (preview oblige)
   *
   * @memberof QrReaderPage
   */
  ionViewDidEnter() {
    this.checkAuthForScan().then(() => {
      this.startPreview();
    });
    this.screenCtrl.lock(this.screenCtrl.ORIENTATIONS.PORTRAIT);

    const pageData = Global.getDefaultPageData();
    pageData.title = 'Scanner un QR Code';
    pageData.subtitle = 'Importer une liste';
    this.evtCtrl.setHeader(pageData);
  }

  /**
   * termine la preview et débloque la rotation de la page
   *
   * @memberof QrReaderPage
   */
  ionViewWillLeave() {
    super.ionViewWillLeave();
    if (this.scanSub != null && !this.scanSub.closed) {
      this.scanSub.unsubscribe();
    }
    this.stopPreview();
    this.qrScanner.destroy();
    this.screenCtrl.unlock();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * retourne une promise qui indique si l'on peut scanner (càd si le scanner est ready)
   *
   * @private
   * @returns {Promise<void>}
   * @memberof QrReaderPage
   */
  private async checkAuthForScan(): Promise<void> {
    const status: QRScannerStatus = await this.qrScanner.prepare();
    if (status.authorized) {
      this.okToScan = true;
    }
  }

  /**
   * démarre la preview si possible et concerve l'information
   *
   * @private
   * @returns {Promise<void>}
   * @memberof QrReaderPage
   */
  private async startPreview(): Promise<void> {
    if (this.cameraOn === false) {
      this.qrScanner.destroy();
      await this.cameraPreview.startCamera(QrReaderPage.CAMERA_OPTS);
      this.cameraOn = true;
    }
  }

  /**
   * termine la preview si possible et concerve l'information
   *
   * @private
   * @returns {Promise<void>}
   * @memberof QrReaderPage
   */
  private async stopPreview(): Promise<void> {
    if (this.cameraOn === true) {
      await this.cameraPreview.stopCamera();
      this.cameraOn = false;
    }
  }

  /**
   * au bout d'un certain temps arrête de chercher un qr code et reset
   *
   * @private
   * @memberof QrReaderPage
   */
  private timeoutNoData(): void {
    setTimeout(() => {
      if (!this.scanSub.closed) {
        this.uiCtrl.displayToast(
          'Impossible de trouver un QR Code à scanner, veuillez rééssayer'
        );
        this.scanSub.unsubscribe();
        this.startPreview();
      }
    }, QrReaderPage.MAX_SCAN_TIME);
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * permet d'arréter la preview et de commencer à scanner un qr code pendant une certaine durée.
   *
   * @returns {Promise<void>}
   * @memberof QrReaderPage
   */
  public async scan(): Promise<void> {
    this.stopPreview();
    this.uiCtrl.showLoading('Tentative de scan en cours', QrReaderPage.MAX_SCAN_TIME);
    await this.qrScanner.prepare();

    this.scanSub = this.qrScanner.scan().subscribe((text: string) => {
      this.uiCtrl.dismissLoading();
      this.scanSub.unsubscribe();
      this.importHandler(text).then((success: boolean) => {
        if (success) {
          this.navCtrl.popToRoot();
        } else {
          this.uiCtrl.dismissLoading();
          this.startPreview();
        }
      });
    });

    this.timeoutNoData();
  }

  /**************************************************************************/
  /******************************* OVERRIDES ********************************/
  /**************************************************************************/

  /**
   * @override
   * @protected
   * @returns {{ subtitle: string; messages: string[] }}
   * @memberof QrReaderPage
   */
  protected generateHelp(): { subtitle: string; messages: string[] } {
    return {
      subtitle: "Aide sur l'import de liste par QR Code",
      messages: [
        "Cette page vous permet d'importer une liste en scannant un QR Code",
        "Pour cela il vous suffit de viser le QR Code à scanner dans le fenêtre de prévisualisation et de lancer le scan. Au bout de quelque instant un message vous informera du succès ou de l'échec de l'opération",
        'Les listes peuvent avoir été partagé en partage, partage en lecture seule ou envoi.',
        "Les partage et partage en lecture seul vous permette d'observer une unique liste avec l'auteur de partage C'est à dire de lier vos listes.",
        'vos modification seront visible et inversement. Si vous importé une liste partagée en lecture seule, vous ne pourrez pas la modifier ou modifier les tâche associée. Vous pourrez toutefois validé une tâche que vous auriez complété',
        "Les listes disponible en envoie sont cloner lors de l'import et vos modification se seront pas répercuter sur la liste original et inversement"
      ]
    };
  }
}
