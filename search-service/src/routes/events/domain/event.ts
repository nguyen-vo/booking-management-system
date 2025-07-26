import { Location } from './location';
import { Performer } from './performer';

export class Event {
  public eventId: string;
  public name: string;
  public date: Date;
  public description?: string;
  public type: string;
  public status: string;
  public ticketsAvailable: number;
  public location: Location;
  public performers: Array<Performer>;
  public isPopular?: boolean;
}
