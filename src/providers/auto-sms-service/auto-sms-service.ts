import { EventServiceProvider } from './../event/event-service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { IMachine } from './../../model/machine';
import { AuthServiceProvider } from './../auth-service/auth-service';
import { IPlanifiedSms } from './../../model/planified-sms';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Injectable } from '@angular/core';

import { ContactServiceProvider } from './../contact-service/contact-service';
import { BackgroundMode } from '@ionic-native/background-mode';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs/Observable';

/**
 * fourni des service pour planifier l'envoie de sms
 *
 * @export
 * @class AutoSmsServiceProvider
 */
@Injectable()
export class AutoSmsServiceProvider {
  /**
   * tableau des sms planifiés
   *
   * @private
   * @type {IPlanifiedSms[]}
   * @memberof AutoSmsServiceProvider
   */
  private planifiedSmsList: IPlanifiedSms[];

  /**
   * map associant un uuid de sms planifié à son timer js
   *
   * @private
   * @type {Map<string, Timer>}
   * @memberof AutoSmsServiceProvider
   */
  private readonly smsTimers: Map<string, NodeJS.Timer>;

  /**
   * sujet des sms plannifiés
   *
   * @private
   * @type {BehaviorSubject<IPlanifiedSms[]>}
   * @memberof AutoSmsServiceProvider
   */
  private readonly planSmsSubject: BehaviorSubject<IPlanifiedSms[]>;

  /**
   * document firestore contenant la liste des sms plannifiés
   *
   * @private
   * @type {AngularFirestoreDocument<IMachine>}
   * @memberof AutoSmsServiceProvider
   */
  private angularFireDoc: AngularFirestoreDocument<IMachine>;

  /**
   * si l'application est en background alors le status du net est désactivé,
   * on créé un timer qui re-forcera la revérification lors de la connexion
   * (le timer sera freeze entre temps)
   *
   * @private
   * @type {NodeJS.Timer}
   * @memberof AutoSmsServiceProvider
   */
  private netStatusForceRefreshTimer: NodeJS.Timer;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of AutoSmsServiceProvider.
   * @param {ContactServiceProvider} contactCtrl
   * @param {AngularFirestore} fireCtrl
   * @memberof AutoSmsServiceProvider
   */
  constructor(
    private readonly contactCtrl: ContactServiceProvider,
    private readonly fireCtrl: AngularFirestore,
    private readonly authCtrl: AuthServiceProvider,
    private readonly backgroundCtrl: BackgroundMode,
    private readonly evtCtrl: EventServiceProvider
  ) {
    this.planifiedSmsList = [];
    this.smsTimers = new Map<string, any>();
    this.planSmsSubject = new BehaviorSubject<IPlanifiedSms[]>([]);
  }

  /**
   * au démarrage, récupère l'état de si on avait des sms à envoyer.
   * Ne récupère que ceux dont la date d'envoie est dans le future
   *
   * @returns {Promise<void>}
   * @memberof AutoSmsServiceProvider
   */
  public async restoreState(): Promise<void> {
    const machineId: string = await this.authCtrl.getMachineId();
    this.angularFireDoc = this.fireCtrl.doc<IMachine>('machine/' + machineId);
    const snap = await this.angularFireDoc.ref.get();

    if (snap == null || snap.data() == null || snap.data().planifiedSmsList == null) {
      this.planifiedSmsList = [];
      this.updateDoc();
    } else {
      this.planifiedSmsList = snap.data().planifiedSmsList;
    }

    const nowTs: number = new Date().getTime();
    this.smsTimers.clear();
    this.planifiedSmsList = this.planifiedSmsList.filter(e => e.date.getTime() > nowTs);

    for (const item of this.planifiedSmsList) {
      const delay = Math.max(item.date.getTime() - nowTs, 0);
      const to = setTimeout(() => {
        this.smsSendHandler(item);
      }, delay);
      this.smsTimers.set(item.smsUuid, to);
    }

    this.planSmsSubject.next(this.planifiedSmsList);
    this.updateDoc();

    this.setBackgroundStatus();
  }

