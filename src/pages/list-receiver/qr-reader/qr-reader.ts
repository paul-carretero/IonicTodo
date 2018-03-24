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

@IonicPage()
@Component({
  selector: 'page-qr-reader',
  templateUrl: 'qr-reader.html'
})
export class QrReaderPage extends GenericReceiver {
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
   * vrai si on peut démarrer le scan de qr code == si la class de scan est prepared
   *
   * @memberof QrReaderPage
   */
  public okToScan = false;

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

  ionViewWillLeave() {
    if (this.scanSub != null && !this.scanSub.closed) {
      this.scanSub.unsubscribe();
    }
    this.stopPreview();
    this.qrScanner.destroy();
    this.screenCtrl.unlock();
  }

  private async checkAuthForScan(): Promise<void> {
    const status: QRScannerStatus = await this.qrScanner.prepare();
    if (status.authorized) {
      this.okToScan = true;
    }
  }

  private async startPreview(): Promise<void> {
    if (this.cameraOn === false) {
      this.qrScanner.destroy();
      await this.cameraPreview.startCamera(QrReaderPage.CAMERA_OPTS);
      this.cameraOn = true;
    }
  }

  private async stopPreview(): Promise<void> {
    if (this.cameraOn === true) {
      await this.cameraPreview.stopCamera();
      this.cameraOn = false;
    }
  }

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
}
