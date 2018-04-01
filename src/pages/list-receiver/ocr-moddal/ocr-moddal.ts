import { Component } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthServiceProvider } from '../../../providers/auth-service/auth-service';
import { EventServiceProvider } from '../../../providers/event/event-service';
import { SpeechSynthServiceProvider } from '../../../providers/speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../../../providers/todo-service-ts/todo-service-ts';
import { UiServiceProvider } from '../../../providers/ui-service/ui-service';
import { GenericPage } from '../../../shared/generic-page';
import { Global } from '../../../shared/global';

/**
 * import de la bibliothèque d'OCR OCRAD
 * @see https://www.gnu.org/software/ocrad/
 */
declare const OCRAD: any;

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
   * liste dans laquelle sauvegarder les todo scanner
   *
   * @readonly
   * @private
   * @type {string}
   * @memberof OcrModdalPage
   */
  private readonly listUuid: string;

  /**
   * options pour la caméta
   *
   * @private
   * @type {CameraOptions}
   * @memberof OcrModdalPage
   */
  private readonly cameraOpts: CameraOptions;

  /***************************** PUBLIC FIELDS ******************************/

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
   * @param {Camera} cameraCtrl
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
    private readonly cameraCtrl: Camera,
    private readonly todoCtrl: TodoServiceProvider
  ) {
    super(navCtrl, evtCtrl, ttsCtrl, authCtrl, uiCtrl);
    this.listUuid = this.navParams.get('listUuid');
    this.cameraOpts = {
      quality: 80,
      correctOrientation: true,
      allowEdit: true,
      targetWidth: 800,
      destinationType: this.cameraCtrl.DestinationType.FILE_URI,
      encodingType: this.cameraCtrl.EncodingType.JPEG,
      mediaType: this.cameraCtrl.MediaType.PICTURE
    };
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   * initialise le header de la page
   *
   * @memberof OcrModdalPage
   */
  ionViewWillEnter(): void {
    super.ionViewWillEnter();
    const pageData = Global.getDefaultPageData();
    pageData.title = 'Importer par OCR';
    pageData.subtitle = 'Importer vos tâches';
    this.evtCtrl.setHeader(pageData);
  }

  /**
   * prépare la prise d'une photo pour analyse OCR
   *
   * @memberof OcrModdalPage
   */
  ionViewDidEnter(): void {
    if (this.listUuid == null) {
      this.navCtrl.pop();
    }
    this.takePicture();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * démarre la capture d'une photo à reconnaitre par OCR
   *
   * @private
   * @memberof OcrModdalPage
   */
  private takePicture(): void {
    this.cameraCtrl.getPicture(this.cameraOpts).then(
      imageData => {
        this.srcImage = imageData;
        this.startOCR();
      },
      () => this.uiCtrl.alert('Erreur', "Impossible d'acceder à la camera")
    );
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
    let atLeastOne = false;
    selectTodo.setTitle('Tâches à importer');
    selectTodo.setSubTitle(
      'Les tâches suivante ont été reconnues. Vous pouvez sélectionner celles que vous souhaiter importer dans votre liste de tâches'
    );
    for (const todo of lines) {
      if (todo.trim().length > 2) {
        atLeastOne = true;
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
        this.takePicture();
      }
    });
    selectTodo.addButton({
      text: 'Valider',
      handler: (data: string[]) => {
        this.importTodos(data);
      }
    });
    this.uiCtrl.dismissLoading();
    if (atLeastOne) {
      selectTodo.present();
    } else {
      const again = await this.uiCtrl.confirm(
        'Echec',
        "Désolé mais aucune ligne n'a pû être identifiée, voulez vous réessayer ?"
      );
      if (again) {
        this.srcImage = null;
        this.takePicture();
      } else {
        this.navCtrl.pop();
      }
    }
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

  /**
   * la fonction démarrera la reconnaissance de caractères
   * terminera le preview et affichera l'image prise pour la reconnaissance
   *
   * @protected
   * @returns {Promise<void>}
   * @memberof OcrModdalPage
   */
  private async startOCR(): Promise<void> {
    this.uiCtrl.showLoading('OCR en cours');
    setTimeout(() => {
      OCRAD(document.getElementById('image'), (text: any) => {
        this.ocrTextHandler(text);
      });
    }, 400);
  }
}
