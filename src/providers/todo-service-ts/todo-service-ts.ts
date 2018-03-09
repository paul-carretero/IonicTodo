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
import { TodoList } from '../../model/todo-list';
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
  private localTodoLists: Observable<TodoList[]>;

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

  /**
   * Synchronise la liste des listes de todo privée de l'utilisateur avec la base
   * Firestore et abandonne la synchro en cas de déconnexion
   *
   * @private
   * @memberof TodoServiceProvider
   */
  private updateDBLink(): void {
    this.authCtrl.getConnexionSubject().subscribe((user: User) => {
      if (this.privateListSub != null) {
        this.privateListSub.unsubscribe();
      }
      if (user != null) {
        this.todoListCollection = this.firestoreCtrl.collection<TodoList>(
          'user/' + this.authCtrl.getUserId() + '/list'
        );
        this.listsPublisher();
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
  private updateLocalDBLink(): void {
    this.authCtrl.getMachineId().then((id: string) => {
      this.localTodoListCollection = this.firestoreCtrl.collection<TodoList>(
        'machine/' + id + '/list'
      );
      this.localTodoLists = this.localTodoListCollection.valueChanges();
    });
  }

  /**************************************************************************/
  /************************* PUBLIC LISTS INTERFACE *************************/
  /**************************************************************************/

  public getPrivateLists(): Observable<TodoList[]> {
    return this.todoLists;
  }

  public getALocalPrivateList(uuid: string): Observable<any> {
    const doc = this.todoListCollection.doc(uuid);
    return doc.valueChanges();
  }

  public getLocalLists(): Observable<TodoList[]> {
    return this.localTodoLists;
  }

  public getSharedLists(): Observable<TodoList[]> {
    return null;
  }

  public getAList(uuid: string): Observable<TodoList> {
    return this.getALocalPrivateList(uuid);
  }

  /**
   * Permet de créer une liste. La liste sera créer localement si hors ligne
   * @param {string} name le nom de la liste à créer
   * @param {string} icon un type de liste (associé à une icone ionic)
   * @param {boolean} [local] vrai si la liste doit être stocker localement, faus sinon (par défault)
   * @returns {Promise<string>} l'uuid de la liste nouvellement créée
   * @memberof TodoServiceProvider
   */
  public addList(name: string, icon: string, local?: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      const newUuid: string = uuid();

      let dbCollection: AngularFirestoreCollection<TodoList> = this
        .todoListCollection;
      if (local || !this.authCtrl.getConnexionSubject().getValue()) {
        dbCollection = this.localTodoListCollection;
      }

      dbCollection
        .doc(newUuid)
        .set({
          uuid: newUuid,
          name: name,
          items: [],
          icon: icon
        })
        .then(() => resolve(newUuid));
    });
  }

  public updateList(uuid: string, name: string, icon: string): void {
    this.todoListCollection
      .doc(uuid)
      .update({
        uuid: uuid,
        name: name,
        icon: icon
      })
      .catch(() => {
        this.localTodoListCollection.doc(uuid).update({
          uuid: uuid,
          name: name,
          icon: icon
        });
      });
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
