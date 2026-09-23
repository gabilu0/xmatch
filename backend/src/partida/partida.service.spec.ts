import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PartidaService } from './partida.service';

describe('Placar e partidas', () => {
  const membrosJogo = { findOne: jest.fn() };
  const membrosSala = { find: jest.fn(), findOne: jest.fn() };
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
    jogos.findOne.mockResolvedValue({ id: 'jogo-1', salaId: 'sala-1', ciclo: 'sem_fim' });
    membrosSala.findOne.mockResolvedValue({ usuarioId: 'ana' });
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

  it('bloqueia placar para ex membro de uma sala', async () => {
    membrosJogo.findOne.mockResolvedValue({ usuarioId: 'ana' });
    membrosSala.findOne.mockResolvedValue(null);
    await expect(service.placar('ana', 'jogo-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(resultados.createQueryBuilder).not.toHaveBeenCalled();
  });
});

describe('Registro, temporada e contestação', () => {
  const partidas = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const query = {
    innerJoin: jest.fn(), select: jest.fn(), addSelect: jest.fn(), where: jest.fn(),
    andWhere: jest.fn(), groupBy: jest.fn(), getRawMany: jest.fn(),
  };
  for (const metodo of ['innerJoin', 'select', 'addSelect', 'where', 'andWhere', 'groupBy'] as const) {
    query[metodo].mockReturnValue(query);
  }
  const resultados = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(query),
  };
  const jogos = { findOne: jest.fn() };
  const membrosJogo = { find: jest.fn(), findOne: jest.fn() };
  const seasons = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const membrosSala = { findOne: jest.fn() };
  const notificacoes = { criar: jest.fn() };
  const service = new PartidaService(
    partidas as never,
    resultados as never,
    jogos as never,
    membrosJogo as never,
    seasons as never,
    membrosSala as never,
    notificacoes as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    query.innerJoin.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.addSelect.mockReturnValue(query);
    query.where.mockReturnValue(query);
    query.andWhere.mockReturnValue(query);
    query.groupBy.mockReturnValue(query);
    resultados.createQueryBuilder.mockReturnValue(query);
    query.getRawMany.mockResolvedValue([{ usuarioId: 'ana', total: '4' }]);
    jogos.findOne.mockResolvedValue({
      id: 'jogo-1',
      salaId: 'sala-1',
      sala: { encerrada: false },
      arquivado: false,
      modo: 'competicao',
      ciclo: 'season',
      metaVitorias: 5,
    });
    membrosSala.findOne.mockResolvedValue({ usuarioId: 'ana' });
    membrosJogo.find.mockResolvedValue([
      { usuarioId: 'ana' },
      { usuarioId: 'bia' },
    ]);
    membrosJogo.findOne.mockResolvedValue({ usuarioId: 'ana' });
    seasons.findOne.mockResolvedValue({ id: 'season-1', numero: 1 });
    partidas.create.mockImplementation((dados) => ({ id: 'partida-1', ...dados }));
    partidas.save.mockImplementation(async (partida) => partida);
    resultados.create.mockImplementation((dados) => dados);
    resultados.save.mockImplementation(async (itens) => itens);
    notificacoes.criar.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bloqueia novas vitórias quando uma partida não resolvida pode atingir a meta', async () => {
    query.getRawMany.mockResolvedValue([{ usuarioId: 'ana', total: '5' }]);

    await expect(
      service.registrarVitoria('ana', 'jogo-1', {}),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(partidas.create).not.toHaveBeenCalled();
    expect(query.andWhere).toHaveBeenCalledWith(
      'p.status IN (:...statuses)',
      { statuses: ['pendente', 'contestada', 'confirmada'] },
    );
  });

  it('abre uma janela de uma hora para contestar a vitória', async () => {
    const agora = new Date('2026-09-23T12:00:00.000Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(agora);

    const partida = await service.registrarVitoria('ana', 'jogo-1', {});

    expect(partida.expiraEm).toEqual(new Date(agora + 60 * 60 * 1000));
  });

  it('impede o registrador de contestar a própria vitória', async () => {
    partidas.findOne.mockResolvedValue({
      id: 'partida-1',
      jogoId: 'jogo-1',
      registradoPor: 'ana',
      status: 'pendente',
    });

    await expect(service.contestar('ana', 'partida-1'))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reinicia em uma hora o prazo para resolver uma contestação', async () => {
    const agora = new Date('2026-09-23T12:00:00.000Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(agora);
    const partida = {
      id: 'partida-1',
      jogoId: 'jogo-1',
      registradoPor: 'ana',
      status: 'pendente',
      expiraEm: new Date(agora),
    };
    partidas.findOne.mockResolvedValue(partida);

    await service.contestar('bia', 'partida-1');

    expect(partida.status).toBe('contestada');
    expect(partida.expiraEm).toEqual(new Date(agora + 60 * 60 * 1000));
  });

  it.each(['confirmar', 'cancelar'] as const)(
    'impede o registrador de %s a própria vitória contestada',
    async (acao) => {
      partidas.findOne.mockResolvedValue({
        id: 'partida-1',
        jogoId: 'jogo-1',
        registradoPor: 'ana',
        status: 'contestada',
        seasonId: null,
      });

      await expect(service[acao]('ana', 'partida-1'))
        .rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it.each(['confirmar', 'cancelar'] as const)(
    'permite que outro jogador possa %s a vitória contestada',
    async (acao) => {
      const partida = {
        id: 'partida-1',
        jogoId: 'jogo-1',
        registradoPor: 'ana',
        status: 'contestada',
        seasonId: null,
      };
      partidas.findOne.mockResolvedValue(partida);

      await service[acao]('bia', 'partida-1');

      expect(partida.status).toBe(acao === 'confirmar' ? 'confirmada' : 'cancelada');
      expect(partidas.save).toHaveBeenCalledWith(partida);
    },
  );
});
