import { ITodoItem } from './../../model/todo-item';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage';
import { Injectable } from '@angular/core';

/**
 * fourni des services pour gérer les images d'un todo
 *
 * @export
 * @class StorageServiceProvider
 */
@Injectable()
export class StorageServiceProvider {
  /**
   * Creates an instance of StorageServiceProvider.
   * @param {AngularFireStorage} storageCtrl
   * @memberof StorageServiceProvider
   */
  constructor(private readonly storageCtrl: AngularFireStorage) {}

  /**
   * supprime toutes les images d'un todo (si elle existent)
   *
   * @param {ITodoItem} todo
   * @memberof StorageServiceProvider
   */
  public deleteMedias(todo: ITodoItem) {
    if (todo != null && todo.pictures != null && todo.uuid != null) {
      for (const pic of todo.pictures) {
        this.deleteMedia(todo.uuid, pic.uuid);
      }
    }
  }

  /**
   * supprime une image d'un todo
   *
   * @param {string} todoUuid
   * @param {string} mediaUuid
   * @memberof StorageServiceProvider
   */
  public deleteMedia(todoUuid: string, mediaUuid: string): void {
    try {
      const path = '/' + todoUuid + '/' + mediaUuid;
      const ref = this.storageCtrl.ref(path);
      ref.delete();
    } catch (error) {
      console.log('erreur lors de la suppression, le media existe il toujours ?');
    }
  }

  /**
   * permet d'envoyer une image pour un todo
   *
   * @param {string} todoUuid
   * @param {string} uuidMedia
   * @param {string} base64data
   * @param {('image/jpg' | 'image/png')} content
   * @returns {AngularFireUploadTask}
   * @memberof StorageServiceProvider
   */
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

  /**
   * actualise les lien de téléchargement des images d'un todo
   *
   * @param {ITodoItem} todo
   * @returns {void}
   * @memberof StorageServiceProvider
   */
  public refreshDownloadLink(todo: ITodoItem): void {
    if (todo != null && todo.uuid != null && todo.pictures.length > 0) {
      for (const picture of todo.pictures) {
        const path = '/' + todo.uuid + '/' + picture.uuid;
        const ref = this.storageCtrl.ref(path);
        const sub = ref.getDownloadURL().subscribe(res => {
          picture.url = res;
          sub.unsubscribe();
        });
      }
    }
  }
}
