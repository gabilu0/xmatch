import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Sala } from '../../sala/entities/sala.entity';

// Tabela `notificacao` — ver fase3_arquitetura_completa, Parte 2.
// partidaId fica sem FK por enquanto: a tabela `partida` só existe a partir
// do Sprint 4. O campo já existe aqui (nullable) para não precisar de uma
// migration de ALTER TABLE mais tarde — a FK real pode ser adicionada então.
//
// Tipos usados até o Sprint 2: 'adicionado_sala', 'sala_encerrada',
// 'lideranca_transferida'. Os demais tipos da tabela de referência do
// fase3_arquitetura_completa (vitoria_registrada, partida_contestada, etc.)
// entram junto com os módulos de Jogo/Partida (Sprints 3 e 4).
@Entity('notificacao')
export class Notificacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'partida_id', type: 'uuid', nullable: true })
  partidaId: string | null;

  @Column({ name: 'sala_id', type: 'uuid', nullable: true })
  salaId: string | null;

  @ManyToOne(() => Sala, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sala_id' })
  sala: Sala | null;

  @Column({ type: 'varchar', length: 50 })
  tipo: string;

  @Column({ type: 'boolean', default: false })
  lida: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
