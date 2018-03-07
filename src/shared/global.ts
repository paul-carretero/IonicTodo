import { PageData } from './../model/page-data';
export class Global {
  //index des pages
  public static readonly HOMEPAGE = 0;
  public static readonly AUTHPAGE = 1;

  public static readonly PAGES_DATA = new Map<number, PageData>([
    [
      Global.HOMEPAGE,
      {
        title: 'Listes de Tâches',
        listenable: false,
        talkable: false,
        popoverMenu: null
      }
    ]
  ]);
}
