/*
 * Ficha de ACEITAÇÃO DE ÁREA FRESADA: DNIT 159/2011-ES — Pavimentos asfálticos — Fresagem a frio.
 *
 * O que a ES manda (seções do PDF):
 *   4 a) marcação prévia das áreas; profundidade de corte e rugosidade do projeto.   4 b) sinalização provisória
 *        (degraus inevitáveis sinalizados).   4 c) fresagem para reciclagem: área fresada no máximo 3 dias sem
 *        recobrimento.   4 f) liberação ao tráfego só sem material solto, degraus, buracos ou descolamento de placas.
 *   5.3  execução: b) varrição mecânica prévia (reciclagem); c) início na borda mais baixa; d) jateamento contínuo de água;
 *        e) esteira + caminhão; bota-fora aprovado e conforme CONAMA 307; f) limpeza; g) tratamento de buracos e
 *        desagregações remanescentes.
 *   6.2  condicionantes ambientais específicos (tráfego fora dos acostamentos, poeira/ruído/vibração, estocagem).
 *   7.1  textura rugosa e uniforme, sem desníveis entre passadas, desempeno (declividade), sem falhas de corte e depressões.
 *   7.2.1 profundidade de corte nas bordas (régua/trena), no centro (topografia); espessura = média de no mínimo
 *        3 medidas para cada 100 m² fresados.     7.2.2 condições de tráfego (seção 4).  7.2.3 atendimento ambiental.
 *   7.3  por área tratada: corte > 5 cm → média a ± 5 % do projeto; corte < 5 cm → ± 10 %; declividade transversal em
 *        pontos isolados até 20 % diferente da de projeto, sem depressões que acumulem água; material depositado em
 *        local inadequado → não conforme até a correção.     8.1 medição em m³ = área × espessura.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, media = FE.media;
  var ID = "dnit-159-2011-es";
  var EPS = 1e-9;
  function recicla(P) { return P.reciclagem === "sim"; }
  function area(P, L) { var a = num(P.areaFresada); return ok(a) ? a : L.area; }
  // 7.3: tolerância da média conforme a espessura de corte de projeto (5 cm exatos: a ES não diz — adota-se ± 10 %)
  function tolEsp(e) { return e > 5 + EPS ? 5 : 10; }
  var GG = "Condições gerais e de tráfego (4 / 7.2.2)", GE = "Execução (5.3)", GS = "Superfície fresada (7.1 / 7.3)", GM = "Controle geométrico (7.2.1 / 7.3)";

  var CRIT = [
    { id: "g1", texto: "Áreas marcadas previamente; profundidade de corte e rugosidade (tipo de fresagem) conforme projeto", secao: "4 a / 5.3 a", tipo: "sim_nao", grupo: GG },
    { id: "g2", texto: "Sinalização provisória de regulamentação e advertência; degraus inevitáveis sinalizados", secao: "4 b", tipo: "sim_nao", grupo: GG },
    { id: "rec", texto: "Área fresada sem recobrimento (fresagem para reciclagem)", secao: "4 c", tipo: "valor", unid: "dias", casas: 0, max: 3, grupo: GG,
      se: recicla, naoAplicaPor: "só quando a fresagem precede a reciclagem" },
    { id: "g3", texto: "Pista liberada sem material solto, degraus, buracos ou descolamento de placas", secao: "4 f / 7.2.2", tipo: "sim_nao", grupo: GG },
    { id: "e1", texto: "Varrição mecânica prévia da superfície (material destinado à reciclagem)", secao: "5.3 b", tipo: "sim_nao", grupo: GE,
      se: recicla, naoAplicaPor: "só quando o fresado vai para reciclagem" },
    { id: "e2", texto: "Corte iniciado na borda mais baixa, com velocidade de corte e avanço regulados", secao: "5.3 c", tipo: "sim_nao", grupo: GE },
    { id: "e3", texto: "Jateamento contínuo de água (resfriamento dos dentes e controle de poeira)", secao: "5.3 d", tipo: "sim_nao", grupo: GE },
    { id: "e4", texto: "Fresado levado a local aprovado (reaproveitamento ou bota-fora), conforme CONAMA 307", secao: "5.3 e / 7.3", tipo: "sim_nao", grupo: GE },
    { id: "e5", texto: "Superfície limpa (vassoura mecânica ou manual; jato de ar ou água)", secao: "5.3 f", tipo: "sim_nao", grupo: GE },
    { id: "e6", texto: "Buracos e desagregações remanescentes tratados (reparos pela ES correspondente)", secao: "5.3 g", tipo: "sim_nao", grupo: GE },
    { id: "s1", texto: "Textura rugosa e uniforme, sem desníveis entre passadas, sem falhas de corte nem depressões", secao: "7.1", tipo: "sim_nao", grupo: GS },
    { id: "s2", texto: "Sem depressões que propiciem acúmulo de água", secao: "7.3", tipo: "sim_nao", grupo: GS },
    { id: "decl", texto: "Declividade transversal (pontos isolados)", secao: "7.1 / 7.3", tipo: "valor", unid: "%", casas: 2, grupo: GS,
      min: function (P) { var d = Math.abs(num(P.declProj)); return ok(d) ? d * 0.8 : NaN; },
      max: function (P) { var d = Math.abs(num(P.declProj)); return ok(d) ? d * 1.2 : NaN; },
      exigido: "até 20 % diferente da de projeto (valor absoluto)" },
    { id: "amb", texto: "Condicionantes ambientais: tráfego só nas áreas previstas, poeira/ruído/vibração controlados, fresado estocado em área aprovada", secao: "6.2 / 7.2.3", tipo: "sim_nao", grupo: GS },
    { id: "esp", texto: "Espessura (profundidade) de corte", secao: "7.2.1 / 7.3", tipo: "valor", unid: "cm", casas: 1, grupo: GM,
      exigido: "média a ± 5 % (corte > 5 cm) ou ± 10 % (corte < 5 cm) do projeto",
      freq: { por: "area", a_cada: 1, minimo: 3, qtd: function (P, L) { var a = area(P, L); return ok(a) ? 3 * Math.ceil(a / 100 - EPS) : NaN; },
        regra: "no mínimo 3 medidas a cada 100 m² fresados" } },
  ];
  function ver(m) { return CRIT.filter(function (c) { return c.tipo === "sim_nao"; }).map(function (c) { return m[c.id] || {}; }); }

  A.fichaSimples({
    id: ID,
    titulo: "Fresagem a frio — aceitação da área fresada (DNIT 159/2011-ES)",
    resumo: "Espessura média de corte (mín. 3 medidas por 100 m²) dentro de ± 5 % (corte > 5 cm) ou ± 10 % (corte < 5 cm) do projeto, declividade até 20 % da de projeto, verificações de execução, tráfego e meio ambiente (7.3); volume para medição (8.1).",
    lote: { largura: true },
    params: [
      { k: "areaFresada", r: "Área fresada (m²) — opcional", ph: "extensão × largura", dica: "fresagem descontínua: some as áreas tratadas; vazio = extensão × largura" },
      { k: "espProj", r: "Espessura de corte de projeto (cm)", dica: "7.3: > 5 cm → ± 5 %; < 5 cm → ± 10 % (5 cm exatos: ± 10 %, ver nota)" },
      { k: "declProj", r: "Declividade transversal de projeto (%)", dica: "7.3: pontos isolados até 20 % diferentes" },
      { k: "modalidade", r: "Modalidade (5.2)", tipo: "select", opcoes: [["continua", "Fresagem contínua"], ["descontinua", "Fresagem descontínua"],
        ["cunha", "Fresagem em cunha (de garra)"], ["inclinacao", "Correção da inclinação"], ["arremate", "Fresagem de arremate"]] },
      { k: "tipoFres", r: "Tipo de fresagem (5.1 a)", tipo: "select", opcoes: [["padrao", "Padrão — dentes a ≈ 15 mm"], ["fina", "Fina — dentes a ≈ 8 mm"], ["micro", "Microfresagem — dentes a 2 a 3 mm"]] },
      { k: "reciclagem", r: "Fresado destinado à reciclagem (4 c / 5.3 b)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ],
    padrao: { modalidade: "continua", tipoFres: "padrao", reciclagem: "nao" },
    criterios: CRIT,
    extra: function (ctx) {
      var P = ctx.P, L = ctx.L, le = ctx.item.esp, ep = num(P.espProj);
      var pts = (le.pontos || []).filter(function (p) { return ok(p.v); });
      var a = area(P, L);
      if (ok(a)) ctx.linhas.unshift(A.linha({ id: "area", grupo: "Área tratada", criterio: "Área fresada considerada", secao: "7.2.1", situacao: "informativo",
        exigido: "—", resultado: fmt(a, 0) + " m²" + (ok(num(P.areaFresada)) ? " (informada)" : " (extensão × largura)") }));
      if (pts.length) {
        var X = media(pts.map(function (p) { return p.v; })), tol = ok(ep) ? tolEsp(ep) : NaN;
        le.situacao = "conforme"; le.motivos = []; le.motivo = ""; le.media = X;
        if (le.est && ok(ep)) { le.est.min = ep * (1 - tol / 100); le.est.max = ep * (1 + tol / 100); le.est.fora = []; }
        le.exigido = ok(ep) ? "X̄ entre " + fmt(ep * (1 - tol / 100), 2) + " e " + fmt(ep * (1 + tol / 100), 2) + " cm (" + fmt(ep, 1) + " cm ± " + tol + " %)" : le.exigido;
        le.resultado = "X̄ = " + fmt(X, 2) + " cm (n = " + pts.length + ", " + fmt(Math.min.apply(null, pts.map(function (p) { return p.v; })), 1) + " a " +
          fmt(Math.max.apply(null, pts.map(function (p) { return p.v; })), 1) + " cm)" + (ok(ep) ? " · desvio " + fmt((X / ep - 1) * 100, 1) + " %" : "");
        if (!ok(ep)) A.marcar(le, "pendente", "informe a espessura de corte de projeto");
        else if (Math.abs(X / ep - 1) * 100 > tol + 1e-6) A.marcar(le, "nao_conforme", "média " + fmt(X, 2) + " cm fora de " + fmt(ep, 1) + " cm ± " + tol + " % (7.3)");
        else le.motivo = "média dentro de ± " + tol + " % do projeto (7.3)";
        if (ok(a)) ctx.linhas.push(A.linha({ id: "vol", grupo: "Medição (8.1)", criterio: "Volume fresado = área × espessura média", secao: "8.1", situacao: "informativo",
          exigido: "m³ (só o serviço conforme)", n: pts.length, resultado: fmt(a, 0) + " m² × " + fmt(X / 100, 4) + " m = " + fmt(a * X / 100, 2) + " m³" }));
      }
      if (ctx.item.decl && ctx.item.decl.n && !ok(num(P.declProj))) A.marcar(ctx.item.decl, "pendente", "informe a declividade de projeto");
    },
    textos: {
      ACEITO: { titulo: "FRESAGEM CONFORME", texto: "Espessura, declividade e verificações atendem à DNIT 159/2011-ES (7.3)." },
      RESSALVA: { titulo: "FRESAGEM CONFORME COM RESSALVA", texto: "Nenhum critério reprovado, mas há pontos a documentar ou corrigir." },
      PENDENTE: { titulo: "CONTROLE INCOMPLETO", texto: "Faltam medidas (mín. 3 por 100 m²) ou verificações exigidas: complete o controle antes de aceitar a área." },
      REJEITADO: { titulo: "FRESAGEM NÃO CONFORME", texto: "Exigência não cumprida: corrigir; o serviço só é aceito se a correção o puser em conformidade (7.3)." },
    },
    notas: "DNIT 159/2011-ES: condições gerais 4, execução 5.3, condicionantes ambientais 6, controle 7.1 e 7.2, conformidade 7.3, medição 8.1. " +
      "Espessura: média aritmética de no mínimo 3 medidas por 100 m² (7.2.1), comparada com o projeto: ± 5 % para corte > 5 cm e ± 10 % para corte < 5 cm; " +
      "a ES não trata o corte de exatamente 5 cm — a ficha aplica ± 10 %. Declividade transversal: cada ponto até 20 % diferente da de projeto (em valor absoluto).",
    exemplos: [
      { nome: "Fresagem contínua de 4 cm em 700 m² (conforme)", dados: function () {
        var e = [4.1, 4.0, 4.2, 4.1, 3.9, 4.2, 4.0, 4.1, 4.3, 4.0, 4.1, 4.2, 3.9, 4.1, 4.0, 4.2, 4.1, 4.0, 4.2, 4.1, 4.0];
        var d = { ident: { registro: "FRES-01", data: "2025-07-22", obra: "Obra A", trecho: "BR-000 — faixa direita", camada: "Revestimento asfáltico existente" },
          params: { estIni: "50", estFim: "60", largura: "3,50", espProj: "4", declProj: "2", modalidade: "continua", tipoFres: "padrao", reciclagem: "nao" },
          verificacoes: ver({ g1: { atende: "S" }, g2: { atende: "S" }, g3: { atende: "S" }, e2: { atende: "S" }, e3: { atende: "S" }, e4: { atende: "S", obs: "pátio de estocagem aprovado" },
            e5: { atende: "S" }, e6: { atende: "S", obs: "sem ocorrências" }, s1: { atende: "S", real: "10" }, s2: { atende: "S" }, amb: { atende: "S" } }),
          decl: [{ est: "51", pos: "seção", v: "1,90" }, { est: "55", pos: "seção", v: "2,10" }, { est: "59", pos: "seção", v: "2,20" }], esp: [] };
        e.forEach(function (v, i) { d.esp.push({ est: A.fmtEstaca(1000 + Math.floor(i / 3) * 33.3, { simples: true }), pos: ["BE", "centro", "BD"][i % 3], v: A.nstr(v, 1) }); });
        return d;
      } },
      { nome: "Fresagem de 6 cm para reciclagem: média baixa, declividade e bota-fora fora do exigido (não conforme)", dados: function () {
        var e = [5.6, 5.4, 5.8, 5.7, 5.5, 5.6, 5.9, 5.5, 5.6];
        var d = { ident: { registro: "FRES-02", data: "2025-08-05", obra: "Obra B", trecho: "BR-000 — faixa esquerda", camada: "Revestimento asfáltico existente" },
          params: { estIni: "120", estFim: "125", largura: "3,60", espProj: "6", declProj: "2", modalidade: "descontinua", tipoFres: "padrao", reciclagem: "sim" },
          verificacoes: ver({ g1: { atende: "S" }, g2: { atende: "S" }, g3: { atende: "S" }, e1: { atende: "S" }, e2: { atende: "S" }, e3: { atende: "S" },
            e4: { atende: "N", obs: "fresado descarregado em área não aprovada, junto a curso d'água" }, e5: { atende: "S" }, e6: { atende: "S" }, s1: { atende: "S" }, s2: { atende: "S" }, amb: { atende: "S" } }),
          rec: [{ pos: "área 1", v: "2" }],
          decl: [{ est: "121", pos: "seção", v: "2,10" }, { est: "123", pos: "seção", v: "2,50" }], esp: [] };
        e.forEach(function (v, i) { d.esp.push({ est: A.fmtEstaca(2400 + Math.floor(i / 3) * 33.3, { simples: true }), pos: ["BE", "centro", "BD"][i % 3], v: A.nstr(v, 1) }); });
        return d;
      } },
    ],
  });
})();
