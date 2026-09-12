import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Jogo } from './jogo.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `jogo_membro`. Ver fase3_arquitetura_completa, Parte 2, e UC-12
// (membro adicionado depois entra com zero vitórias, sem compensação).
@Entity('jogo_membro')
export class JogoMembro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'jogo_id', type: 'uuid' })
  jogoId: string;

  @ManyToOne(() => Jogo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jogo_id' })
  jogo: Jogo;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'entrou_em', type: 'timestamptz' })
  entrouEm: Date;
}
