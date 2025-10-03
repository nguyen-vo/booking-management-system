import { Module } from '@nestjs/common';
import { EsFindAllEventRepository } from './repositories/es-find-all-event.repository';
import { SearchModule } from 'src/core/elasticsearch/elasticsearch.module';

@Module({
  imports: [SearchModule],
  providers: [EsFindAllEventRepository],
  exports: [EsFindAllEventRepository],
})
export class ElasticsearchEventModule {}
