import { Global } from './../../shared/global';
import { EventServiceProvider } from './../../providers/event/event-service';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  AlertController,
  LoadingController
} from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';
import { TodoListPage } from '../todo-list/todo-list';

@IonicPage()
@Component({
  selector: 'page-list-edit',
  templateUrl: 'list-edit.html'
})
export class ListEditPage extends GenericPage {
  public newList: FormGroup;
  public listUUID: string;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public evtCtrl: EventServiceProvider,
    private formBuilder: FormBuilder,
    private todoService: TodoServiceProvider,
    private navParams: NavParams
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl);
    this.listUUID = navParams.get('uuid');
    this.newList = this.formBuilder.group({
      name: ['', Validators.required],
      icon: ['checkmark']
    });
  }

  ionViewDidEnter() {
    const header = Global.VALIDABLE_PAGE_DATA;

    if (this.listUUID != null) {
      const todoList = this.todoService
        .getAList(this.listUUID)
        .subscribe(list => {
          header.title = 'Editer "' + list.name + '" ';
          this.evtCtrl.getHeadeSubject().next(header);
          this.newList = this.formBuilder.group({
            name: [list.name, Validators.required],
            icon: [list.icon]
          });
        });
    } else {
      header.title = 'Nouvelle Liste';
      this.evtCtrl.getHeadeSubject().next(header);
    }
  }

  get submitText(): string {
    if (this.listUUID == null) {
      return 'Créer une nouvelle liste';
    }
    return 'Mettre à jour cette liste';
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public async defList(): Promise<void> {
    let nextUuid = this.listUUID;
    if (this.listUUID == null) {
      this.showLoading('Création de la liste...');
      nextUuid = await this.todoService.addList(
        this.newList.value.name,
        this.newList.value.icon
      );
    } else {
      this.showLoading('Mise à jour de la liste...');
      this.todoService.updateList(
        this.listUUID,
        this.newList.value.name,
        this.newList.value.icon
      );
    }
    this.loading.dismiss();
    this.selectTodoList(nextUuid);
  }

  public selectTodoList(uuid: string): void {
    this.navCtrl.push(TodoListPage, { uuid: uuid });
  }
}
