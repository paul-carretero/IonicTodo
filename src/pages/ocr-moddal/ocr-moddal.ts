import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { Component } from '@angular/core';
import {
  CameraPreview,
  CameraPreviewOptions,
  CameraPreviewPictureOptions
} from '@ionic-native/camera-preview';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { UiServiceProvider } from '../../providers/ui-service/ui-service';
import { GenericPage } from '../../shared/generic-page';
import { Global } from '../../shared/global';

declare var OCRAD: any;

/**
 * Page affichant une preview et la possibilité de photographier un text pour reconnaissance de caractères.
 * En fait ce n'est pas une page modale
 *
 * @export
 * @class OcrModdalPage
 */
@IonicPage()
@Component({
  selector: 'page-ocr-moddal',
  templateUrl: 'ocr-moddal.html'
})
export class OcrModdalPage extends GenericPage {
  /**************************** PRIVATE FIELDS ******************************/
  /**
   * options pour prendre une photo avec le plugin de preview
   *
   * @private
   * @static
   * @type {CameraPreviewPictureOptions}
   * @memberof OcrModdalPage
   */
  private static readonly pictureOpts: CameraPreviewPictureOptions = {
    width: 720,
    height: 1280,
    quality: 100
  };

  /**
   * options de prévisiualisation avec le plugin de preview
   *
   * @private
   * @static
   * @type {CameraPreviewOptions}
   * @memberof OcrModdalPage
   */
  private static readonly CAMERA_OPTS: CameraPreviewOptions = {
    x: (window.screen.width - window.screen.width / 1.4) / 2,
    y: 120,
    width: window.screen.width / 1.4,
    height: window.screen.height / 2,
    camera: 'rear',
    tapPhoto: false,
    previewDrag: false,
    toBack: true,
    alpha: 1
  };

  /**
   * liste dans laquelle sauvegarder les todo scanner
   *
   * @readonly
   * @private
   * @type {string}
   * @memberof OcrModdalPage
   */
  private readonly listUuid: string;

  /***************************** PUBLIC FIELDS ******************************/

  /**
   * vrai si la visualisation est activée, faux sinon
   *
   * @protected
   * @type {boolean}
   * @memberof OcrModdalPage
   */
  protected cameraOn: boolean = false;

  /**
   * Hauteur maximal de l'image (lors du chargement, ne dépasse pas les limites de l'écran)
   *
   * @readonly
   * @protected
   * @type {number}
   * @memberof OcrModdalPage
   */
  protected readonly maxHeight = OcrModdalPage.CAMERA_OPTS.height;

  /**
   * image pour présentation à l'écran
   *
   * @protected
   * @type {string}
   * @memberof OcrModdalPage
   */
  protected srcImage: string | null;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of OcrModdalPage.
   * @param {NavController} navCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {SpeechSynthServiceProvider} ttsCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {UiServiceProvider} uiCtrl
   * @param {NavParams} navParams
   * @param {CameraPreview} cameraPreview
   * @param {ScreenOrientation} screenCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @memberof OcrModdalPage
   */
  constructor(
    protected readonly navCtrl: NavController,
    protected readonly evtCtrl: EventServiceProvider,
    protected readonly ttsCtrl: SpeechSynthServiceProvider,
    protected readonly authCtrl: AuthServiceProvider,
    protected readonly uiCtrl: UiServiceProvider,
    private readonly navParams: NavParams,
    private readonly cameraPreview: CameraPreview,
    private readonly screenCtrl: ScreenOrientation,
    private readonly todoCtrl: TodoServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.listUuid = this.navParams.get('listUuid');
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * défini la page et initialise la prévisualisation
   *
   * @memberof OcrModdalPage
   */
  ionViewDidEnter() {
    this.startPreview();
    this.screenCtrl.lock(this.screenCtrl.ORIENTATIONS.PORTRAIT);
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Importer par OCR';
    pageData.subtitle = 'Importer vos tâches';
    this.evtCtrl.setHeader(pageData);
  }

  /**
   * Termine la visualisation et déverrouille l'écran
   *
   * @memberof OcrModdalPage
   */
  ionViewWillLeave() {
    this.stopPreview();
    this.screenCtrl.unlock();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * commence la prévisualisation
   *
   * @private
   * @returns {Promise<void>}
   * @memberof OcrModdalPage
   */
  private async startPreview(): Promise<void> {
    if (this.cameraOn === false) {
      await this.cameraPreview.startCamera(OcrModdalPage.CAMERA_OPTS);
      this.cameraOn = true;
    }
  }

  /**
   * Termine la prévisualisation si possible
   *
   * @private
   * @returns {Promise<void>}
   * @memberof OcrModdalPage
   */
  private async stopPreview(): Promise<void> {
    if (this.cameraOn === true) {
      await this.cameraPreview.stopCamera();
      this.cameraOn = false;
    }
  }

  /**
   * à partir d'une chaine de caractère reconnu par l'application OCR, la fonction va:
   * Nettoyer la chaine des caractère spéciaux (erreur d'OCR probablement)
   * Convertir les lignes non vide en un tableau de string
   * Proposer à l'utilisateur de selectionner les todo
   *
   * @private
   * @param {string} text
   * @returns {Promise<void>}
   * @memberof OcrModdalPage
   */
  private async ocrTextHandler(text: string): Promise<void> {
    text = text.replace(/[-'`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    const lines = text.split(/\r?\n/);
    const selectTodo = this.uiCtrl.getBasicAlert();
    selectTodo.setTitle('Tâches à importer');
    selectTodo.setSubTitle(
      'Les tâches suivante ont été reconnues. Vous pouvez sélectionner celles que vous souhaiter importer dans votre liste de tâches'
    );
    for (const todo of lines) {
      if (todo.trim().length > 2) {
        selectTodo.addInput({
          type: 'checkbox',
          label: todo,
          value: todo,
          checked: true
        });
      }
    }
    selectTodo.addButton({
      text: 'Annuler',
      handler: () => {
        this.srcImage = null;
        this.startPreview();
      }
    });
    selectTodo.addButton({
      text: 'Valider',
      handler: (data: string[]) => {
        this.importTodos(data);
      }
    });
    this.uiCtrl.dismissLoading();
    selectTodo.present();
  }

  /**
   * La fonction tentera de créer des todos ayant pour nom ce passé dans le tableau de string
   *
   * @private
   * @param {string[]} names
   * @returns {Promise<void>}
   * @memberof OcrModdalPage
   */
  private async importTodos(names: string[]): Promise<void> {
    this.uiCtrl.showLoading('Importation de vos tâches en cours');
    const promises: Promise<any>[] = [];
    for (const name of names) {
      const todo = Global.getBlankTodo();
      todo.name = name;
      promises.push(this.todoCtrl.addTodo(this.listUuid, todo));
    }
    await Promise.all(promises);
    this.navCtrl.pop();
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * la fonction démarrera la reconnaissance de caractères
   * terminera le preview et affichera l'image prise pour la reconnaissance
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof OcrModdalPage
   */
  protected async scanOCR(): Promise<void> {
    let imageData: any;
    try {
      imageData = await this.cameraPreview.takePicture(OcrModdalPage.pictureOpts);
    } catch (error) {
      this.uiCtrl.displayToast('Impossible de prendre une photo');
      return;
    }
    this.srcImage = 'data:image/jpeg;base64,' + imageData;
    this.stopPreview();
    this.uiCtrl.showLoading('OCR en cours');
    setTimeout(() => {
      OCRAD(document.getElementById('image'), (text: any) => {
        this.ocrTextHandler(text);
      });
    }, 400);
  }
}
