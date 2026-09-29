/*
 * Ficha de ES: DNIT 082/2006-ES — Furos e chumbadores para ancoragem de armaduras (pós-concretagem).
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function sol(v) { return function (P) { return P.solic === v; }; }
  function trCis(P) { return P.solic !== "compressao"; }
  function quim(P) { return trCis(P) && P.tipo === "quimico"; }
  function hef(P) { return num(P.hef); }
  // espaçamento e distância à borda mínimos em hef (5.1; 5.2)
  function kEsp(P) { return P.solic === "tracao" && P.tipo === "quimico" ? 2 : 4; }
  function kBorda(P) { return P.solic === "tracao" && P.tipo === "quimico" ? 1 : 2; }

  A.fichaSimples({
    id: "dnit-082-2006-es",
    titulo: "Furos e chumbadores para ancoragem de armaduras — aceitação",
    resumo: "Geometria dos chumbadores de pós-concretagem (5.1 tração; 5.2 cisalhamento; 5.3 compressão): embutimento efetivo hef ≥ 20 φ (adesão química), espaçamento ≥ 2 hef ou 4 hef, " +
      "distância à borda ≥ 1 hef ou 2 hef, espessura do membro ≥ 1,5 hef, furo ≈ φ + 3 mm (φ + 10 mm na compressão), inclinação até 15° no cisalhamento; capacidade por ensaio " +
      "minorada por coeficiente ≥ 5 no cisalhamento; inspeção das etapas da seção 7.1 — etapa não conforme paralisa os serviços (7.2).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "solic", r: "Solicitação do chumbador", tipo: "select", recarrega: true,
        opcoes: [["tracao", "Tração (5.1)"], ["cisalhamento", "Cisalhamento (5.2)"], ["compressao", "Compressão — reforço de pilares (5.3)"]] },
      { k: "tipo", r: "Tipo de chumbador (3; 4)", tipo: "select", recarrega: true,
        opcoes: [["quimico", "Adesão química (resina)"], ["outro", "Demais (expansão, segurança, grout)"]], se: function (d) { return trCis(d.params || {}); } },
      { k: "phi", r: "Diâmetro do chumbador / barra φ (mm)" },
      { k: "hef", r: "Embutimento efetivo de projeto hef (mm)", se: function (d) { return trCis(d.params || {}); }, dica: "base do espaçamento, da distância à borda e da espessura mínima" },
      { k: "lb", r: "Comprimento de ancoragem da armadura de reforço (mm)", se: function (d) { return (d.params || {}).solic === "compressao"; } },
      { k: "nChumb", r: "Nº de chumbadores executados", dica: "a geometria é conferida em cada chumbador" },
    ],
    padrao: { solic: "tracao", tipo: "quimico", nChumb: "1" },
    textos: G.textos("Etapa não conforme: os serviços são paralisados e só retomados após a eliminação dos serviços não conformes (7.2)."),
    criterios: [
      G.itPlataforma("7.1 a"),
      G.itSinalizacao("7.1 b"),
      { id: "locacao", grupo: "Furos", texto: "Locação dos furos conforme projeto", secao: "7.1 c", tipo: "sim_nao" },
      { id: "execucao", grupo: "Furos", texto: "Furos executados com perfuratriz rotativa", secao: "3; 7.1 d", tipo: "sim_nao" },
      { id: "limpeza", grupo: "Furos", texto: "Furos limpos com jato de ar", secao: "5.1; 5.3; 7.1 e", tipo: "sim_nao" },
      { id: "enchimento", grupo: "Furos", texto: "Furo completamente preenchido (resina ou grout) antes da introdução da barra, que expulsa o excesso", secao: "5.1; 5.2; 5.3; 7.1 f", tipo: "sim_nao",
        se: function (P) { return P.tipo === "quimico" || P.solic === "compressao"; }, naoAplicaPor: "ancoragem mecânica" },
      { id: "direcao", grupo: "Chumbadores", texto: "Chumbador na direção da força de tração; carga no eixo (isolado) ou no centro de gravidade (grupo)", secao: "5.1", tipo: "sim_nao",
        se: sol("tracao"), naoAplicaPor: "não é chumbador de tração" },
      { id: "fluencia", grupo: "Chumbadores", texto: "Fluência da resina avaliada na mais alta temperatura de serviço", secao: "4", tipo: "sim_nao",
        se: function (P) { return P.tipo === "quimico" && trCis(P); }, naoAplicaPor: "ancoragem não química" },
      { id: "hefMed", grupo: "Geometria (por chumbador)", texto: "Embutimento efetivo hef", secao: "5.1; 5.2", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return Math.max(20 * num(P.phi), hef(P)); }, se: quim, naoAplicaPor: "hef mínimo só definido para adesão química",
        freq: { por: "contagem", a_cada: 1, qtd: "nChumb", unidade: "chumbador(es)", regra: "cada chumbador" } },
      { id: "espac", grupo: "Geometria (por chumbador)", texto: "Espaçamento entre chumbadores (eixo a eixo)", secao: "5.1; 5.2", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return kEsp(P) * hef(P); }, se: trCis, naoAplicaPor: "compressão" },
      { id: "borda", grupo: "Geometria (por chumbador)", texto: "Distância do eixo à borda do membro", secao: "5.1; 5.2", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return kBorda(P) * hef(P); }, se: trCis, naoAplicaPor: "compressão" },
      { id: "espMembro", grupo: "Geometria (por chumbador)", texto: "Espessura do membro estrutural", secao: "5.1; 5.2", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return 1.5 * hef(P); }, se: trCis, naoAplicaPor: "compressão" },
      { id: "folga", grupo: "Geometria (por chumbador)", texto: "Folga do furo (diâmetro do furo − φ)", secao: "5.1; 5.2", tipo: "valor", unid: "mm", casas: 1, min: 2, max: 4, falha: "ressalva",
        exigido: "cerca de 3,0 mm (aceito 2 a 4 mm)", se: quim, naoAplicaPor: "só para adesão química" },
      { id: "angulo", grupo: "Geometria (por chumbador)", texto: "Ângulo do chumbador com a superfície do concreto", secao: "5.2", tipo: "valor", unid: "°", casas: 0, min: 75, max: 90,
        exigido: "90°, reduzido em até 15° (≥ 75°)", se: sol("cisalhamento"), naoAplicaPor: "não é chumbador de cisalhamento" },
      { id: "folgaC", grupo: "Geometria (por chumbador)", texto: "Folga do furo (diâmetro do furo − φ)", secao: "5.3", tipo: "valor", unid: "mm", casas: 0, min: 10,
        exigido: "≥ 10 mm (diâmetro ≥ φ + 1 cm)", se: sol("compressao"), naoAplicaPor: "não é chumbador de compressão",
        freq: { por: "contagem", a_cada: 1, qtd: "nChumb", unidade: "chumbador(es)", regra: "cada chumbador" } },
      { id: "compFuro", grupo: "Geometria (por chumbador)", texto: "Comprimento do furo", secao: "5.3", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return num(P.lb); }, falha: "ressalva", se: sol("compressao"), naoAplicaPor: "não é chumbador de compressão" },
      { id: "coef", grupo: "Capacidade de carga", texto: "Coeficiente de segurança (carga resistente no ensaio ÷ carga de cálculo)", secao: "5.2", tipo: "valor", unid: "", casas: 1, min: 5,
        exigido: "≥ 5", metodo: "ensaio de cisalhamento no local (NBR 14827)", se: sol("cisalhamento"), naoAplicaPor: "não é chumbador de cisalhamento" },
      { id: "ensaios", grupo: "Capacidade de carga", texto: "Ensaios de capacidade de carga (no local, para os de maior responsabilidade) com resultados minorados", secao: "4; 7.1 h", tipo: "sim_nao",
        se: trCis, naoAplicaPor: "compressão (menor responsabilidade)" },
      { id: "quantidade", grupo: "Capacidade de carga", texto: "Quantidade de chumbadores suficiente, à vista dos resultados dos ensaios", secao: "7.1 i", tipo: "sim_nao", se: trCis, naoAplicaPor: "compressão" },
      G.itManejo("6"),
    ],
    extra: function (ctx) {
      var P = ctx.P, faltaHef = !ok(hef(P)) && trCis(P), faltaPhi = !ok(num(P.phi));
      ["hefMed", "espac", "borda", "espMembro"].forEach(function (id) {
        var l = ctx.item[id];
        if (!l || l.situacao === "nao_exigido") return;
        if (faltaHef || (id === "hefMed" && faltaPhi)) A.marcar(l, "pendente", "informe " + (faltaHef ? "o hef de projeto" : "o diâmetro φ"));
        else if (id === "hefMed") l.exigido = "≥ 20 φ = " + fmt(20 * num(P.phi), 0) + " mm e ≥ hef de projeto (" + fmt(hef(P), 0) + " mm)";
        else if (id === "espac") l.exigido = "≥ " + kEsp(P) + " hef = " + fmt(kEsp(P) * hef(P), 0) + " mm";
        else if (id === "borda") l.exigido = "≥ " + kBorda(P) + " hef = " + fmt(kBorda(P) * hef(P), 0) + " mm";
        else l.exigido = "≥ 1,5 hef = " + fmt(1.5 * hef(P), 0) + " mm";
      });
      var c = ctx.item.compFuro;
      if (c && c.situacao !== "nao_exigido") {
        if (!ok(num(P.lb))) A.marcar(c, "pendente", "informe o comprimento de ancoragem");
        else c.exigido = "≈ comprimento de ancoragem (" + fmt(num(P.lb), 0) + " mm)";
      }
      if (P.solic === "compressao" && faltaPhi) ctx.avisos.push("Informe o diâmetro φ da barra.");
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 082/2006-ES (definições da NBR 14827). hef mínimo de 20 φ só é definido para os chumbadores de adesão química; para os demais valem o espaçamento de 4 hef e a " +
      "distância à borda de 2 hef. Folga do furo \"cerca de 3,0 mm\": aceita-se de 2 a 4 mm (fora: ressalva). Comprimento do furo na compressão \"proximamente igual\" ao de ancoragem: " +
      "menor que ele é ressalva. O coeficiente de segurança ≥ 5 é exigido no cisalhamento (5.2); na tração a ES pede apenas coeficientes \"elevados\" (4).",
    exemplos: [
      { nome: "Chumbadores químicos de tração φ 16 — aceitos", dados: function () {
        return { ident: { registro: "CHU-01", obra: "Obra A", local: "Ponte sobre o rio A — consolo do encontro E2", data: "2025-05-12" },
          params: { solic: "tracao", tipo: "quimico", phi: "16", hef: "320", nChumb: "4" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "4", nc: "0" }, { real: "4", nc: "0" }, { atende: "S" },
            { atende: "S", obs: "ensaio do fabricante a 60 °C" }, { atende: "S", obs: "2 ensaios de tração no local" }, { atende: "S" }, { atende: "S" }],
          hefMed: [{ est: "C1", v: "330" }, { est: "C2", v: "325" }, { est: "C3", v: "335" }, { est: "C4", v: "328" }],
          espac: [{ est: "C1–C2", v: "700" }, { est: "C2–C3", v: "680" }, { est: "C3–C4", v: "700" }],
          borda: [{ est: "C1", v: "400" }, { est: "C4", v: "380" }],
          espMembro: [{ est: "consolo", v: "600" }],
          folga: [{ est: "C1", v: "3" }, { est: "C2", v: "3" }, { est: "C3", v: "3,5" }, { est: "C4", v: "3" }] };
      } },
      { nome: "Chumbadores de cisalhamento próximos da borda e coeficiente < 5 — não conforme", dados: function () {
        return { ident: { registro: "CHU-02", obra: "Obra B", local: "Viaduto B — cantoneira de apoio da laje", data: "2025-08-28" },
          params: { solic: "cisalhamento", tipo: "quimico", phi: "12,5", hef: "250", nChumb: "3" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "3", nc: "0" }, { real: "3", nc: "0" }, {},
            { atende: "S" }, { atende: "S" }, { atende: "" }, { atende: "S" }],
          hefMed: [{ est: "C1", v: "260" }, { est: "C2", v: "255" }, { est: "C3", v: "240" }],
          espac: [{ est: "C1–C2", v: "1000" }, { est: "C2–C3", v: "1050" }],
          borda: [{ est: "C1", v: "420" }, { est: "C3", v: "510" }],
          espMembro: [{ est: "viga", v: "400" }],
          folga: [{ est: "C1", v: "3" }, { est: "C2", v: "5" }, { est: "C3", v: "3" }],
          angulo: [{ est: "C1", v: "80" }, { est: "C2", v: "78" }, { est: "C3", v: "85" }],
          coef: [{ est: "ensaio 1", reg: "carga de ruptura 96 kN ÷ 24 kN", v: "4,0" }] };
      } },
    ],
  });
})();
