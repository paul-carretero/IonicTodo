import { Global } from './../../shared/global';
import { DocumentReference } from '@firebase/firestore-types';
import { CloudServiceProvider } from './../cloud-service/cloud-service';
import { IAuthor } from './../../model/author';
import { ITodoItem } from './../../model/todo-item';
import { ITodoListPath } from './../../model/todo-list-path';
import { IAppUser } from './../../model/user';
import 'rxjs/Rx';

import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
  DocumentChangeAction
} from 'angularfire2/firestore';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { v4 as uuid } from 'uuid';

import { ITodoList, ListType } from '../../model/todo-list';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { Subscription, Subject, Observable } from 'rxjs/Rx';
import { User } from '@firebase/auth-types';

@Injectable()
export class TodoServiceProvider {
  /**
   * cloud controlleur qui s'enregistrera plus tard
   *
   * @private
   * @type {CloudServiceProvider}
   * @memberof TodoServiceProvider
   */
  private cloudCtrl: CloudServiceProvider;

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
   * Subscription pour l'observable du tableau des listes partagés.
   * Il s'agit de l'observable combinant l'ensemble des observable des document des listes partagés unitaires
   *
   * @private
   * @type {Subscription}
   * @memberof TodoServiceProvider
   */
  private sharedListSub: Subscription;

  /**************************************************************************/
  /****************************** TODO FIELDS *******************************/
  /**************************************************************************/

  private todoSub: Subscription;

  private readonly extTodoSubject: Subject<Observable<ITodoItem[]>>;

  /**************************************************************************/
  /************************* TODO/LIST DELETE NOTIF *************************/
  /**************************************************************************/

  /**
   * Subscription à la suppression d'une liste en cours d'observation.
   * Fire un nouvel evement si la liste en cours est supprimé
   *
   * @private
   * @type {Subject<void>}
   * @memberof TodoServiceProvider
   */
  private readonly deleteSubject: Subject<void>;

