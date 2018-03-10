/**
 * Spécifie les index des paramètres
 *
 * @export
 * @enum {number}
 */
export enum Settings {
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
   * Délai avant la deadline pour lancer une notification
   */
  NOTIF_DELAY,

  /**
   * Synthétise automatiquement les alerts
   */
  AUTO_READ_ALERT
}
