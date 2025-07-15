export class EventResponseDto {
  eventId: string;
  name: string;
  date: Date;
  description?: string;
  type: string;
  status: string;
  ticketsAvailable: number;
  location: {
    locationId: string;
    name: string;
  };
  performers: {
    performerId: string;
    name: string;
  }[];
}

export class PaginatedEventResponseDto {
  events: EventResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
