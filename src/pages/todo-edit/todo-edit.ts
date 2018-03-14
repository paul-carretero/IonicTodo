import { EventServiceProvider } from './../../providers/event/event-service';
import { MapServiceProvider } from './../../providers/map-service/map-service';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  AlertController,
  IonicPage,
  LoadingController,
  NavController,
  ToastController
} from 'ionic-angular';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions
} from '@ionic-native/google-maps';
import { Subscription } from 'rxjs';

import { GenericPage } from '../../shared/generic-page';
import { ITodoItem } from './../../model/todo-item';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';
import { IMenuRequest } from '../../model/menu-request';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';

@IonicPage()
@Component({
  selector: 'page-todo-edit',
  templateUrl: 'todo-edit.html'
})
export class TodoEditPage extends GenericPage {
  private readonly todoUUID: string;
  private readonly listUUID: string;
  private todoSub: Subscription;
  private map: GoogleMap;

  public todo: ITodoItem;
  public todoForm: FormGroup;

  constructor(
    public readonly navCtrl: NavController,
    public readonly alertCtrl: AlertController,
    public readonly loadingCtrl: LoadingController,
    public readonly evtCtrl: EventServiceProvider,
    public readonly ttsCtrl: SpeechSynthServiceProvider,
    public readonly toastCtrl: ToastController,
    public readonly authCtrl: AuthServiceProvider,
    private readonly todoService: TodoServiceProvider,
    private readonly formBuilder: FormBuilder,
    private readonly MapService: MapServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl, evtCtrl, ttsCtrl, toastCtrl, authCtrl);
    //this.todoUUID = navParams.get('todoUUID');
    //this.listUUID = navParams.get('listUUID');
    this.todo = { name: '', complete: false, desc: '', uuid: this.todoUUID };
    this.todoForm = this.formBuilder.group({});
    this.MapService.lol();
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  ionViewDidEnter(): void {
    this.loadMap();
    if (this.todoUUID != null) {
      this.todoSub = this.todoService
        .getTodo(this.listUUID, this.todoUUID)
        .subscribe(data => {
          this.initForm(data);
          this.todo = data;
        });
    }
  }

  ionViewWillLeave(): void {
    this.todoSub.unsubscribe();
  }

  public menuEventHandler(req: IMenuRequest): void {
    switch (req) {
    }
  }

  get isInCreation(): boolean {
    return this.todoUUID == null;
  }

  get submitText(): string {
    if (this.listUUID == null) {
      return 'Créer une nouvelle tâche';
    }
    return 'Mettre à jour cette tâche';
  }

  private initForm(todo: ITodoItem): void {
    this.todoForm = this.formBuilder.group({
      name: [todo.name, Validators.required],
      desc: [todo.desc],
      notif: [todo.notif, Validators.required],
      sendSMS: [todo.sendSMS, Validators.required],
      SMSNumber: [todo.name],
      complete: [todo.name, Validators.required],
      deadline: [todo.deadline]
    });
  }

  public generateDescription(): string {
    throw new Error('Method not implemented.');
  }

  public validate(): void {
    if (this.todoUUID != null) {
      this.todoService.editTodo(this.listUUID, this.todo);
    } else {
      this.todoService.addTodo(this.listUUID, this.todo);
    }
    this.navCtrl.pop();
  }

  private loadMap() {
    const mapOptions: GoogleMapOptions = {
      camera: {
        target: {
          lat: 43.0741904,
          lng: -89.3809802
        },
        zoom: 18,
        tilt: 30
      }
    };
    this.map = GoogleMaps.create('mapwrapper', mapOptions);
    // Wait the MAP_READY before using any methods.
    this.map
      .one(GoogleMapsEvent.MAP_READY)
      .then(() => {
        // Now you can use all methods safely.
        this.map
          .addMarker({
            title: 'Ionic',
            icon: 'blue',
            animation: 'DROP',
            position: {
              lat: 43.0741904,
              lng: -89.3809802
            }
          })
          .then(marker => {
            marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
              alert('clicked');
            });
          })
          .catch(() => {});
      })
      .catch(() => {});
  }

  public loginAuthRequired(): boolean {
    return false;
  }

  public basicAuthRequired(): boolean {
    return true;
  }
}
