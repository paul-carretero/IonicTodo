import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { Settings } from '../../model/settings';

/**
 *
 * @deprecated
 * @export
 * @class SettingServiceProvider
 */
@Injectable()
export class SettingServiceProvider {
  private readonly ready: Promise<void>;
  private dbObject: Promise<SQLiteObject>;

  private static readonly SQL_CONFIG = {
    name: 'setting.db',
    location: 'default'
  };

  constructor(private readonly sqlite: SQLite) {
    this.ready = new Promise<void>(resolve => {
      this.initDatabase().then(() => resolve());
    });
  }

  public async getSetting(name: Settings): Promise<string> {
    const sql = 'SELECT value FROM setting WHERE id = "' + name + '" ';

    await this.ready;
    const db = await this.dbObject;
    const result = await db.executeSql(sql, {});
    if (result.rows.length === 0) {
      return '';
    }
    return String(result.rows.item(0).value);
  }

  public async setSetting(name: Settings, value: any): Promise<void> {
    const sql_insert = 'INSERT OR IGNORE INTO setting VALUES ( ' + name + ' , "" )';
    const sql_update =
      'UPDATE setting SET value = "' + value + '" WHERE id = ' + name + '';

    await this.ready;
    const db = await this.dbObject;
    await db.executeSql(sql_insert, {});
    await db.executeSql(sql_update, {});
  }

  public async reset(): Promise<void> {
    const sql_drop = 'DELETE FROM setting';
    await this.ready;
    const db = await this.dbObject;
    await db.executeSql(sql_drop, {});
  }

  private async initDatabase(): Promise<void> {
    this.dbObject = this.sqlite.create(SettingServiceProvider.SQL_CONFIG);
    const db = await this.dbObject;
    const sql =
      'CREATE TABLE IF NOT EXISTS setting (id INT PRIMARY KEY, value VARCHAR(255))';
    await db.executeSql(sql, {});
  }
}
