import { Injectable } from '@angular/core';
import { DocumentSnapshot } from '@firebase/firestore-types';
import { ILatLng } from '@ionic-native/google-maps';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentChangeAction
} from 'angularfire2/firestore';
import { User } from 'firebase/app';
import { Observable, Subscription } from 'rxjs/Rx';
import { v4 as uuid } from 'uuid';

import { MenuRequestType } from '../../model/menu-request-type';
import { Settings } from '../../model/settings';
import { ITodoList } from '../../model/todo-list';
import { ITodoListPath } from '../../model/todo-list-path';
import { ICloudSharedList } from './../../model/cloud-shared-list';
import { IMenuRequest } from './../../model/menu-request';
import { Global } from './../../shared/global';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { EventServiceProvider } from './../event/event-service';
import { MapServiceProvider } from './../map-service/map-service';
import { SettingServiceProvider } from './../setting/setting-service';
import { TodoServiceProvider } from './../todo-service-ts/todo-service-ts';
import { UiServiceProvider } from './../ui-service/ui-service';

@Injectable()
export class CloudServiceProvider {
  /**
   * durée en seconde durant laquelle un partage sts est disponible
   *
   * @readonly
   * @private
   * @static
   * @memberof CloudServiceProvider
   */
  private static readonly MAX_SECONDS = 10;

  /**
   * collection firestore contenant les partage liste cloud
   *
   * @readonly
   * @private
   * @type {AngularFirestoreCollection<ICloudSharedList>}
   * @memberof CloudServiceProvider
   */
  private readonly cloudListCollection: AngularFirestoreCollection<ICloudSharedList>;

  /**
   * abonement aux listes partagée disponible pour notre compte
   *
   * @private
   * @type {Subscription}
   * @memberof CloudServiceProvider
   */
  private availableListsSub: Subscription;

