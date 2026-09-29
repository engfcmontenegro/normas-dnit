/*
 * DNIT 017/2006-ES — Drenagem — Drenos sub-horizontais — aceitação do serviço.
 * Usa FE.aceitacao.fichaSimples via FE.drenagemES (definido em es-dnit-015-2006-es.js, carregado antes).
 * Lote: o painel de drenos executado (número de drenos). Concreto das saídas: fck ≥ 15 MPa (5.1.3), fck,est ≥ fck (7.4).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.drenagemES, num = FE.num;
  var G = { MAT: "Materiais (5.1 e 7.1)", CON: "Concreto das saídas (5.1.3, 7.1 e 7.4)", EXE: "Execução (4 e 5.3)", PRO: "Verificação do produto (7.3)", AMB: "Manejo ambiental (6)" };
  function S(id, texto, secao, grupo, exigido, extra) { return D.sn(id, texto, secao, grupo, exigido, extra); }
  function corte(P) { return P.local !== "aterro"; }
  function aterro(P) { return P.local === "aterro"; }
  var POR_DRENO = { por: "contagem", a_cada: 1, qtd: "nDrenos", unidade: "dreno(s)", regra: "cada dreno instalado" };
  var CRIT = [
    { id: "diam", texto: "Tubo dreno de PVC rígido — diâmetro interno", secao: "5.1.1", grupo: G.MAT, tipo: "valor", unid: "cm", casas: 1, min: 5,
      exigido: "≥ 5 cm", metodo: "medida no recebimento", se: corte },
    S("pvc", "Tubos de PVC perfurados/ranhurados de fábrica conforme o projeto-tipo, sem furação no canteiro, sem rebarbas, ponta e bolsa, luvas rosqueadas", "5.1.1 / 7.1", G.MAT,
      "NBR 7362 ou NBR 7365; conexões estanques", { se: corte }),
    S("pead", "Tubos dreno corrugados de PEAD conforme DNIT 093-EM, conexões com peças especiais", "5.1.2 / 7.1", G.MAT, "DNIT 093-EM", { se: aterro }),
    S("manta", "Manta geotêxtil não tecido do capuz aprovada no projeto de estabilização, com permeabilidade e espessura adequadas", "5.1.4", G.MAT,
      "especificação do fabricante; ensaios de textura e granulometria"),
    S("envolv", "Materiais de envolvimento e acessórios com características controladas por ensaios", "7.1", G.MAT, "ensaios específicos"),
    // concreto
    D.itemFc({ id: "fc", secao: "5.1.3 / 7.4", grupo: G.CON, texto: "Concreto das saídas — resistência à compressão aos 28 dias (exemplares)",
      se: function (P) { return P.concreto === "sim"; } }),
    // execução
    S("locacao", "Locação dos pontos de instalação conforme projeto, ajustada aos problemas constatados", "5.3 a, h", G.EXE, "conforme projeto", { freq: POR_DRENO }),
    S("perfur", "Perfuração na profundidade de projeto; água de perfuração canalizada sem danos ao talude", "5.3 c", G.EXE, "profundidade do projeto", { freq: POR_DRENO }),
    S("capuz", "Tubos instalados com capuz de manta envolvendo toda a área de furos/ranhuras", "5.1.4 / 5.3 d", G.EXE, "capuz na extremidade interna", { se: corte, freq: POR_DRENO }),
    S("boca", "Boca de saída executada (proteção e fixação do dreno); barrilete quando previsto", "5.3 e, f", G.EXE, "conforme projeto", { freq: POR_DRENO }),
    S("aterroExe", "Drenos em aterro executados como drenos subterrâneos (DNIT 015-ES)", "5.3 j", G.EXE, "procedimento da DNIT 015-ES", { se: aterro }),
    S("tampao", "Tubos tamponados e camadas protegidas durante a construção", "4", G.EXE, "tamponamento durante toda a construção"),
    S("vistoria", "Vistoria e comprovação da operacionalidade; descargas recolhidas e lançadas em deságue adequado", "4", G.EXE,
      "aceite e retirada dos equipamentos só após a vistoria", { freq: POR_DRENO }),
    // produto
    S("geom", "Posicionamento, alinhamento e caimento conforme Notas de Serviço (topografia e gabaritos)", "7.3 / 6 d", G.PRO, "conforme projeto / Notas de Serviço"),
  ].concat(D.itensGeo("7.3", G.PRO), [
    S("acab", "Acabamento (inspeção visual)", "7.3", G.PRO, "sem prejuízo à operação hidráulica"),
    S("amb", "Manejo ambiental: excedentes removidos, proteção nos deságues, estabilidade do maciço monitorada", "6", G.AMB, "itens a) a g) do capítulo 6"),
  ]);

  var F = D.montar({
    id: "dnit-017-2006-es",
    titulo: "Drenos sub-horizontais — aceitação do serviço",
    resumo: "Controle da DNIT 017/2006-ES: tubos de PVC (Ø ≥ 5 cm) ou PEAD e manta (5.1), execução por dreno (5.3), vistoria da operacionalidade (4), " +
      "concreto das saídas (fck,est ≥ 15 MPa, NBR 12655) e verificação do produto (seções ≤ 1 %, espessuras ± 10 %).",
    lote: { largura: false },
    refs: { reprova: "7.4", atende: "7.4", regra: "7.3/7.4" },
    params: [
      { k: "local", r: "Local dos drenos", tipo: "select", recarrega: true, opcoes: [["corte", "Talude de corte / encosta — tubos de PVC"], ["aterro", "Aterro — tubos PEAD"]] },
      { k: "nDrenos", r: "Número de drenos do painel", dica: "as verificações por dreno exigem uma por dreno" },
      { k: "concreto", r: "Saídas em concreto?", tipo: "select", recarrega: true, opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "fck", r: "fck do concreto das saídas (MPa)", se: function (d) { return (d.params || {}).concreto === "sim"; }, dica: "mínimo de 15 MPa aos 28 dias (5.1.3)" },
    ].concat(D.paramsConcreto(function (d) { return (d.params || {}).concreto === "sim"; })),
    padrao: { local: "corte", concreto: "sim", fck: "15", amostragem: "parcial", condicao: "B" },
    criterios: CRIT,
    extra: function (ctx) {
      var P = ctx.P, fck = num(P.fck);
      if (FE.ok(fck) && fck < 15) ctx.avisos.push("fck de " + FE.fmt(fck, 1) + " MPa abaixo do mínimo de 15 MPa da ES (5.1.3) — usado 15 MPa.");
      D.extraConcreto(ctx, [{ id: "fc", fck: FE.ok(fck) ? Math.max(fck, 15) : 15, secao: "7.4" }]);
    },
    notas: "Critérios da DNIT 017/2006-ES. Tubo de PVC com diâmetro interno ≥ 5 cm (5.1.1); concreto das saídas com fck ≥ 15 MPa aos 28 dias (5.1.3) e fck,est ≥ fck (7.4), " +
      "fck,est pela NBR 12655; seções transversais com desvio ≤ 1 % em pontos isolados e espessuras em ± 10 % (7.3). Locação, perfuração, capuz, boca de saída e " +
      "vistoria verificados em cada dreno.",
  });

  function V(mapa) { return D.verificacoes(CRIT, mapa); }
  F.exemplos = [
    { nome: "Painel de 8 drenos em talude de corte — aceito", dados: function () {
      var n8 = { atende: "", real: "8", nc: "0" };
      return {
        ident: { registro: "LOTE-DSH-01", obra: "Obra A", trecho: "BR-000 — corte", camada: "Painel de drenos sub-horizontais LD", data: "2026-03-10" },
        params: { estIni: "300", estFim: "304", local: "corte", nDrenos: "8", concreto: "sim", fck: "15", amostragem: "parcial", condicao: "B" },
        verificacoes: V({ locacao: n8, perfur: n8, capuz: n8, boca: n8, vistoria: n8 }),
        diam: [{ pos: "lote de tubos 1", v: "5,0" }, { pos: "lote de tubos 2", v: "5,1" }],
        fc: [{ pos: "E1", v: "17,4" }, { pos: "E2", v: "16,8" }, { pos: "E3", v: "18,1" }, { pos: "E4", v: "17,0" }, { pos: "E5", v: "16,5" }, { pos: "E6", v: "18,6" }, { pos: "E7", v: "17,9" }],
        geoSec: [{ est: "301", elem: "boca de saída — largura", proj: "40", med: "40,2" }, { est: "303", elem: "boca de saída — largura", proj: "40", med: "39,8" }],
        geoEsp: [{ est: "301", elem: "parede da boca", proj: "10", med: "10,4" }, { est: "303", elem: "parede da boca", proj: "10", med: "9,6" }],
      };
    } },
    { nome: "Painel de 6 drenos — tubo com Ø 4 cm, dreno sem vistoria e concreto com fck,est < 15 MPa (rejeitado)", dados: function () {
      var n6 = { atende: "", real: "6", nc: "0" };
      return {
        ident: { registro: "LOTE-DSH-02", obra: "Obra B", trecho: "BR-000 — encosta", camada: "Painel de drenos sub-horizontais LE", data: "2026-04-02" },
        params: { estIni: "120", estFim: "122", local: "corte", nDrenos: "6", concreto: "sim", fck: "15", amostragem: "parcial", condicao: "B" },
        verificacoes: V({ locacao: n6, perfur: n6, capuz: n6, boca: n6, vistoria: { real: "5", nc: "0", obs: "dreno 6 sem vistoria" } }),
        diam: [{ pos: "lote de tubos 1", v: "4,0" }],
        fc: [{ pos: "E1", v: "15,2" }, { pos: "E2", v: "16,0" }, { pos: "E3", v: "14,1" }, { pos: "E4", v: "15,8" }, { pos: "E5", v: "13,9" }, { pos: "E6", v: "16,4" }],
        geoSec: [{ est: "121", elem: "boca de saída — largura", proj: "40", med: "40,3" }],
        geoEsp: [{ est: "121", elem: "parede da boca", proj: "10", med: "10,2" }],
      };
    } },
  ];
})();
