/*
 * DNIT 019/2023-ES — Drenagem — Transposição de sarjetas e valetas — aceitação do serviço.
 * Usa FE.aceitacao.fichaSimples via FE.drenagemES (definido em es-dnit-015-2006-es.js, carregado antes).
 * Concreto das lajes pré-moldadas fck ≥ 25 MPa (5.1.1) e da base de assentamento fck ≥ 20 MPa (5.1.2, 5.3 e); fck,est ≥ fck (7.3).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.drenagemES, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var G = { MAT: "Materiais (5.1 e 7.1)", EXE: "Execução (5.3)", PRO: "Verificação do produto (7.2)", AMB: "Condicionantes ambientais (6)" };
  function S(id, texto, secao, grupo, exigido, extra) { return D.sn(id, texto, secao, grupo, exigido, extra); }
  function laje(P) { return P.solucao !== "tubo"; }
  function tubo(P) { return P.solucao === "tubo"; }
  var CRIT = [
    D.itemFc({ id: "fcLaje", secao: "5.1.1 / 7.3", grupo: G.MAT, texto: "Concreto das lajes pré-moldadas — resistência aos 28 dias (exemplares)", se: laje }),
    D.itemFc({ id: "fcBase", secao: "5.1.2 / 5.3 e / 7.3", grupo: G.MAT, texto: "Concreto da base de assentamento — resistência aos 28 dias (exemplares)" }),
    D.itemAbat({ id: "abat", secao: "7.1", grupo: G.MAT }),
    S("consist", "Ensaio de consistência nas ocasiões do 7.1", "7.1", G.MAT,
      "alteração da umidade dos agregados, 1ª amassada do dia, reinício após > 2 h, moldagem de CPs e troca de operador"),
    S("aco", "Aço CA-50 conforme NBR 7480; armaduras das lajes conforme projeto e DNIT 118-ES", "5.1.1 / 5.3", G.MAT, "CA-50; plano de amostragem prévio", { se: laje }),
    S("tuboNBR", "Tubo de concreto conforme NBR 8890 (solução alternativa e temporária)", "5.3 Nota 3", G.MAT, "NBR 8890", { se: tubo }),
    // execução
    S("interr", "Interrupção da sarjeta/valeta no segmento do acesso e demarcação de níveis, cotas e alinhamento", "5.3 a, b", G.EXE, "conforme projeto"),
    S("escav", "Escavação e apiloamento com base firme e bem desempenada", "5.3 c, d", G.EXE, "base firme e desempenada"),
    S("comple", "Complementação da sarjeta ou valeta conforme DNIT 018-ES", "5.3 f", G.EXE, "DNIT 018-ES"),
    S("modulos", "Lajes em módulos de 0,50 m, adensadas por vibração, içadas e instaladas", "5.3 g / Nota 2", G.EXE, "módulos de 0,50 m; fôrmas metálicas ou de madeira revestida", { se: laje }),
    { id: "compr", texto: "Comprimento do segmento de transposição", secao: "5.3", grupo: G.EXE, tipo: "valor", unid: "m", casas: 2, max: 3.0, exigido: "≤ 3,0 m" },
    { id: "rampa", texto: "Declividade transversal das rampas adjacentes ao acostamento", secao: "5.3", grupo: G.EXE, tipo: "valor", unid: "%", casas: 1, max: 25,
      exigido: "≤ 25 % (4H:1V)" },
    S("rejunte", "Tubo rejuntado em toda a circunferência e envolto em concreto na geometria do projeto", "5.3 Nota 3", G.EXE, "estanqueidade", { se: tubo }),
    { id: "recob", texto: "Recobrimento de concreto sobre a geratriz superior do tubo", secao: "5.3 Nota 3", grupo: G.EXE, tipo: "valor", unid: "cm", casas: 0, min: 15, se: tubo },
    // produto
    S("posic", "Dimensões e posicionamento do dispositivo conforme projeto / Notas de Serviço", "7.2.1", G.PRO, "conforme projeto"),
  ].concat(D.itensGeo("7.2.1", G.PRO), [
    S("acab", "Acabamento (inspeção visual)", "7.2.2", G.PRO, "sem prejuízo à operação hidráulica do dispositivo"),
    S("amb", "Condicionantes ambientais (DNIT 070-PRO e componente ambiental do projeto)", "6", G.AMB, "conforme documentação ambiental"),
  ]);

  var F = D.montar({
    id: "dnit-019-2023-es",
    titulo: "Transposição de sarjetas e valetas — aceitação do serviço",
    resumo: "Controle da DNIT 019/2023-ES: concreto das lajes (fck ≥ 25 MPa) e da base (fck ≥ 20 MPa) com fck,est ≥ fck (NBR 12655), consistência, aço, " +
      "execução (segmento ≤ 3,0 m, rampas ≤ 25 %, recobrimento do tubo ≥ 15 cm) e verificação do produto (seções ≤ 1 %, espessuras ± 10 %).",
    lote: { largura: false },
    refs: { reprova: "7.3", atende: "7.3", regra: "7.3" },
    params: [
      { k: "solucao", r: "Solução de transposição", tipo: "select", recarrega: true,
        opcoes: [["laje", "Laje de concreto armado pré-moldada"], ["tubo", "Tubo de concreto envolto em concreto (alternativa temporária, Nota 3)"]] },
      { k: "fckLaje", r: "fck do concreto das lajes (MPa)", se: function (d) { return laje(d.params || {}); }, dica: "mínimo de 25 MPa aos 28 dias (5.1.1)" },
      { k: "fckBase", r: "fck do concreto da base de assentamento (MPa)", dica: "mínimo de 20 MPa aos 28 dias (5.1.2)" },
    ].concat(D.paramsConcreto()),
    padrao: { solucao: "laje", fckLaje: "25", fckBase: "20", amostragem: "parcial", condicao: "B" },
    criterios: CRIT,
    extra: function (ctx) {
      var P = ctx.P, fl = num(P.fckLaje), fb = num(P.fckBase);
      if (ok(fl) && fl < 25) ctx.avisos.push("fck das lajes de " + fmt(fl, 1) + " MPa abaixo do mínimo de 25 MPa (5.1.1) — usado 25 MPa.");
      if (ok(fb) && fb < 20) ctx.avisos.push("fck da base de " + fmt(fb, 1) + " MPa abaixo do mínimo de 20 MPa (5.1.2) — usado 20 MPa.");
      D.extraConcreto(ctx, [{ id: "fcLaje", fck: ok(fl) ? Math.max(fl, 25) : 25, secao: "7.3" }, { id: "fcBase", fck: ok(fb) ? Math.max(fb, 20) : 20, secao: "7.3" }], "abat");
    },
    notas: "Critérios da DNIT 019/2023-ES. Lajes com fck ≥ 25 MPa e base com fck ≥ 20 MPa aos 28 dias (5.1), fck,est ≥ fck (7.3), fck,est pela NBR 12655. " +
      "Segmentos com comprimento ≤ 3,0 m e rampas com declividade transversal ≤ 25 % (5.3); na solução com tubo, recobrimento ≥ 15 cm sobre a geratriz (Nota 3). " +
      "Seções transversais com desvio ≤ 1 % em pontos isolados e espessuras em ± 10 % (7.2.1). Detalhe incorreto deve ser corrigido; só é aceito se a correção o colocar em conformidade (7.3).",
  });

  function V(mapa) { return D.verificacoes(CRIT, mapa); }
  F.exemplos = [
    { nome: "Transposição com lajes pré-moldadas em acesso — aceita", dados: function () {
      return {
        ident: { registro: "LOTE-TS-01", obra: "Obra A", trecho: "BR-000 — acesso lateral", camada: "Transposição de sarjeta — acesso 1", data: "2026-07-14" },
        params: { estIni: "88", estFim: "88+03", solucao: "laje", fckLaje: "25", fckBase: "20", amostragem: "excepcional", condicao: "A", volConc: "4",
          abat: "80", abatTol: "20" },
        verificacoes: V({}),
        fcLaje: [{ pos: "E1", v: "29,8" }, { pos: "E2", v: "31,2" }, { pos: "E3", v: "30,5" }],
        fcBase: [{ pos: "E1", v: "25,6" }, { pos: "E2", v: "25,0" }],
        abat: [{ pos: "base", v: "75" }, { pos: "lajes", v: "90" }],
        compr: [{ est: "88", v: "3,00" }],
        rampa: [{ est: "88", pos: "rampa montante", v: "22,0" }, { est: "88+03", pos: "rampa jusante", v: "24,5" }],
        geoSec: [{ est: "88+01", elem: "largura interna do canal", proj: "40", med: "40,3" }, { est: "88+02", elem: "altura do canal", proj: "30", med: "29,8" }],
        geoEsp: [{ est: "88+01", elem: "laje", proj: "12", med: "12,5" }, { est: "88+02", elem: "base de assentamento", proj: "10", med: "10,6" }],
      };
    } },
    { nome: "Transposição com lajes — rampa íngreme, abatimento fora e lajes com fck,est < 25 MPa (rejeitada)", dados: function () {
      var d = {
        ident: { registro: "LOTE-TS-02", obra: "Obra B", trecho: "BR-000 — acesso lateral", camada: "Transposição de valeta — acesso 2", data: "2026-08-03" },
        params: { estIni: "15", estFim: "15+03", solucao: "laje", fckLaje: "25", fckBase: "20", amostragem: "parcial", condicao: "B", abat: "100", abatTol: "20" },
        verificacoes: V({ acab: { atende: "N", obs: "junta aberta entre módulos 3 e 4" } }),
        fcLaje: [{ pos: "E1", v: "26,1" }, { pos: "E2", v: "24,8" }, { pos: "E3", v: "27,0" }, { pos: "E4", v: "23,9" }, { pos: "E5", v: "25,5" }, { pos: "E6", v: "26,4" }],
        fcBase: [{ pos: "E1", v: "22,4" }, { pos: "E2", v: "23,1" }, { pos: "E3", v: "21,8" }, { pos: "E4", v: "22,9" }, { pos: "E5", v: "23,5" }, { pos: "E6", v: "22,2" }],
        compr: [{ est: "15", v: "3,00" }],
        rampa: [{ est: "15", pos: "rampa montante", v: "31,0" }, { est: "15+03", pos: "rampa jusante", v: "24,0" }],
        geoSec: [{ est: "15+01", elem: "largura interna do canal", proj: "50", med: "50,4" }],
        geoEsp: [{ est: "15+01", elem: "laje", proj: "12", med: "11,4" }],
      };
      // abatimentos: exemplo "Concreto C25 — três caminhões, 100 ± 20 mm" da DNER-ME 404 (um fora da tolerância)
      A.exemplos.importar(F.params, d, "imp_abat", [["dner-me-404-00", 1]]);
      return d;
    } },
  ];
})();
