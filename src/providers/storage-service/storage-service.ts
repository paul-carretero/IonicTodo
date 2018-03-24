import { HttpClient } from '@angular/common/http';
import { AngularFireStorage } from 'angularfire2/storage';
import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';

@Injectable()
export class StorageServiceProvider {
  constructor(
    private readonly storageCtrl: AngularFireStorage,
    private readonly httpCtrl: HttpClient
  ) {}

  public deleteMedias(todoUuid: string) {
    const ref = this.storageCtrl.ref(todoUuid);
    ref.delete();
  }

  public deleteMedia(todoUuid: string, mediaUuid: string): void {
    const path = '/' + todoUuid + '/' + mediaUuid;
    const ref = this.storageCtrl.ref(path);
    ref.delete();
  }

  public async copyMedia(
    todoUuidSrc: string,
    todoUuidDest: string,
    mediaUuid: string
  ): Promise<void> {
    const pathSrc = '/' + todoUuidSrc + '/' + mediaUuid;
    const uuidDest = uuid();
    const pathDest = '/' + todoUuidDest + '/' + uuidDest;
    const refSrc = this.storageCtrl.ref(pathSrc);
    const refDest = this.storageCtrl.ref(pathDest);
    const obsUrl = refSrc.getDownloadURL();
    const base64 = await this.getBase64FromURL(obsUrl);
    return refDest.putString(base64, 'base64').then();
  }

  private getBase64FromURL(obsUrl: Observable<any>): Promise<string> {
    return new Promise(resolve => {
      const sub = obsUrl.subscribe((res: { downloadURL: string }) => {
        const getSub = this.httpCtrl.get(res.downloadURL).subscribe((data: any) => {
          console.log(data);
          console.log(JSON.stringify(data));
          getSub.unsubscribe();
          resolve(data);
        });
        sub.unsubscribe();
      });
    });
  }
}
