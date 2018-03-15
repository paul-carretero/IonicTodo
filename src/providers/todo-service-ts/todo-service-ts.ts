import { ILatLng } from '@ionic-native/google-maps';
import { IAuthor } from './../../model/author';
import { ITodoItem } from './../../model/todo-item';
import { ITodoListPath } from './../../model/todo-list-path';
import { IAppUser } from './../../model/user';
import 'rxjs/Rx';

import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from 'angularfire2/firestore';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { v4 as uuid } from 'uuid';

import { ITodoList, ListType } from '../../model/todo-list';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { Subscription } from 'rxjs/Rx';
import { User } from '@firebase/auth-types';
import { MapServiceProvider } from '../map-service/map-service';

@Injectable()
export class TodoServiceProvider {
  private readonly data: ITodoList[] = [];

  /**************************************************************************/
  /**************************** TODO UTILISATEUR ****************************/
  /**************************************************************************/

  /**
   * ensemble des listes de l'utilisateur courrant
   * @private
   * @type {AngularFirestoreCollection<TodoList>}
   * @memberof TodoServiceProvider
   */
  private todoListCollection: AngularFirestoreCollection<ITodoList>;

  /**
   * Liste des listes privée de todo, synchronisé avec la base de donnée
   *
   * @private
   * @type {BehaviorSubject<TodoList[]>}
   * @memberof TodoServiceProvider
   */
  private readonly todoLists: BehaviorSubject<ITodoList[]>;

  /**
   * Abonnement au liste privée de l'utilisateur
   *
   * @private
   * @type {Subscription}
   * @memberof TodoServiceProvider
   */
  private privateListSub: Subscription;

  /**************************************************************************/
  /*************************** TODO LOCAL MACHINE ***************************/
  /**************************************************************************/

  /**
   * Ensemble des listes de todo hors connexion
   *
   * @private
   * @type {AngularFirestoreCollection<TodoList>}
   * @memberof TodoServiceProvider
   */
  private localTodoListCollection: AngularFirestoreCollection<ITodoList>;

  /**
   * Liste des listes de todo hors connexion, synchronisé avec la base de donnée
   *
   * @private
   * @type {BehaviorSubject<TodoList[]>}
   * @memberof TodoServiceProvider
   */
  private readonly localTodoLists: BehaviorSubject<ITodoList[]>;

  /**************************************************************************/
  /******************************* USER DATA ********************************/
  /**************************************************************************/

  /**
   * Représente les données applicative de l'utilisateur connecté (si).
   * Contient notamant les informations sur les todos partagés avec lui
   *
   * @private
   * @type {AngularFirestoreDocument<User>}
   * @memberof TodoServiceProvider
   */
  private currentUserDataDoc: AngularFirestoreDocument<IAppUser>;

  /**
   * Représente notament les listes partagée avec l'utilisateur courant, mise à jour en temps réel
   *
   * @private
   * @type {Observable<AppUser>}
   * @memberof TodoServiceProvider
   */
  private readonly currentUserData: BehaviorSubject<IAppUser>;

  /**
   * Abonnement aux données utilisateur (les listes partagées avec lui)
   *
   * @private
   * @type {Subscription}
   * @memberof TodoServiceProvider
   */
  private userDataSub: Subscription;

  /**
   * Abonement aux donnée appuser
   *
   * @private
   * @type {Subscription}
   * @memberof TodoServiceProvider
   */
  private appUserDataSub: Subscription;

  /**************************************************************************/
  /************************** TODO LISTS PARTAGEES **************************/
  /**************************************************************************/

  /**
   * Ensemble des document Firestore représentant des listes de todo partagé avec cet utilisateur
   *
   * @private
   * @type {AngularFirestoreDocument<TodoList>[]}
   * @memberof TodoServiceProvider
   */
  private sharedTodoCollection: AngularFirestoreDocument<ITodoList>[];

