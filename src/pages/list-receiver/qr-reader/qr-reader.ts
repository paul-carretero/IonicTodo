import { Component } from '@angular/core';
import { CameraPreview, CameraPreviewOptions } from '@ionic-native/camera-preview';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { IonicPage, NavController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import { IMenuRequest } from '../../../model/menu-request';
import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { GenericReceiver } from '../generic-receiver';
import { TodoServiceProvider } from './../../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../../../providers/ui-service/ui-service';

@IonicPage()
@Component({
  selector: 'page-qr-reader',
  templateUrl: 'qr-reader.html'
})
export class QrReaderPage extends GenericReceiver {
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
    public readonly navCtrl: NavController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly todoCtrl: TodoServiceProvider,
    public readonly uiCtrl: UiServiceProvider,
    private readonly qrScanner: QRScanner,
    private readonly cameraPreview: CameraPreview,
    private readonly screenCtrl: ScreenOrientation,
    public readonly authCtrl: AuthServiceProvider
  ) {
    super(
      navCtrl,

      evtCtrl,
      ttsCtrl,
      todoCtrl,
      authCtrl,
      uiCtrl
    );
  }

  ionViewDidEnter() {
    this.checkAuthForScan();
    this.startPreview();
    this.screenCtrl.lock(this.screenCtrl.ORIENTATIONS.PORTRAIT);
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
      await this.cameraPreview.startCamera(QrReaderPage.cameraPreviewOpts);
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

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public menuEventHandler(req: IMenuRequest): void {
    switch (req) {
    }
  }
}
