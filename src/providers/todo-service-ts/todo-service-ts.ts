import { AuthServiceProvider } from './../auth-service/auth-service';
import 'rxjs/Rx';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { v4 as uuid } from 'uuid';

import { TodoItem } from '../../model/todo-item';
import { TodoList } from '../../model/todo-list';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import {
  AngularFirestoreCollection,
  AngularFirestore
} from 'angularfire2/firestore';

@Injectable()
export class TodoServiceProvider {
  private data = [];

  /**
   * ensemble des listes de l'utilisateur courrant
   * @private
   * @type {AngularFirestoreCollection<TodoList>}
   * @memberof TodoServiceProvider
   */
  private todoListCollection: AngularFirestoreCollection<TodoList>;
  private todoLists: Observable<TodoList[]>;

  constructor(
    private firestoreCtrl: AngularFirestore,
    private authCtrl: AuthServiceProvider
  ) {
    this.todoLists = new Observable();
    this.updateDBLink();
  }

  private updateDBLink(): void {
    this.authCtrl.getConnexionSubject().subscribe((isConnected: boolean) => {
      if (isConnected) {
        this.authCtrl.getUserId().then((id: any) => {
          this.todoListCollection = this.firestoreCtrl.collection<TodoList>(
            'user/' + id + '/list'
          );
          this.todoLists = this.todoListCollection.valueChanges();
        });
      }
    });
  }

  /*******************************
   * gestions des listes de todo *
   *******************************/

  /**
   * récupère l'ensemble des listes de todo
   */
  public getList(): Observable<TodoList[]> {
    return this.todoLists;
  }

  public getAList(uuid: String): Observable<TodoList> {
    return Observable.of(this.data.find(d => d.uuid == uuid));
  }

  /**
   * permet de créer une liste
   * @param listName le nom de la liste à créer
   * @param icon un type de liste (associé à une icone ionic)
   * @returns l'uuid de la liste nouvellement créée
   */
  public addList(listName: string, icon: string): string {
    const newUuid = uuid();
    this.todoListCollection.doc(newUuid).set({
      uuid: newUuid,
      name: listName,
      items: [],
      icon: icon
    });
    return newUuid;
  }

  public deleteList(listUuid: string): void {
    const index = this.data.findIndex(value => value.uuid == listUuid);
    if (index != -1) {
      this.data.splice(index, 1);
    }
  }

  public updateAList(uuid: string, name: string, icon: string): void {
    const list = this.data.find(d => d.uuid == uuid);
    list.name = name;
    list.icon = icon;
  }

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
