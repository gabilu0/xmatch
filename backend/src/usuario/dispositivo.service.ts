import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioDispositivo } from './entities/usuario-dispositivo.entity';
import { RegistrarDispositivoDto } from './dto/registrar-dispositivo.dto';

@Injectable()
export class DispositivoService {
  constructor(
    @InjectRepository(UsuarioDispositivo)
    private readonly dispositivoRepository: Repository<UsuarioDispositivo>,
  ) {}

  // Ver fase3_arquitetura_completa, Parte 2 ("Comportamento do token"):
  // quando o app reinstala ou reinicia, o Firebase gera um novo token — o
  // app reenvia ao backend, que atualiza o registro existente ou cria um
  // novo. Um token é único por dispositivo (UQ_usuario_dispositivo_fcm_token),
  // então o upsert é feito por fcm_token, não por usuario_id.
  async registrar(usuarioId: string, dto: RegistrarDispositivoDto) {
    const existente = await this.dispositivoRepository.findOne({
      where: { fcmToken: dto.fcmToken },
    });

    if (existente) {
      existente.usuarioId = usuarioId;
      existente.plataforma = dto.plataforma;
      return this.dispositivoRepository.save(existente);
    }

    const dispositivo = this.dispositivoRepository.create({
      usuarioId,
      fcmToken: dto.fcmToken,
      plataforma: dto.plataforma,
    });

    return this.dispositivoRepository.save(dispositivo);
  }
}
