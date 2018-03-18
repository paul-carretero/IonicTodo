import { Injectable } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';
import { LocalNotifications } from '@ionic-native/local-notifications';

@Injectable()
export class NotifServiceProvider {
  constructor(
    private readonly plt: Platform,
    private readonly localNotifications: LocalNotifications,
    private readonly alertCtrl: AlertController
  ) {
    this.plt.ready().then(readySource => {
      this.localNotifications.on('click', (notification: any, state: any) => {
        const json = JSON.parse(notification.data);
        const alert = this.alertCtrl.create({
          title: notification.title,
          subTitle: json.mydata
        });
        alert.present();
        console.log('state = ' + state);
      });
      console.log('ready = ' + readySource);
    });
  }

  public scheduleNotification() {
    this.localNotifications.schedule({
      id: 1,
      title: 'Attention',
      text: 'Simons Notification',
      data: { mydata: 'My hidden message this is' },
      at: new Date(new Date().getTime() + 5 * 1000)
    });
  }
}
