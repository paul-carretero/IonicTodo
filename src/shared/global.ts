import { Settings } from './../model/settings';
import { PageData } from './../model/page-data';

/**
 * Contient des structure de données constante (ou semi constante)
 * pouvent être réutilisée par les composant de l'application
 *
 * @export
 * @class Global
 */
export class Global {
  /**
   * Index de la page d'accueil
   *
   * @readonly
   * @static
   * @type {number}
   * @memberof Global
   */
  public static readonly HOMEPAGE: number = 0;

  /**
   * Index de la page d'authentification
   * @readonly
   * @static
   * @type {number}
   * @memberof Global
   */
  public static readonly AUTHPAGE: number = 1;

  /**
   * Index de la page d'options
   *
   * @readonly
   * @static
   * @type {number}
   * @memberof Global
   */
  public static readonly OPTSPAGE: number = 2;

  /**
   * Identifie une liste de todo, pour deserialization
   *
   * @readonly
   * @static
   * @type {string}
   * @memberof Global
   */
  public static readonly TODO_LIST_MAGIC: string = '(╯°□°）╯︵ ┻━┻';

  /**
   * Identifie un lien vers une liste de todo pour désérialisation
   *
   * @readonly
   * @static
   * @type {string}
   * @memberof Global
   */
  public static readonly LIST_PATH_MAGIC: string = '┬─┬ノ( º _ ºノ)';

  /**
   * Page non éditable, non partageable et non validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly DEFAULT_PAGE_DATA: PageData = {
    title: 'Edit me!',
    shareable: false,
    editable: false,
    validable: false
  };

  /**
   * Page non éditable, non partageable et validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly VALIDABLE_PAGE_DATA: PageData = {
    title: 'Edit me',
    shareable: false,
    editable: false,
    validable: true
  };

  /**
   *  Page éditable, partageable et non validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly SHARE_EDIT_PAGE_DATA: PageData = {
    title: 'Edit me',
    shareable: true,
    editable: true,
    validable: false
  };

  /**
   * Page éditable, non partageable et non validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly ONLY_EDIT_PAGE_DATA: PageData = {
    title: 'Edit me',
    shareable: false,
    editable: true,
    validable: false
  };
}
