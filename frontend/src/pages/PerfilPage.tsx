import { useEffect, useState, type FormEvent } from 'react';
import { obterMensagemErro } from '../services/auth';
import { atualizarApelido, enviarFoto, obterPerfil, type Perfil } from '../services/perfil';
import '../styles/app-pages.css';

export function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [apelido, setApelido] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    let ativo = true;
    obterPerfil().then((dados) => { if (ativo) { setPerfil(dados); setApelido(dados.apelido); } })
      .catch((falha: unknown) => { if (ativo) setErro(obterMensagemErro(falha, 'Não foi possível carregar seu perfil.')); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(''); setMensagem(''); setSalvando(true);
    try { const atualizado = await atualizarApelido(apelido.trim()); setPerfil(atualizado); setApelido(atualizado.apelido); setMensagem('Apelido atualizado.'); }
    catch (falha) { setErro(obterMensagemErro(falha, 'Não foi possível atualizar seu apelido.')); }
    finally { setSalvando(false); }
  }

  async function enviarImagem(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!foto) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(foto.type) || foto.size > 2 * 1024 * 1024) {
      setErro('Envie uma foto PNG, JPEG ou WebP de até 2 MB.'); return;
    }
    setSalvando(true); setErro(''); setMensagem('');
    try { setPerfil(await enviarFoto(foto)); setFoto(null); setMensagem('Foto atualizada.'); }
    catch (falha) { setErro(obterMensagemErro(falha, 'Não foi possível atualizar sua foto.')); }
    finally { setSalvando(false); }
  }

  return <main className="app-page"><header className="app-page__heading"><p className="eyebrow">xMatch</p><h1>Perfil</h1></header>
    {carregando && <p role="status">Carregando perfil...</p>}
    {erro && <p className="form-error" role="alert">{erro}</p>}
    {mensagem && <p className="form-message" role="status">{mensagem}</p>}
    {perfil && <section className="panel"><div className="profile-summary">{perfil.fotoUrl ? <img src={perfil.fotoUrl} alt="Sua foto de perfil" /> : <span aria-hidden="true">{perfil.apelido.slice(0, 2).toUpperCase()}</span>}<h2>{perfil.apelido}</h2></div><form className="app-form" onSubmit={enviar}><label>Apelido<input value={apelido} minLength={3} maxLength={30} required onChange={(evento) => setApelido(evento.target.value)} /></label><button className="button button--primary" type="submit" disabled={salvando || apelido.trim() === perfil.apelido}>{salvando ? 'Salvando...' : 'Salvar apelido'}</button></form><form className="app-form photo-form" onSubmit={enviarImagem}><label>Foto de perfil (PNG, JPEG ou WebP; até 2 MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(evento) => setFoto(evento.target.files?.[0] ?? null)} /></label><button className="button button--ghost" type="submit" disabled={salvando || !foto}>{salvando ? 'Enviando...' : 'Enviar foto'}</button></form></section>}
  </main>;
}
