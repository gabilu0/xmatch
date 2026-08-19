import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// DataSource usado pela CLI do TypeORM para gerar e rodar migrations.
// Ordem de criação das tabelas segue fase3_arquitetura_completa:
// usuario -> usuario_dispositivo -> sala -> sala_membro -> convite
// -> jogo -> jogo_membro -> season -> partida -> partida_resultado -> notificacao
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['migrations/*.ts'],
  synchronize: false,
});
