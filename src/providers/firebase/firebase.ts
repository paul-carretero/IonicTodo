import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the FirebaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class FirebaseProvider {
  private readonly config = {
    apiKey: 'AIzaSyCBksGncfjCX3Yo4dDd3vQgoEZOef2fv8I',
    authDomain: 'todolist-carretep.firebaseapp.com',
    databaseURL: 'https://todolist-carretep.firebaseio.com',
    projectId: 'todolist-carretep',
    storageBucket: 'todolist-carretep.appspot.com',
    messagingSenderId: '1054325728864'
  };

  constructor() {
    console.log('Hello FirebaseProvider Provider');
  }
}
