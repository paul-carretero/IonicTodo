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
import { List } from 'ionic-angular';

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
   * Liste des listes de todo, synchronisé avec la base de donnée
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
  private currentUserData: AngularFirestoreDocument<AppUser>;

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
  private sharedTodoLists: BehaviorSubject<TodoList[]>[];

  /**
   *
   *
   * @private
   * @type {Subscription[]}
   * @memberof TodoServiceProvider
   */
  private sharedListSubs: Subscription[];

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

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
    this.updateDBLink();
    this.updateLocalDBLink();
  }

  /**************************************************************************/
  /**************************** PRIVATE METHODS *****************************/
  /**************************************************************************/

  private initPrivateListCollection(): void {
    this.todoListCollection = this.firestoreCtrl.collection<TodoList>(
      'user/' + this.authCtrl.getUserId() + '/list'
    );
    this.listsPublisher();
  }

  /**
   * Synchronise la liste des listes de todo privée de l'utilisateur avec la base
   * Firestore et abandonne la synchro en cas de déconnexion
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private updateDBLink(): void {
    if (this.authCtrl.isConnected()) {
      this.initPrivateListCollection();
    }

    this.authCtrl.getConnexionSubject().subscribe((user: User) => {
      if (this.privateListSub != null) {
        this.privateListSub.unsubscribe();
      }
      if (user != null) {
        this.initPrivateListCollection();
      } else {
        this.todoLists.next([]);
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
    this.localTodoListCollection
      .valueChanges()
      .subscribe((lists: TodoList[]) => {
        this.localTodoLists.next(lists);
      });
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
    return {
      userUUID: this.authCtrl.getUserId(),
      listUUID: listUUID
    };
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
    if (localLists.find(d => d.uuid == uuid) != null) {
      return ListType.LOCAL;
    }

    return ListType.PRIVATE;
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
        return this.localTodoLists;
      default:
        return this.todoLists;
    }
  }

  /**
   * Permet de récupérer une liste représenté par son identifiant unique
   *
   * @param {string} uuid l'identifiant unique de la liste
   * @param {ListType} [type] le type de la liste (ou l'on doit la chercher)
   * @returns {Observable<TodoList>}
   * @memberof TodoServiceProvider
   */
  public getAList(uuid: string, type?: ListType): Observable<TodoList> {
    if (type == null) {
      type = this.getListType(uuid);
    }
    switch (type) {
      case ListType.LOCAL:
        return this.localTodoListCollection.doc<TodoList>(uuid).valueChanges();
      default:
        return this.todoListCollection.doc<TodoList>(uuid).valueChanges();
    }
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
    const local: boolean = type == ListType.LOCAL;
    const newUuid: string = uuid();

    let dbCollection = this.todoListCollection;
    if (local || !this.authCtrl.getConnexionSubject().getValue()) {
      dbCollection = this.localTodoListCollection;
    }

    return new Promise((resolve, reject) => {
      dbCollection
        .doc<TodoList>(newUuid)
        .set({
          uuid: newUuid,
          name: data.name,
          items: [],
          icon: data.icon,
          isPrivate: data.isPrivate
        })
        .then(() => resolve(newUuid));
    });
  }

  private getFirestoreCollection(
    type: ListType,
    listUUID?: string
  ): AngularFirestoreCollection<TodoList> {
    switch (type) {
      case ListType.LOCAL:
        return this.localTodoListCollection;
      default:
        return this.todoListCollection;
    }
  }

  public async updateList(data: TodoList, destType?: ListType): Promise<void> {
    const curListType = this.getListType(data.uuid);

    if (destType == null || destType === curListType) {
      await this.getFirestoreCollection(curListType)
        .doc<TodoList>(data.uuid)
        .update({
          name: data.name,
          icon: data.icon,
          isPrivate: data.isPrivate
        });
    } else {
      await this.getFirestoreCollection(destType)
        .doc<TodoList>(data.uuid)
        .set(data);
      await this.getFirestoreCollection(curListType)
        .doc<TodoList>(data.uuid)
        .delete();
    }
  }

  public deleteList(uuid: string): void {
    this.todoListCollection
      .doc(uuid)
      .delete()
      .catch(() => this.localTodoListCollection.doc(uuid).delete());
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
    return Observable.of(this.data.find(d => d.uuid == uuid).items);
  }

  public getTodo(listUUID: string, uuid: string): Observable<TodoItem> {
    return Observable.of(
      this.data.find(d => d.uuid == listUUID).items.find(d => d.uuid == uuid)
    );
  }

  public complete(listUUID: string, todoUUID: string, status: boolean) {
    const todo = this.data
      .find(d => d.uuid == listUUID)
      .items.find(d => d.uuid == todoUUID);
    todo.complete = status;
    if (status == true) {
      todo.posCompleted = null;
      todo.dateCompleted = null;
    } else {
      todo.posCompleted = null;
      todo.dateCompleted = null;
    }
  }

  public editTodo(listUuid: String, editedItem: TodoItem) {
    let items = this.data.find(d => d.uuid == listUuid).items;
    let index = items.findIndex(value => value.uuid == editedItem.uuid);
    items[index] = editedItem;
  }

  public addTodo(listUuid: String, newItem: TodoItem): void {
    const items = this.data.find(d => d.uuid == listUuid).items;
    newItem.uuid = uuid();
    items.push(newItem);
  }

  public deleteTodo(listUuid: String, uuid: String) {
    let items = this.data.find(d => d.uuid == listUuid).items;
    let index = items.findIndex(value => value.uuid == uuid);
    if (index != -1) {
      items.splice(index, 1);
    }
  }
}
