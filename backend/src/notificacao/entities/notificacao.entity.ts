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
import { Jogo } from '../../jogo/entities/jogo.entity';
import { Partida } from '../../partida/entities/partida.entity';

// Tabela `notificacao` — ver fase3_arquitetura_completa, Parte 2.
//
// jogoId foi adicionado no Sprint 3: o tipo 'adicionado_jogo' já constava
// na tabela de referência do fase3_arquitetura_completa, mas o schema da
// notificacao não tinha coluna pra vincular a qual jogo. Como `jogo` já
// existe a partir de agora, criamos com FK real.
//
// partidaId ganhou a FK real no Sprint 4, agora que `partida` existe.
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

  @ManyToOne(() => Partida, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'partida_id' })
  partida: Partida | null;

  @Column({ name: 'sala_id', type: 'uuid', nullable: true })
  salaId: string | null;

  @ManyToOne(() => Sala, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sala_id' })
  sala: Sala | null;

  @Column({ name: 'jogo_id', type: 'uuid', nullable: true })
  jogoId: string | null;

  @ManyToOne(() => Jogo, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'jogo_id' })
  jogo: Jogo | null;

  @Column({ type: 'varchar', length: 50 })
  tipo: string;

  @Column({ type: 'boolean', default: false })
  lida: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
