import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Tabela `usuario` — ver fase3_arquitetura_completa, Parte 2.
@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30, unique: true })
  apelido: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'senha_hash', type: 'text', nullable: true })
  senhaHash: string | null;

  @Column({ name: 'google_id', length: 100, unique: true, nullable: true })
  googleId: string | null;

  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl: string | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
