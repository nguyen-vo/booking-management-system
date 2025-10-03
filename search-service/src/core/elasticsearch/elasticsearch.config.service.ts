import { ApiKeyAuth } from '@elastic/elasticsearch';
import { ElasticsearchModuleOptions, ElasticsearchOptionsFactory } from '@nestjs/elasticsearch';
import {} from '@nestjs/elasticsearch/dist/interfaces/index';
import { ConnectionOptions } from 'node:tls';
export class ElasticsearchConfigService implements ElasticsearchOptionsFactory {
  createElasticsearchOptions(): ElasticsearchModuleOptions {
    return {
      node: this._getNode(),
      auth: this._getAuth(),
      tls: this._tlsOptions(),
    };
  }

  private _getAuth(): ApiKeyAuth {
    if (process.env.ELASTICSEARCH_API_KEY) {
      return { apiKey: process.env.ELASTICSEARCH_API_KEY };
    }
    return { apiKey: 'NOT-SET' };
  }

  private _tlsOptions(): ConnectionOptions | undefined {
    if (process.env.NODE_ENV === 'local') {
      return {
        rejectUnauthorized: false,
      };
    }

    return {
      rejectUnauthorized: true,
      ca: process.env.ELASTICSEARCH_CA_CERT,
    };
  }

  private _getNode(): string {
    return process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
  }
}
