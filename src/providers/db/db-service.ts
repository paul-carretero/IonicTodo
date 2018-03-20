import { ITodoItem } from './../../model/todo-item';
import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { Settings } from '../../model/settings';

/**
 *
 * @export
 * @class DBServiceProvider
 */
@Injectable()
export class DBServiceProvider {
  /**
   * barrière d'attente que la base de donnée soit initialisé
   *
   * @private
   * @type {Promise<void>}
   * @memberof DBServiceProvider
   */
  private readonly ready: Promise<void>;

  /**
   * Objet de la base de donnée SQLite
   *
   * @private
   * @type {SQLiteObject}
   * @memberof DBServiceProvider
   */
  private dbObject: SQLiteObject;

  /**
   * configuration sqlite pour le projet
   *
   * @private
   * @static
   * @memberof DBServiceProvider
   */
  private static readonly SQL_CONFIG = {
    name: 'setting.db',
    location: 'default'
  };

  /**************************************************************************/
  /****************************** CONSTRUCTOR *******************************/
  /**************************************************************************/

  /**
   * Creates an instance of DBServiceProvider.
   * @param {SQLite} sqlite
   * @memberof DBServiceProvider
   */
  constructor(private readonly sqlite: SQLite) {
    this.ready = new Promise<void>(resolve => {
      this.initDatabase().then(() => resolve());
    });
  }

  /**
   * Initialise la base de donnée et créé les tables (opération optionelle)
   *
   * @private
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  private async initDatabase(): Promise<void> {
    this.dbObject = await this.sqlite.create(DBServiceProvider.SQL_CONFIG);
    const sql_settings =
      'CREATE TABLE IF NOT EXISTS setting (id INTEGER PRIMARY KEY, value VARCHAR';
    const sql_notifs =
      'CREATE TABLE IF NOT EXISTS notif (todo_uuid VARCHAR PRIMARY KEY, notif_id INTEGER UNIQUE, notif_ts INTEGER, user_uuid VARCHAR ))';
    const sql_notifs_buffer =
      'CREATE TABLE IF NOT EXISTS notif_buffer (todo_uuid VARCHAR PRIMARY KEY)';
    const promises: Promise<any>[] = [];
    promises.push(this.dbObject.executeSql(sql_settings, {}));
    promises.push(this.dbObject.executeSql(sql_notifs, {}));
    promises.push(this.dbObject.executeSql(sql_notifs_buffer, {}));
    await Promise.all(promises);
  }

  /**************************************************************************/
  /*************************** SETTINGS INTERFACE ***************************/
  /**************************************************************************/

  /**
   * recherche et retourne un paramètre utilisateur
   *
   * @public
   * @param {Settings} name
   * @returns {Promise<boolean>}
   * @memberof DBServiceProvider
   */
  public async getSetting(name: Settings): Promise<boolean> {
    const sql = 'SELECT value FROM setting WHERE id = "' + name + '" ';
    await this.ready;
    const result = await this.dbObject.executeSql(sql, {});
    if (result.rows.length === 0) {
      return false;
    }
    return Boolean(result.rows.item(0).value);
  }

  /**
   * recherche et retourne un paramètre utilisateur en string
   *
   * @param {Settings} name
   * @returns {Promise<string>}
   * @memberof DBServiceProvider
   */
  public async getSettingStr(name: Settings): Promise<string> {
    const sql = 'SELECT value FROM setting WHERE id = "' + name + '" ';
    await this.ready;
    const result = await this.dbObject.executeSql(sql, {});
    if (result.rows.length === 0) {
      return '';
    }
    return String(result.rows.item(0).value);
  }

  /**
   * défini un paramètre utilisateur
   *
   * @public
   * @param {Settings} name
   * @param {*} value
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async setSetting(name: Settings, value: boolean | string): Promise<void> {
    value = String(value);
    const sql_insert = 'INSERT OR IGNORE INTO setting VALUES ( ' + name + ' , "" )';
    const sql_update = 'UPDATE setting SET value = "' + value + '" WHERE id = ' + name + '';
    await this.ready;
    await this.dbObject.executeSql(sql_insert, {});
    await this.dbObject.executeSql(sql_update, {});
  }

  /**
   * supprime tous les paramètres utilisateur
   *
   * @public
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async resetSettings(): Promise<void> {
    const sql_drop = 'DELETE FROM setting';
    await this.ready;
    await this.dbObject.executeSql(sql_drop, {});
  }

  /**************************************************************************/
  /************************* NOTIFICATIONS INTERFACE ************************/
  /**************************************************************************/

