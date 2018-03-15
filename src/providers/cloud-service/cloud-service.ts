import { Injectable } from '@angular/core';
import {
  CollectionReference,
  QueryDocumentSnapshot,
  FieldValue
} from '@firebase/firestore-types';
import { ILatLng } from '@ionic-native/google-maps';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentChangeAction
} from 'angularfire2/firestore';
import * as firebase from 'firebase';
import { User } from 'firebase/app';
import { AlertController, ToastController } from 'ionic-angular';
import { Subscription } from 'rxjs/Rx';
import { v4 as uuid } from 'uuid';

import { Settings } from '../../model/settings';
import { ITodoList } from '../../model/todo-list';
import { ITodoListPath } from '../../model/todo-list-path';
import { ICloudSharedList } from './../../model/cloud-shared-list';
import { Global } from './../../shared/global';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { MapServiceProvider } from './../map-service/map-service';
import { SettingServiceProvider } from './../setting/setting-service';

@Injectable()
export class CloudServiceProvider {
  private readonly cloudListCollection: AngularFirestoreCollection<ICloudSharedList>;

  private availableListsSub: Subscription;

  constructor(
    private readonly firestoreCtrl: AngularFirestore,
    private readonly authCtrl: AuthServiceProvider,
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController,
    private readonly settingsCtrl: SettingServiceProvider,
    private readonly mapCtrl: MapServiceProvider
  ) {
    this.cloudListCollection = this.firestoreCtrl.collection<ICloudSharedList>('cloud/');

    this.authCtrl.getConnexionSubject().subscribe(this.watchForAvailableList);
  }

  private tryUnsub(sub: Subscription): void {
    if (sub != null) {
      sub.unsubscribe();
    }
  }

  private watchForAvailableList(user: User): void {
    this.tryUnsub(this.availableListsSub);

    if (user == null) {
      return;
    }

    const forImportCollection = this.firestoreCtrl.collection<ICloudSharedList>(
      'cloud/',
      (ref: CollectionReference) => ref.where('email', '==', this.authCtrl.getEmail())
    );
    this.availableListsSub = forImportCollection
      .snapshotChanges()
      .subscribe(this.importSharedListsWrapper);
  }

  private getListName(list: ITodoListPath): Promise<string> {
    return new Promise(resolve => {
      const doc = this.firestoreCtrl.doc<ITodoList>(
        'user/' + list.userUUID + '/list/' + list.listUUID
      );

      doc
        .update({})
        .then(() => {
          const sub: Subscription = doc
            .valueChanges()
            .subscribe((todoList: ITodoList) => {
              sub.unsubscribe();
              resolve(todoList.name);
            });
        })
        .catch(() => {
          resolve(null);
        });
    });
  }

  private async DocumentImportHandler(importdoc: QueryDocumentSnapshot): Promise<void> {
    const myEmail = this.authCtrl.getEmail();
    const data: ICloudSharedList = importdoc.data() as ICloudSharedList;

    if (
      data == null ||
      data.list == null ||
      data.list.magic !== Global.TODO_LIST_MAGIC ||
      data.list.magic !== Global.LIST_PATH_MAGIC
    ) {
      return;
    }

    if (data.email === myEmail || data.password == null || data.password === '') {
      this.importSharedList(data.list);
      importdoc.ref.delete();
      return;
    }

    if (data.password != null) {
      let pass: string = '';
      let hasCancel: boolean = true;
      let name: string = '';

      if (data.list.magic === Global.LIST_PATH_MAGIC) {
        name = await this.getListName(data.list as ITodoListPath);
      }
      if (data.list.magic === Global.TODO_LIST_MAGIC) {
        name = (data.list as ITodoList).name;
      }

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

      importdoc.ref.delete();
      return;
    }

    if (data.shareWithShake != null && data.shareWithShake) {
      const stsEnabled: boolean =
        (await this.settingsCtrl.getSetting(Settings.ENABLE_STS)) === 'true';

      if (stsEnabled) {
        let myPos: ILatLng = await this.mapCtrl.getMyPosition();

        if (myPos == null) {
          this.displayToast(
            'Vous devez activer votre geolocalisation pour pouvoir utiliser la fonctionalité ShakeToShare'
          );
          return;
        }

        myPos = Global.roundILatLng(myPos);
        if (myPos.lat === data.coord.lat && myPos.lng === data.coord.lng) {
          if (this.timestampAreClose(data.timestamp)) {
          }
        }
      }
    }
  }

  private timestampAreClose(ts1: FieldValue): boolean {
    const ts2 = firebase.firestore.FieldValue.serverTimestamp();
    return ts1 === ts2;
  }

  private importSharedListsWrapper(docChangeAction: DocumentChangeAction[]): void {
    if (docChangeAction == null || !this.authCtrl.isConnected()) {
      return;
    }

    for (const doc of docChangeAction) {
      this.DocumentImportHandler(doc.payload.doc);
    }
  }

  private async importSharedList(list: ITodoList | ITodoListPath): Promise<void> {}

  public async postNewShareRequest(data: ICloudSharedList): Promise<void> {
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    data.timestamp = timestamp;
    const doc = this.cloudListCollection.doc<ICloudSharedList>(uuid());
    await doc.set(data);
  }

  private displayToast(message: string): void {
    this.toastCtrl
      .create({ message: message, duration: 3000, position: 'bottom' })
      .present();
  }

  private presentPrompt(message: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const alert = this.alertCtrl.create({
        title: 'Liste protégée',
        subTitle: message,
        inputs: [
          {
            name: 'password',
            placeholder: 'Password',
            type: 'password'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              reject();
            }
          },
          {
            text: 'Valider',
            handler: data => {
              resolve(data.password);
            }
          }
        ]
      });
      alert.present();
    });
  }
}
