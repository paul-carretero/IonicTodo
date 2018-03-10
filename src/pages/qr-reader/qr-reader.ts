import { Component } from '@angular/core';
import {
  CameraPreview,
  CameraPreviewOptions
} from '@ionic-native/camera-preview';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import {
  AlertController,
  IonicPage,
  LoadingController,
  NavController,
  ToastController
} from 'ionic-angular';
import { Subscription } from 'rxjs';

import { MenuRequest } from '../../model/menu-request';
import { EventServiceProvider } from './../../providers/event/event-service';
import { SpeechSynthServiceProvider } from './../../providers/speech-synth-service/speech-synth-service';
import { GenericPage } from './../../shared/generic-page';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';

@IonicPage()
@Component({
  selector: 'page-qr-reader',
  templateUrl: 'qr-reader.html'
})
export class QrReaderPage extends GenericPage {
  private static readonly MAX_SCAN_TIME = 8000;

  private static readonly cameraPreviewOpts: CameraPreviewOptions = {
    x: 0,
    y: 60,
    width: window.screen.width,
    height: window.screen.height / 2,
    camera: 'rear',
    tapPhoto: false,
    previewDrag: false,
    toBack: true,
    alpha: 1
  };

  public okToScan = false;
  private cameraOn = false;
  private scanSub: Subscription;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider,
    public ttsCtrl: SpeechSynthServiceProvider,
    public toastCtrl: ToastController,
    private qrScanner: QRScanner,
    private cameraPreview: CameraPreview,
    private screenCtrl: ScreenOrientation
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl);
  }

  ionViewDidEnter() {
    this.checkAuthForScan();
    this.cameraPreview.startCamera(QrReaderPage.cameraPreviewOpts).then(() => {
      this.cameraOn = true;
    });
    this.screenCtrl.lock(this.screenCtrl.ORIENTATIONS.PORTRAIT);
  }

  ionViewWillLeave() {
    if (this.scanSub != null && !this.scanSub.closed) {
      this.scanSub.unsubscribe();
    }
    if ((this.cameraOn = true)) {
      this.cameraPreview.stopCamera();
    }
    this.qrScanner.destroy();
    this.screenCtrl.unlock();
  }

  private async checkAuthForScan(): Promise<void> {
    const status: QRScannerStatus = await this.qrScanner.prepare();
    if (status.authorized) {
      this.okToScan = true;
    }
  }

  public async scan(): Promise<void> {
    if ((this.cameraOn = true)) {
      await this.cameraPreview.stopCamera();
      this.cameraOn = false;
    }

    this.showLoading('tentative de scan en cours', QrReaderPage.MAX_SCAN_TIME);

    await this.qrScanner.prepare();

    this.scanSub = this.qrScanner.scan().subscribe((text: string) => {
      this.loading.dismiss();
      console.log(text);
      this.alert('Scanned something', text);
      this.scanSub.unsubscribe();
    });

    setTimeout(() => {
      if (!this.scanSub.closed) {
        this.displayToast(
          'Impossible de trouver un QR Code à scanner, veuillez rééssayer'
        );
        this.scanSub.unsubscribe();
        this.qrScanner.destroy();
        this.cameraPreview
          .startCamera(QrReaderPage.cameraPreviewOpts)
          .then(() => {
            this.cameraOn = true;
          });
      }
    }, QrReaderPage.MAX_SCAN_TIME);
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public menuEventHandler(req: MenuRequest): void {
    throw new Error('Method not implemented.');
  }
}
