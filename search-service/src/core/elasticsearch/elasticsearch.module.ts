import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchConfigService } from './elasticsearch.config.service';
import { ElasticsearchService } from './elasticsearch.service';
@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useClass: ElasticsearchConfigService,
    }),
  ],
  controllers: [],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class SearchModule {}
