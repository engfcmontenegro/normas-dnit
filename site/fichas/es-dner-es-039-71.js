/*
 * Ficha de ES: DNER-ES 039/71 (DNER-ES-OA 39/71) — Muros de arrimo — aceitação (A.fichaSimples via FE.aceitacaoG11,
 * definido em es-dnit-071-2006-es.js). Pedras (volume, espessura, % de blocos ≥ 0,036 m³), argamassa 1:3,
 * drenagem (barbacãs 100 cm²/m² de paramento; camada filtrante de 20 cm) e conformidade com o projeto.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var EPS = 1e-9;

  var pedra = function (P) { return P.tipo === "seca" || P.tipo === "argamassada"; };
  var arg = function (P) { return P.tipo === "argamassada"; };
  var drena = function (P) { return P.tipo !== "fogueira"; };
  var C = [
    { id: "qualid", texto: "Pedras de boa qualidade, sem decomposição e não provenientes de capa de pedreira; argamassada: forma ≈ paralelepípedo (demais dimensões 3× e 1,5× a espessura)",
      secao: "2", grupo: "Materiais", tipo: "sim_nao", se: pedra, naoAplicaPor: "muro de concreto ou em fogueira" },
    { id: "volume", texto: "Volume das pedras", secao: "2", grupo: "Materiais", tipo: "valor", unid: "m³", casas: 3, min: 0.015, max: 0.05,
      se: pedra, naoAplicaPor: "muro de concreto ou em fogueira", exigido: "0,015 a 0,05 m³",
      freq: { por: "lote", minimo: 10, regra: "amostra de 10 pedras por lote (adotado: a ES fixa a proporção de blocos ≥ 0,036 m³)" } },
    { id: "espessura", texto: "Espessura (menor dimensão) das pedras", secao: "2", grupo: "Materiais", tipo: "valor", unid: "cm", casas: 0,
      min: function (P) { return arg(P) ? 20 : NaN; }, max: function (P) { var m = num(P.menorDim); return ok(m) ? m * 100 / 2 : NaN; },
      se: pedra, naoAplicaPor: "muro de concreto ou em fogueira", exigido: "≤ metade da menor dimensão do muro; argamassada: ≥ 20 cm",
      freq: { por: "lote", minimo: 10, regra: "amostra de 10 pedras por lote (adotado)" } },
    { id: "fundacao", texto: "Escavação e preparo da fundação conforme DNER-ES-OA 35/71 e dimensões do projeto", secao: "4.1", grupo: "Execução", tipo: "sim_nao" },
    { id: "seca", texto: "Alvenaria sem argamassa só em contenção de pequena altura; pedras escolhidas para perfeita arrumação", secao: "4.1", grupo: "Execução",
      tipo: "sim_nao", se: function (P) { return P.tipo === "seca"; }, naoAplicaPor: "outro tipo de muro" },
    { id: "argam", texto: "Argamassa 1:3 (cimento : areia, em volume); pedras umedecidas, em camadas horizontais, vazios preenchidos com pedras menores", secao: "4.1",
      grupo: "Execução", tipo: "sim_nao", se: arg, naoAplicaPor: "outro tipo de muro" },
    { id: "concreto", texto: "Concreto ciclópico, armado ou protendido conforme as especificações correspondentes do DNER", secao: "4.2", grupo: "Execução",
      tipo: "sim_nao", se: function (P) { return P.tipo === "concreto"; }, naoAplicaPor: "outro tipo de muro" },
    { id: "fogueira", texto: "Muro em fogueira: peças pré-moldadas de bom acabamento, montadas em fogueira, enchimento silico-argiloso compactado, cava à distância do projeto",
      secao: "4.3", grupo: "Execução", tipo: "sim_nao", se: function (P) { return P.tipo === "fogueira"; }, naoAplicaPor: "outro tipo de muro" },
    { id: "filtro", texto: "Espessura da camada filtrante no tardoz (toda a altura do paramento interno), com dreno de areia longitudinal", secao: "4.1",
      grupo: "Execução", tipo: "valor", unid: "cm", casas: 0, min: 20, se: function (P) { return drena(P) && G.sim(P, "freatico"); },
      naoAplicaPor: "sem lençol freático nem terreno muito permeável", freq: G.lote() },
    { id: "projeto", texto: "Dimensões e disposições do projeto; controle exercido pela Fiscalização orientada pela ES e pelo projeto", secao: "5", grupo: "Produto",
      tipo: "sim_nao", exigido: "conforme projeto" },
  ];

  A.fichaSimples({
    id: "dner-es-039-71",
    titulo: "Muros de arrimo — aceitação",
    resumo: "Verificações da DNER-ES 039/71: pedras (volume 0,015 a 0,05 m³, espessura, ≥ 50 % dos blocos com 0,036 m³ nos muros argamassados), argamassa 1:3, fundação, barbacãs (100 cm² de drenos por m² de paramento), camada filtrante de 20 cm e conformidade com o projeto.",
    lote: false,
    params: [{ k: "tipo", r: "Tipo de muro", tipo: "select", recarrega: true, opcoes: [["argamassada", "Alvenaria de pedra argamassada"], ["seca", "Alvenaria de pedra seca"],
        ["concreto", "Concreto ciclópico, armado ou protendido"], ["fogueira", "Em fogueira (peças pré-moldadas)"]] },
      { k: "menorDim", r: "Menor dimensão do muro projetado (m)", se: pedra, dica: "a espessura das pedras não pode passar da metade dela (2)" },
      { k: "aParam", r: "Área do paramento externo (m²)", se: drena },
      { k: "nBarb", r: "Nº de barbacãs", se: drena }, { k: "dBarb", r: "Diâmetro interno das barbacãs (cm)", se: drena },
      { k: "freatico", r: "Lençol freático interceptado ou terreno de alta permeabilidade?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO, se: drena }],
    padrao: { tipo: "argamassada", freatico: "nao" },
    criterios: C,
    extra: function (ctx) {
      var P = ctx.P, v = ctx.item.volume;
      // 2: argamassada — no mínimo 50 % dos blocos com volume ≥ 0,036 m³
      if (arg(P)) {
        var vs = v && v.n ? v.pontos.map(function (p) { return p.v; }).filter(ok) : [];
        var l = A.linha({ id: "pct036", grupo: "Materiais", criterio: "Blocos com volume ≥ 0,036 m³", secao: "2", n: vs.length, exigido: "≥ 50 % dos blocos" });
        if (!vs.length) A.marcar(l, "sem_dados", "informe os volumes da amostra de pedras");
        else {
          var p = vs.filter(function (x) { return x >= 0.036 - EPS; }).length / vs.length * 100;
          l.resultado = fmt(p, 0) + " % (" + vs.filter(function (x) { return x >= 0.036 - EPS; }).length + " de " + vs.length + ")";
          if (p < 50 - EPS) A.marcar(l, "nao_conforme", "só " + fmt(p, 0) + " % dos blocos com volume ≥ 0,036 m³");
          else l.motivo = "atende";
        }
        ctx.linhas.splice(ctx.linhas.indexOf(v) + 1, 0, l);
      }
      // 4.1 / 4.2: barbacãs na proporção de 100 cm² de drenos por m² de paramento
      if (drena(P)) {
        var a = num(P.aParam), n = num(P.nBarb), d = num(P.dBarb);
        var b = A.linha({ id: "barb", grupo: "Execução", criterio: "Barbacãs: área de drenos por m² de paramento (uniformemente distribuídas)", secao: "4.1; 4.2",
          exigido: "≥ 100 cm²/m²" });
        if (!ok(a) || !ok(n) || !ok(d) || a <= 0) A.marcar(b, "sem_dados", "informe a área do paramento, o nº e o diâmetro das barbacãs");
        else {
          var t = n * Math.PI * d * d / 4 / a;
          b.n = n; b.resultado = fmt(t, 0) + " cm²/m² (" + n + " × Ø " + fmt(d, 1) + " cm em " + fmt(a, 1) + " m²)";
          if (t < 100 - EPS) A.marcar(b, "nao_conforme", fmt(t, 0) + " cm²/m² < 100 cm²/m²");
          else b.motivo = "atende";
        }
        var i = ctx.linhas.indexOf(ctx.item.projeto);
        ctx.linhas.splice(i, 0, b);
      }
    },
    notas: "Critérios da DNER-ES 039/71: a seção 5 atribui o controle à Fiscalização, orientada pela ES e pelo projeto; os valores verificados vêm das seções 2 e 4. Área de drenos = nº de barbacãs × π·Ø²/4 ÷ área do paramento (≥ 100 cm²/m²). Amostra de 10 pedras por lote adotada (a ES não fixa amostragem) para verificar o volume, a espessura e a proporção de blocos ≥ 0,036 m³.",
    exemplos: [
      { nome: "Muro de pedra argamassada (aceito)", dados: function () {
        var P = { tipo: "argamassada", menorDim: "0,80", aParam: "36", nBarb: "46", dBarb: "10", freatico: "sim" };
        var vol = ["0,040", "0,036", "0,030", "0,045", "0,038", "0,025", "0,042", "0,036", "0,020", "0,048"];
        var esp = ["22", "25", "20", "28", "24", "21", "30", "26", "20", "27"];
        return { ident: { registro: "OC-039-01", data: "2026-04-14", obra: "Obra A", trecho: "BR-000 — km 9", local: "Muro de arrimo LD, est. 60 a 63" },
          params: P, verificacoes: G.verif(C, P),
          volume: G.vals(vol.map(function (x, i) { return ["Pedra " + (i + 1), x]; })),
          espessura: G.vals(esp.map(function (x, i) { return ["Pedra " + (i + 1), x]; })),
          filtro: G.vals([["Seção 1", "20"], ["Seção 2", "22"]]) };
      } },
      { nome: "Muro de pedra argamassada — pedras pequenas e poucas barbacãs (rejeitado)", dados: function () {
        var P = { tipo: "argamassada", menorDim: "0,60", aParam: "40", nBarb: "8", dBarb: "5", freatico: "nao" };
        var vol = ["0,020", "0,030", "0,036", "0,018", "0,025", "0,012", "0,040", "0,022", "0,028", "0,030"];
        var esp = ["18", "22", "25", "15", "20", "20", "32", "21", "24", "22"];
        return { ident: { registro: "OC-039-02", data: "2026-07-30", obra: "Obra B", trecho: "BR-000 — km 55", local: "Muro de arrimo LE, est. 140 a 144" },
          params: P, verificacoes: G.verif(C, P, { argam: { atende: "N", obs: "argamassa 1:5 no preparo" } }),
          volume: G.vals(vol.map(function (x, i) { return ["Pedra " + (i + 1), x]; })),
          espessura: G.vals(esp.map(function (x, i) { return ["Pedra " + (i + 1), x]; })) };
      } },
    ],
  });
})();
