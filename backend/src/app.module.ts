import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Módulos de domínio — implementados sprint a sprint conforme
// docs/fase4_planejamento (Sprint 1: Auth, Sprint 2: Sala/Amigos,
// Sprint 3: Jogo, Sprint 4: Partida/Notificação).
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AmigoModule } from './amigo/amigo.module';
// import { SalaModule } from './sala/sala.module';
// import { JogoModule } from './jogo/jogo.module';
// import { PartidaModule } from './partida/partida.module';
// import { NotificacaoModule } from './notificacao/notificacao.module';
// import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, // migrations controlam o schema — nunca true em produção
      // Neon (e a maioria dos Postgres gerenciados) exige SSL; o Postgres
      // local via Docker não usa. Ativa via DATABASE_SSL=true no ambiente
      // de produção (Render), deixa desligado localmente.
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsuarioModule,
    AmigoModule,
  ],
})
export class AppModule {}
