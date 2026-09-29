/*
 * Ficha: DNER-PRO 143/94 — Formação de lotes de inspeção (registro e verificação).
 * A PRO não tem cálculo: a ficha registra os lotes de produção que compõem o lote de inspeção e confere as condições
 * gerais da seção 4:
 *   4.1  agrupamento conforme a especificação do produto ou, na falta dela, a ordem de compra;
 *   4.2  produto que afeta saúde/segurança: indicação do lote de produção (batelada, corrida, data e turma …);
 *   4.3  idem: lote de inspeção formado por lote tipo B (3.8: único tipo, classe, forma e composição, mesmas condições,
 *        mesmo período) ou parte dele;
 *   4.4  produto que não afeta: lote tipo A admitido (3.7), tipo B preferível;
 *   4.5  qualidade inalterável no transporte: formar o lote, amostrar e ensaiar na fábrica (evita dupla inspeção);
 *   4.6  afeta saúde/segurança e pode alterar-se antes do uso: formar o lote imediatamente antes do uso;
 *   Nota planos de amostragem e inspeção: os da especificação; sem ela, os da ordem de compra (ABNT NB-309 / NBR 5426).
 * Interpretação: "lote B ou parte deste" é conferido pela homogeneidade (tipo, classe, forma/composição iguais e
 * fabricação no mesmo período); vários lotes de produção num lote B geram ressalva (documentar as mesmas condições).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-pro-143-94";
  function vazio(v) { return v === undefined || v === null || String(v).trim() === ""; }
  function norm(v) { return String(v || "").trim().toLowerCase(); }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [];
    var saude = P.saude === "sim";
    var lp = (d.lp || []).filter(function (c) { return !vazio(c.lote) || !vazio(c.qtd) || !vazio(c.tipo); });
    var qtd = lp.reduce(function (s, c) { var q = num(c.qtd); return s + (ok(q) ? q : 0); }, 0);
    var G1 = "Formação do lote (4.1 a 4.4)", G2 = "Local da formação e amostragem (4.5, 4.6, Nota)";
    // 4.1
    var l1 = A.linha({ id: "base", grupo: G1, criterio: "Agrupamento conforme a especificação do produto (ou a ordem de compra, na falta dela)", secao: "4.1",
      exigido: "especificação ou ordem de compra", resultado: P.base === "espec" ? "especificação: " + (P.espec || "—") : P.base === "oc" ? "ordem de compra: " + (P.oc || "—") : "—", n: 1 });
    if (!P.base) A.marcar(l1, "pendente", "informe a base do agrupamento");
    else if (P.base === "espec" && vazio(P.espec)) A.marcar(l1, "pendente", "informe a especificação");
    else if (P.base === "oc" && vazio(P.oc)) A.marcar(l1, "pendente", "informe a ordem de compra");
    linhas.push(l1);
    // 4.2
    var semId = lp.filter(function (c) { return vazio(c.lote); });
    var l2 = A.linha({ id: "ident", grupo: G1, criterio: "Indicação do lote de produção (batelada, corrida, data de fabricação, turma)", secao: "4.2",
      exigido: saude ? "obrigatória (afeta saúde/segurança)" : "recomendável", resultado: lp.length ? (lp.length - semId.length) + " de " + lp.length + " identificados" : "—", n: lp.length });
    if (!lp.length) A.marcar(l2, "sem_dados", "nenhum lote de produção registrado");
    else if (semId.length) A.marcar(l2, saude ? "nao_conforme" : "ressalva", semId.length + " lote(s) sem identificação de produção");
    if (saude && P.naOC === "nao") A.marcar(l2, "nao_conforme", "a indicação do lote deve constar da especificação ou da ordem de compra (4.2)");
    linhas.push(l2);
    // 4.3 / 4.4 — tipo de lote e homogeneidade
    var campos = [["tipo", "tipo"], ["classe", "classe"], ["comp", "forma/composição"]];
    var difs = campos.filter(function (f) {
      var vs = lp.map(function (c) { return norm(c[f[0]]); }).filter(Boolean);
      return vs.some(function (v) { return v !== vs[0]; });
    }).map(function (f) { return f[1]; });
    var datas = lp.map(function (c) { return c.data ? new Date(c.data) : null; }).filter(function (x) { return x && !isNaN(x); });
    var span = datas.length > 1 ? (Math.max.apply(null, datas) - Math.min.apply(null, datas)) / 864e5 : 0, per = num(P.periodo);
    var ids = lp.map(function (c) { return norm(c.lote); }).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var l3 = A.linha({ id: "tipo", grupo: G1, criterio: "Tipo do lote de inspeção", secao: saude ? "4.3 / 3.8" : "4.4 / 3.7",
      exigido: saude ? "lote tipo B ou parte dele" : "tipo A admitido; tipo B preferível", resultado: P.tipoLote ? "tipo " + P.tipoLote + (ids.length ? " · " + ids.length + " lote(s) de produção" : "") : "—", n: 1 });
    if (!P.tipoLote) A.marcar(l3, "pendente", "informe o tipo do lote");
    else if (saude && P.tipoLote !== "B") A.marcar(l3, "nao_conforme", "produto que afeta a saúde ou a segurança exige lote tipo B (4.3)");
    if (P.tipoLote === "B") {
      if (difs.length) A.marcar(l3, "nao_conforme", "lote B com unidades de " + difs.join(", ") + " diferentes (3.8: único tipo, classe, forma e composição)");
      if (ok(per) && span > per + 1e-9) A.marcar(l3, "nao_conforme", "fabricação espalhada por " + fmt(span, 0) + " dias, além do período de produção de " + fmt(per, 0) + " dias (3.2 / 3.8)");
      else if (!ok(per) && span > 0) A.marcar(l3, "ressalva", "datas de fabricação diferentes (" + fmt(span, 0) + " dias): confirme que é o mesmo período de produção (3.2)");
      if (ids.length > 1) A.marcar(l3, "ressalva", "mais de um lote de produção num lote B: documente as mesmas condições de fabricação");
    } else if (P.tipoLote === "A" && !saude) {
      l3.motivo = "tipo A admitido (4.4); tipo B seria preferível";
      if (difs.length) A.marcar(l3, "ressalva", "unidades aparentemente uniformes? diferem em " + difs.join(", ") + " (3.7)");
    }
    linhas.push(l3);
    // 4.5 / 4.6
    var l4 = A.linha({ id: "local", grupo: G2, criterio: "Local/momento da formação do lote", secao: saude && P.altera === "sim" ? "4.6" : "4.5",
      exigido: saude && P.altera === "sim" ? "imediatamente antes do uso, sempre que possível" : P.altera === "nao" ? "na fábrica, sempre que possível (evita dupla inspeção)" : "—",
      resultado: { fabrica: "na fábrica", recebimento: "no recebimento", uso: "imediatamente antes do uso" }[P.local] || "—", n: 1 });
    if (!P.local || !P.altera) A.marcar(l4, "pendente", "informe o local e se a qualidade pode alterar-se no transporte/armazenagem");
    else if (P.altera === "nao" && P.local !== "fabrica") A.marcar(l4, "ressalva", "qualidade inalterável no transporte: formar, amostrar e ensaiar na fábrica sempre que possível (4.5)");
    else if (P.altera === "sim" && saude && P.local !== "uso") A.marcar(l4, "ressalva", "pode alterar-se antes do uso: formar o lote imediatamente antes do uso, mesmo já aceito (4.6)");
    linhas.push(l4);
    var l5 = A.linha({ id: "plano", grupo: G2, criterio: "Plano de amostragem e procedimento de inspeção", secao: "Nota da seção 4",
      exigido: "os da especificação; sem ela, os da ordem de compra (ABNT NB-309 / NBR 5426)", resultado: P.plano || "—", n: vazio(P.plano) ? 0 : 1 });
    if (vazio(P.plano)) A.marcar(l5, "pendente", "informe o plano de amostragem adotado");
    linhas.push(l5);
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "LOTE DE INSPEÇÃO BEM FORMADO", texto: "Formação conforme a DNER-PRO 143/94; prossiga com a amostragem do plano indicado." },
      RESSALVA: { titulo: "LOTE DE INSPEÇÃO FORMADO COM RESSALVA", texto: "Formação aceitável; há pontos a documentar." },
      PENDENTE: { titulo: "FORMAÇÃO DO LOTE INCOMPLETA", texto: "Faltam informações para conferir a formação do lote." },
      REJEITADO: { titulo: "LOTE DE INSPEÇÃO MAL FORMADO", texto: "Refazer o agrupamento antes de amostrar (seção 4)." } } });
    return { tab: {}, resultados: { linhas: linhas, parecer: par, nLotes: lp.length, qtd: qtd, saude: saude }, avisos: avisos };
  }

  FE.FICHAS[ID] = {
    titulo: "Formação de lotes de inspeção",
    lote: true,
    resumo: "Registro dos lotes de produção que compõem o lote de inspeção e verificação da seção 4: identificação do lote de produção, lote tipo B (homogêneo, mesmo período) para produtos que afetam saúde/segurança, local da formação e origem do plano de amostragem.",
    rotuloImportar: function (r) { return (r.nLotes || 0) + " lote(s) de produção · " + (r.parecer ? r.parecer.parecer : ""); },
    blocos: [],
    params: [
      { k: "produto", r: "Unidade de produto (3.1)", ph: "ex.: tinta para sinalização horizontal" },
      { k: "saude", r: "A qualidade pode afetar a saúde ou a segurança individual/coletiva?", tipo: "select", recarrega: true, opcoes: [["sim", "Sim — 4.2, 4.3, 4.6"], ["nao", "Não — 4.4"]] },
      { k: "base", r: "Agrupamento definido por (4.1)", tipo: "select", recarrega: true, opcoes: [["", "—"], ["espec", "Especificação do produto"], ["oc", "Ordem de compra (sem especificação)"]] },
      { k: "espec", r: "Especificação", ph: "ex.: DNIT 000/2020-EM", se: function (d) { return (d.params || {}).base === "espec"; } },
      { k: "oc", r: "Ordem de compra", ph: "ex.: OC 000/2026", se: function (d) { return (d.params || {}).base === "oc"; } },
      { k: "naOC", r: "A indicação do lote de produção consta da especificação/ordem de compra (4.2)?", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não"]],
        se: function (d) { return (d.params || {}).saude === "sim"; } },
      { k: "tipoLote", r: "Tipo do lote de inspeção", tipo: "select", opcoes: [["", "—"], ["A", "Tipo A — unidades aparentemente uniformes (3.7)"], ["B", "Tipo B — único tipo, classe, forma, composição e período (3.8)"]] },
      { k: "periodo", r: "Período de produção considerado (dias) — opcional", dica: "3.2: intervalo sem variação de matérias-primas nem do processo" },
      { k: "altera", r: "A qualidade pode alterar-se no transporte/armazenagem antes do uso?", tipo: "select", opcoes: [["", "—"], ["nao", "Não — 4.5"], ["sim", "Sim — 4.6"]] },
      { k: "local", r: "Onde o lote foi formado", tipo: "select", opcoes: [["", "—"], ["fabrica", "Na fábrica"], ["recebimento", "No recebimento (obra/almoxarifado)"], ["uso", "Imediatamente antes do uso"]] },
      { k: "plano", r: "Plano de amostragem / inspeção adotado (Nota)", ph: "ex.: NBR 5426, nível II, NQA 1,5" },
    ],
    padrao: { saude: "sim" },
    tabelas: function () {
      return [{ chave: "lp", titulo: "Lotes de produção incluídos no lote de inspeção (3.5 / 4.2)", rotulo: "Lote", iniciais: 2, min: 1,
        linhas: [{ k: "lote", r: "Lote de produção (batelada / corrida / turma)", texto: true, ph: "ex.: batelada 0412" }, { k: "data", r: "Data de fabricação", texto: true, ph: "aaaa-mm-dd" },
          { k: "tipo", r: "Tipo", texto: true }, { k: "classe", r: "Classe", texto: true }, { k: "comp", r: "Forma / composição", texto: true },
          { k: "fornecedor", r: "Fabricante", texto: true }, { k: "qtd", r: "Quantidade de unidades", u: "un." }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(String(r.nLotes), "Lotes de produção") + A.cartao(fmt(r.qtd, 0), "Unidades no lote de inspeção") + "</div>" +
        A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    relatorio: {
      notas: "DNER-PRO 143/94, seção 4. Lote tipo A: unidades aparentemente uniformes (3.7); tipo B: único tipo, classe, forma e composição, fabricadas sob as mesmas condições e no mesmo período (3.8). Datas de fabricação no formato aaaa-mm-dd.",
      resultados: function (calc, d) { var r = calc.resultados; return [["Parecer", r.parecer.titulo], ["Produto", (d.params || {}).produto || "—"], ["Lotes de produção · unidades", r.nLotes + " · " + fmt(r.qtd, 0)]]; },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Tinta de sinalização (afeta a segurança) — lote B de uma batelada, formado antes do uso", dados: function () {
        return { ident: { registro: "LI-01", data: "2026-07-02", obra: "Obra A", origem: "Fornecedor A" },
          params: { produto: "Tinta para sinalização horizontal, branca", saude: "sim", base: "espec", espec: "especificação de material do contrato", naOC: "sim", tipoLote: "B", periodo: "7",
            altera: "sim", local: "uso", plano: "NBR 5426 — amostragem simples, nível II" },
          lp: [{ lote: "Batelada 0412", data: "2026-06-18", tipo: "acrílica base água", classe: "branca", comp: "formulação F-1", fornecedor: "Fabricante A", qtd: "120" },
            { lote: "Batelada 0412", data: "2026-06-18", tipo: "acrílica base água", classe: "branca", comp: "formulação F-1", fornecedor: "Fabricante A", qtd: "80" }] };
      } },
      { nome: "Tachas refletivas (afetam a segurança) — lote A misturando classes e sem identificação", dados: function () {
        return { ident: { registro: "LI-02", data: "2026-07-09", obra: "Obra B", origem: "Fornecedor B" },
          params: { produto: "Tachas refletivas bidirecionais", saude: "sim", base: "oc", oc: "OC 000/2026", naOC: "nao", tipoLote: "A", altera: "nao", local: "recebimento", plano: "" },
          lp: [{ lote: "Corrida 88", data: "2026-05-02", tipo: "tacha", classe: "monodirecional", comp: "resina", fornecedor: "Fabricante B", qtd: "500" },
            { lote: "", data: "2026-06-20", tipo: "tacha", classe: "bidirecional", comp: "resina", fornecedor: "Fabricante B", qtd: "700" }] };
      } },
    ],
  };
})();
