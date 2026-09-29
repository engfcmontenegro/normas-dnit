/*
 * DNIT 023/2024-ES — Drenagem — Bueiros tubulares de concreto — aceitação do serviço.
 * Usa FE.aceitacao.fichaSimples via FE.drenagemES (definido em es-dnit-015-2006-es.js, carregado antes).
 * Concreto do berço fck ≥ 20 MPa (5.1.1, 5.3 d), fck,est ≥ fck (7.2.3); reaterro acima de 0,30 m da geratriz com GC ≥ 100 % do Proctor
 * normal ou intermediário (5.3 g), camadas ≤ 0,20 m, recobrimento ≥ 1 m; folga lateral da vala ≥ 0,40 m (5.3 c).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.drenagemES, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var G = { MAT: "Materiais (5.1 e 7.1)", VAL: "Vala, berço e assentamento (4 e 5.3 a–f)", REA: "Reaterro (5.3 g)", PRO: "Verificação do produto (7.2)", AMB: "Condicionantes ambientais (6)" };
  function S(id, texto, secao, grupo, exigido, extra) { return D.sn(id, texto, secao, grupo, exigido, extra); }
  function bConc(P) { return P.berco !== "granular"; }
  function rigida(P) { return P.junta !== "elastica"; }
  var GC_FONTES = ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me", "dner-me-037-94", "dnit-405-2017-me"];
  var CRIT = [
    D.itemFc({ id: "fc", secao: "5.1.1 / 7.2.3", grupo: G.MAT, texto: "Concreto do berço — resistência à compressão aos 28 dias (exemplares)", se: bConc }),
    D.itemAbat({ id: "abat", secao: "7.1", grupo: G.MAT, se: bConc }),
    S("consist", "Ensaio de consistência nas ocasiões do 7.1", "7.1", G.MAT,
      "alteração da umidade dos agregados, 1ª amassada do dia, reinício após > 2 h, moldagem de CPs e troca de operador", { se: bConc }),
    S("tubos", "Tubos de concreto da classe e dimensões do projeto, ponta e bolsa, ensaios da NBR 8890 (compressão diametral)", "5.1.4 / 7.1", G.MAT,
      "classe de resistência do projeto; NBR 8890"),
    S("tubosV", "Tubos limpos internamente, sem defeitos ou quebras (principalmente na ponta e bolsa)", "4", G.MAT, "inspeção visual antes do assentamento"),
    S("aco", "Aço CA-50 (NBR 7480) ou telas CA-60 (NBR 7481) quando previstos", "5.1.2", G.MAT, "conforme projeto", { se: function (P) { return P.armado === "sim"; } }),
    S("argam", "Argamassa das juntas rígidas: cimento e areia 1:3 em massa", "5.1.3", G.MAT, "traço 1:3 em massa", { se: rigida }),
    // vala, berço e assentamento
    S("sinal", "Sinalização da obra implantada e mantida; sem execução em dias de chuva", "4", G.VAL, "sinalização e segurança do tráfego"),
    S("locacao", "Locação topográfica com réguas e gabaritos a cada 5 m (alinhamento, profundidade e declividade)", "5.3 b", G.VAL, "conforme projeto / NBR 17015"),
    S("valas", "Valas abertas de jusante para montante; escoramento nas valas com mais de 1,25 m ou solo instável", "4 / 5.3 c", G.VAL, "NR-18 e NBR 9061"),
    { id: "folga", texto: "Folga lateral da vala (cada lado)", secao: "5.3 c", grupo: G.VAL, tipo: "valor", unid: "m", casas: 2, min: 0.40, metodo: "medida direta" },
    { id: "folgaT", texto: "Folga entre tubos (linhas duplas ou triplas)", secao: "5.3 c", grupo: G.VAL, tipo: "valor", unid: "m", casas: 2, min: 0.30,
      se: function (P) { return num(P.linhas) > 1; } },
    { id: "camAss", texto: "Espessura das camadas de aterro até a cota de assentamento", secao: "5.3 c", grupo: G.VAL, tipo: "valor", unid: "m", casas: 2, max: 0.20,
      se: function (P) { return P.aterroAss === "sim"; } },
    S("berco", "Berço executado conforme projeto; bueiro não assentado direto no fundo da vala", "4 / 5.3 d", G.VAL, "berço de concreto em duas etapas ou granular em duas camadas"),
    S("dentes", "Berço de concreto com dentes (declividade longitudinal > 4 %)", "5.3 d Nota 3", G.VAL, "dentes fundidos com o berço, espaçados conforme projeto",
      { se: function (P) { return bConc(P) && num(P.decl) > 4; } }),
    S("assent", "Bolsa voltada para montante; tubos uniformemente apoiados; descida por equipamento mecânico", "4 / 5.3 e", G.VAL, "apoio contínuo; bolsa a montante"),
    S("juntas", "Juntas rígidas com argamassa 1:3 em toda a circunferência externa (Ø ≤ 0,60 m) ou interna e externa (Ø > 0,60 m)", "5.3 f", G.VAL,
      "rejuntamento completo", { se: rigida }),
    S("juntaE", "Juntas elásticas com anéis de borracha", "5.3 f Nota 4", G.VAL, "anéis de vedação", { se: function (P) { return !rigida(P); } }),
    // reaterro
    { id: "camRea", texto: "Espessura das camadas do reaterro", secao: "5.3 g", grupo: G.REA, tipo: "valor", unid: "m", casas: 2, max: 0.20, exigido: "≤ 0,20 m" },
    { id: "gc", texto: "Grau de compactação do reaterro acima de 0,30 m da geratriz", secao: "5.3 g", grupo: G.REA, tipo: "valor", unid: "%", casas: 1, min: 100,
      exigido: "≥ 100 % do Proctor normal ou intermediário (projeto)", metodo: "DNIT 458 / DNER-ME 036 / DNIT 417",
      importar: { de: GC_FONTES, valores: function (e) {
        var r = e.resultados || {};
        return (r.furos || r.pts || []).filter(function (f) { return ok(f.GC); }).map(function (f, j) {
          return { v: f.GC, est: f.estaca || "", pos: f.posicao || "", rot: (e.ficha === "dnit-417-2019-me" || e.ficha === "dnit-405-2017-me" ? "ponto " : "furo ") + (j + 1) };
        });
      } } },
    { id: "recob", texto: "Recobrimento acima da geratriz superior do tubo", secao: "5.3 g", grupo: G.REA, tipo: "valor", unid: "m", casas: 2, min: 1.0 },
    S("envolt", "Envoltória lateral com material de boa qualidade apiloado até 0,30 m acima da geratriz; sem equipamento que sobrecarregue o tubo", "5.3 g", G.REA,
      "duas etapas de preenchimento; escoramento retirado com o aterro"),
    // produto
    S("posic", "Dimensões, alinhamento, declividade e posicionamento conforme projeto / Notas de Serviço", "7.2.1", G.PRO, "levantamentos topográficos e gabaritos"),
  ].concat(D.itensGeo("7.2.1", G.PRO), [
    S("acab", "Acabamento (inspeção visual) e acompanhamento das camadas de embasamento e do enchimento das valas", "7.2.2", G.PRO,
      "sem prejuízo à operação hidráulica da canalização"),
    S("amb", "Condicionantes ambientais (DNIT 070-PRO); ensecadeira removida", "6 / 4", G.AMB, "conforme documentação ambiental"),
  ]);

  var F = D.montar({
    id: "dnit-023-2024-es",
    titulo: "Bueiros tubulares de concreto — aceitação do serviço",
    resumo: "Controle da DNIT 023/2024-ES: concreto do berço (fck ≥ 20 MPa, fck,est ≥ fck pela NBR 12655), tubos (NBR 8890), vala (folga ≥ 0,40 m), berço, juntas, " +
      "reaterro (camadas ≤ 0,20 m, GC ≥ 100 %, recobrimento ≥ 1 m) e verificação do produto (seções ≤ 1 %, espessuras ± 10 %).",
    lote: { largura: false },
    refs: { reprova: "7.2.3", atende: "7.2.3", regra: "7.2.3" },
    params: [
      { k: "diam", r: "Diâmetro dos tubos (m)", dica: "Ø ≤ 0,60 m: junta rígida só externa; Ø > 0,60 m: interna e externa (5.3 f)" },
      { k: "linhas", r: "Número de linhas de tubos", dica: "linha dupla ou tripla: folga de 0,30 m entre tubos" },
      { k: "decl", r: "Declividade longitudinal do bueiro (%)", dica: "> 4 %: berço de concreto com dentes (Nota 3)" },
      { k: "berco", r: "Tipo de berço", tipo: "select", recarrega: true, opcoes: [["concreto", "Concreto"], ["granular", "Granular (brita 1 ou areia)"]] },
      { k: "junta", r: "Tipo de junta", tipo: "select", recarrega: true, opcoes: [["rigida", "Rígida (argamassa 1:3)"], ["elastica", "Elástica (anéis de borracha)"]] },
      { k: "armado", r: "Elementos armados (aço CA-50 / telas CA-60)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "aterroAss", r: "Houve aterro até a cota de assentamento?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "fck", r: "fck do concreto do berço (MPa)", se: function (d) { return bConc(d.params || {}); }, dica: "mínimo de 20 MPa aos 28 dias (5.1.1)" },
    ].concat(D.paramsConcreto(function (d) { return bConc(d.params || {}); })),
    padrao: { linhas: "1", berco: "concreto", junta: "rigida", armado: "nao", aterroAss: "nao", fck: "20", amostragem: "parcial", condicao: "B" },
    criterios: CRIT,
    extra: function (ctx) {
      var P = ctx.P, fck = num(P.fck);
      if (bConc(P) && ok(fck) && fck < 20) ctx.avisos.push("fck de " + fmt(fck, 1) + " MPa abaixo do mínimo de 20 MPa (5.1.1) — usado 20 MPa.");
      D.extraConcreto(ctx, [{ id: "fc", fck: ok(fck) ? Math.max(fck, 20) : 20, secao: "7.2.3" }], "abat");
      if (!ok(num(P.decl))) ctx.avisos.push("Informe a declividade do bueiro: acima de 4 % o berço de concreto exige dentes (5.3 d, Nota 3).");
    },
    notas: "Critérios da DNIT 023/2024-ES. Concreto do berço com fck ≥ 20 MPa aos 28 dias (5.1.1) e fck,est ≥ fck (7.2.3), fck,est pela NBR 12655. Folga lateral da vala ≥ 0,40 m " +
      "e 0,30 m entre tubos (5.3 c); camadas de aterro e de reaterro ≤ 0,20 m; reaterro acima de 0,30 m da geratriz com 100 % do Proctor normal ou intermediário e recobrimento " +
      "≥ 1 m (5.3 g) — a ES não fixa a frequência do controle de compactação (mín. 1 por lote aqui). Seções com desvio ≤ 1 % em pontos isolados e espessuras em ± 10 % (7.2.1). " +
      "Detalhe incorreto deve ser corrigido; só é aceito se a correção o colocar em conformidade (7.2.3).",
  });

  function V(mapa) { return D.verificacoes(CRIT, mapa); }
  F.exemplos = [
    { nome: "BSTC Ø 1,00 m em berço de concreto — aceito", dados: function () {
      return {
        ident: { registro: "LOTE-BT-01", obra: "Obra A", trecho: "BR-000", camada: "Bueiro simples tubular Ø 1,00 m — est. 145", data: "2026-08-12" },
        params: { estIni: "145", estFim: "146+04", diam: "1,00", linhas: "1", decl: "2,0", berco: "concreto", junta: "rigida", armado: "nao", aterroAss: "nao",
          fck: "20", amostragem: "parcial", condicao: "B", abat: "80", abatTol: "20" },
        verificacoes: V({}),
        fc: [{ pos: "E1", v: "24,8" }, { pos: "E2", v: "23,6" }, { pos: "E3", v: "25,3" }, { pos: "E4", v: "22,9" }, { pos: "E5", v: "24,1" }, { pos: "E6", v: "23,8" }],
        abat: [{ pos: "1ª etapa", v: "80" }, { pos: "2ª etapa", v: "90" }],
        folga: [{ est: "145+05", pos: "LE", v: "0,45" }, { est: "145+05", pos: "LD", v: "0,42" }, { est: "146", pos: "LE", v: "0,41" }],
        camRea: [{ est: "145+10", pos: "camada 3", v: "0,18" }, { est: "145+10", pos: "camada 5", v: "0,20" }],
        gc: [{ est: "145+06", pos: "eixo", v: "101,2" }, { est: "145+12", pos: "LE", v: "100,4" }, { est: "146+02", pos: "LD", v: "102,0" }],
        recob: [{ est: "145+10", v: "1,35" }],
        geoSec: [{ est: "145+05", elem: "largura do berço", proj: "180", med: "181,2" }, { est: "146", elem: "largura do berço", proj: "180", med: "179,0" }],
        geoEsp: [{ est: "145+05", elem: "berço sob o tubo", proj: "20", med: "21,0" }, { est: "146", elem: "berço sob o tubo", proj: "20", med: "19,2" }],
      };
    } },
    { nome: "BSTC Ø 0,80 m — GC importado (DNIT 458) com furo abaixo de 100 %, concreto importado (DNER-ME 091) e recobrimento curto (rejeitado)", dados: function () {
      var d = {
        ident: { registro: "LOTE-BT-02", obra: "Obra B", trecho: "BR-000", camada: "Bueiro simples tubular Ø 0,80 m — est. 30", data: "2026-09-01" },
        params: { estIni: "10", estFim: "26", diam: "0,80", linhas: "1", decl: "5,0", berco: "concreto", junta: "rigida", armado: "nao", aterroAss: "nao",
          fck: "20", amostragem: "excepcional", condicao: "B", volConc: "7", abat: "100", abatTol: "20" },
        verificacoes: V({ dentes: { atende: "N", obs: "berço sem dentes com declividade de 5 %" } }),
        folga: [{ est: "12", pos: "LE", v: "0,40" }, { est: "12", pos: "LD", v: "0,35" }],
        camRea: [{ est: "18", pos: "camada 2", v: "0,20" }],
        recob: [{ est: "18", v: "0,85" }],
        geoSec: [{ est: "18", elem: "largura do berço", proj: "150", med: "150,9" }],
        geoEsp: [{ est: "18", elem: "berço sob o tubo", proj: "15", med: "15,6" }],
      };
      A.exemplos.importar(F.params, d, "imp_gc", [["dnit-458-2025-me", 1]]);
      A.exemplos.importar(F.params, d, "imp_fc", [["dner-me-091-98", 1]]);
      A.exemplos.importar(F.params, d, "imp_abat", [["dner-me-404-00", 1]]);
      return d;
    } },
  ];
})();
