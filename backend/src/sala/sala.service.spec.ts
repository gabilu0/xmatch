import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SalaService } from './sala.service';
import { Jogo } from '../jogo/entities/jogo.entity';
import { JogoMembro } from '../jogo/entities/jogo-membro.entity';
import { SalaMembro } from './entities/sala-membro.entity';

describe('Detalhes da sala', () => {
  const sala = { id: 'sala-1', nome: 'Turma', liderId: 'lider' };
  const salas = { findOne: jest.fn().mockResolvedValue(sala) };
  const manager = { delete: jest.fn(), count: jest.fn(), update: jest.fn(), transaction: jest.fn() };
  const membros = { findOne: jest.fn(), find: jest.fn(), manager };
  const jogos = { find: jest.fn() };
  const service = new SalaService(salas as never, membros as never, {} as never, jogos as never, {} as never);

  beforeEach(() => jest.clearAllMocks());

  it('bloqueia acesso de quem não participa', async () => {
    membros.findOne.mockResolvedValue(null);
    await expect(service.detalhar('intruso', sala.id)).rejects.toBeInstanceOf(ForbiddenException);
    expect(membros.find).not.toHaveBeenCalled();
  });

  it('retorna apenas os campos públicos dos membros', async () => {
    membros.findOne.mockResolvedValue({ usuarioId: 'lider' });
    membros.find.mockResolvedValue([{ usuarioId: 'lider', usuario: { apelido: 'Ana', fotoUrl: null, email: 'privado@exemplo.com', senhaHash: 'segredo' } }]);
    const detalhes = await service.detalhar('lider', sala.id);
    expect(detalhes.membros).toEqual([{ id: 'lider', apelido: 'Ana', fotoUrl: null }]);
    expect(JSON.stringify(detalhes)).not.toContain('segredo');
    expect(JSON.stringify(detalhes)).not.toContain('privado@exemplo.com');
  });

  it('não gera convite após encerramento', async () => {
    salas.findOne.mockResolvedValueOnce({ ...sala, encerrada: true });
    await expect(service.gerarConvite('lider', sala.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('sair remove o participante dos jogos na mesma transação e arquiva jogo sem dupla', async () => {
    membros.findOne.mockResolvedValue({ id: 'membro-1', usuarioId: 'ana' });
    jogos.find.mockResolvedValue([{ id: 'jogo-1' }]);
    manager.transaction.mockImplementation((callback: (contexto: typeof manager) => Promise<void>) => callback(manager));
    manager.count.mockResolvedValue(1);
    await service.sair('ana', sala.id);
    expect(manager.delete).toHaveBeenCalledWith(JogoMembro, { jogoId: 'jogo-1', usuarioId: 'ana' });
    expect(manager.update).toHaveBeenCalledWith(Jogo, { id: 'jogo-1' }, { arquivado: true });
    expect(manager.delete).toHaveBeenCalledWith(SalaMembro, { id: 'membro-1' });
  });
});
