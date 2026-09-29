/*
 * Ficha de ES: DNIT 092/2006-ES — Recuperação e substituição de juntas de dilatação.
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-092-2006-es";

  function tipo() { var l = [].slice.call(arguments); return function (P) { return l.indexOf(P.tipo) >= 0; }; }
  var cada = { por: "contagem", a_cada: 1, qtd: "nJuntas", unidade: "junta(s)", regra: "cada junta" };
  function it(id, grupo, texto, secao, se, extra) {
    var o = { id: id, grupo: grupo, texto: texto, secao: secao, tipo: "sim_nao", se: se, naoAplicaPor: "outro tipo de junta", freq: cada };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  function comConcreto(P) { return P.concreto === "sim"; }

  A.fichaSimples({
    id: ID,
    titulo: "Recuperação e substituição de juntas de dilatação — aceitação",
    resumo: "Condições gerais (4: transição suave, sem degraus nem recapeamento sobre a junta, livre movimentação, inspeção final sem detritos, vazamentos ou ruídos, inclusive por baixo) " +
      "e procedimentos por tipo (5): juntas abertas (argamassa polimérica; cantoneiras novas em peças ≤ 2,00 m, completamente assentadas no concreto novo; cura com tráfego interrompido), " +
      "de asfalto (substituir por junta de neoprene), compressão, fita de neoprene, JEENE, blocos de neoprene e aço, modulares e denteadas. Concreto de reconstrução fck = 30 MPa (6 f).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "tipo", r: "Tipo de junta", tipo: "select", recarrega: true,
        opcoes: [["aberta", "Aberta sem proteção (5.1)"], ["cantoneira", "Aberta com cantoneiras de aço (5.1)"], ["asfalto", "De asfalto (5.2.2)"], ["compressao", "De compressão (5.2.3)"],
          ["fita", "Fita de neoprene (5.2.4)"], ["jeene", "JEENE (5.2.5)"], ["bloco", "Blocos de neoprene e chapas de aço — tipo Transiflex (5.2.6)"],
          ["modular", "Modular expansível (5.2.7)"], ["denteada", "Denteada — finger joint (5.2.8)"]] },
      { k: "concreto", r: "Houve demolição e reconstrução de trecho de laje / berço em concreto? (5.1; 6 f)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "nJuntas", r: "Nº de juntas recuperadas ou substituídas" },
    ].concat(G.paramsConcreto({ se: comConcreto, rotuloFck: "fck do concreto (MPa) — vazio: 30 MPa (6 f)" })),
    padrao: Object.assign({ tipo: "compressao", concreto: "nao", nJuntas: "1" }, G.padraoConcreto),
    textos: G.textos("Serviço não conforme: deve ser refeito antes do prosseguimento dos serviços (8)."),
    criterios: [
      G.itEngenheiro("7; 8", "Geral"),
      G.itSinalizacao("6 a, b", "Geral"),
      it("fabricante", "Geral", "Recuperação/substituição de juntas complexas pelo fabricante ou empresa por ele indicada", "5.2.6; 5.2.8; 8",
        tipo("jeene", "bloco", "modular", "denteada"), { falha: "ressalva" }),
      it("transicao", "Condições gerais", "Transição suave entre acessos e ponte; recapeamento sem degraus, sem obstruir ou cobrir a junta", "4 a, e", null, { naoAplicaPor: "" }),
      it("inspFinal", "Condições gerais", "Inspeção final: sem pedras/detritos, sem vazamentos, sem ruídos à passagem dos veículos; parte inferior inspecionada", "4 d, g", null),
      it("aberta", "Junta aberta", "Cantos recuperados com argamassa polimérica de alta resistência; cura respeitada com o tráfego interrompido", "5.1", tipo("aberta")),
      it("cantAssent", "Junta aberta com cantoneiras", "Cantoneiras novas completamente assentadas no concreto novo, fixadas por parafusos novos; cura com tráfego interrompido",
        "5.1", tipo("cantoneira", "compressao")),
      { id: "cantComp", grupo: "Junta aberta com cantoneiras", texto: "Comprimento de cada peça de cantoneira", secao: "5.1", tipo: "valor", unid: "m", casas: 2, max: 2,
        exigido: "≤ 2,00 m (evita empenamento)", metodo: "trena", se: tipo("cantoneira", "compressao"), naoAplicaPor: "sem cantoneiras" },
      it("asfalto", "Junta de asfalto", "Junta de asfalto com mau funcionamento substituída por junta de neoprene", "5.2.2", tipo("asfalto")),
      it("compr", "Junta de compressão", "Bloco de neoprene alveolar substituído se descolado ou sem elasticidade; perfis calçados, sem empenamento nem corrosão", "5.2.3", tipo("compressao")),
      it("fita", "Fita de neoprene", "Fita rompida substituída por outra igual, abaixo do nível do pavimento e sem detritos", "5.2.4", tipo("fita")),
      it("jeene", "JEENE", "Câmara elástica substituída; lábios poliméricos com os materiais indicados e especificações construtivas atendidas", "5.2.5", tipo("jeene")),
      it("bloco", "Blocos de neoprene e aço", "Módulos substituídos; berços sem trincas, parafusos apertados, reentrâncias superiores livres de detritos", "5.2.6", tipo("bloco")),
      it("modular", "Junta modular", "Módulos recuperados e estruturas auxiliares de suporte dos apoios intermediários verificadas", "5.2.7", tipo("modular")),
      it("denteada", "Junta denteada", "Chapas firmemente fixadas, soldas sem trincas, dentes encaixados, sem corrosão; calha coletando as águas", "5.2.8", tipo("denteada")),
    ].concat(G.itensConcreto({ se: comConcreto, secao: "6 f", grupo: "Concreto" })).concat([G.itManejo("6")]),
    extra: function (ctx) {
      G.extraConcreto(ctx, { fck: function (P) { var f = num(P.fck); return ok(f) ? f : 30; }, secao: ok(num(ctx.P.fck)) ? "projeto" : "6 f" });
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 092/2006-ES. Verificações de cada junta (informe realizadas / não conformes). Peças de cantoneira ≤ 2,00 m (5.1); na junta de compressão com perfis de " +
      "sustentação valem os procedimentos das juntas abertas (5.2.3). Concreto de reconstrução com fck = 30 MPa (6 f; 9 f) quando não houver outro de projeto." + G.notaConcreto,
    exemplos: [
      { nome: "Duas juntas de compressão com cantoneiras novas e concreto C30 — aceito", dados: function () {
        var d = { ident: { registro: "JUN-01", obra: "Obra A", local: "Ponte sobre o rio A — juntas J1 e J2", data: "2025-05-06" },
          params: { tipo: "compressao", concreto: "sim", nJuntas: "2", fck: "", condPreparo: "A", amostragem: "parcial", volConc: "2,4", abatEsp: "100", abatTol: "20" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { real: "2", nc: "0" }, { real: "2", nc: "0" }, {}, { real: "2", nc: "0" }, {}, { real: "2", nc: "0" }, {}, {}, {}, {}, {}, { atende: "S" }],
          cantComp: [{ est: "J1", v: "2,00" }, { est: "J1", v: "1,80" }, { est: "J2", v: "2,00" }, { est: "J2", v: "1,80" }],
          fc: G.fcTabela(["33,4", "34,1", "32,8", "35,0", "33,9", "34,6"], "J1/J2"),
          abat: [{ est: "J1", reg: "caminhão 1", v: "95" }, { est: "J2", reg: "caminhão 2", v: "110" }] };
        return d;
      } },
      { nome: "Cantoneira longa, vazamento e caminhão fora do abatimento (DNER-ME 404) — não conforme", dados: function () {
        var d = { ident: { registro: "JUN-02", obra: "Obra B", local: "Viaduto B — junta J3", data: "2025-08-26" },
          params: { tipo: "cantoneira", concreto: "sim", nJuntas: "1", fck: "", condPreparo: "A", amostragem: "parcial", volConc: "1,2", abatEsp: "100", abatTol: "20" },
          fc: G.fcTabela(["37,0", "38,0"], "J3"),
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "N", obs: "vazamento sob a junta após chuva" }, {}, { atende: "S" }, {}, {}, {}, {}, {}, {}, {}, { atende: "S" }],
          cantComp: [{ est: "J3", v: "2,00" }, { est: "J3", v: "2,60" }, { est: "J3", v: "2,00" }] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "imp_abat", [["dner-me-404-00", 1]]);
        return d;
      } },
    ],
  });
})();