  /**************************************************************************/
  /**************************** METHODES PUBLIQUE ***************************/
  /**************************************************************************/

  /**
   * assigne un uuid au sms à envoyer, créé son timer, ajoute son timer dans la map des timer,
   * ajoute le sms à envoyer dans le tableau des sms à envoyer
   *
   * @param {IPlanifiedSms} toPlan
   * @memberof AutoSmsServiceProvider
   */
  public addPlanifiedSms(toPlan: IPlanifiedSms): void {
    toPlan.smsUuid = uuid();

    this.planifiedSmsList.push(toPlan);
    const nowTs: number = new Date().getTime();
    const delay = Math.max(toPlan.date.getTime() - nowTs, 0);

    const to = setTimeout(() => {
      this.smsSendHandler(toPlan);
    }, delay);
    this.smsTimers.set(toPlan.smsUuid, to);

    this.planSmsSubject.next(this.planifiedSmsList);
    this.updateDoc();
    this.setBackgroundStatus();
  }

  /**
   * supprime une entrée de sms a envoyer
   *
   * @param {IPlanifiedSms} plannedSms
   * @memberof AutoSmsServiceProvider
   */
  public rmPlanifiedSms(plannedSms: IPlanifiedSms): void {
    const timer = this.smsTimers.get(plannedSms.smsUuid);
    if (timer != null) {
      clearTimeout(timer);
    }
    this.smsTimers.delete(plannedSms.smsUuid);

    const toDelete = this.planifiedSmsList.findIndex(s => s.smsUuid === plannedSms.smsUuid);
    if (toDelete !== -1) {
      this.planifiedSmsList.splice(toDelete, 1);
    }

    this.updateDoc();
    this.setBackgroundStatus();
  }

  /**
   * retourne l'observable du tableau des sms plannifiés
   *
   * @returns {Observable<IPlanifiedSms[]>}
   * @memberof AutoSmsServiceProvider
   */
  public getPlanifiedSmsObs(): Observable<IPlanifiedSms[]> {
    return this.planSmsSubject.asObservable();
  }

  /**************************************************************************/
  /*********************** METHODES PRIVATES/INTERNES ***********************/
  /**************************************************************************/

  /**
   * supprime le timer associé, supprime l'entrée du tableau des sms à envoyer,
   * envoie le sms à tout les destinataires, et met à jour le document firestore
   *
   * @private
   * @param {IPlanifiedSms} plannedSms
   * @memberof AutoSmsServiceProvider
   */
  private smsSendHandler(plannedSms: IPlanifiedSms) {
    for (const contact of plannedSms.contacts) {
      this.contactCtrl.sendSMS(contact, plannedSms.message, false);
    }

    this.rmPlanifiedSms(plannedSms);
  }

  /**
   * si il y a des sms en attente, active le mode background
   *
   * @private
   * @memberof AutoSmsServiceProvider
   */
  private setBackgroundStatus(): void {
    clearTimeout(this.netStatusForceRefreshTimer);

    if (this.planifiedSmsList.length > 0 && !this.backgroundCtrl.isEnabled()) {
      this.backgroundCtrl.enable();
    } else if (this.planifiedSmsList.length === 0 && this.backgroundCtrl.isEnabled()) {
      if (this.backgroundCtrl.isActive()) {
        this.netStatusForceRefreshTimer = setTimeout(() => {
          this.evtCtrl.forceRefreshNetwork();
        }, 5000);
      }

      this.backgroundCtrl.disable();
    }
  }

  /**
   * met à jour le document firestore pour persistence
   *
   * @private
   * @memberof AutoSmsServiceProvider
   */
  private updateDoc(): void {
    if (this.angularFireDoc != null) {
      this.angularFireDoc.set({ planifiedSmsList: this.planifiedSmsList });
    }
  }
}
