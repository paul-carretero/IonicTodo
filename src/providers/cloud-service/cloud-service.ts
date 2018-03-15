import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import * as firebase from 'firebase';
import { v4 as uuid } from 'uuid';

import { ICloudSharedList } from './../../model/cloud-shared-list';

@Injectable()
export class CloudServiceProvider {
  private readonly cloudListCollection: AngularFirestoreCollection<ICloudSharedList>;

  constructor(private readonly firestoreCtrl: AngularFirestore) {
    this.cloudListCollection = this.firestoreCtrl.collection<ICloudSharedList>('cloud/');
  }

  public async postNewShareRequest(data: ICloudSharedList): Promise<void> {
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    data.timestamp = timestamp;
    const doc = this.cloudListCollection.doc<ICloudSharedList>(uuid());
    await doc.set(data);
  }
}
