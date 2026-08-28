import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sala } from './sala.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `convite` — links/códigos de entrada na sala.
// Ver fase3_arquitetura_completa, Parte 2, e UC-06 (expira em 48h ou 1 uso).
@Entity('convite')
export class Convite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sala_id', type: 'uuid' })
  salaId: string;

  @ManyToOne(() => Sala, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sala_id' })
  sala: Sala;

  @Column({ name: 'criado_por', type: 'uuid' })
  criadoPor: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'criado_por' })
  criador: Usuario;

  @Column({ type: 'varchar', length: 8, unique: true })
  codigo: string;

  @Column({ type: 'boolean', default: false })
  usado: boolean;

  @Column({ name: 'expira_em', type: 'timestamptz' })
  expiraEm: Date;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
