import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sala } from '../../sala/entities/sala.entity';

// Tabela `jogo`. Ver casos_de_uso (UC-11) e fase4_planejamento (Sprint 3).
//
// NOTA DE ESCOPO: o fase3_arquitetura_completa (18 ago) documentava
// modo_contagem com só 2 valores ('competicao' | 'colocacao'). O
// casos_de_uso e o fase4_planejamento (19 ago, um dia depois) descrevem 3
// modos — Duelo, Competição, Rei do Pedaço — sem mencionar mais
// "Colocação". Por decisão do usuário, segui a versão mais recente.
@Entity('jogo')
export class Jogo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sala_id', type: 'uuid' })
  salaId: string;

  @ManyToOne(() => Sala, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sala_id' })
  sala: Sala;

  @Column({ type: 'varchar', length: 50 })
  nome: string;

  // 'duelo' (2 membros, automático) | 'competicao' | 'rei_do_pedaco'
  // (3+ membros, líder escolhe entre os dois últimos).
  @Column({ type: 'varchar', length: 20 })
  modo: 'duelo' | 'competicao' | 'rei_do_pedaco';

  // 'sem_fim' | 'season'
  @Column({ type: 'varchar', length: 20 })
  ciclo: 'sem_fim' | 'season';

  @Column({ name: 'meta_vitorias', type: 'int', nullable: true })
  metaVitorias: number | null;

  @Column({ type: 'boolean', default: false })
  arquivado: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