  /**
   * Ensemble des listes de todo partagé avec cet utilisateur
   *
   * @private
   * @type {BehaviorSubject<TodoList[]>[]}
   * @memberof TodoServiceProvider
   */
  private readonly sharedTodoLists: BehaviorSubject<ITodoList[]>;

  /**
   *
   *
   * @private
   * @type {Subscription}
   * @memberof TodoServiceProvider
   */
  private sharedListSub: Subscription;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /*****************************************************************************
   *                       __    __    __    __                                *
   *                      /  \  /  \  /  \  /  \     This is a Boa Constructor *
   * ____________________/  __\/  __\/  __\/  __\_____________________________ *
   * ___________________/  /__/  /__/  /__/  /________________________________ *
   *                    | / \   / \   / \   / \  \____                         *
   *                    |/   \_/   \_/   \_/   \    o \                        *
   *                                            \_____/--<                     *
   *****************************************************************************/

  /**
   * Creates an instance of TodoServiceProvider.
   * Initialise les lien firestore pour les liste de todo de l'utilisateur
   * (en fonction du status de la connexion, des listes de todo locales et partagées)
   * @param {AngularFirestore} firestoreCtrl
   * @param {AuthServiceProvider} authCtrl
   * @memberof TodoServiceProvider
   */
  constructor(
    private readonly firestoreCtrl: AngularFirestore,
    private readonly authCtrl: AuthServiceProvider,
    private readonly mapCtrl: MapServiceProvider
  ) {
    this.todoLists = new BehaviorSubject<ITodoList[]>([]);
    this.localTodoLists = new BehaviorSubject<ITodoList[]>([]);
    this.sharedTodoLists = new BehaviorSubject<ITodoList[]>([]);
    this.currentUserData = new BehaviorSubject<IAppUser>({
      todoListSharedWithMe: []
    });
    this.updateDBLink();
    this.updateLocalDBLink();
  }

  /**************************************************************************/
  /**************************** PRIVATE METHODS *****************************/
  /**************************************************************************/

  private tryUnsub(sub: Subscription) {
    if (sub != null) {
      sub.unsubscribe();
    }
  }

  /****************************** USER METHODS ******************************/

  /**
   * Initialise le document firestore contenant les listes partagée avec l'utilisateur courant
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private initUserDataDocument(): void {
    this.currentUserDataDoc = this.firestoreCtrl.doc<IAppUser>(
      'user/' + this.authCtrl.getUserId() + ''
    );
    this.userPublisher();
  }

  /**
   * Permet de mettre à jour les données utilisateur en fonction des connexion/déconnexion
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private userPublisher(): void {
    this.userDataSub = this.currentUserDataDoc
      .valueChanges()
      .subscribe((data: IAppUser) => {
        this.currentUserData.next(data);
      });
  }

  /**
   * Génère un snapshot de l'état actuel des listes partagées avec l'utilisateur et le retourne
   *
   * @private
   * @returns {TodoListPath[]}
   * @memberof TodoServiceProvider
   */
  private getSharedListPathSnapchot(): ITodoListPath[] {
    if (this.currentUserData.getValue() == null) {
      return [];
    }
    if (this.currentUserData.getValue().todoListSharedWithMe == null) {
      return [];
    }
    return this.currentUserData.getValue().todoListSharedWithMe;
  }

  /******************************* DB METHODS *******************************/

