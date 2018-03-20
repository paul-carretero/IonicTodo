import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MenuController, PopoverController, Searchbar } from 'ionic-angular';

import { MenuRequestType } from '../../model/menu-request-type';
import { EventServiceProvider } from '../../providers/event/event-service';
import { IPageData } from './../../model/page-data';
import { SpeechRecServiceProvider } from '../../providers/speech-rec-service/speech-rec-service';

/**
 * Composant angular gérant le menu haut de l'application et les différentes actions communes associés
 * Les communications sont géré par Publish-Subscribe
 *
 * @export
 * @class HeaderComponent
 * @implements {OnInit}
 * @implements {OnDestroy}
 */
@Component({
  selector: 'HeaderComponent',
  templateUrl: 'header.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  /***************************** PUBLIC FIELDS ******************************/

  /**
   * donnée d'affichage du header courrante
   *
   * @type {IPageData}
   * @memberof HeaderComponent
   */
  public data: IPageData;

  /**
   * true si l'on doit afficher la barre de recherche, false si l'on affiche les options et le sous titre
   *
   * @type {boolean}
   * @memberof HeaderComponent
   */
  public displaySearchBar: boolean = false;

  /**************************** PRIVATE FIELDS ******************************/

  /**
   * la barre de recherche, null si elle n'est pas affiché
   *
   * @type {Searchbar}
   * @memberof HeaderComponent
   */
  @ViewChild(Searchbar) searchbar: Searchbar;

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of HeaderComponent.
   * @param {PopoverController} popoverCtrl
   * @param {MenuController} menuCtrl
   * @param {EventServiceProvider} evtCtrl
   * @memberof HeaderComponent
   */
  constructor(
    private readonly popoverCtrl: PopoverController,
    private readonly menuCtrl: MenuController,
    private readonly evtCtrl: EventServiceProvider,
    private readonly sprec : SpeechRecServiceProvider
  ) {
    this.data = this.evtCtrl.getHeader();
  }

  /**************************************************************************/
  /**************************** LIFECYCLE EVENTS ****************************/
  /**************************************************************************/

  /**
   *
   * @memberof HeaderComponent
   */
  ngOnDestroy(): void {}

  /**
   * initialise la subscription au flux de mise à jour du header
   *
   * @memberof HeaderComponent
   */
  ngOnInit(): void {
    // car  [ '' == false ]     (╯°□°）╯︵ ┻━┻
    console.log("init de header");
    this.evtCtrl.getSearchSubject().next('#');
    this.sprec;
  }

  /**************************************************************************/
  /*********************** METHODES PUBLIQUE/TEMPLATE ***********************/
  /**************************************************************************/

  /**
   * Affiche le menu général à gauche
   *
   * @memberof HeaderComponent
   */
  public openMenu(): void {
    this.menuCtrl.enable(true, 'menu-left');
    this.menuCtrl.open('menu-left');
  }

  /**
   * Présente le menu contextuel de droite
   * note: event est nécessaire à l'affichage la ou le boutton est sinon c'est au milieu...
   *
   * @memberof HeaderComponent
   */
  public presentPopover(myEvent: any): void {
    const popover = this.popoverCtrl.create('PopoverOptionsPage');
    popover.present({
      ev: myEvent
    });
  }

  /**
   * Envois une notification que le bouton de validation à été activé
   *
   * @memberof HeaderComponent
   */
  public valid(): void {
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.VALIDATE });
  }

  /**
   * Envois une notification que le bouton de démarrage de la reconnaissance vocale à été activé
   *
   * @memberof HeaderComponent
   */
  public startSpeechRec() {
    console.log("envoit evt speech rec");
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.SPEECH_REC });
  }

  /**
   * Envois une notification que le bouton de synthèse vocale à été activé
   *
   * @memberof HeaderComponent
   */
  public startTTS() {
    this.evtCtrl.getMenuRequestSubject().next({ request: MenuRequestType.SPEECH_SYNTH });
  }

  /**
   * initialise la bar de recherche et met le focus clavier dessus
   *
   * @memberof HeaderComponent
   */
  public searchInit(): void {
    this.displaySearchBar = true;
    setTimeout(() => {
      this.searchbar.setFocus();
    }, 100);
  }

  /**
   * annule la recherche et retire la barre de recherche
   *
   * @memberof HeaderComponent
   */
  public cancelSearch(): void {
    this.displaySearchBar = false;
    this.evtCtrl.getSearchSubject().next('#');
  }

  /**
   * envoie une recherche utilisateur
   *
   * @param {any} event
   * @memberof HeaderComponent
   */
  public search(event: any): void {
    if (event.target.value === '' || event.target.value == null) {
      this.evtCtrl.getSearchSubject().next('#');
    } else {
      this.evtCtrl.getSearchSubject().next(event.target.value.toUpperCase());
    }
  }
}