  /**
   * abonnement aux listes partagé sts (brève durée)
   *
   * @private
   * @type {Subscription}
   * @memberof CloudServiceProvider
   */
  private availableSTSListsSub: Subscription;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of CloudServiceProvider.
   * @param {AngularFirestore} firestoreCtrl
   * @param {AuthServiceProvider} authCtrl
   * @param {SettingServiceProvider} settingsCtrl
   * @param {MapServiceProvider} mapCtrl
   * @param {TodoServiceProvider} todoCtrl
   * @param {EventServiceProvider} evtCtrl
   * @param {UiServiceProvider} uiCtrl
   * @memberof CloudServiceProvider
   */
  constructor(
    private readonly firestoreCtrl: AngularFirestore,
    private readonly authCtrl: AuthServiceProvider,
    private readonly settingsCtrl: SettingServiceProvider,
    private readonly mapCtrl: MapServiceProvider,
    private readonly todoCtrl: TodoServiceProvider,
    private readonly evtCtrl: EventServiceProvider,
    private readonly uiCtrl: UiServiceProvider
  ) {
    this.cloudListCollection = this.firestoreCtrl.collection<ICloudSharedList>('cloud/');
    this.evtCtrl.getMenuRequestSubject().subscribe((req: IMenuRequest) => {
      if (req.request === MenuRequestType.SHAKE) {
        this.watchForSTSAvailableList();
      }
    });
    this.todoCtrl.cloudRegister(this);
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * récupère toutes les liste partagée sur le cloud qui ne sont pas sts ni adressé à un compte
   *
   * @returns {Observable<ICloudSharedList[]>}
   * @memberof CloudServiceProvider
   */
  public getCloudLists(): Observable<ICloudSharedList[]> {
    const collection = this.firestoreCtrl.collection<ICloudSharedList>('cloud', ref =>
      ref
        .where('shakeToShare', '==', false)
        .where('email', '==', null)
        .orderBy('author.timestamp', 'desc')
    );
    return collection.valueChanges();
  }

  /**
   * Si l'on est connecté, recherche des listes disponible pour nous (à notre email) disponible sur la plateforme cloud.
   * Ne doit être appelé qu'a l'initialisation...
   *
   * @memberof CloudServiceProvider
   */
  public listenForUpdate(): void {
    this.authCtrl
      .getConnexionSubject()
      .subscribe((user: User) => this.watchForAvailableList(user));
  }

  /**
   * créer une nouvelle offre de partage par référence d'une liste sur le cloud
   * Initialise l'offre comme shake to share et la signe avec le compte courrant
   *
   * @param {string} listUuid
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  public async stsExport(listUuid: string): Promise<void> {
    const path = this.todoCtrl.getListLink(listUuid);
    const cloudData = Global.getDefaultCloudShareData();

    const author = await this.authCtrl.getAuthor(true);

    if (author == null || author.coord == null) {
      this.uiCtrl.displayToast(
        'Vous devez activer votre geolocalisation pour pouvoir utiliser la fonctionalité ShakeToShare'
      );
      return;
    }

    cloudData.author = author;
    cloudData.email = null;
    cloudData.list = path;
    cloudData.password = null;
    cloudData.shakeToShare = true;
    cloudData.name = await this.getListName(path);

    this.postNewShareRequest(cloudData);

    this.uiCtrl.displayToast(
      'la liste ' +
        cloudData.name +
        ' a été distribuée à toutes les personnes à proximité ayant activé ShakeToShare et ayant agitée leur téléphone'
    );
  }

  /**
   * permet d'envoyer sur la collection cloud une nouvelle proposition de partage de liste
   * Si la le partage et de type sts alors il sera supprimé après quelques secondes
   *
   * @param {ICloudSharedList} data
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  public async postNewShareRequest(data: ICloudSharedList): Promise<void> {
    const doc = this.cloudListCollection.doc<ICloudSharedList>(uuid());
    await doc.set(data);
    if (data.shakeToShare) {
      setTimeout(() => {
        doc.delete();
      }, CloudServiceProvider.MAX_SECONDS * 1000);
    }
  }

  /**
   * Permet d'effectuer une demande d'import d'une liste cloud
   *
   * @param {ICloudSharedList} data
   * @returns {void}
   * @memberof CloudServiceProvider
   */
  public async importCloudList(data: ICloudSharedList): Promise<void> {
    if (
      data == null ||
      data.list == null ||
      data.list.userUUID === this.authCtrl.getUserId()
    ) {
      return;
    }

    if (data.password != null && data.password !== '') {
      await this.importByPassword(data);
    } else {
      await this.importSharedList(data.list);
    }
  }

  /**
   * permet de récupérer le nom d'une liste en se basant uniquement sur son chemin
   *
   * @async
   * @param {ITodoListPath} list
   * @returns {Promise<string>}
   * @memberof CloudServiceProvider
   */
  public async getListName(list: ITodoListPath): Promise<string | null> {
    const doc = this.firestoreCtrl.doc<ITodoList>(
      'user/' + list.userUUID + '/list/' + list.listUUID
    );
    const ref = await doc.ref.get();

    if (ref.exists) {
      return ref.get('name');
    }
    return null;
  }

  /**
   * permet de supprimer également toutes les références vers ce document sur le cloud
   *
   * @param {string} listUUID
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  public async removeCloudList(listUUID: string): Promise<void> {
    const collection = this.firestoreCtrl.collection<ICloudSharedList>('cloud', ref =>
      ref.where('list.listUUID', '==', listUUID)
    );

    const sub: Subscription = collection
      .snapshotChanges()
      .subscribe((dcas: DocumentChangeAction[]) => {
        for (const dca of dcas) {
          dca.payload.doc.ref.delete();
        }
        sub.unsubscribe();
      });
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * Lors de chaque connexion, supprime les anciens documents partagé sur le cloud
   *
   * @private
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  private async cleanUp(): Promise<void> {
    const now = await this.authCtrl.getServerTimestamp();
    const stsExpire = new Date(now.getTime() - CloudServiceProvider.MAX_SECONDS * 2000);
    const cloudExpire = new Date(now.getTime() - 24 * 3600 * 1000);

    const forCleanSTSCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud',
      ref =>
        ref.where('shakeToShare', '==', true).where('author.timestamp', '<', stsExpire)
    );

    const forCleanCloudCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud',
      ref =>
        ref.where('shakeToShare', '==', false).where('author.timestamp', '<', cloudExpire)
    );

    const subSTS = forCleanSTSCollection
      .snapshotChanges()
      .subscribe((refs: DocumentChangeAction[]) => {
        for (const ref of refs) {
          ref.payload.doc.ref.delete();
        }
        subSTS.unsubscribe();
      });

    const subCloud = forCleanCloudCollection
      .snapshotChanges()
      .subscribe((refs: DocumentChangeAction[]) => {
        for (const ref of refs) {
          ref.payload.doc.ref.delete();
        }
        subCloud.unsubscribe();
      });
  }

  /**
   * helper pour de désinscrire d'une subscription de manière safe
   *
   * @private
   * @param {Subscription} sub
   * @memberof CloudServiceProvider
   */
  private tryUnsub(sub: Subscription): void {
    if (sub != null) {
      sub.unsubscribe();
    }
  }

  /**
   * méthode déclancher après un agitement du téléphone pour observer si des listes sts sont disponible à notre emplacement sur le cloud
   *
   * @private
   * @returns {void}
   * @memberof CloudServiceProvider
   */
  private watchForSTSAvailableList(): void {
    if (!this.authCtrl.isConnected()) {
      return;
    }

    this.tryUnsub(this.availableSTSListsSub);

    const forSTSImportCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud',
      ref => ref.where('shakeToShare', '==', true)
    );

    this.availableSTSListsSub = forSTSImportCollection
      .snapshotChanges()
      .subscribe((docChanges: DocumentChangeAction[]) => {
        this.importSharedListsWrapper(docChanges);
      });

    setTimeout(() => {
      this.tryUnsub(this.availableSTSListsSub);
    }, CloudServiceProvider.MAX_SECONDS * 1000);
  }