  /**
   * Initialise la collection firestore pour l'ensemble des liste privée de l'utilisateur courant
   * Ne peut être réalisé que si l'utilisateur est connecté obviously
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private initPrivateListCollection(): void {
    this.todoListCollection = this.firestoreCtrl.collection<ITodoList>(
      'user/' + this.authCtrl.getUserId() + '/list'
    );
    this.listsPublisher();
  }

  /**
   * Note: les liens vers les listes null (plus partagé ou supprimé par leur propriétaire)
   * sont simplmeent ignoré ici, et seront supprimé lors du prochain chargement de updateSharedListCollection
   * (lors de la prochaine connexion)
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private listenForSharedUpdate(): void {
    const obsArray: Observable<ITodoList>[] = [];
    for (const doc of this.sharedTodoCollection) {
      obsArray.push(doc.valueChanges());
    }

    this.sharedListSub = Observable.combineLatest(obsArray).subscribe(
      (lists: ITodoList[]) => {
        if (lists != null) {
          this.sharedTodoLists.next(lists);
        }
      }
    );
  }

  /**
   * Permet de vérifier si le document considéré existe toujours (ie si l'utilisateur ayant créer la liste ne l'a pas supprimée)
   *
   * @private
   * @param {AngularFirestoreDocument<TodoList>} doc une liste de todo
   * @returns {Promise<boolean>}
   * @memberof TodoServiceProvider
   */
  private checkIfExist(doc: AngularFirestoreDocument<ITodoList>): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      doc
        .update({})
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  /**
   * Met à jour le tableau de document firestore des listes partagées en fonction des données utilisateur
   * Supprime les liste qui ne sont plus partagée
   *
   * @private
   * @param {AppUser} data
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  private updateSharedListCollection(data: IAppUser): void {
    const pathToDelete: string[] = [];
    const promises: Promise<void>[] = [];
    this.sharedTodoCollection = [];

    for (const path of data.todoListSharedWithMe) {
      const docToAdd = this.firestoreCtrl.doc<ITodoList>(
        'user/' + path.userUUID + '/list/' + path.listUUID
      );

      promises.push(
        this.checkIfExist(docToAdd).then((exist: boolean) => {
          if (exist) {
            this.sharedTodoCollection.push(docToAdd);
          } else {
            pathToDelete.push(path.listUUID);
          }
        })
      );
    }

    Promise.all(promises).then(() => {
      this.tryUnsub(this.sharedListSub);
      this.sharedTodoLists.next([]);
      this.listenForSharedUpdate();

      for (const listUUID of pathToDelete) {
        this.removeListLink(listUUID);
      }
    });
  }

  /**
   * Redéfini l'ensemble des listes partagée avec l'utilisateur
   * connecté à chaque update de la liste des listes partagée (userData)
   * Supprime de la liste les liste qui ne sont plus partagée
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private defSharedTodoCollection(): void {
    this.appUserDataSub = this.currentUserData.subscribe((data: IAppUser) => {
      if (data != null && data.todoListSharedWithMe != null) {
        this.updateSharedListCollection(data);
      } else {
        this.sharedTodoCollection = [];
      }
    });
  }

  /**
   * Permet de mettre à jour la liste des listes privée de todo de l'utilisateur
   * en fonction du status de sa connexion
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private listsPublisher(): void {
    this.privateListSub = this.todoListCollection
      .valueChanges()
      .subscribe((lists: ITodoList[]) => {
        this.todoLists.next(lists);
      });
  }

  /**
   * Synchronise la liste des listes de todo privée et partagée de l'utilisateur avec la base
   * Firestore et abandonne la synchro en cas de déconnexion
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private updateDBLink(): void {
    this.authCtrl.getConnexionSubject().subscribe((user: User) => {
      this.tryUnsub(this.privateListSub);
      this.tryUnsub(this.userDataSub);
      this.tryUnsub(this.sharedListSub);
      this.tryUnsub(this.appUserDataSub);

      if (user != null) {
        this.initPrivateListCollection();
        this.initUserDataDocument();
        this.defSharedTodoCollection();
      } else {
        this.currentUserData.next({ todoListSharedWithMe: [] });
        this.todoLists.next([]);
      }
    });
  }

  private refreshShared(): void {
    if (this.authCtrl.isConnected()) {
      this.tryUnsub(this.sharedListSub);
      this.tryUnsub(this.appUserDataSub);
      this.defSharedTodoCollection();
    }
  }

  /**
   * Synchronise la liste des listes de todo de la machine de l'utilisateur avec la base
   * Firestore (éventuelement hors ligne)
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private async updateLocalDBLink(): Promise<void> {
    const machineId: string = await this.authCtrl.getMachineId();
    this.localTodoListCollection = this.firestoreCtrl.collection<ITodoList>(
      'machine/' + machineId + '/list'
    );
    this.localTodoListCollection.valueChanges().subscribe((lists: ITodoList[]) => {
      this.localTodoLists.next(lists);
    });
  }

  /**
   * Recherche et retourne le "document" firestore contenant la liste ayant l'id passé en paramètre
   * Si aucun document ne contient cette liste alors retourne une erreur
   *
   * @private
   * @param {string} listeUUID
   * @param {ListType} [type]
   * @returns {Promise<AngularFirestoreDocument<ITodoList>>}
   * @memberof TodoServiceProvider
   */
  private getFirestoreDocument(
    listeUUID: string,
    type?: ListType
  ): Promise<AngularFirestoreDocument<ITodoList>> {
    if (type == null) {
      type = this.getListType(listeUUID);
    }

    switch (type) {
      case ListType.LOCAL:
        return new Promise(resolve =>
          resolve(this.localTodoListCollection.doc<ITodoList>(listeUUID))
        );
      case ListType.PRIVATE:
        return new Promise(resolve =>
          resolve(this.todoListCollection.doc<ITodoList>(listeUUID))
        );
      case ListType.SHARED:
        return new Promise(resolve => {
          for (const doc of this.sharedTodoCollection) {
            const sub = doc.valueChanges().subscribe((val: ITodoList) => {
              if (val.uuid === listeUUID) {
                sub.unsubscribe();
                resolve(doc);
              } else {
                sub.unsubscribe();
              }
            });
          }
        });
    }

    throw new Error('Liste inconnu ou type invalide');
  }

