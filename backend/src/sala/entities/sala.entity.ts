import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `sala` — ver fase3_arquitetura_completa, Parte 2, e UC-05/UC-10.
@Entity('sala')
export class Sala {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lider_id', type: 'uuid' })
  liderId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'lider_id' })
  lider: Usuario;

  @Column({ type: 'varchar', length: 50 })
  nome: string;

  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl: string | null;

  @Column({ type: 'boolean', default: false })
  encerrada: boolean;

  @Column({ name: 'encerrada_em', type: 'timestamptz', nullable: true })
  encerradaEm: Date | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
