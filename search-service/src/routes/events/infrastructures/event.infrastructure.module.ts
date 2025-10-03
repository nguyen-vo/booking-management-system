import { Module } from '@nestjs/common';
import { OrmEventModule } from './orm/orm.modules';
import { FindAllEventRepositoryFactory } from './factories/find-all-event-repository.factory';
import { FindAllEventRepository } from '../application/ports/find-all-events.repository';
import { ElasticsearchEventModule } from './elasticsearch/elasticsearch.module';

@Module({
  imports: [OrmEventModule, ElasticsearchEventModule],
  providers: [
    FindAllEventRepositoryFactory,
    {
      provide: FindAllEventRepository,
      useFactory: (factory: FindAllEventRepositoryFactory) => factory.getRepository(),
      inject: [FindAllEventRepositoryFactory],
    },
  ],
  exports: [OrmEventModule, ElasticsearchEventModule, FindAllEventRepository, FindAllEventRepositoryFactory],
})
export class EventInfrastructureModule {}
