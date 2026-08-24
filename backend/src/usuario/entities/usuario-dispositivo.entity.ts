import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

// Tabela `usuario_dispositivo` — tokens FCM por dispositivo.
// Um usuário pode ter N dispositivos (N tokens). Ver fase3_arquitetura_completa,
// Parte 2, e o endpoint POST /dispositivos do Sprint 1 (fase4_planejamento).
@Entity('usuario_dispositivo')
export class UsuarioDispositivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'fcm_token', type: 'text', unique: true })
  fcmToken: string;

  // 'android' | 'ios' | 'web' — ver fase3_arquitetura_completa.
  @Column({ type: 'varchar', length: 10 })
  plataforma: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
