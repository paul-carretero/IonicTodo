import { PageData } from './../model/page-data';
export class Global {
  //index des pages
  public static readonly HOMEPAGE = 0;
  public static readonly AUTHPAGE = 1;
  public static readonly OPTSPAGE = 2;

  public static readonly DEFAULT_PAGE_DATA = {
    title: 'Edit me!',
    helpOnly: false,
    validable: false
  };

  public static readonly VALIDABLE_PAGE_DATA = {
    title: 'Edit me',
    helpOnly: true,
    validable: true
  };

  public static readonly NO_MENU_PAGE_DATA = {
    title: 'Edit me',
    helpOnly: true,
    validable: false
  };
}
