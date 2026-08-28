import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `amizade` — NÃO consta no modelo de dados do fase3_arquitetura_completa
// (Parte 2); schema inferido da UC-04 (casos_de_uso), que descreve solicitação,
// aceite e recusa de amizade. Recusa não gera uma "amizade recusada" — a
// linha é removida (ver UC-04: "recusa → solicitação cancelada, nenhuma
// notificação adicional"), permitindo nova solicitação futura.
//
// Regra de bloqueio bidirecional (decisão de produto): se já existe um
// pedido pendente entre duas pessoas — em qualquer direção — não é possível
// criar outro. Quem recebeu só pode aceitar ou recusar o que já existe,
// nunca enviar um pedido "cruzado" enquanto o primeiro está pendente. Isso é
// garantido tanto no AmigoService quanto por um índice único parcial na
// migration (idx_amizade_par_pendente), como defesa contra condições de
// corrida.
@Entity('amizade')
export class Amizade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'solicitante_id', type: 'uuid' })
  solicitanteId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitante_id' })
  solicitante: Usuario;

  @Column({ name: 'destinatario_id', type: 'uuid' })
  destinatarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinatario_id' })
  destinatario: Usuario;

  // 'pendente' | 'aceita' — ver UC-04.
  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  status: 'pendente' | 'aceita';

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
