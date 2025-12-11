import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
dotenv.config();

const configService: ConfigService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('POSTGRES_HOST'),
  port: parseInt(configService.get<string>('POSTGRES_PORT', '6379')),
  username: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  database: configService.get('POSTGRES_DATABASE'),
  logging: +configService.get('DB_LOGGING') === 1 ? true : false,
  entities: [join(__dirname, '/../**/', '*.entity.{ts,js}')],
  synchronize: false, //dangerous its for initials only
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
  migrationsTableName: 'migrations_typeorm',
  migrationsRun: false,
  poolSize: Number(configService.get('DB_POOL_SIZE', 60)),
  cache: {
    duration: Number(configService.get('DB_CACHE_DURATION', 1000)),
  },
};

export const typeOrmDBModuleOptions: TypeOrmModuleOptions = {
  ...dataSourceOptions,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
