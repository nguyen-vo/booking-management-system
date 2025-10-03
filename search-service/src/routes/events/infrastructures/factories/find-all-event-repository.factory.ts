import { Injectable, Inject } from '@nestjs/common';

import { OrmFindAllEventRepository } from '../orm/repositories/orm-find-all-event.repository';
import { EsFindAllEventRepository } from '../elasticsearch/repositories/es-find-all-event.repository';
import { FindAllEventRepository } from '../../application/ports/find-all-events.repository';

@Injectable()
export class FindAllEventRepositoryFactory {
  constructor(
    @Inject(OrmFindAllEventRepository)
    private readonly ormRepository: OrmFindAllEventRepository,
    @Inject(EsFindAllEventRepository)
    private readonly esRepository: EsFindAllEventRepository,
  ) {}

  getRepository(useElasticsearch = false): FindAllEventRepository {
    if (useElasticsearch) {
      return this.esRepository;
    }

    return this.ormRepository;
  }
}
