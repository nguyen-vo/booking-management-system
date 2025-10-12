export interface EnqueueMessageBody {
  message: string;
  position: number;
  eventId: string;
  userId: string;
}
