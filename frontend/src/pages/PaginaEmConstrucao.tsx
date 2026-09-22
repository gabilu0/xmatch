type Props = {
  titulo: string;
  descricao: string;
};

export function PaginaEmConstrucao({ titulo, descricao }: Props) {
  return (
    <main className="placeholder-page">
      <div>
        <p className="eyebrow">xMatch</p>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </div>
    </main>
  );
}
