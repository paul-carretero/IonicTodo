import { TodoListPath } from './../../model/todo-list-path';
import { AppUser } from './../../model/user';
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

import { TodoItem } from '../../model/todo-item';
import { TodoList, ListType } from '../../model/todo-list';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { Subscription } from 'rxjs/Rx';
import { User } from '@firebase/auth-types';

@Injectable()
export class TodoServiceProvider {
  private data = [];

  /**************************************************************************/
  /**************************** TODO UTILISATEUR ****************************/
  /**************************************************************************/

  /**
   * ensemble des listes de l'utilisateur courrant
   * @private
   * @type {AngularFirestoreCollection<TodoList>}
   * @memberof TodoServiceProvider
   */
  private todoListCollection: AngularFirestoreCollection<TodoList>;

  /**
   * Liste des listes privée de todo, synchronisé avec la base de donnée
   *
   * @private
   * @type {BehaviorSubject<TodoList[]>}
   * @memberof TodoServiceProvider
   */
  private todoLists: BehaviorSubject<TodoList[]>;

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
  private localTodoListCollection: AngularFirestoreCollection<TodoList>;

  /**
   * Liste des listes de todo hors connexion, synchronisé avec la base de donnée
   *
   * @private
   * @type {BehaviorSubject<TodoList[]>}
   * @memberof TodoServiceProvider
   */
  private localTodoLists: BehaviorSubject<TodoList[]>;

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
  private currentUserDataDoc: AngularFirestoreDocument<AppUser>;

  /**
   * Représente notament les listes partagée avec l'utilisateur courant, mise à jour en temps réel
   *
   * @private
   * @type {Observable<AppUser>}
   * @memberof TodoServiceProvider
   */
  private currentUserData: BehaviorSubject<AppUser>;

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
  private sharedTodoCollection: AngularFirestoreDocument<TodoList>[];