  /**************************************************************************/
  /************************* PUBLIC USERS INTERFACE *************************/
  /**************************************************************************/

  /**
   * Ajoute à la liste des listes partagées de l'utilisateur connecté courrant le chemin vers la liste passé en paramètre
   * Ceci ajoute une liste à l'ensemble des listes partagées avec l'utilisateur
   *
   * @param {TodoListPath} path
   * @memberof TodoServiceProvider
   */
  public async addListLink(path: ITodoListPath): Promise<void> {
    const listsPathTab = this.getSharedListPathSnapchot();
    listsPathTab.push(path);
    await this.currentUserDataDoc
      .update({ todoListSharedWithMe: listsPathTab })
      .catch(() => {
        this.currentUserDataDoc.set({ todoListSharedWithMe: [path] });
      });
  }

  /**
   * Supprime le chemin d'une liste partagée. Ne supprime pas la liste de todo en temps que telle.
   *
   * @param {string} listUUID
   * @memberof TodoServiceProvider
   */
  public async removeListLink(listUUID: string): Promise<void> {
    const listsPathTab = this.getSharedListPathSnapchot();

    let toDelete: number = -1;
    for (let i = 0; i < listsPathTab.length; i++) {
      if (listsPathTab[i].listUUID === listUUID) {
        toDelete = i;
      }
    }

    if (toDelete !== -1) {
      listsPathTab.splice(toDelete);

      try {
        await this.currentUserDataDoc.update({ todoListSharedWithMe: listsPathTab });
      } catch (error) {
        this.currentUserDataDoc.set({
          todoListSharedWithMe: listsPathTab
        });
      }

      this.refreshShared();
    }
  }

  /**************************************************************************/
  /************************* PUBLIC LISTS INTERFACE *************************/
  /**************************************************************************/

  /**
   * Permet de récupérer un objet de chemin pour la liste ayant l'identifiant spécifié
   *
   * @param {string} listUUID
   * @returns {TodoListPath}
   * @memberof TodoServiceProvider
   */
  public getListLink(listUUID: string): ITodoListPath {
    if (this.getListType(listUUID) !== ListType.SHARED) {
      return { userUUID: this.authCtrl.getUserId(), listUUID: listUUID };
    } else {
      const sharedSnap = this.currentUserData.getValue().todoListSharedWithMe;
      for (const path of sharedSnap) {
        if (path.listUUID === listUUID) {
          return path;
        }
      }
    }

    throw new Error('list UUID not found');
  }

