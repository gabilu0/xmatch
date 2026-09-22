import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SalaService } from './sala.service';

describe('Detalhes da sala', () => {
  const sala = { id: 'sala-1', nome: 'Turma', liderId: 'lider' };
  const salas = { findOne: jest.fn().mockResolvedValue(sala) };
  const membros = { findOne: jest.fn(), find: jest.fn() };
  const service = new SalaService(salas as never, membros as never, {} as never, {} as never);

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
});
