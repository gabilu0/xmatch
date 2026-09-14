import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Partida } from './partida.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

// Tabela `partida_resultado`. Ver fase3_arquitetura_completa, Parte 2.
// Uma linha por usuário afetado pela partida — no Duelo e Competição, isso
// é o registrador + todos os outros membros do jogo; no Rei do Pedaço, é
// só o registrador + a pessoa especificamente selecionada como perdedora.
@Entity('partida_resultado')
export class PartidaResultado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partida_id', type: 'uuid' })
  partidaId: string;

  @ManyToOne(() => Partida, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partida_id' })
  partida: Partida;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'boolean' })
  vencedor: boolean;

  @Column({ type: 'int', default: 1 })
  pontos: number;
}
