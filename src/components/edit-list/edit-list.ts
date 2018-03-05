import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  AlertController,
  LoadingController,
  NavController
} from 'ionic-angular';

import { TodoServiceProvider } from '../../providers/todo-service-ts/todo-service-ts';
import { GenericPage } from '../../shared/generic-page';

@Component({
  selector: 'edit-list',
  templateUrl: 'edit-list.html'
})
export class EditListComponent extends GenericPage implements OnInit {
  public newList: FormGroup;
  @Input() public listUUID: string;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private formBuilder: FormBuilder,
    private todoService: TodoServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl);
  }

  ngOnInit() {
    if (this.listUUID != null) {
      const todoList = this.todoService
        .getAList(this.listUUID)
        .subscribe(list => {
          console.log(this.listUUID);
          this.newList = this.formBuilder.group({
            name: [list.name, Validators.required],
            icon: [list.icon]
          });
        });
    } else {
      this.newList = this.formBuilder.group({
        name: ['', Validators.required],
        icon: ['checkmark']
      });
    }
  }

  get submitText(): string {
    if (this.listUUID == null) {
      return 'Créer une nouvelle liste';
    }
    return 'Mettre à jour cette liste';
  }

  public defList(): void {
    if (this.listUUID == null) {
      this.showLoading('Création de la liste...');
      this.todoService.addList(
        this.newList.value.name,
        this.newList.value.icon
      );
      this.alert(
        'Création',
        'Création de la liste ' +
          this.newList.value.name +
          ' effectuée avec succès!'
      );
    } else {
      this.showLoading('Mise à jour de la liste...');
      this.todoService.updateAList(
        this.listUUID,
        this.newList.value.name,
        this.newList.value.icon
      );
      this.alert(
        'Mise à jour',
        'Mise à jour de la liste ' +
          this.newList.value.name +
          ' effectuée avec succès!'
      );
    }
    this.loading.dismiss();
  }
}
