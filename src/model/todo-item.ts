import { ILatLng } from '@ionic-native/google-maps';
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

  // emplacement du todo
  posCreated?: ILatLng;
  posCompleted?: ILatLng;
  address?: string;

  // image en base64 du todo
  picture?: string;

  // enregistrement audio
  mediaLocation?: string;

  // date de complétion
  complete?: boolean;
  dateCompleted?: string;
  deadline?: string;
}
