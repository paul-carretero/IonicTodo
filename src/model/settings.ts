/**
 * Spécifie les index des paramètres
 *
 * @export
 * @enum {number}
 */
export enum Settings {
  /**
   * Active la possibilité de ShakeToShare (agité le téléphone pour partager
   * une liste avec d'autre téléhone également agité au même moment)
   */
  ENABLE_STS,

  /**
   * Import automatique des listes par NFC ou sur le cloud
   */
  AUTO_IMPORT,

  /**
   * Connexion Automatique
   */
  AUTO_LOG_IN,

  /**
   * Mode hors ligne désactivé
   */
  DISABLE_OFFLINE,

  /**
   * envoi de sms désactivé
   */
  DISABLE_SMS,

  /**
   * Notifications machine désactivées
   */
  DISABLE_NOTIF,

  /**
   * Synthétise automatiquement les alerts
   */
  AUTO_READ_ALERT,

  /**
   * Dernier email renseigné pour une connexion firebase standard
   */
  LAST_FIRE_EMAIL_LOGIN,

  /**
   * demande confiramtion avant de supprimer une liste ou un todo
   */
  ENABLE_UNSURE_MODE
}