  /**
   * Permet de vérifier si une liste partagée est verouillé en lecture seule
   *
   * @param {string} listUuid
   * @returns {boolean}
   * @memberof TodoServiceProvider
   */
  public isReadOnly(listUuid: string): boolean {
    const listShareData = this.currentUserData
      .getValue()
      .todoListSharedWithMe.find(d => d.listUUID === listUuid);

    if (listShareData != null) {
      if (listShareData.locked != null) {
        return listShareData.locked;
      }
    }
    return false;
  }
  /**
   * Permet de récupérer le type d'une liste
   *
   * @param {string} ListUuid l'identifiant d'une liste
   * @returns {ListType} le type de la liste, local, private ou shared
   * @memberof TodoServiceProvider
   */
  public getListType(ListUuid: string): ListType {
    const localLists: ITodoList[] = this.localTodoLists.getValue();
    const sharedLists: ITodoList[] = this.sharedTodoLists.getValue();
    const privateLists: ITodoList[] = this.todoLists.getValue();

    if (localLists.find(d => d.uuid === ListUuid) != null) {
      return ListType.LOCAL;
    }
    if (sharedLists.find(d => d.uuid === ListUuid) != null) {
      return ListType.SHARED;
    }
    if (privateLists.find(d => d.uuid === ListUuid) != null) {
      return ListType.PRIVATE;
    }

    throw new Error('Liste inconnu ou type invalide');
  }

  /**
   * Permet de récupérer un Observable de tableau de liste de todo
   *
   * @param {ListType} [type] Permet de préciser le type de liste que l'on souhaite récupérer
   * @returns {Observable<ITodoList[]>}
   * @memberof TodoServiceProvider
   */
  public getTodoList(type: ListType): Observable<ITodoList[]> {
    switch (type) {
      case ListType.LOCAL:
        return this.localTodoLists.asObservable();
      case ListType.SHARED:
        return this.sharedTodoLists.asObservable();
      case ListType.PRIVATE:
        return this.todoLists.asObservable();
    }
    throw new Error('Liste inconnu ou type invalide');
  }

  /**
   * Permet de récupérer une liste représenté par son identifiant unique
   *
   * @param {string} ListUuid l'identifiant unique de la liste
   * @returns {Observable<ITodoList>}
   * @memberof TodoServiceProvider
   */
  public async getAList(ListUuid: string): Promise<Observable<ITodoList>> {
    const doc = await this.getFirestoreDocument(ListUuid);
    return doc.valueChanges();
  }

  /**
   * A utiliser avec prudence car non synchronisé, retourne une liste telle qu'elle était lors de l'appel
   *
   * @param {string} listUuid
   * @returns {ITodoList}
   * @memberof TodoServiceProvider
   */
  public getAListSnapshot(listUuid: string): ITodoList {
    const type = this.getListType(listUuid);
    let lists: ITodoList[] = [];
    switch (type) {
      case ListType.LOCAL:
        lists = this.localTodoLists.getValue();
        break;
      case ListType.SHARED:
        lists = this.sharedTodoLists.getValue();
        break;
      case ListType.PRIVATE:
        lists = this.todoLists.getValue();
        break;
    }
    return lists.find(d => d.uuid === listUuid);
  }

