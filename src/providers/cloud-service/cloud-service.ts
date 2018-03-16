import { Injectable } from '@angular/core';
import { CollectionReference, DocumentSnapshot } from '@firebase/firestore-types';
import { ILatLng } from '@ionic-native/google-maps';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentChangeAction
} from 'angularfire2/firestore';
import * as firebase from 'firebase';
import { User } from 'firebase/app';
import { Subscription } from 'rxjs/Rx';
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
  private static readonly MAX_SECONDS = 10;

  private readonly cloudListCollection: AngularFirestoreCollection<ICloudSharedList>;

  private availableListsSub: Subscription;

  private availableSTSListsSub: Subscription;

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
  }

  public listenForUpdate(): void {
    this.authCtrl
      .getConnexionSubject()
      .subscribe((user: User) => this.watchForAvailableList(user));
  }

  public async stsExport(listUuid: string): Promise<void> {
    const path = this.todoCtrl.getListLink(listUuid);
    const cloudData = Global.getDefaultCloudShareData();
    cloudData.authorUuid = this.authCtrl.getUserId();

    let myPos: ILatLng = await this.mapCtrl.getMyPosition();
    if (myPos == null) {
      this.uiCtrl.displayToast(
        'Vous devez activer votre geolocalisation pour pouvoir utiliser la fonctionalité ShakeToShare'
      );
      return;
    }
    myPos = Global.roundILatLng(myPos);

    cloudData.coord = Global.getGeoPoint(myPos);
    cloudData.email = null;
    cloudData.list = path;
    cloudData.password = null;
    cloudData.shakeToShare = true;
    cloudData.timestamp = firebase.firestore.FieldValue.serverTimestamp();

    this.postNewShareRequest(cloudData);

    const name = await this.getListName(path);
    this.uiCtrl.displayToast(
      'la liste ' +
        name +
        ' a été distribuée à toutes les personnes à proximité ayant activé ShakeToShare et ayant agitée leur téléphone'
    );
  }

  public async postNewShareRequest(data: ICloudSharedList): Promise<void> {
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    data.timestamp = timestamp;
    const doc = this.cloudListCollection.doc<ICloudSharedList>(uuid());
    await doc.set(data);
    setTimeout(() => {
      doc.delete();
    }, CloudServiceProvider.MAX_SECONDS * 1000);
  }

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
      (ref: CollectionReference) =>
        ref.where('shakeToShare', '==', true).where('timestamp', '<', stsExpire)
    );

    const forCleanCloudCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud',
      (ref: CollectionReference) =>
        ref.where('shakeToShare', '==', false).where('timestamp', '<', cloudExpire)
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

  private tryUnsub(sub: Subscription): void {
    if (sub != null) {
      sub.unsubscribe();
    }
  }

  private watchForSTSAvailableList(): void {
    if (!this.authCtrl.isConnected()) {
      return;
    }

    this.tryUnsub(this.availableSTSListsSub);

    const forSTSImportCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud',
      (ref: CollectionReference) => ref.where('shakeToShare', '==', true)
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

  private watchForAvailableList(user: User): void {
    this.tryUnsub(this.availableListsSub);

    if (user == null) {
      return;
    }
    this.cleanUp();

    const forImportCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud',
      (ref: CollectionReference) => ref.where('email', '==', this.authCtrl.getEmail())
    );

    this.availableListsSub = forImportCollection
      .snapshotChanges()
      .subscribe((docChanges: DocumentChangeAction[]) => {
        this.importSharedListsWrapper(docChanges);
      });
  }

  private async getListName(list: ITodoListPath): Promise<string> {
    const doc = this.firestoreCtrl.doc<ITodoList>(
      'user/' + list.userUUID + '/list/' + list.listUUID
    );
    const ref = await doc.ref.get();

    if (ref.exists) {
      return ref.get('name');
    }
    return null;
  }

  private async importByPassword(data: ICloudSharedList): Promise<void> {
    let pass: string = '';
    let hasCancel: boolean = true;
    const name: string = await this.getListName(data.list as ITodoListPath);

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

  private async importBySTS(data: ICloudSharedList): Promise<void> {
    const stsEnabled: boolean =
      (await this.settingsCtrl.getSetting(Settings.ENABLE_STS)) === 'true';

    if (stsEnabled) {
      let myPos: ILatLng = await this.mapCtrl.getMyPosition();

      if (myPos == null) {
        this.uiCtrl.displayToast(
          'Vous devez activer votre geolocalisation pour pouvoir utiliser la fonctionalité ShakeToShare'
        );
        return;
      }

      myPos = Global.roundILatLng(myPos);
      const myGeoPos = Global.getGeoPoint(myPos);

      if (myGeoPos.isEqual(data.coord)) {
        const now = await this.timestampAreCloseToNow(data.timestamp);
        if (now) {
          this.todoCtrl.importList(data.list);
        }
      }
    }
  }

  private async DocumentImportHandler(importdoc: DocumentSnapshot): Promise<void> {
    const myEmail = this.authCtrl.getEmail();
    const data: ICloudSharedList = importdoc.data() as ICloudSharedList;

    if (
      data == null ||
      data.list == null ||
      data.authorUuid === this.authCtrl.getUserId()
    ) {
      return;
    }

    if (data.email != null && data.email === myEmail && data.email !== '') {
      this.importSharedList(data.list);
      importdoc.ref.delete();
      return;
    }

    if (data.password != null && data.password !== '') {
      this.importByPassword(data);
      return;
    }

    if (data.shakeToShare != null && data.shakeToShare) {
      this.importBySTS(data);
      return;
    }
  }

  private async timestampAreCloseToNow(date: Date): Promise<boolean> {
    const now = await this.authCtrl.getServerTimestamp();
    const date_ts = Math.round(date.getTime() / 1000);
    const now_ts = Math.round(now.getTime() / 1000);
    return Math.abs(date_ts - now_ts) < CloudServiceProvider.MAX_SECONDS;
  }

  private importSharedListsWrapper(docChangeAction: DocumentChangeAction[]): void {
    if (docChangeAction == null || !this.authCtrl.isConnected()) {
      return;
    }

    for (const doc of docChangeAction) {
      this.DocumentImportHandler(doc.payload.doc as DocumentSnapshot);
    }
  }

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

  private presentPrompt(message: string): Promise<string> {
    return this.uiCtrl.presentPrompt('Liste protégée', message, [
      {
        name: 'password',
        placeholder: 'Password',
        type: 'password'
      }
    ]);
  }
}