  /**
   * vide la table buffer pour les notifications
   *
   * @public
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async resetNotifBuffer(): Promise<void> {
    const sql_drop = 'DELETE FROM notif_buffer';
    await this.ready;
    await this.dbObject.executeSql(sql_drop, {});
  }

  /**
   * vide la table buffer pour les notifications
   *
   * @public
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async resetNotif(): Promise<void> {
    const sql_drop = 'DELETE FROM notif';
    await this.ready;
    await this.dbObject.executeSql(sql_drop, {});
  }

  /**
   * rempli le buffer des notification avec les id d'une snapshot des todos disponible pour un utilisateur
   *
   * @public
   * @param {ITodoItem[]} todos
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async fillNotifBuffer(todos: ITodoItem[]): Promise<void> {
    await this.ready;
    await this.resetNotifBuffer();
    const promises: Promise<any>[] = [];
    for (const todo of todos) {
      if (todo != null && todo.uuid != null) {
        const sql_insert = 'INSERT OR IGNORE INTO notif_buffer VALUES ( ' + todo.uuid + ' )';
        promises.push(this.dbObject.executeSql(sql_insert, {}));
      }
    }
    await Promise.all(promises);
  }

  /**
   * permet d'ajouter un enregistrement pour une notification
   *
   * @param {string} todo_uuid
   * @param {number} notif_id
   * @param {number} when
   * @param {string} [user_uuid]
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async addNewNotif(
    todo_uuid: string,
    notif_id: number,
    notif_ts: number,
    user_uuid?: string
  ): Promise<void> {
    await this.ready;
    let sql =
      'INSERT OR IGNORE INTO notif VALUES ( "' +
      todo_uuid +
      '", "' +
      notif_id +
      '", "' +
      notif_ts +
      '" )';
    if (user_uuid != null) {
      sql =
        'INSERT OR IGNORE INTO notif VALUES ( "' +
        todo_uuid +
        '", "' +
        notif_id +
        '", "' +
        notif_ts +
        '", "' +
        user_uuid +
        '" )';
    }
    await this.dbObject.executeSql(sql, {});
  }

  /**
   * Supprime toutes les notifications du passé
   *
   * @public
   * @param {number} now
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async deleteOutdatedNotif(now: number): Promise<void> {
    await this.ready;
    const sql_delete = 'DELETE FROM notif WHERE notif_ts < ' + now + '';
    await this.dbObject.executeSql(sql_delete, {});
  }

  /**
   * retouve l'ensemble des id des notifications prévu pour un todo pour cette machine
   *
   * @public
   * @param {string} todo_uuid
   * @returns {Promise<number[]>}
   * @memberof DBServiceProvider
   */
  public async getAndDeleteNotificationId(todo_uuid: string): Promise<number | null> {
    const sql = 'SELECT notif_id FROM notif WHERE todo_uuid = "' + todo_uuid + '" ';
    let res: number | null = null;
    await this.ready;
    const result = await this.dbObject.executeSql(sql, {});
    if (result.rows.length > 0) {
      res = Number(result.rows.item(0).notif_id);
    }
    const sql_del = "DELETE FROM notif WHERE todo_uuid = '" + todo_uuid + "' ";
    await this.dbObject.executeSql(sql_del, {});
    return res;
  }

  /**
   * recherche et retourne l'identifiant inutilisé suivant pour une notification
   *
   * @public
   * @returns {Promise<number>}
   * @memberof DBServiceProvider
   */
  public async getNextNotifId(): Promise<number> {
    const sql = 'SELECT MAX(notif_id) as res FROM notif';
    const result = await this.dbObject.executeSql(sql, {});
    if (result.rows.length === 0) {
      return 1;
    }
    return Number(result.rows.item(0).res) + 1;
  }

  /**
   * recherche et retourne l'ensemble des id de notification dont le todo n'appartient pas aux todo du buffer
   * et dont l'identifiant de l'utilsiateur est null ou identique à celui renseigné.
   *
   * Une fois trouvée, les référence sont supprimées
   *
   * @public
   * @param {(string | null)} user_uuid
   * @returns {Promise<number[]>}
   * @memberof DBServiceProvider
   */
  public async getAndDeleteNotFoundNotif(user_uuid: string | null): Promise<number[]> {
    const match: number[] = [];
    await this.ready;
    let sql =
      'SELECT notif_id FROM notif WHERE todo_uuid NOT IN (SELECT todo_uuid FROM notif_buffer) AND user_uuid IS NULL';
    if (user_uuid != null) {
      sql =
        "SELECT notif_id FROM notif WHERE todo_uuid NOT IN (SELECT todo_uuid FROM notif_buffer) AND (user_uuid IS NULL OR user_uuid = '" +
        user_uuid +
        "' ";
    }
    const result = await this.dbObject.executeSql(sql, {});
    for (let i = 0; i < result.rows.length; i++) {
      const n: number = result.rows.item(i).notif_id;
      if (n != null) {
        match.push(n);
      }
    }

    sql =
      'DELETE FROM notif WHERE todo_uuid NOT IN (SELECT todo_uuid FROM notif_buffer) AND user_uuid IS NULL';
    if (user_uuid != null) {
      sql =
        "DELETE FROM notif WHERE todo_uuid NOT IN (SELECT todo_uuid FROM notif_buffer) AND (user_uuid IS NULL OR user_uuid = '" +
        user_uuid +
        "' ";
    }
    await this.dbObject.executeSql(sql, {});

    return match;
  }

  /**
   * Supprime toutes les entrée de notifications associées à un todo
   *
   * @param {string} todo_uuid
   * @returns {Promise<void>}
   * @memberof DBServiceProvider
   */
  public async deleteNotifFromTodo(todo_uuid: string): Promise<void> {
    await this.ready;
    const sql = "DELETE FROM notif WHERE todo_uuid = '" + todo_uuid + "' ";
    await this.dbObject.executeSql(sql, {});
  }
}
