/*
 * DNIT 022/2023-ES — Drenagem — Dissipadores de energia — aceitação do serviço.
 * Usa FE.aceitacao.fichaSimples via FE.drenagemES (definido em es-dnit-015-2006-es.js, carregado antes).
 * Lote: dissipadores executados (unidades). Concreto fck ≥ 20 MPa (5.1.1), fck,est ≥ fck (7.3); pedra de mão Ø 15 a 25 cm (5.1.3, 5.3.2 g).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.drenagemES, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var G = { MAT: "Materiais (5.1 e 7.1)", EXE: "Execução (5.3)", PRO: "Verificação do produto (7.2)", AMB: "Condicionantes ambientais (6)" };
  function S(id, texto, secao, grupo, exigido, extra) { return D.sn(id, texto, secao, grupo, exigido, extra); }
  function caixa(P) { return P.tipo !== "dentes"; }
  function dentes(P) { return P.tipo === "dentes"; }
  var POR_UN = { por: "contagem", a_cada: 1, qtd: "nDisp", unidade: "dissipador(es)", regra: "cada dissipador" };
  var CRIT = [
    D.itemFc({ id: "fc", secao: "5.1.1 / 7.3", grupo: G.MAT, texto: "Concreto — resistência à compressão aos 28 dias (exemplares)" }),
    D.itemAbat({ id: "abat", secao: "7.1", grupo: G.MAT }),
    S("consist", "Ensaio de consistência nas ocasiões do 7.1", "7.1", G.MAT,
      "alteração da umidade dos agregados, 1ª amassada do dia, reinício após > 2 h, moldagem de CPs e troca de operador"),
    S("aco", "Armadura CA-50 conforme NBR 7480, cortada e dobrada conforme projeto, com calços para o cobrimento", "5.1.2 / Nota 3", G.MAT, "CA-50; cobrimento garantido",
      { se: function (P) { return P.armado === "sim"; } }),
    S("pedraQ", "Pedra de mão de rocha sã e estável, com os requisitos da brita para concreto (NBR 7211)", "5.1.3", G.MAT, "NBR 7211", { se: caixa }),
    { id: "pedraD", texto: "Pedra de mão — diâmetro", secao: "5.1.3 / 5.3.2 g", grupo: G.MAT, tipo: "valor", unid: "cm", casas: 0, min: 15, max: 25, se: caixa },
    // execução
    S("escav", "Escavação nos alinhamentos, cotas e dimensões do projeto, sem excessos que exijam complementação com solo", "5.3.1 / 5.3.2 a / 5.3.3 a", G.EXE,
      "conforme projeto", { freq: POR_UN }),
    S("apil", "Superfície de assentamento apiloada — base firme e bem desempenada", "5.3.1 / 5.3.2 b / 5.3.3 b", G.EXE, "base firme", { freq: POR_UN }),
    S("concr", "Fôrmas e cimbramento; lançamento, vibração e cura do concreto; retirada das fôrmas", "5.3.2 c–e / 5.3.3 c–e", G.EXE, "conforme projeto", { freq: POR_UN }),
    { id: "camada", texto: "Espessura da camada de concreto sobre a caixa", secao: "5.3.2 f / 7.2.1", grupo: G.EXE, tipo: "valor", unid: "cm", casas: 1, min: 9, max: 11,
      exigido: "10 cm ± 10 % (9 a 11 cm)", se: caixa },
    S("pedraL", "Pedras de mão lançadas e arrumadas antes do início da cura da camada de 10 cm", "5.3.2 g", G.EXE, "antes do início da cura", { se: caixa }),
    S("recomp", "Recomposição lateral com material escolhido compactado (coesivo se o local for de baixa resistência)", "5.3.2 h / 5.3.3 f", G.EXE, "sem pedras ou fragmentos"),
    S("nivel", "Saída d'água no nível do terreno; ajuste da zona de contato com o dispositivo a montante", "5.3.1", G.EXE, "mesmo nível do terreno", { freq: POR_UN }),
    // produto
    S("posic", "Dimensões e posicionamento do dispositivo conforme projeto / Notas de Serviço", "7.2.1", G.PRO, "conforme projeto", { freq: POR_UN }),
  ].concat(D.itensGeo("7.2.1", G.PRO), [
    S("acab", "Acabamento (inspeção visual)", "7.2.2", G.PRO, "sem prejuízo à operação hidráulica do dispositivo", { freq: POR_UN }),
    S("amb", "Condicionantes ambientais (DNIT 070-PRO; bota-fora sem prejudicar o escoamento)", "6 / 5.3.1", G.AMB, "conforme documentação ambiental"),
  ]);

  var F = D.montar({
    id: "dnit-022-2023-es",
    titulo: "Dissipadores de energia — aceitação do serviço",
    resumo: "Controle da DNIT 022/2023-ES: concreto (fck ≥ 20 MPa, fck,est ≥ fck pela NBR 12655), consistência, armadura, pedra de mão (Ø 15 a 25 cm), " +
      "execução (camada de 10 cm sobre a caixa, apiloamento, recomposição) e verificação do produto (seções ≤ 1 %, espessuras ± 10 %).",
    lote: { largura: false },
    refs: { reprova: "7.3", atende: "7.3", regra: "7.3" },
    params: [
      { k: "tipo", r: "Tipo de dissipador", tipo: "select", recarrega: true,
        opcoes: [["caixa", "Caixa de pedras fixadas com concreto (5.3.2)"], ["dentes", "Dentes / degraus de concreto (5.3.3)"]] },
      { k: "nDisp", r: "Dissipadores no lote (unidades)", dica: "as verificações por dissipador exigem uma por unidade" },
      { k: "armado", r: "Há armadura?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "fck", r: "fck do concreto (MPa)", dica: "mínimo de 20 MPa aos 28 dias (5.1.1)" },
    ].concat(D.paramsConcreto()),
    padrao: { tipo: "caixa", armado: "nao", fck: "20", amostragem: "parcial", condicao: "B" },
    criterios: CRIT,
    extra: function (ctx) {
      var fck = num(ctx.P.fck);
      if (ok(fck) && fck < 20) ctx.avisos.push("fck de " + fmt(fck, 1) + " MPa abaixo do mínimo de 20 MPa (5.1.1) — usado 20 MPa.");
      D.extraConcreto(ctx, [{ id: "fc", fck: ok(fck) ? Math.max(fck, 20) : 20, secao: "7.3" }], "abat");
    },
    notas: "Critérios da DNIT 022/2023-ES. Concreto com fck ≥ 20 MPa aos 28 dias (5.1.1) e fck,est ≥ fck (7.3), fck,est pela NBR 12655. Pedra de mão com diâmetro de 15 a 25 cm " +
      "(5.1.3, 5.3.2 g); camada de concreto de 10 cm sobre a caixa (5.3.2 f) verificada com a tolerância de ± 10 % das espessuras (7.2.1). Seções transversais com desvio ≤ 1 % " +
      "em pontos isolados (7.2.1). Detalhe incorreto deve ser corrigido; só é aceito se a correção o colocar em conformidade (7.3).",
  });

  function V(mapa) { return D.verificacoes(CRIT, mapa); }
  F.exemplos = [
    { nome: "3 dissipadores com caixa de pedras na saída de bueiros — aceitos", dados: function () {
      var n3 = { real: "3", nc: "0" };
      return {
        ident: { registro: "LOTE-DE-01", obra: "Obra A", trecho: "BR-000", camada: "Dissipadores de energia — saídas de bueiros", data: "2026-06-20" },
        params: { estIni: "40", estFim: "95", tipo: "caixa", nDisp: "3", armado: "nao", fck: "20", amostragem: "parcial", condicao: "B", abat: "80", abatTol: "20" },
        verificacoes: V({ escav: n3, apil: n3, concr: n3, nivel: n3, posic: n3, acab: n3 }),
        fc: [{ est: "40", v: "23,5" }, { est: "40", v: "24,2" }, { est: "62", v: "22,8" }, { est: "62", v: "25,1" }, { est: "95", v: "23,9" }, { est: "95", v: "24,6" }],
        abat: [{ est: "40", v: "85" }, { est: "62", v: "75" }, { est: "95", v: "90" }],
        pedraD: [{ est: "40", v: "18" }, { est: "40", v: "22" }, { est: "62", v: "20" }, { est: "95", v: "24" }],
        camada: [{ est: "40", v: "10,2" }, { est: "62", v: "9,6" }, { est: "95", v: "10,5" }],
        geoSec: [{ est: "40", elem: "largura interna da caixa", proj: "150", med: "150,8" }, { est: "62", elem: "largura interna da caixa", proj: "150", med: "149,2" }],
        geoEsp: [{ est: "40", elem: "parede", proj: "15", med: "15,6" }, { est: "95", elem: "parede", proj: "15", med: "14,4" }],
      };
    } },
    { nome: "2 dissipadores — pedras grandes, camada de 8 cm e dissipador sem apiloamento (rejeitado)", dados: function () {
      return {
        ident: { registro: "LOTE-DE-02", obra: "Obra B", trecho: "BR-000", camada: "Dissipadores de energia — pés de descida d'água", data: "2026-07-09" },
        params: { estIni: "10", estFim: "18", tipo: "caixa", nDisp: "2", armado: "nao", fck: "20", amostragem: "excepcional", condicao: "B", volConc: "6" },
        verificacoes: V({ escav: { real: "2", nc: "0" }, apil: { real: "2", nc: "1", obs: "base solta no dissipador da est. 18" }, concr: { real: "2", nc: "0" },
          nivel: { real: "2", nc: "0" }, posic: { real: "2", nc: "0" }, acab: { real: "2", nc: "0" } }),
        fc: [{ est: "10", v: "27,4" }, { est: "18", v: "28,0" }],
        abat: [{ est: "10", v: "70" }],
        pedraD: [{ est: "10", v: "20" }, { est: "18", v: "30" }],
        camada: [{ est: "10", v: "10,0" }, { est: "18", v: "8,0" }],
        geoSec: [{ est: "10", elem: "largura interna da caixa", proj: "120", med: "120,6" }],
        geoEsp: [{ est: "10", elem: "parede", proj: "15", med: "15,2" }],
      };
    } },
  ];
})();
