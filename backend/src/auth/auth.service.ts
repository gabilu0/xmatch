import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../usuario/entities/usuario.entity';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';

// Ver UC-01 (casos_de_uso) e RF-01.1 (fase2_requisitos_funcionais).
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async cadastrar(dto: CadastroDto) {
    const existente = await this.usuarioRepository.findOne({
      where: { apelido: dto.apelido },
    });
    if (existente) {
      throw new ConflictException('Apelido já está em uso.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const usuario = this.usuarioRepository.create({
      apelido: dto.apelido,
      senhaHash,
    });
    await this.usuarioRepository.save(usuario);

    return this.gerarToken(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { apelido: dto.apelido },
    });
    if (!usuario || !usuario.senhaHash) {
      throw new UnauthorizedException('Apelido ou senha inválidos.');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new UnauthorizedException('Apelido ou senha inválidos.');
    }

    return this.gerarToken(usuario);
  }

  private gerarToken(usuario: Usuario) {
    const payload = { sub: usuario.id, apelido: usuario.apelido };
    return {
      accessToken: this.jwtService.sign(payload),
      usuario: { id: usuario.id, apelido: usuario.apelido },
    };
  }
}
