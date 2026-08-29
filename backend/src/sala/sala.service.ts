import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sala } from './entities/sala.entity';
import { SalaMembro } from './entities/sala-membro.entity';
import { CriarSalaDto } from './dto/criar-sala.dto';

@Injectable()
export class SalaService {
  constructor(
    @InjectRepository(Sala)
    private readonly salaRepository: Repository<Sala>,
    @InjectRepository(SalaMembro)
    private readonly salaMembroRepository: Repository<SalaMembro>,
  ) {}

  // Ver UC-05 e RF-02.1/RF-02.3. Quem cria a sala torna-se líder
  // automaticamente e já entra como membro dela.
  async criar(liderId: string, dto: CriarSalaDto) {
    const sala = this.salaRepository.create({
      liderId,
      nome: dto.nome,
      fotoUrl: dto.fotoUrl ?? null,
    });
    await this.salaRepository.save(sala);

    const membro = this.salaMembroRepository.create({
      salaId: sala.id,
      usuarioId: liderId,
      entrouEm: new Date(),
    });
    await this.salaMembroRepository.save(membro);

    return sala;
  }

  // Ver RF-02.10 / UC-05 ("sala aparece na tela principal do Líder").
  // Lista as salas em que o usuário é membro (líder ou não).
  async listarDoUsuario(usuarioId: string) {
    return this.salaRepository
      .createQueryBuilder('sala')
      .innerJoin(
        SalaMembro,
        'membro',
        'membro.salaId = sala.id AND membro.usuarioId = :usuarioId',
        { usuarioId },
      )
      .orderBy('sala.criadoEm', 'DESC')
      .getMany();
  }
}
