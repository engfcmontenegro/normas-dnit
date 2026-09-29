/*
 * Ficha de ES: DNIT 123/2009-ES — Pontes e viadutos rodoviários — Estruturas de concreto protendido (protensão e
 * injeção). Usa FE.aceitacao e FE.aceitacaoG9b (es-dnit-116-2009-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-123-2009-es";

  // 5.3.2 b — limites de σpi na saída do aparelho de tração: [× fptk, × fpyk] (valores transcritos da ES)
  function limites(P) {
    if (P.armadura === "pre") return P.relax === "RN" ? [0.77, 0.90] : [0.77, 0.85];
    if (P.relax === "barra") return [0.72, 0.88];
    return P.relax === "RN" ? [0.74, 0.90] : [0.74, 0.88];
  }
  function sigLim(P) {
    var k = limites(P), fptk = num(P.fptk), fpyk = num(P.fpyk);
    return ok(fptk) && ok(fpyk) ? Math.min(k[0] * fptk, k[1] * fpyk) : NaN;
  }

  var GP = "Protensão (5.3.2; 7.2.1)", GI = "Injeção (5.3.2 e; 7.2.2)";
  var CRIT = [
    { id: "insumos", grupo: "Materiais (5.1; 7.1)", texto: "Concreto, armaduras, fôrmas e escoramentos aceitos pelas DNIT 117, 118, 119, 120, 122 e 124", secao: "5.1; 7.1", tipo: "sim_nao" },
    { id: "ancor_conc", grupo: "Materiais (5.1; 7.1)", texto: "Concreto das zonas de ancoragem adensado sem vazios; cones e placas de ancoragem posicionados e curados", secao: "5.3.1", tipo: "sim_nao" },
    { id: "plano", grupo: GP, texto: "Plano de Protensão aprovado (fases, ordem, alongamentos e tolerâncias, forças, descimbramento)", secao: "5.3.2 a", tipo: "sim_nao" },
    { id: "fcj", grupo: GP, texto: "Resistência do concreto na data da protensão", secao: "5.3.2 a", tipo: "valor", unid: "MPa", casas: 1,
      min: function (P) { return num(P.fcjProj); }, exigido: "≥ resistência mínima do Plano de Protensão", importar: G.imp091 },
    { id: "equip", grupo: GP, texto: "Estrutura inspecionada após retirar as fôrmas laterais; acesso às extremidades; macacos aferidos", secao: "5.3.2 a; 5.2", tipo: "sim_nao" },
    { id: "tabelas", grupo: GP, texto: "Tabelas de protensão e gráfico tensão × alongamento de cada cabo registrados", secao: "5.3.2 d; 7.2.1", tipo: "sim_nao",
      freq: { por: "contagem", qtd: "cabos", a_cada: 1, minimo: 1, regra: "todos os cabos" } },
    { id: "inj_prev", grupo: GI, texto: "Calda ensaiada (DNIT 117); purgadores desobstruídos; cabos lavados e água expulsa com ar comprimido", secao: "5.3.2 e", tipo: "sim_nao" },
    { id: "inj_bomba", grupo: GI, texto: "Bomba elétrica de pistão ou parafuso (sem ar comprimido); manômetro aferido com precisão de 0,1 MPa; sequência pré-estabelecida", secao: "5.3.2 e", tipo: "sim_nao" },
    { id: "inj_p", grupo: GI, texto: "Pressão de injeção", secao: "5.3.2 e", tipo: "valor", unid: "MPa", casas: 1, min: 1.5, max: 2.0, falha: "ressalva",
      exigido: "1,5 a 2,0 MPa (maiores em cabos verticais ou com grande desnível)" },
    { id: "inj_v", grupo: GI, texto: "Velocidade de injeção", secao: "5.3.2 e", tipo: "valor", unid: "m/min", casas: 1, min: 6, max: 12, falha: "ressalva",
      exigido: "6 a 12 m/min (a ES escreve m/seg)" },
    { id: "inj_vol", grupo: GI, texto: "Volume injetado / volume teórico de vazios do cabo", secao: "7.2.2 e", tipo: "valor", unid: "%", casas: 0, min: 100, falha: "ressalva",
      freq: { por: "contagem", qtd: "cabos", a_cada: 1, minimo: 1, regra: "cada cabo ou família de cabos" } },
    { id: "inj_prazo", grupo: GI, texto: "Prazo entre a protensão e a injeção", secao: "117: 5.3.4", tipo: "valor", unid: "dias", casas: 0, max: 8, falha: "ressalva", exigido: "recomendado ≤ 8 dias" },
    { id: "inj_flu_e", grupo: GI, texto: "Índice de fluidez da calda na entrada da bainha", secao: "7.2.2 f; 117: Tabela 3", tipo: "valor", unid: "s", casas: 0, max: 18,
      freq: { por: "contagem", qtd: "cabos", a_cada: 1, minimo: 1, regra: "cada cabo" } },
    { id: "inj_flu_s", grupo: GI, texto: "Índice de fluidez da calda na saída da bainha", secao: "7.2.2 f; 117: Tabela 3", tipo: "valor", unid: "s", casas: 0, min: 8,
      freq: { por: "contagem", qtd: "cabos", a_cada: 1, minimo: 1, regra: "cada cabo" } },
    { id: "inj_reg", grupo: GI, texto: "Registros da injeção: horários, composição, temperaturas, pressões, equipamentos e anomalias", secao: "7.2.2 a–h", tipo: "sim_nao" },
    { id: "corte", grupo: GI, texto: "Pontas dos fios/cordoalhas cortadas só após o enchimento das bainhas", secao: "5.3.2 e", tipo: "sim_nao" },
  ];

  function tabelasExtra() {
    return [{ chave: "cabos_t", titulo: "Cabos — tensão na saída do aparelho de tração e alongamentos (5.3.2 b–d)", rotulo: "Cabo", iniciais: 2, min: 1,
      dica: "uma coluna por cabo; alongamento previsto do Plano de Protensão e medido na tabela de protensão; \"S\" se a força foi elevada por irregularidade (5.3.2 c)",
      linhas: [{ k: "id", r: "Cabo", texto: true }, { k: "sig", r: "Tensão σpi na saída do aparelho", u: "MPa" },
        { k: "alP", r: "Alongamento previsto", u: "mm" }, { k: "alM", r: "Alongamento medido", u: "mm" }, { k: "elev", r: "Força elevada por irregularidade? (S / N)", texto: true }] }];
  }

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — estruturas de concreto protendido (protensão e injeção) — aceitação",
    resumo: "Aceitação da protensão e da injeção de um elemento pela DNIT 123/2009-ES: Plano de Protensão e resistência do concreto (5.3.2 a), tensão σpi na saída do aparelho de tração ≤ os limites de 5.3.2 b (× fptk e × fpyk, por tipo de armadura e relaxação), elevação de até 10 % em no máximo 50 % dos cabos (5.3.2 c), alongamentos com a tolerância do plano (5.3.2 a, d) e injeção (5.3.2 e; 7.2.2: pressão 1,5 a 2,0 MPa, fluidez, volume injetado, registros). Calda ensaiada pela DNIT 117.",
    lote: false,
    params: [
      { k: "peca", r: "Elemento protendido", ph: "ex.: viga longarina V1" },
      { k: "armadura", r: "Armadura ativa", tipo: "select", opcoes: [["pos", "Pós-tracionada (aderência posterior)"], ["pre", "Pré-tracionada (aderência inicial)"]] },
      { k: "relax", r: "Aço", tipo: "select", opcoes: [["RB", "Relaxação baixa (RB)"], ["RN", "Relaxação normal (RN)"], ["barra", "Barras CP-85/105 (pós-tracionada)"]] },
      { k: "fptk", r: "fptk — resistência característica à tração (MPa)", ph: "1900" },
      { k: "fpyk", r: "fpyk — resistência característica ao escoamento (MPa)", ph: "1710" },
      { k: "tolAl", r: "Tolerância dos alongamentos do Plano de Protensão (± %)", dica: "a ES (5.3.2 a) remete ao Plano de Protensão" },
      { k: "cabos", r: "Cabos do elemento (nº)" },
      { k: "fcjProj", r: "Resistência mínima do concreto para a protensão (MPa)" },
    ],
    padrao: { armadura: "pos", relax: "RB", fptk: "1900", fpyk: "1710" },
    criterios: CRIT,
    refs: { reprova: "7.3.2", atende: "7.3.1", regra: "7.3" },
    extra: function (ctx) {
      var P = ctx.P, lim = sigLim(P), k = limites(P), tol = num(P.tolAl), l;
      var cab = (ctx.d.cabos_t || []).filter(function (c) { return ok(num(c.sig)) || ok(num(c.alM)); });
      var elev = cab.filter(function (c) { return G.simNao(c.elev) === true; });
      var permiteElev = P.armadura !== "pre";
      function rot(c, i) { return c.id || "cabo " + (i + 1); }
      // tensões
      var pts = [], fora = [], acima10 = [];
      cab.forEach(function (c, i) {
        var s = num(c.sig); if (!ok(s)) return;
        var e = G.simNao(c.elev) === true && permiteElev, L = e ? 1.1 * lim : lim;
        pts.push({ v: s, rot: rot(c, i) });
        if (ok(L) && s > L + 1e-9) (e ? acima10 : fora).push(rot(c, i) + " (" + fmt(s, 0) + (e ? " > 1,10 × " : " > ") + fmt(lim, 0) + " MPa)");
      });
      l = A.linha({ id: "sig", grupo: GP, criterio: "Tensão σpi na saída do aparelho de tração", secao: "5.3.2 b, c", n: pts.length, pontos: pts,
        exigido: ok(lim) ? "≤ " + fmt(lim, 0) + " MPa = mín(" + fmt(k[0], 2) + "·fptk; " + fmt(k[1], 2) + "·fpyk)" + (permiteElev ? "; elevada: ≤ 1,10 × em até 50 % dos cabos" : "") : "informe fptk e fpyk",
        resultado: pts.length ? fmt(Math.min.apply(null, pts.map(function (p) { return p.v; })), 0) + " a " + fmt(Math.max.apply(null, pts.map(function (p) { return p.v; })), 0) + " MPa (n = " + pts.length + ")" : "—" });
      if (!ok(lim)) G.redefinir(l, "pendente", "informe fptk e fpyk");
      else if (!pts.length) G.redefinir(l, "sem_dados", "sem tensões registradas");
      else {
        if (fora.length) A.marcar(l, "nao_conforme", "acima do limite: " + fora.join("; "));
        if (acima10.length) A.marcar(l, "nao_conforme", "acima do limite majorado em 10 %: " + acima10.join("; "));
        if (elev.length && !permiteElev) A.marcar(l, "nao_conforme", "elevação de força só é admitida em armaduras pós-tracionadas (5.3.2 c)");
        if (permiteElev && elev.length > 0.5 * cab.length + 1e-9) A.marcar(l, "nao_conforme", elev.length + " de " + cab.length + " cabos com força elevada — máximo 50 % (5.3.2 c)");
        if (l.situacao === "conforme") l.motivo = "todas as tensões dentro do limite" + (elev.length ? " (" + elev.length + " cabo(s) elevado(s) até 1,10 × o limite)" : "");
      }
      ctx.linhas.push(l);
      // alongamentos
      var pa = [];
      cab.forEach(function (c, i) { var p = num(c.alP), m = num(c.alM); if (ok(p) && ok(m) && p > 0) pa.push({ v: (m / p - 1) * 100, rot: rot(c, i) }); });
      l = A.avaliar({ id: "along", grupo: GP, criterio: "Alongamento medido × previsto", secao: "5.3.2 a, d; 7.2.1", unid: "%", casas: 1, individual: true,
        min: ok(tol) ? -tol : NaN, max: ok(tol) ? tol : NaN, exigido: ok(tol) ? "± " + fmt(tol, 1) + " % (tolerância do Plano de Protensão)" : "tolerância do Plano de Protensão", pontos: pa });
      if (!ok(tol) && pa.length) G.redefinir(l, "pendente", "informe a tolerância dos alongamentos do Plano de Protensão");
      if (l.situacao === "nao_conforme") l.motivos[0].texto = l.motivo = l.motivo + " — corrigir após consulta ao projetista (7.3.2)";
      ctx.linhas.push(l);
      ctx.freqs.push(A.frequencia({ ensaio: "Tensão e alongamento por cabo", metodo: "tabela de protensão", por: "contagem", a_cada: 1, qtd: num(P.cabos), minimo: 1, unidade: "cabo(s)", realizado: cab.length }));
    },
    notas: "Critérios da DNIT 123/2009-ES. Limites de σpi transcritos de 5.3.2 b: pré-tracionada 0,77 fptk e 0,90 fpyk (RN) / 0,77 fptk e 0,85 fpyk (RB); pós-tracionada 0,74 fptk e 0,90 fpyk (RN) / 0,74 fptk e 0,88 fpyk (RB); barras CP-85/105 0,72 fptk e 0,88 fpyk — vale o menor dos dois produtos. Irregularidades em pós-tracionadas: força elevada com σpi até 1,10 × o limite, em no máximo 50 % dos cabos (5.3.2 c). Alongamentos com a tolerância do Plano de Protensão (a ES não fixa valor). Injeção: bombas elétricas, pressão de 1,5 a 2,0 MPa, velocidade de 6 a 12 (a ES escreve m/seg; adotado m/min, como na NBR 14931), registros de 7.2.2; injeção recomendada até 8 dias após a protensão (DNIT 117, 5.3.4). Não conformes: corrigidos após consulta ao projetista, complementados ou refeitos (7.3.2).",
    exemplos: [
      { nome: "Viga pós-tracionada, 4 cabos CP-190 RB — aceito", dados: function () {
        return { ident: { registro: "PRT-01", obra: "Obra A — ponte sobre o rio A", camada: "Viga longarina V1 — 4 cabos 12φ12,7", data: "2025-07-02" },
          params: { peca: "Viga V1", armadura: "pos", relax: "RB", fptk: "1900", fpyk: "1710", tolAl: "5", cabos: "4", fcjProj: "24" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "4" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "4" }, { atende: "S" }],
          fcj: [{ est: "V1", pos: "7 d", v: "26,4" }, { est: "V1", pos: "7 d", v: "27,1" }],
          cabos_t: [{ id: "C1", sig: "1395", alP: "182", alM: "187", elev: "N" }, { id: "C2", sig: "1400", alP: "182", alM: "178", elev: "N" },
            { id: "C3", sig: "1390", alP: "176", alM: "181", elev: "N" }, { id: "C4", sig: "1402", alP: "176", alM: "172", elev: "N" }],
          inj_p: [{ est: "C1", v: "1,6" }, { est: "C2", v: "1,8" }, { est: "C3", v: "1,7" }, { est: "C4", v: "1,8" }],
          inj_v: [{ est: "C1", v: "8" }, { est: "C3", v: "9" }],
          inj_vol: [{ est: "C1", v: "104" }, { est: "C2", v: "102" }, { est: "C3", v: "105" }, { est: "C4", v: "101" }],
          inj_prazo: [{ est: "C1 a C4", v: "3" }],
          inj_flu_e: [{ est: "C1", v: "14" }, { est: "C2", v: "15" }, { est: "C3", v: "14" }, { est: "C4", v: "16" }],
          inj_flu_s: [{ est: "C1", v: "11" }, { est: "C2", v: "12" }, { est: "C3", v: "10" }, { est: "C4", v: "11" }] };
      } },
      { nome: "Tensão acima do limite, 3 de 4 cabos elevados e alongamento fora — rejeitado", dados: function () {
        return { ident: { registro: "PRT-02", obra: "Obra B — viaduto", camada: "Viga V3 — 4 cabos", data: "2025-08-19" },
          params: { peca: "Viga V3", armadura: "pos", relax: "RB", fptk: "1900", fpyk: "1710", tolAl: "5", cabos: "4", fcjProj: "24" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "4" }, { atende: "S" }, { atende: "S" }, { real: "4", nc: "1", obs: "cabo C2 sem registro de temperatura" }, { atende: "S" }],
          fcj: [{ est: "V3", pos: "7 d", v: "25,2" }],
          cabos_t: [{ id: "C1", sig: "1420", alP: "180", alM: "185", elev: "N" }, { id: "C2", sig: "1520", alP: "180", alM: "196", elev: "S" },
            { id: "C3", sig: "1480", alP: "174", alM: "180", elev: "S" }, { id: "C4", sig: "1500", alP: "174", alM: "179", elev: "S" }],
          inj_p: [{ est: "C1", v: "1,8" }, { est: "C2", v: "2,4" }],
          inj_vol: [{ est: "C1", v: "101" }, { est: "C2", v: "92" }, { est: "C3", v: "100" }, { est: "C4", v: "103" }],
          inj_prazo: [{ est: "C1 a C4", v: "12" }],
          inj_flu_e: [{ est: "C1", v: "16" }, { est: "C2", v: "17" }, { est: "C3", v: "15" }, { est: "C4", v: "16" }],
          inj_flu_s: [{ est: "C1", v: "10" }, { est: "C2", v: "9" }, { est: "C3", v: "10" }, { est: "C4", v: "11" }] };
      } },
    ],
  });
  G.registrar(F, ID, tabelasExtra);
})();
