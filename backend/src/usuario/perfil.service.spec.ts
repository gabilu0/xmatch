import { ConflictException } from '@nestjs/common';
import { PerfilService } from './perfil.service';

describe('Perfil', () => {
  const usuarios = { findOne: jest.fn(), save: jest.fn() };
  const service = new PerfilService(usuarios as never);

  beforeEach(() => jest.clearAllMocks());

  it('não expõe email, senha ou id Google', async () => {
    usuarios.findOne.mockResolvedValue({ id: 'id-1', apelido: 'Ana', fotoUrl: null, email: 'privado@exemplo.com', senhaHash: 'segredo', googleId: 'google' });
    expect(await service.obter('id-1')).toEqual({ id: 'id-1', apelido: 'Ana', fotoUrl: null });
  });

  it('impede apelido já usado antes de salvar', async () => {
    usuarios.findOne.mockResolvedValueOnce({ id: 'id-1', apelido: 'Ana' }).mockResolvedValueOnce({ id: 'id-2', apelido: 'Bia' });
    await expect(service.atualizar('id-1', { apelido: 'Bia' })).rejects.toBeInstanceOf(ConflictException);
    expect(usuarios.save).not.toHaveBeenCalled();
  });
});