  /**
   * Une fois l'utilisateur connecté, on peut observer si des listes cloud lui sont disponible avec son email
   *
   * @private
   * @param {User} user
   * @returns {void}
   * @memberof CloudServiceProvider
   */
  private watchForAvailableList(user: User): void {
    this.tryUnsub(this.availableListsSub);

    if (user == null) {
      return;
    }
    this.cleanUp();

    const forImportCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud',
      ref => ref.where('email', '==', this.authCtrl.getEmail())
    );

    this.availableListsSub = forImportCollection
      .snapshotChanges()
      .subscribe((docChanges: DocumentChangeAction[]) => {
        this.importSharedListsWrapper(docChanges);
      });
  }

  /**
   * permet d'importer une liste cloud protégée par un mot de passe
   *
   * @private
   * @param {ICloudSharedList} data
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  private async importByPassword(data: ICloudSharedList): Promise<void> {
    let pass: string = '';
    let hasCancel: boolean = true;
    const name: string | null = await this.getListName(data.list as ITodoListPath);

    while (pass !== data.password && !hasCancel) {
      try {
        pass = await this.presentPrompt(
          'Veuillez saisir le mot de passe pour la liste "' + name + '"'
        );
      } catch (error) {
        hasCancel = false;
      }
    }

    if (!hasCancel) {
      await this.importSharedList(data.list);
    }
  }

  /**
   * permet d'importer une liste cloud qui a été créé en sts
   * effectue également les vérifications associées
   *
   * @private
   * @param {ICloudSharedList} data
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  private async importBySTS(data: ICloudSharedList): Promise<void> {
    if (data == null) {
      return;
    }

    const stsEnabled: boolean =
      (await this.settingsCtrl.getSetting(Settings.ENABLE_STS)) === 'true';

    if (stsEnabled) {
      let myPos: ILatLng | null = await this.mapCtrl.getMyPosition();

      if (myPos == null) {
        this.uiCtrl.displayToast(
          'Vous devez activer votre geolocalisation pour pouvoir utiliser la fonctionalité ShakeToShare'
        );
        return;
      }

      myPos = Global.roundILatLng(myPos);
      const myGeoPos = Global.getGeoPoint(myPos);

      if (
        data.author != null &&
        data.author.coord != null &&
        data.author.timestamp != null &&
        myGeoPos.isEqual(data.author.coord)
      ) {
        const now = await this.timestampAreCloseToNow(data.author.timestamp);
        if (now) {
          this.todoCtrl.importList(data.list);
        }
      }
    }
  }

  /**
   * méthode gérant les import automatique de liste, soit en sts, soit par email
   *
   * @private
   * @param {DocumentSnapshot} importdoc
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  private async DocumentImportHandler(importdoc: DocumentSnapshot): Promise<void> {
    const myEmail = this.authCtrl.getEmail();
    const data: ICloudSharedList = importdoc.data() as ICloudSharedList;

    if (
      data == null ||
      data.list == null ||
      data.author == null ||
      data.author.uuid === this.authCtrl.getUserId()
    ) {
      return;
    }

    if (data.email != null && data.email === myEmail && data.email !== '') {
      this.importSharedList(data.list);
      importdoc.ref.delete();
      return;
    }

    if (data.shakeToShare != null && data.shakeToShare) {
      this.importBySTS(data);
      return;
    }
  }

  /**
   * retourne une promise ayant true pour valeur si la date passé en paramètre est proche de maintenant.
   *
   * @async
   * @private
   * @param {Date} date
   * @returns {Promise<boolean>}
   * @memberof CloudServiceProvider
   */
  private async timestampAreCloseToNow(date: Date): Promise<boolean> {
    const now = await this.authCtrl.getServerTimestamp();
    const date_ts = Math.round(date.getTime() / 1000);
    const now_ts = Math.round(now.getTime() / 1000);
    return Math.abs(date_ts - now_ts) < CloudServiceProvider.MAX_SECONDS;
  }

  /**
   * Vérifie et tente d'importer les documents (liste cloud partagée) associé aux import automatique
   *
   * @private
   * @param {DocumentChangeAction[]} docChangeAction
   * @returns {void}
   * @memberof CloudServiceProvider
   */
  private importSharedListsWrapper(docChangeAction: DocumentChangeAction[]): void {
    if (docChangeAction == null || !this.authCtrl.isConnected()) {
      return;
    }

    for (const doc of docChangeAction) {
      this.DocumentImportHandler(doc.payload.doc as DocumentSnapshot);
    }
  }

  /**
   * permet d'importer une liste cloud en se basant sur son chemin.
   * la liste est soit copier par référence ou par valeur.
   *
   * @async
   * @private
   * @param {ITodoListPath} list
   * @returns {Promise<void>}
   * @memberof CloudServiceProvider
   */
  private async importSharedList(list: ITodoListPath): Promise<void> {
    if (list.shareByReference === true) {
      await this.todoCtrl.addListLink(list);
    } else {
      await this.todoCtrl.importList(list);
    }
    this.uiCtrl.displayToast(
      'Une nouvelle liste partagée est disponible sur votre compte'
    );
  }

  /**
   * helper permettant d'appeler le service ui pour créer un prompt pour le mot de passe des listes protégée
   *
   * @private
   * @param {string} message
   * @returns {Promise<string>}
   * @memberof CloudServiceProvider
   */
  private async presentPrompt(message: string): Promise<string> {
    const res = await this.uiCtrl.presentPrompt('Liste protégée', message, [
      {
        name: 'password',
        placeholder: 'Password',
        type: 'password'
      }
    ]);
    return res.password;
  }
}
