/**
 * un objet permettant de savoir si :
 * une action à été reconnue,
 * si elle a réussi,
 * et dans le cas contraire, le message d'erreur associé
 *
 * @export
 * @interface ISpeechReqResult
 */
export interface ISpeechReqResult {
  /**
   * Si la phrase de l'utilsiateur à été reconnu
   *
   * @type {boolean}
   * @memberof ISpeechReqResult
   */
  reconnu?: boolean;

  /**
   * statu de la requête
   *
   * @type {boolean}
   * @memberof ISpeechReqResult
   */
  action_success: boolean;

  /**
   * message d'erreur optionnel
   *
   * @type {string}
   * @memberof ISpeechReqResult
   */
  message_error: string;
}
