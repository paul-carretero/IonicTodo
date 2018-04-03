import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';

import { ISpeechReqResult } from '../../model/speech-req-res';
import { ITodoItem } from '../../model/todo-item';
import { ITodoList, ListType } from '../../model/todo-list';
import { Global } from '../../shared/global';
import { AuthServiceProvider } from '../auth-service/auth-service';
import { SpeechSynthServiceProvider } from '../speech-synth-service/speech-synth-service';
import { TodoServiceProvider } from '../todo-service-ts/todo-service-ts';
import { ICloudSharedList } from './../../model/cloud-shared-list';
import { MenuRequestType } from './../../model/menu-request-type';
import { CloudServiceProvider } from './../cloud-service/cloud-service';
import { ContactServiceProvider } from './../contact-service/contact-service';
import { EventServiceProvider } from './../event/event-service';
import { UiServiceProvider } from './../ui-service/ui-service';
import { IParsedRequest } from '../../model/parsed-req';
import { SpeechParser } from './parser';
import { Media } from '../../model/media';

/**
 * permet d'écouter les phrase de l'utilisateur et de les traduire en commande de l'application
 *
 * @export
 * @class SpeechRecServiceProvider
 */
@Injectable()
export class SpeechRecServiceProvider {
  /**
   * true si les paramètre de reconnaissance vocale ont déjà été vérifiés
   *
   * @private
   * @memberof SpeechRecServiceProvider
   */
  private allOK = false;

  /**
   * nombre de tentative de reconnaissance infructueuse avant de proposer de l'aide
   *
   * @private
   * @memberof SpeechRecServiceProvider
   */
  private readonly nb_essais_pour_aide = 3;

  /**
   * nombre d'essais courrant infructueux
   *
   * @private
   * @memberof SpeechRecServiceProvider
   */
  private nb_essais_courant = 0;

  /**
   * messaege d'aide non contextuel
   *
   * @private
   * @memberof SpeechRecServiceProvider
   */
  private readonly message_aide_page_home = " Exemples d'utilisation depuis la page de l'ensemble des listes : \n" +
    ' Créer la liste maison. \n' +
    ' Afficher la liste maison. \n ' +
    ' Modifier la liste maison. \n ' +
    ' Ajouter la tâche repassage dans la liste maison. \n' +
    ' Supprimer la tâche repassage dans la liste maison. \n' +
    ' Supprimer la liste maison. \n';

  /**
   * message d'aide contextuel
   *
   * @private
   * @memberof SpeechRecServiceProvider
   */
  private readonly message_aide_page_todo_list = "Exemples d'utilisation depuis la page d'une liste : \n" +
    ' Ajouter la tâche repassage. \n' +
    ' Afficher la tâche repassage. \n' +
    ' Supprimer la tâche repassage. \n';

  /**
   * parseur de phrase
   *
   * @private
   * @type {SpeechParser}
   * @memberof SpeechRecServiceProvider
   */
  private readonly parser: SpeechParser;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of SpeechRecServiceProvider.
   * @param {SpeechRecognition} speechRecognition
   * @param {EventServiceProvider} evtCtrl
   * @param {TodoServiceProvider} todoService
   * @param {UiServiceProvider} uiCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {SpeechSynthServiceProvider} speechSynthService
   * @memberof SpeechRecServiceProvider
   */
  constructor(
    private readonly speechRecognition: SpeechRecognition,
    private readonly evtCtrl: EventServiceProvider,
    private readonly todoService: TodoServiceProvider,
    private readonly uiCtrl: UiServiceProvider,
    private readonly authCtrl: AuthServiceProvider,
    private readonly speechSynthService: SpeechSynthServiceProvider,
    private readonly cloudCtrl: CloudServiceProvider,
    contactCtrl: ContactServiceProvider
  ) {
    this.parser = new SpeechParser(todoService, contactCtrl, evtCtrl);
  }

  /**************************************************************************/
  /********************** METHODES PUBLIQUES/INTERFACE **********************/
  /**************************************************************************/

