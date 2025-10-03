import { Injectable } from '@nestjs/common';
import { ElasticsearchService as client } from '@nestjs/elasticsearch';

@Injectable()
export class ElasticsearchService {
  constructor(private readonly elasticsearchService: client) {}

  get client() {
    return this.elasticsearchService;
  }
}
