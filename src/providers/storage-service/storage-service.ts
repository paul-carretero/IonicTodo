import { ITodoItem } from './../../model/todo-item';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage';
import { Injectable } from '@angular/core';

@Injectable()
export class StorageServiceProvider {
  constructor(private readonly storageCtrl: AngularFireStorage) {}

  public deleteMedias(todoUuid: string) {
    try {
      const ref = this.storageCtrl.ref(todoUuid);
      ref.delete();
    } catch (error) {
      console.log('erreur lors de la suppression, le media existe il toujours ?');
    }
  }

  public deleteMedia(todoUuid: string, mediaUuid: string): void {
    try {
      const path = '/' + todoUuid + '/' + mediaUuid;
      const ref = this.storageCtrl.ref(path);
      ref.delete();
    } catch (error) {
      console.log('erreur lors de la suppression, le media existe il toujours ?');
    }
  }

  public uploadMedia(
    todoUuid: string,
    uuidMedia: string,
    base64data: string,
    content: 'image/jpg' | 'image/png'
  ): AngularFireUploadTask {
    const path = '/' + todoUuid + '/' + uuidMedia;
    const ref = this.storageCtrl.ref(path);
    return ref.putString(base64data, 'base64', { contentType: content });
  }

  public refreshDownloadLink(todo: ITodoItem): void {
    if (todo == null || todo.uuid == null || todo.pictures.length === 0) {
      return;
    }

    for (const picture of todo.pictures) {
      const path = '/' + todo.uuid + '/' + picture.uuid;
      const ref = this.storageCtrl.ref(path);
      const sub = ref.getDownloadURL().subscribe(res => {
        picture.url = res;
        sub.unsubscribe();
      });
    }
  }

  /*
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
  */
}
