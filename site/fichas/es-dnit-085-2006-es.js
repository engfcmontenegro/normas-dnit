/*
 * Ficha de CONTROLE POR ETAPAS: DNIT 085/2006-ES — Demolição e remoção de pavimentos (asfáltico ou concreto) em
 * obras-de-arte especiais: recuperação, ou demolição e reconstituição, do pavimento/sobre-laje de concreto.
 *
 * O que a ES manda (seções do PDF):
 *   5.1  inspeção: a) tipo, idade, tráfego e cargas; b) estado geral; c)/d) quadro fissuratório longitudinal e
 *        transversal; e) extremidades e juntas de dilatação; f) descontinuidades da laje estrutural; g) infiltrações e
 *        eflorescências.        5.2 escolha da alternativa (adiar, recuperar, demolir e reconstituir).
 *   5.3  recuperação (pequenos trechos isolados): b) delimitar; c) sinalização; d) meia pista; e) demolir integralmente
 *        com equipamentos leves; f) tratar a laje; g) aderência; h) tráfego até 24 t; i) velocidade até 20 km/h;
 *        j) concreto de pega rápida e sem retração; k) repetir d…j após 8 h da última concretagem.
 *   5.4  demolição e reconstituição: b) alargamento/barreiras (sobre-laje armada); c)/d) sinalização e meia pista;
 *        e) juntas serradas com a altura do pavimento; f) demolição integral e tratamento da laje; g) remoção para locais
 *        determinados; h) laje áspera, agregado graúdo aparente, sem detritos; i) armadura / tela soldada a 4 cm do topo;
 *        j) 24 t; k) 20 km/h; l) faixas de ≈ 20 m com intervalos de ≈ 5 m; m) juntas de contração moldadas ou serradas
 *        de 8 a 12 h; n) cura por 7 dias; o) após 48 h, até 36 t na meia pista não trabalhada; p) após 7 dias, a outra
 *        meia pista.        6 partes demolidas para locais pré-determinados.
 *   7    acompanhamento contínuo; serviço conforme ou não conforme em cada etapa; o não conforme deve ser refeito.
 *   8    medição por etapas (demolição e remoção em m³, juntas em m, armadura em kg / m², concreto em m³).
 * A ES não tem ensaios nem frequências: cada etapa é uma verificação (1 por lote/meia pista, no mínimo).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-085-2006-es";
  function rec(P) { return P.alternativa !== "dem"; }
  function dem(P) { return P.alternativa === "dem"; }
  var GI = "Inspeção e escolha da alternativa (5.1 / 5.2)", GR = "Recuperação do pavimento (5.3)", GD = "Demolição e reconstituição (5.4)",
    GC = "Etapas comuns (5.3 / 5.4 / 6)", GT = "Tráfego e prazos (5.3 / 5.4)";

  var CRIT = [
    // ---- inspeção (5.1) e alternativa (5.2)
    { id: "i1", texto: "Coleta de dados (tipo e idade do pavimento, tráfego, cargas por eixo) e estado geral (descontinuidades)", secao: "5.1 a / b", tipo: "sim_nao", grupo: GI },
    { id: "i2", texto: "Mapeamento do quadro fissuratório longitudinal e transversal", secao: "5.1 c / d", tipo: "sim_nao", grupo: GI },
    { id: "i3", texto: "Extremidades e juntas de dilatação, descontinuidades da laje estrutural (coincidência com as do pavimento), infiltrações e eflorescências", secao: "5.1 e / f / g", tipo: "sim_nao", grupo: GI },
    { id: "i4", texto: "Alternativa escolhida justificada pela inspeção", secao: "5.2", tipo: "sim_nao", grupo: GI, exigido: "adiar, recuperar ou demolir e reconstituir" },
    // ---- recuperação (5.3)
    { id: "r1", texto: "Pavimento em condições relativamente boas; só pequenos trechos isolados, delimitados", secao: "5.3 / 5.3 b", tipo: "sim_nao", grupo: GR, se: rec, naoAplicaPor: "só na recuperação" },
    { id: "r2", texto: "Trechos demarcados demolidos integralmente com equipamentos leves", secao: "5.3 e", tipo: "sim_nao", grupo: GR, se: rec, naoAplicaPor: "só na recuperação" },
    { id: "r3", texto: "Concreto de pega rápida e sem retração", secao: "5.3 j", tipo: "sim_nao", grupo: GR, se: rec, naoAplicaPor: "só na recuperação" },
    // ---- demolição e reconstituição (5.4)
    { id: "d0", texto: "Verificada a conveniência de alargamento e de barreiras New Jersey (sobre-laje armada)", secao: "5.4 b", tipo: "sim_nao", grupo: GD, se: dem, naoAplicaPor: "só na demolição e reconstituição" },
    { id: "d1", texto: "Demolição integral, delimitada por juntas serradas com a altura do pavimento quando o equipamento exigir", secao: "5.4 e / f", tipo: "sim_nao", grupo: GD, se: dem, naoAplicaPor: "só na demolição e reconstituição" },
    { id: "d3", texto: "Armadura da sobre-laje conforme projeto (ou tela soldada a 4 cm do topo, quando mantidos largura e dispositivos)", secao: "5.4 i", tipo: "sim_nao", grupo: GD, se: dem, naoAplicaPor: "só na demolição e reconstituição" },
    { id: "d4", texto: "Concretagem em faixas de ≈ 20 m com intervalos de ≈ 5 m (juntas de construção)", secao: "5.4 l", tipo: "sim_nao", grupo: GD, se: dem, naoAplicaPor: "só na demolição e reconstituição" },
    { id: "d5", texto: "Juntas de contração: serragem após a concretagem", secao: "5.4 m", tipo: "valor", unid: "h", casas: 0, min: 8, max: 12, grupo: GD, se: dem,
      naoAplicaPor: "só na demolição e reconstituição", exigido: "8 a 12 h (ou moldadas no concreto fresco)" },
    { id: "d6", texto: "Duração da cura", secao: "5.4 n", tipo: "valor", unid: "dias", casas: 0, min: 7, grupo: GD, se: dem, naoAplicaPor: "só na demolição e reconstituição" },
    // ---- etapas comuns
    { id: "c1", texto: "Sinalização instalada e mantida; tráfego desviado para meia pista", secao: "5.3 c / d; 5.4 c / d", tipo: "sim_nao", grupo: GC },
    { id: "c2", texto: "Anomalias da laje estrutural tratadas", secao: "5.3 f; 5.4 f", tipo: "sim_nao", grupo: GC },
    { id: "c3", texto: "Aderência: laje áspera, com agregado graúdo aparente e isenta de detritos antes da concretagem", secao: "5.3 g; 5.4 h", tipo: "sim_nao", grupo: GC },
    { id: "c4", texto: "Material demolido removido para locais previamente determinados", secao: "5.4 g; 6", tipo: "sim_nao", grupo: GC },
    // ---- tráfego e prazos
    { id: "carga", texto: "Carga máxima dos veículos liberados na meia pista em serviço", secao: "5.3 h; 5.4 j", tipo: "valor", unid: "t", casas: 0, max: 24, grupo: GT },
    { id: "vel", texto: "Velocidade máxima dos veículos", secao: "5.3 i; 5.4 k", tipo: "valor", unid: "km/h", casas: 0, max: 20, grupo: GT },
    { id: "r4", texto: "Intervalo entre a última concretagem e a repetição das etapas na meia pista seguinte", secao: "5.3 k", tipo: "valor", unid: "h", casas: 0, min: 8, grupo: GT,
      se: rec, naoAplicaPor: "só na recuperação" },
    { id: "d7", texto: "Aumento da carga para 36 t na meia pista não trabalhada: tempo após a última concretagem", secao: "5.4 o", tipo: "valor", unid: "h", casas: 0, min: 48, grupo: GT,
      se: dem, naoAplicaPor: "só na demolição e reconstituição" },
    { id: "d8", texto: "Início da outra meia pista: tempo após a última concretagem", secao: "5.4 p", tipo: "valor", unid: "dias", casas: 0, min: 7, grupo: GT,
      se: dem, naoAplicaPor: "só na demolição e reconstituição" },
  ];
  // verificações dos exemplos, na ordem dos itens sim_nao
  function ver(m) { return CRIT.filter(function (c) { return c.tipo === "sim_nao"; }).map(function (c) { return m[c.id] || {}; }); }

  A.fichaSimples({
    id: ID,
    titulo: "Pavimento de concreto em OAE — recuperação ou demolição e reconstituição (DNIT 085/2006-ES)",
    resumo: "Verificação das etapas da inspeção (5.1), da recuperação (5.3) ou da demolição e reconstituição (5.4), com os limites de tráfego (24 t, 20 km/h) e os prazos (8 h, 8 a 12 h, 7 dias, 48 h); cada etapa não conforme deve ser refeita (7).",
    rotuloLink: "Controle por etapas",
    lote: { largura: true, volume: true },
    params: [
      { k: "alternativa", r: "Alternativa adotada (5.2)", tipo: "select", recarrega: true,
        opcoes: [["rec", "Recuperação do pavimento (5.3)"], ["dem", "Demolição e reconstituição do pavimento (5.4)"]] },
      { k: "obraArte", r: "Obra-de-arte / meia pista", ph: "ex.: Ponte A — meia pista direita" },
      { k: "tipoPav", r: "Pavimento demolido", tipo: "select", opcoes: [["concreto", "Concreto"], ["asfaltico", "Asfáltico"]], dica: "medição: 8 c) asfáltico ou 8 d) concreto, em m³" },
    ],
    padrao: { alternativa: "rec", tipoPav: "concreto" },
    criterios: CRIT,
    extra: function (ctx) {
      var P = ctx.P, v = num(P.volume);
      ctx.linhas.push(A.linha({ id: "med", grupo: "Medição (8)", criterio: "Demolição e remoção de pavimento " + (P.tipoPav === "asfaltico" ? "asfáltico (8 c)" : "de concreto (8 d)"),
        secao: "8", situacao: "informativo", exigido: "m³", resultado: ok(v) ? fmt(v, 2) + " m³" : "informe o volume do lote",
        motivo: "medir só as etapas conformes (7)" }));
    },
    textos: {
      ACEITO: { titulo: "ETAPAS CONFORMES", texto: "Todas as etapas verificadas conforme a DNIT 085/2006-ES (7)." },
      RESSALVA: { titulo: "ETAPAS CONFORMES COM RESSALVA", texto: "Nenhuma etapa não conforme, mas há pontos a documentar." },
      PENDENTE: { titulo: "CONTROLE INCOMPLETO", texto: "Há etapas sem verificação registrada: a ES exige acompanhamento contínuo de cada etapa (7)." },
      REJEITADO: { titulo: "ETAPA(S) NÃO CONFORME(S) — REFAZER", texto: "Os serviços não conformes devem ser refeitos (7) e só medidos quando conformes." },
    },
    notas: "DNIT 085/2006-ES: inspeção 5.1, alternativas 5.2, recuperação 5.3, demolição e reconstituição 5.4, manejo ambiental 6, conformidade 7 " +
      "(acompanhamento contínuo; não conforme deve ser refeito), medição 8. A ES não fixa ensaios nem frequências: cada etapa é verificada ao menos uma vez " +
      "por lote (meia pista). 5.4 m) diz \"serradas de 8 a 12 horas após a cura\", mas a cura dura 7 dias (5.4 n): a ficha conta as 8 a 12 h a partir da concretagem.",
    exemplos: [
      { nome: "Recuperação de trechos isolados — meia pista esquerda (conforme)", dados: function () {
        return { ident: { registro: "OAE-085-01", data: "2025-08-12", obra: "Obra A", trecho: "Ponte A — meia pista esquerda", camada: "Pavimento de concreto sobre a laje" },
          params: { alternativa: "rec", obraArte: "Ponte A — meia pista esquerda", tipoPav: "concreto", estIni: "100+00", estFim: "102+10", largura: "4,20", volume: "1,85" },
          verificacoes: ver({ i1: { atende: "S" }, i2: { atende: "S" }, i3: { atende: "S" }, i4: { atende: "S", obs: "3 painéis com fraturas nos vértices" },
            r1: { atende: "S" }, r2: { atende: "S", real: "3" }, r3: { atende: "S" }, c1: { atende: "S", real: "4" }, c2: { atende: "S" }, c3: { atende: "S", real: "3" }, c4: { atende: "S" } }),
          carga: [{ pos: "placa de regulamentação", v: "24" }], vel: [{ pos: "placa de regulamentação", v: "20" }],
          r4: [{ pos: "painel 1 → painel 2", v: "10" }, { pos: "painel 2 → painel 3", v: "9" }] };
      } },
      { nome: "Demolição e reconstituição — velocidade, cura e serragem fora do exigido (refazer)", dados: function () {
        return { ident: { registro: "OAE-085-02", data: "2025-09-03", obra: "Obra B", trecho: "Viaduto B — meia pista direita", camada: "Sobre-laje de concreto armado" },
          params: { alternativa: "dem", obraArte: "Viaduto B — meia pista direita", tipoPav: "concreto", estIni: "40+00", estFim: "42+10", largura: "5,00", volume: "8,40" },
          verificacoes: ver({ i1: { atende: "S" }, i2: { atende: "S" }, i3: { atende: "S" }, i4: { atende: "S" }, d0: { atende: "S" }, d1: { atende: "S" }, d3: { atende: "S" },
            d4: { atende: "S", real: "2" }, c1: { atende: "S" }, c2: { atende: "S" }, c3: { real: "2", nc: "1", obs: "detritos na faixa 2 antes da concretagem" }, c4: { atende: "S" } }),
          d5: [{ pos: "faixa 1", v: "10" }, { pos: "faixa 2", v: "18" }], d6: [{ pos: "faixas 1 e 2", v: "5" }],
          carga: [{ pos: "controle de acesso", v: "24" }], vel: [{ pos: "radar portátil", v: "30" }],
          d7: [{ pos: "meia pista esquerda", v: "52" }], d8: [{ pos: "meia pista esquerda", v: "7" }] };
      } },
    ],
  });
})();
