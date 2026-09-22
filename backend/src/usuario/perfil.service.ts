import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';

@Injectable()
export class PerfilService {
  constructor(@InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>) {}

  async obter(id: string) {
    const usuario = await this.usuarios.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return { id: usuario.id, apelido: usuario.apelido, fotoUrl: usuario.fotoUrl };
  }

  async atualizar(id: string, dto: AtualizarPerfilDto) {
    const usuario = await this.usuarios.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    const apelido = dto.apelido.trim();
    if (apelido.length < 3) throw new BadRequestException('O apelido deve ter pelo menos 3 caracteres.');
    if (usuario.apelido === apelido) return this.obter(id);
    const existente = await this.usuarios.findOne({ where: { apelido } });
    if (existente) throw new ConflictException('Esse apelido já está em uso.');
    usuario.apelido = apelido;
    try {
      await this.usuarios.save(usuario);
    } catch (erro) {
      if (typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === '23505') {
        throw new ConflictException('Esse apelido já está em uso.');
      }
      throw erro;
    }
    return this.obter(id);
  }

  async enviarFoto(id: string, arquivo?: { buffer: Buffer; mimetype: string; size: number }) {
    if (!arquivo || !['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.mimetype) || arquivo.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Envie uma foto PNG, JPEG ou WebP de até 2 MB.');
    }
    const usuario = await this.usuarios.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new ServiceUnavailableException('O envio de fotos ainda não está configurado.');
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const fotoUrl = await new Promise<string>((resolve, reject) => {
      const envio = cloudinary.uploader.upload_stream(
        { folder: 'xmatch/perfis', public_id: id, overwrite: true, resource_type: 'image', transformation: [{ width: 512, height: 512, crop: 'fill' }] },
        (erro, resultado) => erro ? reject(erro) : resultado?.secure_url ? resolve(resultado.secure_url) : reject(new Error('Falha ao enviar a foto.')),
      );
      envio.end(arquivo.buffer);
    });
    usuario.fotoUrl = fotoUrl;
    await this.usuarios.save(usuario);
    return this.obter(id);
  }
}
