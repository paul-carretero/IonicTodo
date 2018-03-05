import { Geoposition } from '@ionic-native/geolocation';

export interface TodoList {
  uuid: string;
  name: string;
  items: TodoItem[];
  icon?: string;
}

export interface TodoItem {
  // désignation
  uuid?: string;
  name: string;
  desc?: string;
  userName?: string;

  // permet de gérer l'envoi de sms de rappel contenant la description par exemple
  notif?: boolean;
  sendSMS?: boolean;
  SMSNumber?: string;

  // emplacement ou le todo a été créé
  posCreated?: Geoposition;
  posCompleted?: Geoposition;

  // image en base64 du todo
  picture?: string;

  // enregistrement audio
  mediaLocation?: string;

  // date de complétion
  complete?: boolean;
  dateCompleted?: string;
  deadline?: string;
}
