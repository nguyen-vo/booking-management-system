import { PubSub } from '@google-cloud/pubsub';
import { MessageOptions } from '@google-cloud/pubsub/build/src/topic';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

@Injectable()
export class PubSubService {
  private readonly logger = new Logger(PubSubService.name);

  constructor(private readonly pubSubClient: PubSub) {}

  async publishMessage(topic: string, message: MessageOptions): Promise<void> {
    try {
      const messageId = await this.pubSubClient.topic(topic).publishMessage(message);
      this.logger.log(`Message ${messageId} published to topic ${topic}`);
    } catch (e) {
      const error = e as Error;
      this.logger.error(`Error publishing message to topic ${topic}: ${error.message}`);
      throw new InternalServerErrorException('Error publishing message to topic', { cause: error });
    }
  }
}
