/*
 * Ficha de ES: DNIT 089/2006-ES — Pingadeiras em placas pré-moldadas.
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function porPlaca(min) { return { por: "contagem", a_cada: 1, qtd: "nAmostra", minimo: min || 1, unidade: "placa(s)", regra: "placas inspecionadas" }; }

  A.fichaSimples({
    id: "dnit-089-2006-es",
    titulo: "Pingadeiras em placas pré-moldadas — aceitação",
    resumo: "Superfície apicoada, alinhada e revestida com argamassa 1:3 (4; 7.1 a); fixação com argamassa de epóxi e dois parafusos por placa — φ ≥ 6 mm, comprimento ≥ 30 cm, " +
      "pintados com epóxi, em furos de φ ≥ 10 mm e 20 cm (4; 7.1 b); placas com espessura mínima (5), coladas sem folgas, sem espaço entre placas adjacentes (7.1 c) e com " +
      "extremidade inferior ≥ 5 cm abaixo da superfície a proteger (5; 7.1 d). Etapa não atendida → refazer (7.2).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "extensao", r: "Extensão de pingadeira (m)", dica: "critério de medição (8)" },
      { k: "nPlacas", r: "Nº de placas instaladas" },
      { k: "nAmostra", r: "Nº de placas inspecionadas (medições)", dica: "a ES não fixa a amostragem; a inspeção (7.1) abrange todas as etapas" },
      { k: "espMin", r: "Espessura mínima da placa (mm)", ph: "60", dica: "5: \"seis centímetros\" — mas a placa cimentícia indicada na própria seção 5 tem 6 mm (ver notas)" },
    ],
    padrao: { espMin: "60", nAmostra: "1" },
    textos: G.textos("Etapa do 7.1 não atendida satisfatoriamente: o serviço não é conforme e deve ser refeito (7.2)."),
    criterios: [
      G.itPlataforma("4; 6 a"),
      { id: "superficie", grupo: "Superfície de apoio", texto: "Superfície apicoada, alinhada e revestida com argamassa cimento-areia 1:3 desempenada", secao: "4; 7.1 a", tipo: "sim_nao" },
      { id: "epoxi", grupo: "Fixação", texto: "Placas coladas com argamassa de epóxi, perfeitamente, sem folgas em toda a extensão", secao: "4; 5; 7.1 b", tipo: "sim_nao" },
      { id: "parafProt", grupo: "Fixação", texto: "Parafusos e complementos pintados com epóxi, fixados com argamassa de epóxi, com arruelas e porcas", secao: "4; 7.1 b", tipo: "sim_nao" },
      { id: "nParaf", grupo: "Fixação", texto: "Parafusos por placa", secao: "4", tipo: "valor", unid: "", casas: 0, min: 2, freq: porPlaca() },
      { id: "diamParaf", grupo: "Fixação", texto: "Diâmetro dos parafusos", secao: "4", tipo: "valor", unid: "mm", casas: 1, min: 6, metodo: "paquímetro", freq: porPlaca() },
      { id: "compParaf", grupo: "Fixação", texto: "Comprimento dos parafusos", secao: "4", tipo: "valor", unid: "cm", casas: 1, min: 30, freq: porPlaca() },
      { id: "diamFuro", grupo: "Fixação", texto: "Diâmetro dos furos", secao: "4", tipo: "valor", unid: "mm", casas: 1, min: 10, freq: porPlaca() },
      { id: "compFuro", grupo: "Fixação", texto: "Comprimento (profundidade) dos furos", secao: "4", tipo: "valor", unid: "cm", casas: 1, min: 20, exigido: "20 cm", freq: porPlaca() },
      { id: "espPlaca", grupo: "Placas", texto: "Espessura das placas", secao: "5", tipo: "valor", unid: "mm", casas: 1, min: function (P) { return num(P.espMin); }, metodo: "paquímetro", freq: porPlaca() },
      { id: "material", grupo: "Placas", texto: "Placas cimentícias (sem armadura sem os cobrimentos da NBR 6118)", secao: "5", tipo: "sim_nao", falha: "ressalva" },
      { id: "juntas", grupo: "Placas", texto: "Espaço longitudinal praticamente nulo entre placas adjacentes", secao: "5; 7.1 c", tipo: "sim_nao" },
      { id: "livre", grupo: "Placas", texto: "Folga entre a aresta inferior da superfície a proteger e a da placa (extremidade livre)", secao: "5; 7.1 d", tipo: "valor", unid: "cm", casas: 1, min: 5,
        metodo: "trena", freq: porPlaca() },
      G.itManejo("6"),
    ],
    extra: function (ctx) {
      var l = ctx.item.espPlaca;
      if (l && !ok(num(ctx.P.espMin))) A.marcar(l, "pendente", "informe a espessura mínima");
      var np = num(ctx.P.nPlacas), na = num(ctx.P.nAmostra);
      if (ok(np) && ok(na) && na > np) ctx.avisos.push("Mais placas inspecionadas (" + na + ") que instaladas (" + np + ").");
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 089/2006-ES. Espessura mínima: a seção 5 exige \"seis centímetros\", mas indica como placa de fácil aquisição a de \"200/120/6 mm\" (28,8 kg), que só fecha com " +
      "6 mm de espessura — a ficha usa 60 mm (texto da ES) como padrão, editável. O comprimento dos furos (\"de 20 cm\") é tomado como mínimo. A ES não fixa a amostragem: " +
      "as medições valem para as placas inspecionadas informadas.",
    exemplos: [
      { nome: "Pingadeira em placas cimentícias de 60 mm — aceita", dados: function () {
        return { ident: { registro: "PIN-01", obra: "Obra A", local: "Ponte sobre o rio A — balanço direito", data: "2025-07-08" },
          params: { extensao: "40", nPlacas: "20", nAmostra: "3", espMin: "60" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          nParaf: [{ est: "placa 2", v: "2" }, { est: "placa 9", v: "2" }, { est: "placa 17", v: "2" }],
          diamParaf: [{ est: "placa 2", v: "8" }, { est: "placa 9", v: "8" }, { est: "placa 17", v: "8" }],
          compParaf: [{ est: "placa 2", v: "30" }, { est: "placa 9", v: "31" }, { est: "placa 17", v: "30" }],
          diamFuro: [{ est: "placa 2", v: "12" }, { est: "placa 9", v: "12" }, { est: "placa 17", v: "12" }],
          compFuro: [{ est: "placa 2", v: "20" }, { est: "placa 9", v: "21" }, { est: "placa 17", v: "20" }],
          espPlaca: [{ est: "placa 2", v: "61" }, { est: "placa 9", v: "60" }, { est: "placa 17", v: "62" }],
          livre: [{ est: "placa 2", v: "6,0" }, { est: "placa 9", v: "5,5" }, { est: "placa 17", v: "6,5" }] };
      } },
      { nome: "Placas com folgas, parafuso curto e extremidade livre insuficiente — não conforme", dados: function () {
        return { ident: { registro: "PIN-02", obra: "Obra B", local: "Viaduto B — balanço esquerdo", data: "2025-09-12" },
          params: { extensao: "30", nPlacas: "15", nAmostra: "3", espMin: "60" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "3", nc: "1", obs: "fresta de 8 mm entre as placas 6 e 7" }, { atende: "S" }],
          nParaf: [{ est: "placa 3", v: "2" }, { est: "placa 7", v: "2" }, { est: "placa 12", v: "2" }],
          diamParaf: [{ est: "placa 3", v: "6,3" }, { est: "placa 7", v: "6,3" }, { est: "placa 12", v: "6,3" }],
          compParaf: [{ est: "placa 3", v: "30" }, { est: "placa 7", v: "25" }, { est: "placa 12", v: "30" }],
          diamFuro: [{ est: "placa 3", v: "10" }, { est: "placa 7", v: "10" }, { est: "placa 12", v: "10" }],
          compFuro: [{ est: "placa 3", v: "20" }, { est: "placa 7", v: "18" }, { est: "placa 12", v: "20" }],
          espPlaca: [{ est: "placa 3", v: "60" }, { est: "placa 7", v: "60" }, { est: "placa 12", v: "60" }],
          livre: [{ est: "placa 3", v: "5,0" }, { est: "placa 7", v: "3,5" }, { est: "placa 12", v: "5,5" }] };
      } },
    ],
  });
})();