  /**
   * Ensemble des listes de todo partagé avec cet utilisateur
   *
   * @private
   * @type {BehaviorSubject<TodoList[]>[]}
   * @memberof TodoServiceProvider
   */
  private sharedTodoLists: BehaviorSubject<TodoList[]>;

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
    private firestoreCtrl: AngularFirestore,
    private authCtrl: AuthServiceProvider
  ) {
    this.todoLists = new BehaviorSubject<TodoList[]>([]);
    this.localTodoLists = new BehaviorSubject<TodoList[]>([]);
    this.sharedTodoLists = new BehaviorSubject<TodoList[]>([]);
    this.currentUserData = new BehaviorSubject<AppUser>({
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
    this.currentUserDataDoc = this.firestoreCtrl.doc<AppUser>(
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
      .subscribe((data: AppUser) => {
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
  private getSharedListPathSnapchot(): TodoListPath[] {
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
    this.todoListCollection = this.firestoreCtrl.collection<TodoList>(
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
    const obsArray: Observable<TodoList>[] = [];
    for (const doc of this.sharedTodoCollection) {
      obsArray.push(doc.valueChanges());
    }

    this.sharedListSub = Observable.combineLatest(obsArray).subscribe(
      (lists: TodoList[]) => {
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
  private checkIfExist(doc: AngularFirestoreDocument<TodoList>): Promise<boolean> {
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
  private updateSharedListCollection(data: AppUser): void {
    const pathToDelete: string[] = [];
    const promises: Promise<void>[] = [];
    this.sharedTodoCollection = [];

    for (const path of data.todoListSharedWithMe) {
      const docToAdd = this.firestoreCtrl.doc<TodoList>(
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
    this.appUserDataSub = this.currentUserData.subscribe((data: AppUser) => {
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
      .subscribe((lists: TodoList[]) => {
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
    this.localTodoListCollection = this.firestoreCtrl.collection<TodoList>(
      'machine/' + machineId + '/list'
    );
    this.localTodoListCollection.valueChanges().subscribe((lists: TodoList[]) => {
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
   * @returns {Promise<AngularFirestoreDocument<TodoList>>}
   * @memberof TodoServiceProvider
   */
  private getFirestoreDocument(
    listeUUID: string,
    type?: ListType
  ): Promise<AngularFirestoreDocument<TodoList>> {
    if (type == null) {
      type = this.getListType(listeUUID);
    }

    switch (type) {
      case ListType.LOCAL:
        return new Promise((resolve, reject) =>
          resolve(this.localTodoListCollection.doc<TodoList>(listeUUID))
        );
      case ListType.PRIVATE:
        return new Promise((resolve, reject) =>
          resolve(this.todoListCollection.doc<TodoList>(listeUUID))
        );
      case ListType.SHARED:
        return new Promise((resolve, reject) => {
          for (const doc of this.sharedTodoCollection) {
            const sub = doc.valueChanges().subscribe((val: TodoList) => {
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
  public addListLink(path: TodoListPath): void {
    const listsPathTab = this.getSharedListPathSnapchot();
    listsPathTab.push(path);
    this.currentUserDataDoc.update({ todoListSharedWithMe: listsPathTab }).catch(() => {
      this.currentUserDataDoc.set({ todoListSharedWithMe: [path] });
    });
  }

  /**
   * Supprime le chemin d'une liste partagée. Ne supprime pas la liste de todo en temps que telle.
   *
   * @param {string} listUUID
   * @memberof TodoServiceProvider
   */
  public removeListLink(listUUID: string): void {
    const listsPathTab = this.getSharedListPathSnapchot();

    let toDelete: number = -1;
    for (let i = 0; i < listsPathTab.length; i++) {
      if (listsPathTab[i].listUUID === listUUID) {
        toDelete = i;
      }
    }

    if (toDelete !== -1) {
      listsPathTab.splice(toDelete);
      this.currentUserDataDoc
        .update({ todoListSharedWithMe: listsPathTab })
        .catch(() => {
          // not really reachable...
          this.currentUserDataDoc.set({
            todoListSharedWithMe: listsPathTab
          });
        })
        .then(() => this.refreshShared());
    }
  }

  /**************************************************************************/
  /************************* PUBLIC LISTS INTERFACE *************************/
  /**************************************************************************/

  /**
   * Permet de récupérer un objet de chemin pour la liste ayant l'identifiant spécifié
   * TODO gérer les liste partagé!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   *
   * @param {string} listUUID
   * @returns {TodoListPath}
   * @memberof TodoServiceProvider
   */
  public getListLink(listUUID: string): TodoListPath {
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
   * Permet de récupérer le type d'une liste
   *
   * @param {string} uuid l'identifiant d'une liste
   * @returns {ListType} le type de la liste, local, private ou shared
   * @memberof TodoServiceProvider
   */
  public getListType(uuid: string): ListType {
    const localLists: TodoList[] = this.localTodoLists.getValue();
    const sharedLists: TodoList[] = this.sharedTodoLists.getValue();
    const privateLists: TodoList[] = this.todoLists.getValue();

    if (localLists.find(d => d.uuid === uuid) != null) {
      return ListType.LOCAL;
    }
    if (sharedLists.find(d => d.uuid === uuid) != null) {
      return ListType.SHARED;
    }
    if (privateLists.find(d => d.uuid === uuid) != null) {
      return ListType.PRIVATE;
    }

    throw new Error('Liste inconnu ou type invalide');
  }

  /**
   * Permet de récupérer un Observable de tableau de liste de todo
   *
   * @param {ListType} [type] Permet de préciser le type de liste que l'on souhaite récupérer
   * @returns {Observable<TodoList[]>}
   * @memberof TodoServiceProvider
   */
  public getTodoList(type?: ListType): Observable<TodoList[]> {
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
   * @param {string} uuid l'identifiant unique de la liste
   * @returns {Observable<TodoList>}
   * @memberof TodoServiceProvider
   */
  public async getAList(uuid: string): Promise<Observable<TodoList>> {
    const doc = await this.getFirestoreDocument(uuid);
    return doc.valueChanges();
  }

  /**
   * Permet de créer une liste. La liste sera créer localement si hors ligne ou non authentifié
   *
   * @param {string} name le nom de la liste à créer
   * @param {string} icon un type de liste (associé à une icone ionic)
   * @param {boolean} [local] vrai si la liste doit être stocker localement, faus sinon (par défault)
   * @returns {Promise<string>} l'uuid de la liste nouvellement créée
   * @memberof TodoServiceProvider
   */
  public addList(data: TodoList, type?: ListType): Promise<string> {
    const newUuid: string = uuid();

    let dbCollection = this.todoListCollection;
    if (type === ListType.LOCAL || !this.authCtrl.getConnexionSubject().getValue()) {
      dbCollection = this.localTodoListCollection;
    }

    if (data.order == null) {
      data.order = -1;
    }

    return new Promise(resolve => {
      dbCollection
        .doc<TodoList>(newUuid)
        .set({
          uuid: newUuid,
          name: data.name,
          items: [],
          icon: data.icon,
          order: data.order
        })
        .then(() => resolve(newUuid));
    });
  }

  /**
   * Permet de mettre à jour une liste et/ou de la transférer des liste locales aux liste privée et inversement
   *
   * @param {TodoList} data
   * @param {ListType} [destType]
   * @returns {Promise<void>}
   * @memberof TodoServiceProvider
   */
  public async updateList(data: TodoList, destType?: ListType): Promise<void> {
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
   * @param {string} uuid l'identifiant de la liste
   * @memberof TodoServiceProvider
   */
  public async deleteList(uuid: string, type?: ListType): Promise<void> {
    if (type == null) {
      type = this.getListType(uuid);
    }

    if (type === ListType.SHARED) {
      this.removeListLink(uuid);
    } else {
      const doc = await this.getFirestoreDocument(uuid, type);
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

  public getTodos(uuid: String): Observable<TodoItem[]> {
    return Observable.of(this.data.find(d => d.uuid === uuid).items);
  }

  public getTodo(listUUID: string, uuid: string): Observable<TodoItem> {
    return Observable.of(
      this.data.find(d => d.uuid === listUUID).items.find(d => d.uuid === uuid)
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

  public editTodo(listUuid: String, editedItem: TodoItem) {
    const items = this.data.find(d => d.uuid === listUuid).items;
    const index = items.findIndex(value => value.uuid === editedItem.uuid);
    items[index] = editedItem;
  }

  public addTodo(listUuid: String, newItem: TodoItem): void {
    const items = this.data.find(d => d.uuid === listUuid).items;
    newItem.uuid = uuid();
    items.push(newItem);
  }

  public deleteTodo(listUuid: String, uuid: String) {
    const items = this.data.find(d => d.uuid === listUuid).items;
    const index = items.findIndex(value => value.uuid === uuid);
    if (index !== -1) {
      items.splice(index, 1);
    }
  }
}
