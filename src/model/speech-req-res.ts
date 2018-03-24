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