  /**
   * Subscription à la suppression d'une liste en cours d'observation
   *
   * @private
   * @type {Subscription}
   * @memberof TodoServiceProvider
   */
  private deleteSub: Subscription;

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
    private readonly authCtrl: AuthServiceProvider
  ) {
    this.todoLists = new BehaviorSubject<ITodoList[]>([]);
    this.localTodoLists = new BehaviorSubject<ITodoList[]>([]);
    this.sharedTodoLists = new BehaviorSubject<ITodoList[]>([]);
    this.currentUserData = new BehaviorSubject<IAppUser>({
      todoListSharedWithMe: []
    });
    this.extTodoSubject = new Subject<Observable<ITodoItem[]>>();
    this.deleteSubject = new Subject<void>();
    this.updateDBLink();
    this.updateLocalDBLink();
  }

  public cloudRegister(c: CloudServiceProvider): void {
    this.cloudCtrl = c;
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
      'user/' + this.authCtrl.getUserId() + '/list',
      ref => ref.orderBy('order', 'asc')
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
   * Met à jour le tableau de document firestore des listes partagées en fonction des données utilisateur
   * Supprime les liste qui ne sont plus partagée
   *
   * @private
   * @param {AppUser} data
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  private async updateSharedListCollection(data: IAppUser): Promise<void> {
    const pathToDelete: string[] = [];
    this.sharedTodoCollection = [];

    for (const path of data.todoListSharedWithMe) {
      const docToAdd = this.firestoreCtrl.doc<ITodoList>(
        'user/' + path.userUUID + '/list/' + path.listUUID
      );

      if ((await docToAdd.ref.get()).exists) {
        this.sharedTodoCollection.push(docToAdd);
      } else {
        if (path.listUUID != null) {
          pathToDelete.push(path.listUUID);
        }
      }
    }

    this.tryUnsub(this.sharedListSub);
    this.sharedTodoLists.next([]);
    this.listenForSharedUpdate();

    for (const listUUID of pathToDelete) {
      this.removeListLink(listUUID);
    }
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

  /**
   * Réinitialise les observable des listes partagés
   *
   * @private
   * @memberof TodoServiceProvider
   */
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
      'machine/' + machineId + '/list',
      ref => ref.orderBy('order', 'asc')
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
   * @param {string} listUuid
   * @param {ListType} [type]
   * @returns {Promise<AngularFirestoreDocument<ITodoList>>}
   * @memberof TodoServiceProvider
   */
  private getFirestoreDocument(
    listUuid: string,
    type?: ListType
  ): Promise<AngularFirestoreDocument<ITodoList>> {
    if (type == null) {
      try {
        type = this.getListType(listUuid);
      } catch (error) {
        throw new Error('Liste inconnu ou type invalide');
      }
    }

    switch (type) {
      case ListType.LOCAL:
        return new Promise(resolve =>
          resolve(this.localTodoListCollection.doc<ITodoList>(listUuid))
        );
      case ListType.PRIVATE:
        return new Promise(resolve =>
          resolve(this.todoListCollection.doc<ITodoList>(listUuid))
        );
      case ListType.SHARED:
        return new Promise(resolve => {
          for (const doc of this.sharedTodoCollection) {
            const sub = doc.valueChanges().subscribe((val: ITodoList) => {
              if (val.uuid === listUuid) {
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
  /*********************** PUBLIC ADD LISTS INTERFACE ***********************/
  /**************************************************************************/

  /**
   * Permet de cloner une liste d'un autre utilisateur vers le compte de l'utilsateur courant
   *
   * @param {ITodoListPath} path
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async importList(path: ITodoListPath): Promise<void> {
    const listData = await this.getAListSnapshotFromPath(path);
    listData.uuid = null;
    listData.order = 0;
    await this.addList(listData);
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
      data.order = 0;
    }

    let author: IAuthor | null = null;

    if (data.author != null) {
      author = data.author;
    }

    if (data.author == null && this.authCtrl.isConnected()) {
      author = await this.authCtrl.getAuthor(false);
    }

    await dbCollection.doc<ITodoList>(newUuid).set({
      uuid: newUuid,
      name: data.name,
      icon: data.icon,
      order: data.order,
      author: author,
      externTodos: []
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
  public async updateList(data: ITodoList, destType?: ListType): Promise<string | null> {
    if (data == null || data.uuid == null) {
      return null;
    }

    let curListType: ListType;
    try {
      curListType = this.getListType(data.uuid);
    } catch (error) {
      return null;
    }

    let doc: AngularFirestoreDocument<ITodoList>;
    try {
      doc = await this.getFirestoreDocument(data.uuid, curListType);
    } catch (error) {
      return null;
    }

    // si on ne change pas la liste de place
    if (destType == null || destType === curListType) {
      await doc.update({
        name: data.name,
        icon: data.icon
      });
    } else if (destType === ListType.PRIVATE || destType === ListType.LOCAL) {
      // on ajoute la liste à la collection de destination et on supprime la liste de la collection source
      const newUuid: string = await this.addList(data, destType);
      this.deleteList(data.uuid, curListType);
      return newUuid;
    }
    return data.uuid;
  }

  public async updateOrder(listUuid: string | null, ord: number): Promise<void> {
    if (listUuid == null) {
      return;
    }

    let doc: AngularFirestoreDocument<ITodoList>;
    try {
      doc = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return;
    }

    doc.update({
      order: ord
    });
  }

  /**************************************************************************/
  /*********************** PUBLIC GET LISTS INTERFACE ***********************/
  /**************************************************************************/

  /****************************** LISTS GETTERS *****************************/

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

  /****************************** LIST GETTERS ******************************/

  /**
   * Permet de récupérer un objet de chemin pour la liste ayant l'identifiant spécifié
   *
   * @param {string} listUUID
   * @returns {TodoListPath}
   * @memberof TodoServiceProvider
   */
  public getListLink(listUUID: string): ITodoListPath {
    let type: ListType;
    try {
      type = this.getListType(listUUID);
    } catch (error) {
      return Global.getBlankListPath();
    }

    if (type !== ListType.SHARED) {
      return {
        userUUID: this.authCtrl.getUserId(),
        listUUID: listUUID,
        shareByReference: true
      };
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
   * Permet de récupérer une liste représenté par son identifiant unique
   *
   * @param {string} listUuid l'identifiant unique de la liste
   * @returns {Observable<ITodoList>}
   * @memberof TodoServiceProvider
   */
  public async getAList(listUuid: string): Promise<Observable<ITodoList>> {
    let doc: AngularFirestoreDocument<ITodoList>;
    try {
      doc = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return Observable.of(Global.getBlankList());
    }

    return doc.valueChanges();
  }

  public getListUUIDByName(name : string): string {
    let uuidList : string | null ="";
    this.localTodoLists.getValue().forEach(
          liste => {
            if(liste.name === name){
              uuidList = liste.uuid;
            }
          }
        );
    return uuidList;

  }

  /****************************** REMOVAL NOTIFS ****************************/

  /**
   * reconfigure le sujet de suppression de liste pour l'identifiant passé en paramètre et retoune le sujet
   *
   * @public
   * @param {any} listUuid
   * @returns {Subject<void>}
   * @memberof TodoServiceProvider
   */
  public getDeleteSubject(listUuid: string): Subject<void> {
    this.subscribeForDelete(listUuid);
    return this.deleteSubject;
  }

  /**
   * annule les subscription pour suppression de liste
   *
   * @public
   * @memberof TodoServiceProvider
   */
  public unsubDeleteSubject(): void {
    this.tryUnsub(this.deleteSub);
  }

  /**
   * reconfigure le sujet de suppression de liste pour un nouvel identifiant de liste
   *
   * @public
   * @param {any} listUuid
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async subscribeForDelete(listUuid: string, todoUuid?: string): Promise<void> {
    let doc: AngularFirestoreDocument<ITodoList>;
    this.tryUnsub(this.deleteSub);

    try {
      if (todoUuid == null) {
        doc = await this.getFirestoreDocument(listUuid);
      } else {
        doc = (await this.getFirestoreDocument(listUuid))
          .collection('todo')
          .doc(todoUuid);
      }
    } catch (error) {
      return;
    }

    this.deleteSub = doc.snapshotChanges().subscribe(snap => {
      if (!snap.payload.exists) {
        this.deleteSubject.next();
        this.tryUnsub(this.deleteSub);
      }
    });
  }

  /****************************** SNAPSHOTS ONLY ****************************/

  /**
   * A utiliser avec prudence car non synchronisé, retourne une liste telle qu'elle était lors de l'appel
   *
   * @param {string} listUuid
   * @returns {ITodoList}
   * @memberof TodoServiceProvider
   */
  public getAListSnapshot(listUuid: string): ITodoList {
    let type: ListType;
    try {
      type = this.getListType(listUuid);
    } catch (error) {
      return Global.getBlankList();
    }

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
    const res = lists.find(d => d.uuid === listUuid);
    if (res !== undefined) {
      return res;
    }
    return Global.getBlankList();
  }

  /**
   * Recherche une liste en sa basant sur son chemin absolu dans la base firestore
   *
   * @param {ITodoListPath} path
   * @returns {Promise<ITodoList>}
   * @memberof TodoServiceProvider
   */
  public async getAListSnapshotFromPath(path: ITodoListPath): Promise<ITodoList> {
    const doc = this.firestoreCtrl.doc<ITodoList>(
      'user/' + path.userUUID + '/list/' + path.listUUID
    );
    const snap = await doc.ref.get();
    return snap.data() as ITodoList;
  }

  /**************************************************************************/
  /*********************** PUBLIC DEL LISTS INTERFACE ***********************/
  /**************************************************************************/

  /**
   * Supprime une liste ou la délie si il s'ait d'une liste partagée
   *
   * @param {string} ListUuid l'identifiant de la liste
   * @memberof TodoServiceProvider
   */
  public async deleteList(listUuid: string, type?: ListType): Promise<void> {
    if (type == null) {
      try {
        type = this.getListType(listUuid);
      } catch (error) {
        return;
      }
    }

    if (type === ListType.SHARED) {
      this.removeListLink(listUuid);
    } else {
      await this.cleanUpTodos(listUuid);

      let doc: AngularFirestoreDocument<ITodoList>;
      try {
        doc = await this.getFirestoreDocument(listUuid, type);
      } catch (error) {
        return;
      }

      doc.delete();
      this.cloudCtrl.removeCloudList(listUuid);
    }
  }

  /**************************************************************************/
  /**************************************************************************/
  /************************* PUBLIC TODOS INTERFACE *************************/
  /**************************************************************************/
  /**************************************************************************/

  /**
   * reconfigure le sujet de suppression de liste/todo pour la reference de todo
   * passé en paramètre et retoune le sujet
   *
   * @param {DocumentReference} ref
   * @returns {Subject<void>}
   * @memberof TodoServiceProvider
   */
  public getTodoDeleteSubject(ref: DocumentReference): Subject<void> {
    const doc = new AngularFirestoreDocument(ref as any);
    this.tryUnsub(this.deleteSub);

    this.deleteSub = doc.snapshotChanges().subscribe(snap => {
      if (!snap.payload.exists) {
        this.deleteSubject.next();
        this.tryUnsub(this.deleteSub);
      }
    });
    return this.deleteSubject;
  }

  /**
   * retourne la collection firestore des todos standard de la liste dont l'uuid est passé en paramètre
   *
   * @private
   * @param {string} listUuid
   * @param {boolean} completed true si l'on recherche les todo completed, false sinon
   * @returns {Promise<Observable<ITodoItem>>}
   * @memberof TodoServiceProvider
   */
  public async getPrivateTodos(
    listUuid: string,
    completed: boolean
  ): Promise<Observable<ITodoItem[]>> {
    let listBase: AngularFirestoreDocument<ITodoList>;
    try {
      listBase = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return Observable.of([]);
    }

    return listBase
      .collection<ITodoItem>('todo', ref =>
        ref.where('complete', '==', completed).orderBy('order')
      )
      .valueChanges();
  }

  /**extTodoSubject
   * permet de récupérer un observable d'observable (a refaire...) des todo originaire d'autre listes.
   * Supprime également les référence invalides
   *
   * @param {string} listUuid
   * @returns {Promise<Observable<Observable<ITodoItem[]>>>}
   * @memberof TodoServiceProvider
   */
  public async getExportedTodosObservables(
    listUuid: string
  ): Promise<Observable<Observable<ITodoItem[]>>> {
    let listBase: AngularFirestoreDocument<ITodoList>;
    try {
      listBase = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return Observable.of(Observable.of([]));
    }

    this.tryUnsub(this.todoSub);

    this.todoSub = listBase.valueChanges().subscribe((list: ITodoList) => {
      const afDocs: Observable<ITodoItem>[] = [];
      const promises: Promise<void>[] = [];
      for (const extTodo of list.externTodos) {
        const promise = extTodo.get().then(extTodoDoc => {
          if (extTodoDoc.exists) {
            afDocs.push(
              new AngularFirestoreDocument<ITodoItem>(extTodo as any).valueChanges()
            );
          } else {
            this.removeTodoRef(listUuid, extTodo);
          }
        });
        promises.push(promise);
      }
      Promise.all(promises).then(() =>
        this.extTodoSubject.next(Observable.combineLatest(afDocs))
      );
    });

    return this.extTodoSubject;
  }

  /**
   * Permet d'arréter la subscription aux mises à jour des todos partagée d'une liste
   *
   * @memberof TodoServiceProvider
   */
  public unsubscribeOfTodo(): void {
    this.tryUnsub(this.todoSub);
  }

  /**
   * Permet de récupérer un observable sur un todo unique
   *
   * @param {DocumentReference} ref
   * @returns {Promise<Observable<ITodoItem>>}
   * @memberof TodoServiceProvider
   */
  public getTodo(ref: DocumentReference): Observable<ITodoItem> {
    const doc = new AngularFirestoreDocument<ITodoItem>(ref as any);
    return doc.valueChanges();
  }

  /**
   * permet de préciser le status d'un todo dans une liste (fini ou non)
   *
   * @param {DocumentReference} todoRef
   * @param {boolean} status
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async complete(todoRef: DocumentReference, status: boolean): Promise<void> {
    const doc = new AngularFirestoreDocument<ITodoItem>(todoRef as any);
    let auth: IAuthor | null = null;
    if (status) {
      auth = await this.authCtrl.getAuthor(false);
    }
    try {
      await doc.update({
        complete: status,
        completeAuthor: auth,
        order: 0
      });
    } catch (error) {
      return;
    }
  }

  /**
   * permet de modifier un todo
   *
   * @param {DocumentReference} ref référence vers le todo à éditer
   * @param {ITodoItem} editedItem
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async editTodo(ref: DocumentReference, editedItem: ITodoItem): Promise<void> {
    if (ref == null || editedItem == null) {
      return;
    }

    const todoDoc = new AngularFirestoreDocument<ITodoItem>(ref as any);
    try {
      await todoDoc.update({
        name: editedItem.name
        // a completer une fois fini
      });
    } catch (error) {
      console.log("impossible d'editer le todo. Est ce que le todo existe encore ?");
      return;
    }
  }

  /**
   * permet d'ajouter un todo dans une liste
   *
   * @param {string} listUuid
   * @param {ITodoItem} newItem
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async addTodo(
    listUuid: string,
    newItem: ITodoItem
  ): Promise<DocumentReference | null> {
    let listDoc: AngularFirestoreDocument<ITodoList>;
    try {
      listDoc = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return null;
    }

    const todoUuid = uuid();
    newItem.uuid = todoUuid;
    newItem.author = await this.authCtrl.getAuthor(false);
    const doc = listDoc.collection('todo').doc<ITodoItem>(todoUuid);
    newItem.ref = doc.ref as DocumentReference;
    await doc.set(newItem);
    return newItem.ref;
  }

  /**
   * Permet de supprimer un todo
   *
   * @param {DocumentReference} ref référence vers le todo à supprimer
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async deleteTodo(ref: DocumentReference): Promise<void> {
    if (ref == null) {
      return;
    }
    const list = new AngularFirestoreDocument(ref as any);
    try {
      await list.delete();
    } catch (error) {
      console.log('Impossible de supprimer la tâche, tâche inexistante ?');
    }
  }

  public async removeTodoRef(listUuid: string, ref: DocumentReference): Promise<void> {
    if (ref == null || listUuid == null) {
      return;
    }

    let listDoc: AngularFirestoreDocument<ITodoList>;
    try {
      listDoc = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return;
    }

    const currentExtRef = this.getAListSnapshot(listUuid).externTodos;
    const index = currentExtRef.findIndex(r => r.path === ref.path);

    if (index !== -1) {
      currentExtRef.splice(index, 1);
      await listDoc.update({
        externTodos: currentExtRef
      });
    }
  }

  /**
   * Méthode permettant de supprimer tout les todos d'une liste
   *
   * @param {string} listUuid
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async cleanUpTodos(listUuid: string): Promise<void> {
    let listDoc: AngularFirestoreDocument<ITodoList>;
    try {
      listDoc = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return;
    }

    const todosCollection = listDoc.collection('todo');
    const sub = todosCollection
      .snapshotChanges()
      .subscribe((snap: DocumentChangeAction[]) => {
        for (const dca of snap) {
          dca.payload.doc.ref.delete();
        }
        sub.unsubscribe();
      });
  }

  /**
   * Permet de lier un todo à une liste par référence.
   *
   * @param {string} listUuid la liste dans laquelle lié un todo
   * @param {DocumentReference} todoRef une référence de todo
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async addTodoLink(listUuid: string, todoRef: DocumentReference): Promise<void> {
    let destList: AngularFirestoreDocument<ITodoList>;
    try {
      destList = await this.getFirestoreDocument(listUuid);
    } catch (error) {
      return;
    }

    const destSnap = this.getAListSnapshot(listUuid);
    if (destSnap == null || todoRef == null) {
      return;
    }

    destSnap.externTodos.push(todoRef);
    await destList.update({
      externTodos: destSnap.externTodos
    });
  }

  /**
   * Tente de mettre à jour l'ordre d'une tâche
   *
   * @param {(DocumentReference | null)} ref
   * @param {number} order
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async updateTodoOrder(
    ref: DocumentReference | null,
    order: number
  ): Promise<void> {
    if (ref == null || order == null) {
      return;
    }
    const todoDoc = new AngularFirestoreDocument<ITodoItem>(ref as any);
    try {
      await todoDoc.update({
        order: order
      });
    } catch (error) {
      console.log("impossible d'editer le todo. Est ce que le todo existe encore ?");
      return;
    }
  }

  /**
   *
   * Permet de récupérer un flux de ITodoItem pour une liste
   * Know bug: les todo externe ne sont pas mis à jour en cas de suppression-ajout :/
   *
   * @param {string} listUuid
   * @returns {Promise<Observable<ITodoItem[]>>}
   * @memberof TodoServiceProvider
   */
  public async getTodoDataFromList(listUuid: string): Promise<Observable<ITodoItem[]>> {
    const list = await this.getFirestoreDocument(listUuid);
    const obsTab: Observable<ITodoItem>[] = [];
    const refs = await list.collection('todo').ref.get();

    for (const doc of refs.docs) {
      obsTab.push(new AngularFirestoreDocument<ITodoItem>(doc.ref).valueChanges());
    }
    const extsRefs = this.getAListSnapshot(listUuid).externTodos;
    for (const ref of extsRefs) {
      obsTab.push(new AngularFirestoreDocument<ITodoItem>(ref as any).valueChanges());
    }
    obsTab.push(Observable.of(Global.getBlankTodo())); // cause [] == false (ノಠ益ಠ)ノ彡┻━┻
    return Observable.combineLatest(obsTab);
  }
}