  /**
   * Permet de créer une liste. La liste sera créer localement si hors ligne ou non authentifié
   *
   * @param {ITodoList} data la liste
   * @param {ListType.LOCAL | ListType.PRIVATE} [type]
   * @returns {Promise<string>}
   * @memberof TodoServiceProvider
   */
  public async addList(
    data: ITodoList,
    type?: ListType.LOCAL | ListType.PRIVATE
  ): Promise<string> {
    const newUuid: string = uuid();

    let dbCollection = this.todoListCollection;
    if (type === ListType.LOCAL || !this.authCtrl.isConnected()) {
      dbCollection = this.localTodoListCollection;
    }

    if (data.order == null) {
      data.order = -1;
    }

    let author: IAuthor = null;

    if (data.author != null) {
      author = data.author;
    }

    if (data.author == null && this.authCtrl.isConnected()) {
      const myPos: ILatLng = await this.mapCtrl.getMyPosition();
      const myCity: string = await this.mapCtrl.getCity(myPos);

      author = {
        displayName: this.authCtrl.getDisplayName(),
        city: myCity,
        email: this.authCtrl.getEmail(),
        date: new Date(),
        uuid: this.authCtrl.getUserId()
      };
    }

    await dbCollection.doc<ITodoList>(newUuid).set({
      uuid: newUuid,
      name: data.name,
      items: [],
      icon: data.icon,
      order: data.order,
      author: author
    });

    return newUuid;
  }

  /**
   * Permet de mettre à jour une liste et/ou de la transférer des liste locales aux liste privée et inversement
   *
   * @param {TodoList} data
   * @param {ListType} [destType]
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async updateList(data: ITodoList, destType?: ListType): Promise<void> {
    const curListType = this.getListType(data.uuid);
    const fireDoc = await this.getFirestoreDocument(data.uuid, curListType);

    // si on ne change pas la liste de place
    if (destType == null || destType === curListType) {
      await fireDoc.update({
        name: data.name,
        icon: data.icon
      });
    } else if (destType === ListType.PRIVATE || destType === ListType.LOCAL) {
      // on ajoute la liste à la collection de destination
      this.addList(data, destType);
      // on supprime la liste de la collection source
      this.deleteList(data.uuid, curListType);
    }
  }

  /**
   * Supprime une liste ou la délie si il s'ait d'une liste partagée
   *
   * @param {string} ListUuid l'identifiant de la liste
   * @memberof TodoServiceProvider
   */
  public async deleteList(ListUuid: string, type?: ListType): Promise<void> {
    if (type == null) {
      type = this.getListType(ListUuid);
    }

    if (type === ListType.SHARED) {
      this.removeListLink(ListUuid);
    } else {
      const doc = await this.getFirestoreDocument(ListUuid, type);
      doc.delete();
    }
  }

  /**************************************************************************/
  /************************* PUBLIC TODOS INTERFACE *************************/
  /**************************************************************************/

  /**************************************************************************/
  /************************* PUBLIC USER INTERFACE **************************/
  /**************************************************************************/

  /*******************************
   * gestions des todos          *
   *******************************/

  public getTodos(ListUuid: String): Observable<ITodoItem[]> {
    return Observable.of(this.data.find(d => d.uuid === ListUuid).items);
  }

  public getTodo(listUUID: string, TodoUuid: string): Observable<ITodoItem> {
    return Observable.of(
      this.data.find(d => d.uuid === listUUID).items.find(d => d.uuid === TodoUuid)
    );
  }

  public complete(listUUID: string, todoUUID: string, status: boolean) {
    const todo = this.data
      .find(d => d.uuid === listUUID)
      .items.find(d => d.uuid === todoUUID);
    todo.complete = status;
    if (status === true) {
      todo.posCompleted = null;
      todo.dateCompleted = null;
    } else {
      todo.posCompleted = null;
      todo.dateCompleted = null;
    }
  }

  public editTodo(listUuid: String, editedItem: ITodoItem) {
    const items = this.data.find(d => d.uuid === listUuid).items;
    const index = items.findIndex(value => value.uuid === editedItem.uuid);
    items[index] = editedItem;
  }

  public addTodo(listUuid: String, newItem: ITodoItem): void {
    const items = this.data.find(d => d.uuid === listUuid).items;
    newItem.uuid = uuid();
    items.push(newItem);
  }

  public deleteTodo(listUuid: String, TodoUuid: String) {
    const items = this.data.find(d => d.uuid === listUuid).items;
    const index = items.findIndex(value => value.uuid === TodoUuid);
    if (index !== -1) {
      items.splice(index, 1);
    }
  }
}
