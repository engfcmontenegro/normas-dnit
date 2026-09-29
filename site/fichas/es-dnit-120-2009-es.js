/*
 * Ficha de ES: DNIT 120/2009-ES — Pontes e viadutos rodoviários — Fôrmas (aceitação). Usa FE.aceitacao e
 * FE.aceitacaoG9b (es-dnit-116-2009-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-120-2009-es";

  // 5.5 — prazos sugeridos pelo ACI 347 (transcritos da ES): [carga móvel < permanente, carga móvel > permanente], em dias
  var ACI = { lateral: [0.5, 0.5], v3: [7, 4], v36: [14, 7], v6: [10, 7] };
  var ELEM = [["lateral", "Paredes, colunas e faces laterais de vigas (12 h)"], ["v3", "Fundo de viga — vão < 3,0 m"], ["v36", "Fundo de viga — vão de 3 a 6 m"], ["v6", "Fundo de viga — vão > 6,0 m"]];
  function prazoACI(P) { var a = ACI[P.elemento] || ACI.lateral; return a[P.carga === "movel" ? 1 : 0]; }
  function prazoMin(P) { var n = num(P.prazoNBR), a = prazoACI(P); return ok(n) ? Math.max(a, n) : a; }

  var GP = "Projeto e insumos (4; 5.1; 5.2; 7.1)", GE = "Execução (5.3 a 5.6; 7.2)";
  var CRIT = [
    { id: "projeto", grupo: GP, texto: "Projeto de fôrmas e escoramento apresentado e examinado pela Fiscalização (ventos, sobrecargas, pressão lateral)", secao: "4; 5.1; 5.4", tipo: "sim_nao" },
    { id: "liberacao", grupo: GP, texto: "Fôrmas entram em carga só após liberação da Fiscalização", secao: "4", tipo: "sim_nao" },
    { id: "madeira", grupo: GP, texto: "Tábuas sem nós prejudiciais; compensado resistente à água e à pressão do concreto", secao: "7.1", tipo: "sim_nao" },
    { id: "legal", grupo: GP, texto: "Madeira com aprovação para exploração", secao: "6", tipo: "sim_nao" },
    { id: "estanque", grupo: GE, texto: "Fôrmas estanques, rígidas, limpas, com aberturas provisórias de limpeza quando necessárias", secao: "5.1; 7.3.2", tipo: "sim_nao",
      exigido: "rejeitar fôrmas frágeis, não estanques ou com defeitos que ponham a obra em risco" },
    { id: "tirantes", grupo: GE, texto: "Tirantes isolados; furos obturados com espessura ≥ cobrimento adotado", secao: "5.3.2", tipo: "sim_nao" },
    { id: "autoport", grupo: GE, texto: "Não foram usadas fôrmas auto-portantes", secao: "5.6.3", tipo: "sim_nao", falha: "ressalva", exigido: "utilização deve ser evitada" },
    { id: "especial", grupo: GE, texto: "Fôrmas deslizantes/trepantes operadas por empresa especializada", secao: "5.6.1; 5.6.2", tipo: "sim_nao",
      se: function (P) { return P.tecnica === "deslizante" || P.tecnica === "trepante"; }, naoAplicaPor: "fôrmas convencionais" },
    { id: "desforma_dest", grupo: GE, texto: "Material da desforma removido para áreas aprovadas", secao: "6", tipo: "sim_nao" },
    { id: "dim", grupo: GE, texto: "Dimensões, nivelamento, alinhamento e prumo — desvio em relação ao projeto", secao: "7.2", tipo: "valor", unid: "mm", casas: 0,
      min: function (P) { return -num(P.tol); }, max: function (P) { return num(P.tol); }, exigido: "tolerância da ABNT NBR 6118/14931 adotada (± mm)",
      freq: { por: "contagem", qtd: "pontos", a_cada: 1, minimo: 1, regra: "pontos de conferência antes, durante e após a concretagem" } },
    { id: "cob_desl", grupo: GE, texto: "Fôrma deslizante — acréscimo de cobrimento das armaduras", secao: "5.6.1", tipo: "valor", unid: "cm", casas: 1, min: 2.5,
      se: function (P) { return P.tecnica === "deslizante"; }, naoAplicaPor: "sem fôrma deslizante" },
    { id: "prazo", grupo: GE, texto: "Prazo de retirada das fôrmas", secao: "5.5; 7.2", tipo: "valor", unid: "dias", casas: 1,
      min: function (P) { return prazoMin(P); }, exigido: "≥ o maior entre o ACI 347 (5.5) e a NBR 6118" },
  ];

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — fôrmas — aceitação",
    resumo: "Aceitação das fôrmas de um elemento pela DNIT 120/2009-ES: projeto e liberação (4; 5.1), madeira e compensado (7.1), estanqueidade e rigidez (7.3.2), tirantes (5.3.2), técnicas especiais (5.6), tolerância dimensional (7.2 — remete à ABNT NBR 6118) e prazo de retirada (5.5 — prazos do ACI 347 confrontados com a NBR 6118, adotando o mais longo).",
    lote: false,
    params: [
      { k: "peca", r: "Elemento / fôrma", ph: "ex.: viga V2 — fundo" },
      { k: "elemento", r: "Tipo de fôrma (5.5)", tipo: "select", opcoes: ELEM },
      { k: "carga", r: "Carga móvel estrutural × carga permanente estrutural (5.5)", tipo: "select", opcoes: [["perm", "Carga móvel menor que a permanente"], ["movel", "Carga móvel maior que a permanente"]] },
      { k: "prazoNBR", r: "Prazo mínimo pela NBR 6118 / projeto (dias) — opcional", dica: "a ES manda adotar o mais longo entre este e o do ACI 347" },
      { k: "tecnica", r: "Técnica (5.6)", tipo: "select", opcoes: [["convencional", "Convencional"], ["deslizante", "Deslizante"], ["trepante", "Trepante"], ["avancos", "Avanços / incrementos sucessivos"]] },
      { k: "tol", r: "Tolerância dimensional adotada (± mm)", dica: "a ES (7.2) remete à ABNT NBR 6118 (seção 11) — informe a tolerância do projeto / NBR 14931" },
      { k: "pontos", r: "Pontos de conferência dimensional (nº)" },
    ],
    padrao: { elemento: "lateral", carga: "perm", tecnica: "convencional" },
    criterios: CRIT,
    refs: { reprova: "7.3.2", atende: "7.3.1", regra: "7.3" },
    extra: function (ctx) {
      var P = ctx.P;
      ctx.avisos.push("Prazo mínimo de retirada: ACI 347 (5.5) = " + (prazoACI(P) < 1 ? "12 h" : prazoACI(P) + " dias") + (ok(num(P.prazoNBR)) ? "; NBR 6118/projeto = " + fmt(num(P.prazoNBR), 0) + " dias" : "") + " → adotado " + fmt(prazoMin(P), 1) + " dia(s).");
      if (P.elemento === "v6") ctx.avisos.push("A ES (5.5 b) dá 10 dias para vão > 6 m, menos que os 14 dias do vão de 3 a 6 m (o ACI 347 dá 21/14 dias): confronte com a NBR 6118 e o projeto.");
      if (ok(num(P.tol))) ctx.item.dim.exigido = "± " + fmt(num(P.tol), 0) + " mm (tolerância adotada; 7.2 remete à NBR 6118)";
      ctx.item.prazo.exigido = "≥ " + fmt(prazoMin(P), 1) + " dia(s) — maior entre ACI 347 (5.5) e NBR 6118";
      if (ctx.item.dim && ctx.item.dim.situacao !== "nao_exigido" && !ok(num(P.tol))) G.redefinir(ctx.item.dim, "pendente", "informe a tolerância dimensional adotada");
    },
    notas: "Critérios da DNIT 120/2009-ES. Conformes as fôrmas que atendam à ES (7.3.1); rejeitadas as que tiverem defeitos que ponham a obra em risco, as frágeis e as não estanques (7.3.2). Tolerâncias de dimensões, nivelamento, alinhamento e prumo: a ES remete à seção 11 da ABNT NBR 6118 (7.2). Prazos do ACI 347 transcritos em 5.5 (faces laterais 12 h; fundo de viga: vão < 3 m 7/4 d; 3 a 6 m 14/7 d; > 6 m 10/7 d, carga móvel menor/maior que a permanente), confrontados com a NBR 6118, adotando o mais longo.",
    exemplos: [
      { nome: "Fundo da viga de 5 m, retirada aos 15 dias — aceito", dados: function () {
        return { ident: { registro: "FOR-01", obra: "Obra A — ponte sobre o rio A", camada: "Viga transversina V2 — fôrma de fundo", data: "2025-03-28" },
          params: { peca: "Viga V2 — fundo", elemento: "v36", carga: "perm", prazoNBR: "14", tecnica: "convencional", tol: "5", pontos: "6" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }],
          dim: [{ est: "V2", pos: "largura", v: "2" }, { est: "V2", pos: "altura", v: "-3" }, { est: "V2", pos: "nível — apoio 1", v: "1" }, { est: "V2", pos: "nível — meio", v: "4" }, { est: "V2", pos: "nível — apoio 2", v: "0" }, { est: "V2", pos: "alinhamento", v: "-2" }],
          prazo: [{ est: "V2", v: "15" }] };
      } },
      { nome: "Fundo de viga de 8 m: vazamento, desvio de nível e retirada precoce — rejeitado", dados: function () {
        return { ident: { registro: "FOR-02", obra: "Obra B — viaduto", camada: "Viga V4 (vão 8 m) — fôrma de fundo", data: "2025-08-11" },
          params: { peca: "Viga V4 — fundo", elemento: "v6", carga: "perm", prazoNBR: "", tecnica: "convencional", tol: "5", pontos: "4" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "N", obs: "fuga de nata nas juntas dos painéis" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          dim: [{ est: "V4", pos: "nível — apoio 1", v: "4" }, { est: "V4", pos: "nível — meio do vão", v: "-8" }, { est: "V4", pos: "largura", v: "-2" }, { est: "V4", pos: "alinhamento", v: "1" }],
          prazo: [{ est: "V4", v: "8" }] };
      } },
    ],
  });
  G.registrar(F, ID);
})();
