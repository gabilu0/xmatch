import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sala } from './sala.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `sala_membro` — junção usuario <-> sala.
// Ver fase3_arquitetura_completa, Parte 2.
@Entity('sala_membro')
export class SalaMembro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sala_id', type: 'uuid' })
  salaId: string;

  @ManyToOne(() => Sala, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sala_id' })
  sala: Sala;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'entrou_em', type: 'timestamptz' })
  entrouEm: Date;
}
