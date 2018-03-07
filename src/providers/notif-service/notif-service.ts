import { Injectable } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';
import { LocalNotifications } from '@ionic-native/local-notifications';

@Injectable()
export class NotifServiceProvider {
  constructor(
    private plt: Platform,
    private localNotifications: LocalNotifications,
    private alertCtrl: AlertController
  ) {
    this.plt.ready().then(readySource => {
      this.localNotifications.on('click', (notification, state) => {
        let json = JSON.parse(notification.data);
        let alert = alertCtrl.create({
          title: notification.title,
          subTitle: json.mydata
        });
        alert.present();
      });
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
