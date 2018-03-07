import { MapServiceProvider } from './../../providers/map-service/map-service';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  AlertController,
  IonicPage,
  LoadingController,
  NavController,
  NavParams
} from 'ionic-angular';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker
} from '@ionic-native/google-maps';
import { Subscription } from 'rxjs';

import { GenericPage } from '../../shared/generic-page';
import { TodoItem } from './../../model/model';
import { TodoServiceProvider } from './../../providers/todo-service-ts/todo-service-ts';
import { SpeechSynthServiceProvider } from '../../providers/speech-synth-service/speech-synth-service';

@IonicPage()
@Component({
  selector: 'page-todo-edit',
  templateUrl: 'todo-edit.html'
})
export class TodoEditPage extends GenericPage {
  private todoUUID: string;
  private listUUID: string;
  private todoSub: Subscription;
  private map: GoogleMap;

  public todo: TodoItem;
  public todoForm: FormGroup;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private navParams: NavParams,
    private todoService: TodoServiceProvider,
    private formBuilder: FormBuilder,
    private MapService: MapServiceProvider,
    private synthService: SpeechSynthServiceProvider
  ) {
    super(navCtrl, alertCtrl, loadingCtrl);
    this.todoUUID = navParams.get('todoUUID');
    this.listUUID = navParams.get('listUUID');
    this.todo = { name: '', complete: false, desc: '', uuid: this.todoUUID };
    this.todoForm = this.formBuilder.group({});
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

  private initForm(todo: TodoItem): void {
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

  ionViewWillEnter(): void {
    this.loadMap();
    if (this.todoUUID != null) {
      this.todoSub = this.todoService
        .getTodo(this.listUUID, this.todoUUID)
        .subscribe(data => {
          this.initForm(data);
          this.todo = data;
        });
    }
    this.synthService.synthText('Banana');
    this.synthService.synthText('For');
    this.synthService.synthText('Scale');
  }

  ionViewDidLeave(): void {
    if (this.todoSub != null) {
      this.todoSub.unsubscribe();
    }
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
    let mapOptions: GoogleMapOptions = {
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
    console.log('map?');
    // Wait the MAP_READY before using any methods.
    this.map
      .one(GoogleMapsEvent.MAP_READY)
      .then(() => {
        console.log('Map is ready!');

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
          .catch(err => {});
      })
      .catch(err => {});
  }
}
