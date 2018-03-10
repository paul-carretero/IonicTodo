import { Subscription } from 'rxjs';
import { SpeechSynthServiceProvider } from './../../providers/speech-synth-service/speech-synth-service';
import { EventServiceProvider } from './../../providers/event/event-service';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  AlertController,
  LoadingController
} from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { GenericPage } from './../../shared/generic-page';
import { MenuRequest } from '../../model/menu-request';
import {
  CameraPreview,
  CameraPreviewPictureOptions,
  CameraPreviewOptions,
  CameraPreviewDimensions
} from '@ionic-native/camera-preview';
import { ToastController } from 'ionic-angular';

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
    private qrScanner: QRScanner,
    private navParams: NavParams,
    private cameraPreview: CameraPreview,
    private toastCtrl: ToastController
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl);
  }

  ionViewDidEnter() {
    this.checkAuthForScan();
    this.cameraPreview.startCamera(QrReaderPage.cameraPreviewOpts);
    this.cameraOn = true;
  }

  ionViewWillLeave() {
    if (!this.scanSub.closed) {
      this.scanSub.unsubscribe();
    }
    if ((this.cameraOn = true)) {
      this.cameraPreview.stopCamera();
    }
    this.qrScanner.destroy();
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
        this.failToast();
        this.scanSub.unsubscribe();
        this.qrScanner.destroy();
        this.cameraPreview.startCamera(QrReaderPage.cameraPreviewOpts);
        this.cameraOn = true;
      }
    }, QrReaderPage.MAX_SCAN_TIME);
  }

  private failToast() {
    this.toastCtrl
      .create({
        message:
          'Impossible de trouver un QR Code à scanner, veuillez rééssayer',
        duration: 3000,
        position: 'bottom'
      })
      .present();
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public menuEventHandler(req: MenuRequest): void {
    throw new Error('Method not implemented.');
  }
}
