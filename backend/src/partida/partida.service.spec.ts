import { ForbiddenException } from '@nestjs/common';
import { PartidaService } from './partida.service';

describe('Placar e partidas', () => {
  const membrosJogo = { findOne: jest.fn() };
  const membrosSala = { find: jest.fn() };
  const jogos = { findOne: jest.fn() };
  const query = {
    innerJoin: jest.fn(), select: jest.fn(), addSelect: jest.fn(), where: jest.fn(),
    andWhere: jest.fn(), groupBy: jest.fn(), orderBy: jest.fn(), getRawMany: jest.fn(),
  };
  for (const metodo of ['innerJoin', 'select', 'addSelect', 'where', 'andWhere', 'groupBy', 'orderBy'] as const) {
    query[metodo].mockReturnValue(query);
  }
  const resultados = { createQueryBuilder: jest.fn().mockReturnValue(query) };
  const service = new PartidaService(
    {} as never, resultados as never, jogos as never, membrosJogo as never,
    {} as never, membrosSala as never, {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jogos.findOne.mockResolvedValue({ id: 'jogo-1', ciclo: 'sem_fim' });
    query.getRawMany.mockResolvedValue([{ usuarioId: 'ana', vitorias: '2' }]);
  });

  it('protege o placar de jogos contra não membros', async () => {
    membrosJogo.findOne.mockResolvedValue(null);
    await expect(service.placar('intruso', 'jogo-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(resultados.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('inclui vitórias pendentes e confirmadas no placar', async () => {
    membrosJogo.findOne.mockResolvedValue({ usuarioId: 'ana' });
    expect(await service.placar('ana', 'jogo-1')).toEqual([{ usuarioId: 'ana', vitorias: 2 }]);
    expect(query.andWhere).toHaveBeenCalledWith('p.status IN (:...statuses)', { statuses: ['pendente', 'confirmada'] });
  });

  it('protege o ranking de sala contra não membros', async () => {
    membrosSala.find.mockResolvedValue([{ usuarioId: 'ana' }]);
    await expect(service.placarSala('intruso', 'sala-1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
