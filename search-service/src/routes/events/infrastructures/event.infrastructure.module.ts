import { Module } from '@nestjs/common';
import { OrmEventModule } from './orm/orm.modules';

@Module({ imports: [OrmEventModule], exports: [OrmEventModule] })
export class EventInfrastructureModule {}