  /**
   * démarre le service reconnaissance vocale lorsque l'utilisateur utilise la fonction du menu.
   * Si la reconnaissance vocale à déjà été utilisé alors tente de l'utiliser directement
   *
   * @public
   * @memberof SpeechRecServiceProvider
   */
  public listenForSpeechRequest(): void {
    this.evtCtrl.getMenuRequestSubject().subscribe(req => {
      if (req.request === MenuRequestType.SPEECH_REC) {
        if (this.allOK) {
          this.startListening();
        } else {
          this.speechWrapper();
        }
      }
    });
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * Appelé au début pour vérification des authorisations de la reconnaissance vocale
   *
   * @private
   * @memberof SpeechRecServiceProvider
   */
  private speechWrapper(): void {
    this.uiCtrl.showLoading('Veuillez patienter, préparation de le reconnaissance vocale');
    this.speechRecognition.isRecognitionAvailable().then((available: boolean) => {
      if (available) {
        this.speechRecognition.hasPermission().then((hasPermission: boolean) => {
          if (hasPermission) {
            this.allOK = true;
            this.startListening();
          } else {
            this.speechRecognition.requestPermission().then(
              () => {
                this.allOK = true;
                this.startListening();
              },
              () => {
                this.uiCtrl.dismissLoading();
                this.uiCtrl.alert(
                  'Erreur',
                  "Vous devez autoriser l'application à utiliser votre microphone"
                );
              }
            );
          }
        });
      } else {
        this.uiCtrl.dismissLoading();
        this.uiCtrl.alert(
          'Erreur',
          'Fonctinalité de reconnaissance vocale indisponible sur votre terminal'
        );
      }
    });
  }

  /**
   * Méthode appelée lorsque la reconnaissance vocale est activée
   *
   * @private
   * @returns {Promise<void>}
   * @memberof SpeechRecServiceProvider
   */
  private startListening(): void {
    this.speechRecognition.startListening().subscribe(
      (matches: string[]) => {
        this.matchesHandler(matches);
      },
      () => {
        this.uiCtrl.alert('Erreur', 'une erreur inattendue est survenue');
        this.uiCtrl.dismissLoading();
      }
    );
  }

  /**
   * méthodes permettant de traiter un tableau de matches issue de la reconnaissance vocale
   *
   * @private
   * @param {string[]} matches tableau des différentes chaines possible
   * @returns {Promise<void>}
   * @memberof SpeechRecServiceProvider
   */
  private async matchesHandler(matches: string[]): Promise<void> {
    this.uiCtrl.showLoading('Veuillez patienter, analyse en cours');

    let res_rec: ISpeechReqResult = {
      reconnu: false,
      action_success: false,
      message_error: ''
    };

    await this.parser.init();

    // pour chaque "phrase" possible reconnue par le micro
    for (const item of matches) {
      // on parse cette phrase
      const sentence: IParsedRequest = await this.parser.parse(item);
      console.log(sentence);

      res_rec = this.reconnaissanceAction(sentence);
      if (res_rec.action_success) {
        break;
      }
    }

    // si aucune action n'a été reconnue
    if (res_rec.reconnu == null || !res_rec.reconnu) {
      this.speechSynthService.synthText("Je n'ai pas compris");
      this.nb_essais_courant++;
      if (this.nb_essais_courant >= this.nb_essais_pour_aide) {
        this.speechSynthService.synthText("Si vous voulez de l'aide, dites aide");
      }
    }

    // si l'action a été reconnue mais n'a pas pu être réalisée
    // on affiche son message d'erreur
    if (res_rec.reconnu != null && res_rec.reconnu && !res_rec.action_success) {
      this.speechSynthService.synthText(res_rec.message_error);
    }

    this.uiCtrl.dismissLoading();
  }

  /**
   * Méthode permettant de reconnaitre l'action à réaliser
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private reconnaissanceAction(sentence: IParsedRequest): ISpeechReqResult {
    let phrase_reconnue = true;
    let resultat_action: ISpeechReqResult;
    resultat_action = {
      action_success: false,
      message_error: "Je n'ai pas compris votre demande"
    };

    if (sentence.request != null) {
      // reconnaissance des mots clefs dans les mots entendus
      const contain_todo = sentence.newTodoName != null || sentence.todoFound != null;
      const contain_list = sentence.newListName != null || sentence.listFound != null;

      switch (sentence.request.request) {
        case MenuRequestType.CREATE:
          if (sentence.newListName != null && !contain_todo) {
            // CRÉER UNE NOUVELLE LISTE ?
            phrase_reconnue = true;
            resultat_action = this.creerListe(sentence);
          } else if (sentence.newTodoName != null) {
            // AJOUTER UNE TACHE DANS UNE LISTE ?
            phrase_reconnue = true;
            resultat_action = this.creerTache(sentence);
          }
          break;

        case MenuRequestType.EDIT:
          if (contain_list && !contain_todo) {
            // METTRE A JOUR UNE LISTE ?
            resultat_action = this.updateListe(sentence);
            phrase_reconnue = true;
          } else if (contain_todo) {
            // METTRE A JOUR UNE TACHE ?
            resultat_action = this.updateTache(sentence);
            phrase_reconnue = true;
          }

          break;

        case MenuRequestType.DELETE:
          if (sentence.newListName != null && sentence.listFound != null && !contain_todo) {
            // SUPPRIMER UNE LISTE ? (on est obligé de préciser le mot liste pour suppr)
            resultat_action = this.supprimerListe(sentence);
            phrase_reconnue = true;
          } else if (sentence.newTodoName != null && sentence.todoFound != null) {
            // SUPPRIMER UNE TACHE ? (on est obligé de préciser le mot tache pour suppr)
            resultat_action = this.supprimerTache(sentence);
            phrase_reconnue = true;
          } else if (contain_list || contain_todo) {
            phrase_reconnue = true;
            resultat_action.message_error =
              'Vous devez préciser le mot liste ou tâche suivi du nom de la liste ou tâche à supprimer pour pouvoir la supprimer';
          }
          break;

        case MenuRequestType.VIEW:
          if (contain_list && !contain_todo) {
            //AFFICHER UNE LISTES ?
            resultat_action = this.afficherListe(sentence);
            phrase_reconnue = true;
          } else if (contain_todo) {
            //AFFICHER UNE TACHE ?
            resultat_action = this.afficherTodo(sentence);
            phrase_reconnue = true;
          }
          break;

        case MenuRequestType.HELP:
          resultat_action = { action_success: true, message_error: '' };
          if (this.evtCtrl.getCurrentContext(true) != null) {
            this.speechSynthService.synthText(this.message_aide_page_todo_list);
          } else {
            this.speechSynthService.synthText(this.message_aide_page_home);
          }
          phrase_reconnue = true;
          break;

        case MenuRequestType.SHARE:
          if (contain_list && !contain_todo) {
            //PARTAGER UNE LISTE ?
            resultat_action = this.sendOrShareListHandler(sentence);
            phrase_reconnue = true;
          }
          break;

        case MenuRequestType.SEND:
          if (contain_list && !contain_todo) {
            //ENVOYER UNE LISTE ?
            resultat_action = this.sendOrShareListHandler(sentence);
            phrase_reconnue = true;
          }
          break;

        case MenuRequestType.COMPLETE:
          // MARQUER UNE TACHE COMME COMPLETE
          if (contain_todo) {
            resultat_action = this.completeTodo(sentence);
            phrase_reconnue = true;
          }
          break;
      }
    }

    return {
      reconnu: phrase_reconnue,
      action_success: resultat_action.action_success,
      message_error: resultat_action.message_error
    };
  }

  /**************************************************************************/
  /*************** Méthodes pour les actions liées aux listes ***************/
  /**************************************************************************/

  /**
   * Méthode permettant de créer une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";
    const nameList = sentence.newListName;

    if (nameList == null) {
      message_error =
        "Je n'ai pas compris le nom de la liste à créer. Veuillez essayer de nouveau.";
    } else {
      if (sentence.listFound != null) {
        message_error = 'La liste ' + nameList + ' éxiste déjà';
      } else {
        this.addNewList(nameList);
        this.speechSynthService.synthText('Liste ' + nameList + ' créée.');
        action_success = true;
      }
    }

    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'ajouter une nouvelle liste
   *
   * @private
   * @param {string} nameList nom de la liste à ajouter
   * @memberof SpeechRecServiceProvider
   */
  private addNewList(nameList: string): void {
    let destType: ListType = ListType.LOCAL;
    if (this.authCtrl.isConnected()) {
      destType = ListType.PRIVATE;
    }
    const iconList = 'list-box';
    const data: ITodoList = Global.getBlankList();
    data.name = nameList;
    data.icon = iconList;
    this.todoService.addList(data, destType);
  }

  /**
   * Méthode permettant d'afficher la page d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private afficherListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      action_success = true;
      this.speechSynthService.synthText('Affichage de la liste ' + sentence.listFound.name);
      if (this.evtCtrl.getCurrentContext(true) !== sentence.listFound.uuid) {
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoListPage', data: { uuid: sentence.listFound.uuid } });
      }
    } else {
      message_error = 'La liste ' + sentence.newListName + " n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'afficher la page d'édition d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null) {
      action_success = true;
      this.speechSynthService.synthText(
        'Vous pouvez modifier la liste ' + sentence.listFound.name
      );
      this.evtCtrl
        .getNavRequestSubject()
        .next({ page: 'ListEditPage', data: { uuid: sentence.listFound.uuid } });
    } else {
      message_error = 'La liste ' + sentence.newListName + "n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant de supprimer une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private supprimerListe(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      this.speechSynthService.synthText('Suppression de la liste ' + sentence.listFound.name);
      this.todoService.deleteList(sentence.listFound.uuid);
      action_success = true;
    } else {
      message_error =
        'La liste ' + sentence.newListName + "n'a pas étée trouvée. Suppression impossible";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * permet de partager ou d'envoyer une liste par un media ou à un contact
   *
   * @private
   * @param {IParsedRequest} sentence
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private sendOrShareListHandler(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null) {
      if (sentence.contact != null) {
        if (sentence.contact.email != null && sentence.contact.email !== '') {
          action_success = true;
          this.sendOrShareToContact(sentence);
        } else {
          message_error =
            'Impossible de partager la liste ' +
            sentence.newListName +
            ' avec ' +
            sentence.contact.displayName +
            " car aucune addresse email n'existe pour ce contact";
        }
      } else if (sentence.request != null) {
        action_success = true;
        this.sendOrShareHandler(sentence);
      }
    } else {
      message_error = 'La liste ' + sentence.newListName + "n'a pas été trouvée";
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * en fonction du media choisi, ouvre la page de partage, le cloud est par défault
   *
   * @private
   * @param {IParsedRequest} sentence
   * @returns {void}
   * @memberof SpeechRecServiceProvider
   */
  private sendOrShareHandler(sentence: IParsedRequest): void {
    if (sentence.listFound != null && sentence.request != null) {
      sentence.request.uuid = sentence.listFound.uuid;
      switch (sentence.request.media) {
        case Media.NFC:
          this.evtCtrl
            .getNavRequestSubject()
            .next({ page: 'NfcSenderPage', data: { request: sentence.request } });
          this.speechSynthService.synthText(
            'Vous pouvez maintenant partager la liste ' + sentence.listFound.name + ' par NFC '
          );
          break;

        case Media.QR_CODE:
          this.evtCtrl
            .getNavRequestSubject()
            .next({ page: 'QrcodeGeneratePage', data: { request: sentence.request } });
          this.speechSynthService.synthText(
            'Vous pouvez maintenant partager la liste ' +
              sentence.listFound.name +
              ' par QR Code '
          );
          break;

        default:
          this.evtCtrl
            .getNavRequestSubject()
            .next({ page: 'CloudSenderPage', data: { request: sentence.request } });
          this.speechSynthService.synthText(
            'Vous pouvez maintenant partager la liste ' +
              sentence.listFound.name +
              ' sur le cloud OhMyTask '
          );
          break;
      }
    }
  }

  /**
   * permet d'envoyer une liste en envoi ou partage à un contact
   *
   * @private
   * @param {IParsedRequest} sentence
   * @returns {Promise<void>}
   * @memberof SpeechRecServiceProvider
   */
  private async sendOrShareToContact(sentence: IParsedRequest): Promise<void> {
    if (
      sentence.contact != null &&
      sentence.listFound != null &&
      sentence.listFound.uuid != null &&
      sentence.request != null
    ) {
      const author = await this.authCtrl.getAuthor(false);
      const data: ICloudSharedList = Global.getDefaultCloudShareData();
      data.author = author;
      data.email = sentence.contact.email;
      data.list = this.todoService.getListLink(sentence.listFound.uuid);
      data.name = sentence.listFound.name;
      if (sentence.request.request === MenuRequestType.SHARE) {
        data.list.shareByReference = true;
        await this.cloudCtrl.postNewShareRequest(data);
        this.speechSynthService.synthText(
          'La liste ' +
            sentence.listFound.name +
            ' a été partagé avec ' +
            sentence.contact.displayName
        );
      } else if (sentence.request.request === MenuRequestType.SEND) {
        data.list.shareByReference = false;
        await this.cloudCtrl.postNewShareRequest(data);
        this.speechSynthService.synthText(
          'La liste ' +
            sentence.listFound.name +
            ' a été envoyée a ' +
            sentence.contact.displayName
        );
      }
    }
  }

  /**************************************************************************/
  /*************** Méthodes pour les actions liées aux tâches ***************/
  /**************************************************************************/

  /**
   * Méthode permettant de créer une tâche associée à une liste.
   * Effectue des vérification si on peut créer une tache, (existance etc.)
   * Redirige vers la page d'affichage de la liste ssi on y est pas déjà
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private creerTache(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null) {
      if (sentence.todoFound == null) {
        if (sentence.listFound.uuid != null) {
          const data: ITodoItem = Global.getBlankTodo();
          data.name = sentence.newTodoName;
          const refDoc = this.todoService.addTodo(sentence.listFound.uuid, data);
          action_success = refDoc != null;

          if (action_success) {
            this.speechSynthService.synthText(
              'Tâche ' +
                sentence.newTodoName +
                ' a été ajoutée dans la liste ' +
                sentence.listFound.name
            );
            if (this.evtCtrl.getCurrentContext(true) !== sentence.listFound.uuid) {
              this.evtCtrl
                .getNavRequestSubject()
                .next({ page: 'TodoListPage', data: { uuid: sentence.listFound.uuid } });
            }
          } else {
            message_error = 'La tâche ' + sentence.newTodoName + "n'a pas pu être créée";
          }
        } else {
          message_error = 'La liste ' + sentence.listFound.name + "n'a pas étée trouvée";
        }
      } else {
        message_error =
          'La Tâche ' +
          sentence.todoFound.name +
          ' éxiste déjà dans la liste ' +
          sentence.listFound.name;
      }
    } else {
      message_error =
        'Veuillez indiquer dans quelle liste créer la tâche ' + sentence.newTodoName + ' .';
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'afficher la page d'édition d'une tâche d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private updateTache(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'as pas pu être réalisée";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      if (sentence.todoFound != null) {
        this.evtCtrl
          .getNavRequestSubject()
          .next({ page: 'TodoEditPage', data: { todoRef: sentence.todoFound.ref } });

        this.speechSynthService.synthText(
          'Vous pouvez maintenant modifier la tâche ' +
            sentence.todoFound.name +
            ' de la liste ' +
            sentence.listFound.name
        );
        action_success = true;
      } else {
        message_error =
          'La tâche ' +
          sentence.newTodoName +
          " n'a pas étée trouvée dans la liste " +
          sentence.listFound.name;
      }
    } else {
      if (sentence.newListName == null || sentence.newListName === '') {
        message_error =
          'Veuillez indiquer dans quelle liste modifier la tâche ' +
          sentence.newTodoName +
          ' .';
      } else {
        message_error = 'La liste ' + sentence.newListName + "n'a pas étée trouvée.";
      }
    }

    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant de supprimer une tâche d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private supprimerTache(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée.";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      if (
        sentence.todoFound != null &&
        sentence.todoFound.ref != null &&
        sentence.todoFound.uuid != null
      ) {
        this.speechSynthService.synthText(
          'Suppression de la tâche ' +
            sentence.todoFound.name +
            ' de la liste ' +
            sentence.listFound.name
        );

        this.todoService.deleteTodo(sentence.todoFound);

        if (this.evtCtrl.getCurrentContext(true) !== sentence.listFound.uuid) {
          this.evtCtrl
            .getNavRequestSubject()
            .next({ page: 'TodoListPage', data: { uuid: sentence.listFound.uuid } });
        }

        action_success = true;
      } else {
        message_error = 'La tâche ' + sentence.newTodoName + " n'a pas été trouvée";
      }
    } else {
      if (sentence.newListName != null || sentence.newListName !== '') {
        message_error =
          'Veuillez indiquer dans quelle liste supprimer la tâche ' +
          sentence.newTodoName +
          ' .';
      } else {
        message_error = 'La liste ' + sentence.newListName + " n'a pas été trouvée.";
      }
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant d'afficher la page d'une tâche
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private afficherTodo(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      if (sentence.todoFound != null) {
        action_success = true;
        this.speechSynthService.synthText('Affichage de la tâche ' + sentence.todoFound.name);
        if (this.evtCtrl.getCurrentContext(false) == null) {
          this.evtCtrl.getNavRequestSubject().next({
            page: 'TodoPage',
            data: {
              todoRef: sentence.todoFound.ref,
              listUuid: sentence.listFound.uuid,
              isExternal: false
            }
          });
        } else if (this.evtCtrl.getCurrentContext(false) !== sentence.todoFound.uuid) {
          this.evtCtrl.getMenuRequestSubject().next({
            request: MenuRequestType.VIEW,
            ref: sentence.todoFound.ref,
            uuid: sentence.listFound.uuid
          });
        }
      } else {
        message_error = 'La tâche ' + sentence.newTodoName + " n'a pas été trouvée. ";
      }
    } else {
      if (sentence.newListName == null || sentence.newListName === '') {
        message_error =
          'Veuillez indiquer dans quelle liste visualiser la tâche ' +
          sentence.newTodoName +
          ' .';
      } else {
        message_error = 'La liste ' + sentence.newListName + " n'a pas été trouvée.";
      }
    }
    return { action_success: action_success, message_error: message_error };
  }

  /**
   * Méthode permettant de supprimer une tâche d'une liste
   *
   * @private
   * @param {IParsedRequest} sentence la phrase parsée
   * @returns {ISpeechReqResult}
   * @memberof SpeechRecServiceProvider
   */
  private completeTodo(sentence: IParsedRequest): ISpeechReqResult {
    let action_success = false;
    let message_error = "L'action n'a pas pu être réalisée.";

    if (sentence.listFound != null && sentence.listFound.uuid != null) {
      if (
        sentence.todoFound != null &&
        sentence.todoFound.ref != null &&
        sentence.todoFound.uuid != null
      ) {
        if (!sentence.todoFound.complete) {
          this.speechSynthService.synthText(
            'Complétion de la tâche ' +
              sentence.todoFound.name +
              ' de la liste ' +
              sentence.listFound.name
          );
          sentence.todoFound.complete = true;
          this.todoService.complete(sentence.todoFound);
        } else {
          this.speechSynthService.synthText(
            'Impossible, la tâche ' +
              sentence.todoFound.name +
              ' de la liste ' +
              sentence.listFound.name +
              ' a déjà été complétée.'
          );
        }

        action_success = true;
      } else {
        message_error = 'La tâche ' + sentence.newTodoName + " n'a pas été trouvée";
      }
    } else {
      if (sentence.newListName != null && sentence.newListName !== '') {
        message_error =
          'Veuillez indiquer dans quelle liste compléter la tâche ' +
          sentence.newTodoName +
          ' .';
      } else {
        message_error = 'La liste ' + sentence.newListName + " n'a pas été trouvée.";
      }
    }
    return { action_success: action_success, message_error: message_error };
  }
}
