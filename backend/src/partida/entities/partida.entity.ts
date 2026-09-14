import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Jogo } from '../../jogo/entities/jogo.entity';
import { Season } from '../../jogo/entities/season.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `partida`. Ver fase3_arquitetura_completa, Parte 2, e UC-13/14/15.
// Estados: pendente -> confirmada | contestada; contestada -> confirmada | cancelada.
@Entity('partida')
export class Partida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'jogo_id', type: 'uuid' })
  jogoId: string;

  @ManyToOne(() => Jogo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jogo_id' })
  jogo: Jogo;

  @Column({ name: 'season_id', type: 'uuid', nullable: true })
  seasonId: string | null;

  @ManyToOne(() => Season, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'season_id' })
  season: Season | null;

  @Column({ name: 'registrado_por', type: 'uuid' })
  registradoPor: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'registrado_por' })
  registrador: Usuario;

  // 'pendente' | 'confirmada' | 'contestada' | 'cancelada'
  @Column({ type: 'varchar', length: 20 })
  status: 'pendente' | 'confirmada' | 'contestada' | 'cancelada';

  @Column({ name: 'expira_em', type: 'timestamptz' })
  expiraEm: Date;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
