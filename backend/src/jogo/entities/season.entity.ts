import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Jogo } from './jogo.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `season`. Ver fase3_arquitetura_completa, Parte 2, e RF-03.10.
// Criada automaticamente quando um jogo com ciclo='season' é criado, e
// quando a meta de vitórias é atingida (isso último entra no Sprint 4,
// junto com o módulo de Partida — é lá que uma vitória é registrada).
@Entity('season')
export class Season {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'jogo_id', type: 'uuid' })
  jogoId: string;

  @ManyToOne(() => Jogo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jogo_id' })
  jogo: Jogo;

  @Column({ name: 'campeao_id', type: 'uuid', nullable: true })
  campeaoId: string | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'campeao_id' })
  campeao: Usuario | null;

  @Column({ type: 'int' })
  numero: number;

  @CreateDateColumn({ name: 'iniciada_em', type: 'timestamptz' })
  iniciadaEm: Date;

  @Column({ name: 'encerrada_em', type: 'timestamptz', nullable: true })
  encerradaEm: Date | null;
}
