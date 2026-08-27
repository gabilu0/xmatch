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
import { GoogleProfilePayload } from './strategies/google.strategy';

// Ver UC-01 (casos_de_uso) e RF-01.1 (fase2_requisitos_funcionais).
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  // Ver UC-01 (casos_de_uso) e RF-01.1 (fase2_requisitos_funcionais).
  // Unificação por email (mesma regra de loginComGoogle, no sentido
  // contrário): se já existe uma conta criada via Google com esse email
  // e ainda sem senha, vincula a senha a ela em vez de criar um usuário
  // duplicado.
  async cadastrar(dto: CadastroDto) {
    const porEmail = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });

    if (porEmail) {
      if (porEmail.senhaHash) {
        throw new ConflictException('Email já está em uso.');
      }

      if (dto.apelido !== porEmail.apelido) {
        const apelidoEmUso = await this.usuarioRepository.findOne({
          where: { apelido: dto.apelido },
        });
        if (apelidoEmUso) {
          throw new ConflictException('Apelido já está em uso.');
        }
        porEmail.apelido = dto.apelido;
      }

      porEmail.senhaHash = await bcrypt.hash(dto.senha, 10);
      await this.usuarioRepository.save(porEmail);
      return this.gerarToken(porEmail);
    }

    const apelidoEmUso = await this.usuarioRepository.findOne({
      where: { apelido: dto.apelido },
    });
    if (apelidoEmUso) {
      throw new ConflictException('Apelido já está em uso.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const usuario = this.usuarioRepository.create({
      apelido: dto.apelido,
      email: dto.email,
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

  // Ver UC-02 (casos_de_uso) e fluxo de autenticação (fase3_arquitetura_completa,
  // Parte 3). Unificação de contas por email: se já existe usuário com esse
  // email (cadastrado via apelido/senha), vincula o google_id em vez de criar
  // um novo perfil.
  async loginComGoogle(payload: GoogleProfilePayload) {
    const { googleId, email, nomeSugerido } = payload;

    const porGoogleId = await this.usuarioRepository.findOne({
      where: { googleId },
    });
    if (porGoogleId) {
      return this.gerarToken(porGoogleId);
    }

    if (email) {
      const porEmail = await this.usuarioRepository.findOne({
        where: { email },
      });
      if (porEmail) {
        porEmail.googleId = googleId;
        await this.usuarioRepository.save(porEmail);
        return this.gerarToken(porEmail);
      }
    }

    const apelido = await this.gerarApelidoUnico(nomeSugerido);
    const usuario = this.usuarioRepository.create({
      apelido,
      email,
      googleId,
    });
    await this.usuarioRepository.save(usuario);

    return this.gerarToken(usuario);
  }

  // Apelido sugerido a partir do nome do Google (RF-01.2). Editável depois
  // pelo usuário via RF-01.4 — aqui só garantimos unicidade para o cadastro
  // não falhar.
  private async gerarApelidoUnico(nomeBase: string): Promise<string> {
    const base =
      nomeBase
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 24) || 'usuario';

    let candidato = base;
    let tentativas = 0;

    while (
      await this.usuarioRepository.exist({ where: { apelido: candidato } })
    ) {
      tentativas += 1;
      if (tentativas > 5) {
        throw new ConflictException(
          'Não foi possível gerar um apelido único a partir do seu nome Google.',
        );
      }
      const sufixo = Math.random().toString(36).slice(2, 6);
      candidato = `${base.slice(0, 24 - sufixo.length - 1)}_${sufixo}`;
    }

    return candidato;
  }

  private gerarToken(usuario: Usuario) {
    const payload = { sub: usuario.id, apelido: usuario.apelido };
    return {
      accessToken: this.jwtService.sign(payload),
      usuario: { id: usuario.id, apelido: usuario.apelido },
    };
  }
}
