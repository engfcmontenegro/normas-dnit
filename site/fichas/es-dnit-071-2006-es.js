/*
 * Ficha de ES: DNIT 071/2006-ES — Tratamento ambiental de áreas de uso de obras e do passivo ambiental de áreas
 * planas ou de pouca declividade por vegetação herbácea — aceitação da área tratada (A.fichaSimples).
 *
 * Este arquivo carrega antes das demais fichas de ES do grupo MEIO AMBIENTE / OBRAS COMPLEMENTARES
 * (DNIT 071 a 077/2006-ES, DNER-ES 039/71, DNER-ES 144/85, DNIT 099/2009-ES, 100/2018-ES e 101/2009-ES)
 * e expõe o código comum em window.FE.aceitacaoG11 (abreviado G):
 *   - G.SIM_NAO, G.ETAPA, G.etapa2, G.paramArea, G.paramDias, G.paramSeco, G.paramMudas: parâmetros comuns;
 *   - G.sim(P, k): parâmetro select "sim";
 *   - G.lote(txt): frequência "1 por lote" com texto da regra (quando a ES não fixa frequência);
 *   - G.inspecoes(id, secao, texto, dias): item de inspeções periódicas (1 a cada "dias" dias decorridos);
 *   - G.calcario(secao): dose de calcário dolomítico ≤ 1,5 t/ha (DNIT 071 a 074/2006-ES);
 *   - G.cobertura(secao, se): cobertura vegetal de 100 % da área (2ª etapa da medição);
 *   - G.mudasEst(secao, se): mudas estabelecidas (%), com o nº de mudas a substituir;
 *   - G.fichaComSementes(cfg, S): A.fichaSimples + tabela dos lotes de sementes (pureza, germinação e valor
 *     cultural × Tabelas de sementes nacionais/importadas das DNIT 071 e 072/2006-ES);
 *   - G.verif(C, P, over): dados das verificações (sim/não) dos exemplos; G.vals(rows): colunas de valores.
 *
 * Critério geral adotado no grupo (as ES não trazem controle estatístico nem, em geral, frequência):
 *   - requisito escrito como exigência ("deve", "mínimo", "máximo", "exigida"): valor fora → NÃO CONFORME;
 *   - requisito descrito como prática usual / "da ordem de" / recomendação: valor fora → RESSALVA;
 *   - sem frequência na ES: 1 verificação por lote (texto "adotado" na tabela de frequência).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var EPS = 1e-9;

  // =====================================================================================
  // FE.aceitacaoG11 — código comum do grupo
  // =====================================================================================
  var G = {};
  G.SIM_NAO = [["nao", "Não"], ["sim", "Sim"]];
  G.sim = function (P, k) { return (P || {})[k] === "sim"; };
  G.ADOTADO = "a ES não fixa a frequência — adotado";
  G.lote = function (txt) { return { por: "lote", minimo: 1, regra: "1 por lote (" + (txt || G.ADOTADO) + ")" }; };
  G.ETAPA = { k: "etapa", r: "Etapa da aceitação (seção 7 — medição em duas etapas)", tipo: "select", recarrega: true,
    opcoes: [["1", "1ª etapa — plantio concluído na área liberada"], ["2", "2ª etapa — estabelecimento / cobertura vegetal"]] };
  G.etapa2 = function (P) { return (P || {}).etapa === "2"; };
  G.paramArea = { k: "area", r: "Área tratada no lote (m²)", ph: "ex.: 5000", dica: "área efetivamente tratada (em taludes, medida na inclinação e não na projeção horizontal)" };
  G.paramDias = { k: "dias", r: "Dias decorridos desde o plantio", ph: "ex.: 130" };
  G.paramSeco = { k: "seco", r: "Plantio no período seco ou com estiagem prolongada?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO };
  G.paramMudas = { k: "mudas", r: "Mudas plantadas no lote (nº)", ph: "ex.: 400" };

  G.inspecoes = function (id, secao, texto, dias, se, grupo) {
    return { id: id, texto: texto, secao: secao, grupo: grupo || "Produto", tipo: "sim_nao", se: se,
      exigido: "1 inspeção a cada " + dias + " dias desde o plantio",
      freq: { por: "tempo", a_cada: dias, unidade: "dia(s)", minimo: 1, regra: "1 a cada " + dias + " dias decorridos (" + secao + ")",
        // inspeções já vencidas: ⌊dias / intervalo⌋ (mín. 1)
        qtd: function (P) { var t = num(P.dias); return ok(t) ? Math.floor(t / dias + EPS) * dias : NaN; } } };
  };
  G.calcario = function (secao) {
    return { id: "calcario", texto: "Dose de calcário dolomítico aplicada", secao: secao, grupo: "Materiais", tipo: "valor", unid: "t/ha", casas: 2,
      max: 1.5, falha: "ressalva", exigido: "≤ 1,5 t/ha (para elevar o pH a 5,5; teto por custo)", freq: G.lote() };
  };
  G.cobertura = function (secao, se) {
    return { id: "cobertura", texto: "Cobertura vegetal da área", secao: secao, grupo: "Produto", tipo: "valor", unid: "%", casas: 0,
      min: 100, se: se || G.etapa2, naoAplicaPor: "verificada na 2ª etapa", exigido: "100 % da área (2ª etapa da medição)",
      freq: { por: "lote", minimo: 1, regra: "na 2ª etapa, por área liberada (" + secao + ")" } };
  };
  G.mudasEst = function (secao, se) {
    return { id: "estab", texto: "Mudas estabelecidas (brotamento / pegamento)", secao: secao, grupo: "Produto", tipo: "valor", unid: "%", casas: 0,
      min: 100, falha: "ressalva", se: se || G.etapa2, naoAplicaPor: "verificado na 2ª etapa",
      exigido: "100 % — as que não vingarem são substituídas sem ônus (seção 8)",
      freq: { por: "lote", minimo: 1, regra: "na 2ª etapa (contagem das mudas)" } };
  };
  // mudas a substituir (extra): usa o parâmetro "mudas" e o menor % estabelecido
  G.extraMudas = function (ctx) {
    var l = ctx.item.estab, n = num(ctx.P.mudas);
    if (!l || !l.n || l.situacao === "nao_exigido") return;
    var pct = Math.min.apply(null, l.pontos.map(function (p) { return p.v; }).filter(ok));
    if (ok(n) && ok(pct) && pct < 100 - EPS) {
      var sub = Math.ceil(n * (1 - pct / 100) - EPS);
      A.marcar(l, "ressalva", "substituir cerca de " + sub + " muda(s) de " + n + " (as que não vingarem não são pagas — seção 8)");
    }
  };

  // dados dos exemplos: verificações na ordem dos itens sim_nao (itens que não se aplicam ficam vazios)
  G.verif = function (C, P, over) {
    over = over || {};
    return C.filter(function (it) { return it.tipo === "sim_nao"; }).map(function (it) {
      if (it.se && !it.se(P)) return {};
      var o = over[it.id];
      if (o === undefined) return { atende: "S" };
      return typeof o === "string" ? { atende: o } : o;
    });
  };
  // colunas de valores: [[local/posição, valor, registro?, estaca?], ...]
  G.vals = function (rows) {
    return rows.map(function (r) { return { pos: r[0] || "", v: r[1], reg: r[2] || "", est: r[3] || "" }; });
  };

  // ---------- sementes: pureza, germinação e valor cultural (DNIT 071 Tabelas 1 e 2; DNIT 072 Tabelas 3 e 4) ----------
  // VC = pureza × germinação / 100. A ES imprime VC ≥ 56,26 % para leguminosas nacionais; 75 % × 75 % = 56,25 %:
  // a ficha adota 56,25 % (produto dos mínimos da própria tabela) — ver relatório de erros.
  var TAB_SEM = { GN: { p: 55, g: 60, vc: 33 }, LN: { p: 75, g: 75, vc: 56.25 }, GI: { p: 90, g: 80, vc: 72 } };
  function temValor(c) { return Object.keys(c || {}).some(function (k) { return k !== "usar" && c[k] !== "" && c[k] !== undefined && c[k] !== null; }); }
  function avaliarSementes(d, S, avisos) {
    var linhas = [], tab = [];
    (d.sementes || []).forEach(function (c, i) {
      c = c || {};
      var p = num(c.pur), g = num(c.ger), vcD = num(c.vc), vc = ok(p) && ok(g) ? p * g / 100 : NaN;
      tab.push({ vcc: vc });
      if (!temValor(c)) return;
      var t = String(c.tipo || "").trim().toUpperCase().charAt(0), o = String(c.orig || "").trim().toUpperCase().charAt(0);
      var lim = t === "G" ? (o === "I" ? TAB_SEM.GI : o === "N" ? TAB_SEM.GN : null) : t === "L" && o === "N" ? TAB_SEM.LN : null;
      var nome = "Sementes — lote " + (c.reg || i + 1) + " (" + (t === "G" ? "gramínea" : t === "L" ? "leguminosa" : "tipo ?") +
        (o === "I" ? " importada" : o === "N" ? " nacional" : "") + ")";
      var l = A.linha({ id: "sem" + i, grupo: "Materiais", criterio: nome, secao: S.secao + " (" + S.tabs + ")", n: 1,
        resultado: "pureza " + fmt(p, 1) + " % · germinação " + fmt(g, 1) + " % · VC " + fmt(vc, 2) + " %",
        exigido: lim ? "pureza ≥ " + fmt(lim.p, 0) + " %, germinação ≥ " + fmt(lim.g, 0) + " %, VC ≥ " + fmt(lim.vc, 2).replace(/,00$/, "") + " %" : "—" });
      if ((t !== "G" && t !== "L") || (o !== "N" && o !== "I")) A.marcar(l, "pendente", "informe o tipo (G = gramínea, L = leguminosa) e a origem (N = nacional, I = importada)");
      else if (!lim) A.marcar(l, "ressalva", "a ES não fixa mínimos para leguminosas importadas (a tabela de importadas só traz gramíneas): exigir o certificado e a comprovação de boa qualidade");
      else if (!ok(p) || !ok(g)) A.marcar(l, "pendente", "informe a pureza e a germinação do certificado do lote");
      else {
        var f = [];
        if (p < lim.p - EPS) f.push("pureza " + fmt(p, 1) + " % < " + fmt(lim.p, 0) + " %");
        if (g < lim.g - EPS) f.push("germinação " + fmt(g, 1) + " % < " + fmt(lim.g, 0) + " %");
        if (vc < lim.vc - EPS) f.push("valor cultural " + fmt(vc, 2) + " % < " + fmt(lim.vc, 2) + " %");
        if (f.length) A.marcar(l, "nao_conforme", f.join("; ") + " — lote de sementes recusado");
        else l.motivo = "atende aos mínimos das " + S.tabs;
      }
      if (ok(vcD) && ok(vc) && Math.abs(vcD - vc) > 0.5) avisos.push(nome + ": valor cultural declarado " + fmt(vcD, 2) + " % difere de pureza × germinação / 100 = " + fmt(vc, 2) + " %.");
      linhas.push(l);
    });
    if (!linhas.length) {
      var l0 = A.linha({ id: "sem", grupo: "Materiais", criterio: "Sementes — pureza, germinação e valor cultural", secao: S.secao + " (" + S.tabs + ")",
        exigido: "mínimos da " + S.tabs });
      A.marcar(l0, "sem_dados", "informe os lotes de sementes (certificado)");
      linhas.push(l0);
    }
    return { linhas: linhas, tab: tab };
  }
  G.fichaComSementes = function (cfg, S) {
    var ultimo = [], extraOrig = cfg.extra;
    cfg.extra = function (ctx) {
      var aplica = !S.se || S.se(ctx.P);
      if (aplica) {
        var r = avaliarSementes(ctx.d, S, ctx.avisos);
        ultimo = r.tab;
        var idx = 0;
        ctx.linhas.forEach(function (l, i) { if (l.grupo === "Materiais") idx = i + 1; });
        Array.prototype.splice.apply(ctx.linhas, [idx, 0].concat(r.linhas));
      } else ultimo = [];
      if (extraOrig) extraOrig(ctx);
    };
    var F = A.fichaSimples(cfg);
    var tabOrig = F.tabelas, calcOrig = F.calcular;
    F.tabelas = function (d) {
      var T = tabOrig(d);
      if (S.se && !S.se(d.params || {})) return T;
      T.splice(1, 0, { chave: "sementes", titulo: "Lotes de sementes — certificado (" + S.secao + ", " + S.tabs + ")", rotulo: "Lote", iniciais: 2, min: 1,
        dica: "uma coluna por lote de sementes: tipo G (gramínea) ou L (leguminosa), origem N (nacional) ou I (importada), pureza e germinação do certificado",
        linhas: [{ k: "reg", r: "Lote / espécie / certificado", texto: true }, { k: "tipo", r: "Tipo (G / L)", texto: true },
          { k: "orig", r: "Origem (N / I)", texto: true }, { k: "pur", r: "Grau de pureza", u: "%" }, { k: "ger", r: "Poder germinativo", u: "%" },
          { k: "vc", r: "Valor cultural declarado (opcional)", u: "%" }, { calc: "vcc", r: "Valor cultural = pureza × germinação / 100", u: "%", casas: 2 }] });
      return T;
    };
    F.calcular = function (d) {
      var r = calcOrig(d);
      r.tab = r.tab || {};
      r.tab.sementes = ultimo;
      return r;
    };
    return F;
  };
  FE.aceitacaoG11 = G;

  // =====================================================================================
  // DNIT 071/2006-ES
  // =====================================================================================
  var sementes = function (P) { return P.plantio !== "mudas"; };
  var C = [
    { id: "analise", texto: "Análise edáfica e pedológica do solo (acidez, toxidez, nutrientes) — define calagem, adubação e espécies", secao: "4.1",
      grupo: "Materiais", tipo: "sim_nao", exigido: "realizada antes do plantio" },
    { id: "certif", texto: "Certificado das sementes (origem, data de expedição, nome científico, poder germinativo, grau de pureza e valor cultural); fornecedor idôneo",
      secao: "5.1", grupo: "Materiais", tipo: "sim_nao", se: sementes, naoAplicaPor: "plantio por mudas, placas ou leivas", exigido: "certificado de cada lote" },
    { id: "mudasq", texto: "Mudas, hastes, placas ou leivas: vigor, sanidade, verdume e rusticidade", secao: "4.2", grupo: "Materiais", tipo: "sim_nao",
      se: function (P) { return !sementes(P); }, naoAplicaPor: "plantio por sementes", exigido: "conforme normas agropecuárias" },
    G.calcario("5.1 c; 5.4.4"),
    { id: "conform", texto: "Modelagem e conformação: superfície sem depressões ou valas, escoamento adequado, barrancos modelados (1:3 a 1:4), sem arestas vivas nos bota-foras, entulhos e obstáculos removidos",
      secao: "5.4.1", grupo: "Execução", tipo: "sim_nao", exigido: "inspeção visual após a modelagem" },
    { id: "topsoil", texto: "Espessura da camada orgânica (top-soil) reposta", secao: "5.4.2", grupo: "Execução", tipo: "valor", unid: "m", casas: 2,
      min: 0.15, exigido: "≥ 0,15 m (espessura mínima exigida)", freq: G.lote() },
    { id: "aracao", texto: "Profundidade da aração (sulcos em curva de nível, ≈ 0,30 m entre si)", secao: "5.4.3", grupo: "Execução", tipo: "valor", unid: "m", casas: 2,
      min: 0.15, max: 0.20, falha: "ressalva", freq: G.lote() },
    { id: "intervalo", texto: "Intervalo entre a calagem e a adubação", secao: "5.4.4; 5.4.5", grupo: "Execução", tipo: "valor", unid: "dias", casas: 0,
      min: 30, max: 60, falha: "ressalva", freq: G.lote() },
    { id: "irrig", texto: "Irrigação no período seco: ≥ 1 vez por semana até a germinação / pegamento, 5 a 10 L/m², em chuvisco leve nas horas amenas",
      secao: "5.4.7", grupo: "Execução", tipo: "sim_nao", se: function (P) { return G.sim(P, "seco"); }, naoAplicaPor: "plantio no período chuvoso",
      falha: "ressalva", exigido: "registro semanal de irrigação" },
    { id: "adubcob", texto: "Adubação de cobertura 90 a 120 dias após o plantio (≈ 50 % da adubação inicial)", secao: "5.4.8", grupo: "Execução", tipo: "sim_nao",
      se: G.etapa2, naoAplicaPor: "verificada na 2ª etapa", exigido: "realizada no prazo e na dose" },
    { id: "acab", texto: "Controle geométrico e de acabamento — apreciação visual da Fiscalização", secao: "6", grupo: "Produto", tipo: "sim_nao",
      exigido: "aprovado pela Fiscalização" },
    G.cobertura("6; 7 b"),
    { id: "agron", texto: "Cobertura, vigor de crescimento e persistência aprovados pelo agrônomo responsável (processos usuais do plantio agrícola)",
      secao: "6", grupo: "Produto", tipo: "sim_nao", se: G.etapa2, naoAplicaPor: "verificado na 2ª etapa", exigido: "aprovação liberada à Fiscalização" },
  ];

  G.fichaComSementes({
    id: "dnit-071-2006-es",
    titulo: "Revegetação herbácea de áreas planas ou de pouca declividade — aceitação da área tratada",
    resumo: "Verificações da DNIT 071/2006-ES (seções 4 a 7): análise do solo, certificado e qualidade das sementes (Tabelas 1 e 2), calagem, modelagem, top-soil ≥ 0,15 m, aração, intervalos, irrigação, adubação de cobertura, acabamento e cobertura vegetal de 100 % (2ª etapa).",
    lote: false,
    params: [G.paramArea, G.ETAPA,
      { k: "plantio", r: "Processo de plantio (5.4.6)", tipo: "select", recarrega: true, opcoes: [["sementes", "Sementes a lanço (manual ou mecanizado)"], ["mudas", "Hastes e estolões, placas ou leivas"]] },
      G.paramSeco, G.paramDias],
    padrao: { etapa: "1", plantio: "sementes", seco: "nao" },
    criterios: C,
    extra: function (ctx) {
      var P = ctx.P, dias = num(P.dias), l = ctx.item.cobertura;
      if (G.etapa2(P) && ok(dias) && dias < 120) ctx.avisos.push("2ª etapa com " + dias + " dias desde o plantio: a ES considera usual a cobertura de 100 % entre 120 e 150 dias (6).");
      if (l && l.situacao === "nao_conforme") A.marcar(l, "nao_conforme", "área não liberada para a 2ª medição (7 b): replantio / tratos até a cobertura total");
    },
    notas: "Critérios da DNIT 071/2006-ES: a seção 6 remete o controle geométrico e de acabamento à apreciação visual da Fiscalização e a cobertura, o vigor e a persistência à aprovação do agrônomo responsável; os valores medidos vêm das seções 5.1 a 5.4 (top-soil ≥ 0,15 m exigido; aração, intervalos e dose de calcário tratados como ressalva por serem descritos como prática usual). Sementes: valor cultural = pureza × germinação / 100 (Tabelas 1 e 2); para leguminosas nacionais adotado VC ≥ 56,25 % (= 75 % × 75 %; a ES imprime 56,26 %). A ES não fixa frequência: 1 verificação por área liberada.",
    exemplos: [
      { nome: "Área de empréstimo — 2ª etapa, cobertura total (aceita)", dados: function () {
        var P = { area: "12500", etapa: "2", plantio: "sementes", seco: "nao", dias: "138" };
        return { ident: { registro: "AMB-071-01", data: "2026-05-18", obra: "Obra A", trecho: "BR-000 — km 12", local: "Caixa de empréstimo 3 (lado direito)", responsavel: "Eng. agrônomo responsável" },
          params: P, verificacoes: G.verif(C, P),
          sementes: [{ reg: "Brachiaria — lote 1", tipo: "G", orig: "N", pur: "62", ger: "70", vc: "43,4" }, { reg: "Calopogônio — lote 2", tipo: "L", orig: "N", pur: "82", ger: "78" }],
          calcario: G.vals([["Área toda", "1,20", "Nota de aplicação 14"]]),
          topsoil: G.vals([["Ponto 1 (norte)", "0,18"], ["Ponto 2 (centro)", "0,16"], ["Ponto 3 (sul)", "0,17"]]),
          aracao: G.vals([["Ponto 1", "0,18"], ["Ponto 2", "0,17"]]),
          intervalo: G.vals([["Calagem 02/01 → adubação 12/02", "41"]]),
          cobertura: G.vals([["Inspeção final (agrônomo + Fiscalização)", "100"]]) };
      } },
      { nome: "Canteiro desativado — 2ª etapa com falhas (rejeitada)", dados: function () {
        var P = { area: "4200", etapa: "2", plantio: "sementes", seco: "sim", dias: "126" };
        return { ident: { registro: "AMB-071-02", data: "2026-06-02", obra: "Obra B", trecho: "BR-000 — km 48", local: "Canteiro de obras desativado" },
          params: P, verificacoes: G.verif(C, P, { conform: { atende: "N", obs: "arestas vivas na crista do bota-fora" }, irrig: { real: "10", nc: "3", obs: "3 semanas sem irrigação" } }),
          sementes: [{ reg: "Brachiaria — lote 7", tipo: "G", orig: "N", pur: "58", ger: "63" }, { reg: "Feijão guandu — lote 8", tipo: "L", orig: "N", pur: "74", ger: "72" }],
          calcario: G.vals([["Área toda", "1,80"]]),
          topsoil: G.vals([["Ponto 1", "0,16"], ["Ponto 2", "0,12"]]),
          aracao: G.vals([["Ponto 1", "0,12"]]),
          intervalo: G.vals([["Calagem → adubação", "18"]]),
          cobertura: G.vals([["Inspeção final", "85"]]) };
      } },
    ],
  }, { secao: "5.1", tabs: "Tabelas 1 e 2", se: sementes });
})();
