import { Media } from './media';
import { MenuRequestType } from './menu-request-type';

export interface IMenuRequest {
  request: MenuRequestType;
  media?: Media;
}
