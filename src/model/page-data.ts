/**
 * Représente les spécificité d'une page.
 * Notament utilisé pour affiché un header correct
 *
 * @export
 * @interface IPageData
 */
export interface IPageData {
  title: string;
  validable: boolean;
  editable: boolean;
  shareable: boolean;
  importable: boolean;
  searchable: boolean;
  subtitle: string;
  searchPlaceholders: string;
  copiable: boolean;
  pastable: boolean;
}
