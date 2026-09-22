import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuarioDispositivo } from './entities/usuario-dispositivo.entity';
import { DispositivoController } from './dispositivo.controller';
import { DispositivoService } from './dispositivo.service';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';

// Módulo de usuário e dispositivos — ver fase3_arquitetura_completa,
// estrutura de repositório recomendada.
@Module({
  imports: [TypeOrmModule.forFeature([Usuario, UsuarioDispositivo])],
  controllers: [DispositivoController, PerfilController],
  providers: [DispositivoService, PerfilService],
})
export class UsuarioModule {}
