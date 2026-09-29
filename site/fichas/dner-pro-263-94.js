/*
 * Ficha: DNER-PRO 263/94 — Emprego de escórias de aciaria em pavimentos rodoviários (procedimento).
 * Registra-se em window.FE (usa FE.aceitacao: linhas de critério e parecer).
 *
 * O que a PRO manda:
 *   4     a escória satisfaz as condições gerais da DNER-EM 262/94 (aceitação do lote — importável da ficha da EM 262);
 *   5.1   emprego em sub-base, base e misturas betuminosas, conforme as exigências aprovadas nos projetos;
 *   Nota  rigoroso controle da EXPANSÃO na aceitação: ≤ 3 % ou o valor da especificação particular do projeto, pelo
 *         PTM 130 adaptado (DNIT 113/2009-ME — importável; a nota está truncada no PDF depois de "adaptado pelo");
 *   3.3   lote de estocagem ≤ 2 000 t;  3.8 / 3.9 nota de entrega e rastreabilidade (registradas);
 *   2.1 b sub-base e base: consultar a ABNT EB-2103 (fora do acervo — registrada como verificação).
 * Outras camadas (subleito, aterro, regularização, revestimento de concreto) não estão previstas na PRO.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-pro-263-94", EM = "dner-em-262-94", ME = "dnit-113-2009-me", LOTE_MAX = 2000;
  var CAMADAS = [["subbase", "Sub-base (5.1)"], ["base", "Base (5.1)"], ["mistura", "Mistura betuminosa (5.1)"],
    ["outra", "Outra camada — subleito, aterro, regularização, revestimento de concreto (não prevista)"]];
  var SN = [["", "— não verificado"], ["S", "Atende"], ["N", "Não atende"], ["NA", "Não se aplica"]];
  function situacaoParecer(t) {
    var s = String(t || "").toUpperCase();
    if (!s.trim()) return "";
    if (/REJEIT|N[ÃA]O ACEIT/.test(s)) return "nao_conforme";
    if (/PENDENTE|INCOMPLET/.test(s)) return "pendente";
    if (/RESSALVA/.test(s)) return "ressalva";
    if (/ACEIT|APROVAD|CONFORME/.test(s)) return "conforme";
    return "?";
  }
  function linhaSN(v, o) {
    var l = A.linha(Object.assign({ n: v && v !== "NA" ? 1 : 0, resultado: v === "S" ? "atende" : v === "N" ? "não atende" : v === "NA" ? "não se aplica" : "—" }, o));
    if (v === "N") A.marcar(l, o.falha || "nao_conforme", "não atende (" + o.secao + ")");
    else if (v === "NA") { l.situacao = "nao_exigido"; l.motivo = "não se aplica"; }
    else if (!v) { if (o.opcional) { l.situacao = "nao_exigido"; l.motivo = "não verificado"; } else A.marcar(l, "pendente", "verificação não registrada"); }
    return l;
  }
  function vazioCol(c, ks) { return !ks.some(function (k) { return String(c[k] || "").trim(); }); }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [];
    var cam = CAMADAS.filter(function (c) { return c[0] === (P.camada || "base"); })[0] || CAMADAS[1];
    var lp = num(P.expMax), lim = ok(lp) ? lp : 3, limTxt = "≤ " + fmt(lim, ok(lp) ? 1 : 0) + " %" + (ok(lp) ? " (especificação particular)" : "");
    // camada (5.1)
    var lc = A.linha({ id: "cam", grupo: "Emprego (5.1)", criterio: "Camada de emprego", secao: "5.1", exigido: "sub-base, base ou mistura betuminosa", resultado: cam[1].replace(/ \(.*\)$/, "").replace(/ — .*/, ""), n: 1 });
    if (cam[0] === "outra") A.marcar(lc, "nao_conforme", "a PRO 263 só prevê o emprego em sub-base, base e misturas betuminosas (5.1)");
    linhas.push(lc);
    // lotes (EM 262)
    var lotes = (d.lotes || []).filter(function (c) { return !vazioCol(c, ["reg", "qtd", "exp", "parecer"]); }), qtot = 0, exps = [];
    lotes.forEach(function (c, i) {
      var rot = "Lote " + (c.reg ? c.reg : i + 1), G = rot + (c.forn ? " — " + c.forn : ""), q = num(c.qtd), sp = situacaoParecer(c.parecer);
      if (ok(q)) qtot += q;
      var le = A.linha({ id: "em" + i, grupo: G, criterio: rot + ": aceitação pela DNER-EM 262/94", secao: "4", exigido: "lote aceito", n: sp ? 1 : 0, resultado: c.parecer ? String(c.parecer) : "—" });
      if (!sp) A.marcar(le, "pendente", "sem o resultado da aceitação pela EM 262 — importe a ficha da DNER-EM 262/94 ou informe o parecer");
      else if (sp === "?") A.marcar(le, "pendente", "parecer \"" + c.parecer + "\" não reconhecido (use ACEITO / REJEITADO / PENDENTE)");
      else if (sp === "nao_conforme") A.marcar(le, "nao_conforme", "lote rejeitado na aceitação pela EM 262 — não satisfaz as condições gerais (4)");
      else if (sp === "pendente") A.marcar(le, "pendente", "aceitação pela EM 262 incompleta");
      else if (sp === "ressalva") A.marcar(le, "ressalva", "lote aceito com ressalva pela EM 262");
      linhas.push(le);
      var ll = A.linha({ id: "lt" + i, grupo: G, criterio: rot + ": lote de estocagem", secao: "3.3", unid: "t", exigido: "≤ " + fmt(LOTE_MAX, 0) + " t", n: ok(q) ? 1 : 0, resultado: ok(q) ? fmt(q, 0) + " t" : "—" });
      if (!ok(q)) { ll.situacao = "nao_exigido"; ll.motivo = "quantidade não informada"; }
      else if (q > LOTE_MAX) A.marcar(ll, "ressalva", "lote acima de " + fmt(LOTE_MAX, 0) + " t — forme " + Math.ceil(q / LOTE_MAX - 1e-9) + " lotes de estocagem (3.3)");
      linhas.push(ll);
      var e = num(c.exp);
      // a EM 262 costuma trazer a expansão importada da própria DNIT 113: valor igual (2 casas) ao de um ensaio da tabela
      // de expansão = mesma determinação, contada uma vez
      var dup = ok(e) && (d.exp || []).some(function (x) { return ok(num(x.v)) && fmt(num(x.v), 2) === fmt(e, 2); });
      if (ok(e) && !dup) exps.push({ v: e, rot: rot + " (EM 262)" });
      if (c.camEM && cam[0] !== "outra" && c.camEM !== cam[0]) avisos.push(rot + ": a aceitação pela EM 262 foi feita para \"" + c.camEMr + "\" — confira se os limites da EM (ex.: Los Angeles) valem para a camada desta ficha.");
    });
    if (!lotes.length) linhas.push(A.marcar(A.linha({ id: "lotes", grupo: "Lotes de escória (4)", criterio: "Lotes de escória a empregar", secao: "4", exigido: "ao menos um lote aceito pela EM 262" }), "sem_dados", "nenhum lote informado"));
    // expansão (Nota de 5.1)
    (d.exp || []).forEach(function (c, i) {
      var e = num(c.v);
      if (ok(e)) exps.push({ v: e, rot: (c.reg || "determinação " + (i + 1)) + (c.lote ? " — lote " + c.lote : "") });
    });
    var lx = A.linha({ id: "exp", grupo: "Expansão (Nota de 5.1)", criterio: "Potencial de expansão — PTM 130 adaptado (DNIT 113-ME)", secao: "5.1 Nota", unid: "%", casas: 2, exigido: limTxt, n: exps.length });
    if (!exps.length) A.marcar(lx, "pendente", "sem resultado de expansão: a PRO exige rigoroso controle da expansão na aceitação");
    else {
      var mx = Math.max.apply(null, exps.map(function (x) { return x.v; }));
      lx.resultado = exps.length > 1 ? "máx. " + fmt(mx, 2) + " % (" + exps.length + " det.: " + exps.map(function (x) { return fmt(x.v, 2); }).join("; ") + ")" : fmt(mx, 2) + " %";
      var fora = exps.filter(function (x) { return x.v > lim + 1e-9; });
      if (fora.length) A.marcar(lx, "nao_conforme", fora.map(function (x) { return x.rot + ": " + fmt(x.v, 2) + " %"; }).join("; ") + " — acima do limite: " + limTxt + " (Nota de 5.1)");
    }
    linhas.push(lx);
    (d.exp || []).forEach(function (c) { if (c.limME && ok(num(c.limME)) && Math.abs(num(c.limME) - lim) > 1e-9) avisos.push((c.reg || "Ensaio") + ": a ficha da DNIT 113 usou o limite de " + c.limME + " % — aqui vale " + limTxt + "."); });
    // projeto e documentos
    var G2 = "Projeto, normas complementares e documentação";
    if (cam[0] === "base" || cam[0] === "subbase") linhas.push(linhaSN(P.eb2103, { id: "eb", grupo: G2, criterio: "Material de sub-base/base atende à ABNT EB-2103 (estabilizado granulometricamente)", secao: "2.1 b", exigido: "atende" }));
    linhas.push(linhaSN(P.projeto, { id: "proj", grupo: G2, criterio: "Exigências aprovadas no projeto a que a escória se destina", secao: "5.1", exigido: "atende" }));
    linhas.push(linhaSN(P.nota, { id: "nota", grupo: G2, criterio: "Nota de entrega (volume, tipo, granulometria) e rastreabilidade do lote", secao: "3.8 / 3.9", exigido: "documentação completa", falha: "ressalva", opcional: true }));
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "EMPREGO ADMITIDO", texto: "Camada prevista, lote(s) aceito(s) pela DNER-EM 262/94 e expansão dentro do limite (4 e 5.1)." },
      RESSALVA: { titulo: "EMPREGO ADMITIDO COM RESSALVA", texto: "Nenhuma exigência descumprida, mas há pontos a documentar ou corrigir." },
      PENDENTE: { titulo: "VERIFICAÇÃO INCOMPLETA", texto: "Faltam a aceitação pela EM 262, a expansão ou verificações de projeto para decidir." },
      REJEITADO: { titulo: "EMPREGO NÃO ADMITIDO", texto: "Camada não prevista, lote rejeitado pela EM 262 ou expansão acima do limite." } } });
    return { tab: {}, resultados: { linhas: linhas, parecer: par, camada: cam[1], nLotes: lotes.length, qtot: qtot, expMax: exps.length ? Math.max.apply(null, exps.map(function (x) { return x.v; })) : NaN,
      nExp: exps.length, lim: lim, limTxt: limTxt, exps: exps }, avisos: avisos };
  }

  FE.FICHAS[ID] = {
    titulo: "Escória de aciaria — emprego por camada",
    lote: true,
    resumo: "Verifica o emprego da escória de aciaria em sub-base, base ou mistura betuminosa (5.1), a aceitação dos lotes pela DNER-EM 262/94 (4, importável), o lote de estocagem ≤ 2 000 t (3.3) e a expansão ≤ 3 % ou o valor do projeto pelo PTM 130 adaptado (Nota de 5.1; importável da DNIT 113-ME); parecer do emprego.",
    rotuloImportar: function (r) { return (r.camada ? r.camada.replace(/ \(.*\)$/, "").replace(/ — .*/, "") + " · " : "") + (ok(r.expMax) ? "expansão " + fmt(r.expMax, 2) + " % · " : "") + (r.parecer ? r.parecer.titulo.toLowerCase() : "—"); },
    params: [
      { k: "camada", r: "Camada de emprego (5.1)", tipo: "select", recarrega: true, opcoes: CAMADAS },
      { k: "expMax", r: "Expansão máxima da especificação particular (%) — opcional", ph: "3", dica: "Nota de 5.1: não superior a 3 % ou o valor do projeto" },
      { k: "impLotes", r: "Importar lotes da ficha da DNER-EM 262/94", tipo: "importarVarios", de: EM,
        dica: "cada ensaio da EM 262 vira uma coluna (registro, fornecedor, quantidade, expansão e parecer)",
        aplicar: function (lista, P, d) {
          var cols = lista.map(function (e) {
            var p = e.dados.params || {}, r = e.resultados || {}, V = r.V || {};
            return { reg: (e.dados.ident || {}).registro || "", forn: p.fornecedor || (e.dados.ident || {}).origem || "", qtd: p.quantidade || "",
              exp: ok(V.exp) ? fmt(V.exp, 2) : "", parecer: r.parecer ? r.parecer.titulo.replace(/^LOTE /, "") : "",
              camEM: { base: "base", subbase: "subbase", rev: "mistura" }[p.camada] || "", camEMr: { base: "base", subbase: "sub-base", rev: "revestimento" }[p.camada] || "" };
          });
          A.importacao.substituir(d, "lotes", cols, { chave: ["reg"] });
        } },
      { k: "impExp", r: "Importar ensaios de expansão (DNIT 113/2009-ME — PTM 130 adaptado)", tipo: "importarVarios", de: ME,
        dica: "cada ensaio vira uma determinação da tabela de expansão (média dos corpos de prova)",
        aplicar: function (lista, P, d) {
          var cols = lista.map(function (e) {
            var r = e.resultados || {}, i = e.dados.ident || {};
            return { reg: i.registro || "", lote: i.local || "", v: ok(r.media) ? fmt(r.media, 2) : "", limME: ok(r.limite) ? fmt(r.limite, 1) : "" };
          });
          A.importacao.substituir(d, "exp", cols, { chave: ["reg"] });
        } },
      { k: "eb2103", r: "Sub-base/base: atende à ABNT EB-2103 (2.1 b)", tipo: "select", opcoes: SN,
        se: function (d) { var c = (d.params || {}).camada || "base"; return c === "base" || c === "subbase"; } },
      { k: "projeto", r: "Exigências aprovadas no projeto atendidas (5.1)", tipo: "select", opcoes: SN },
      { k: "nota", r: "Nota de entrega e rastreabilidade (3.8 / 3.9)", tipo: "select", opcoes: SN },
    ],
    padrao: { camada: "base", expMax: "" },
    tabelas: function () {
      return [{ chave: "lotes", titulo: "Lotes de escória de aciaria (DNER-EM 262/94)", rotulo: "Lote", iniciais: 1, min: 1, dica: "um lote por coluna; parecer da EM 262: ACEITO / REJEITADO / PENDENTE",
        linhas: [{ k: "reg", r: "Registro do recebimento (EM 262)", texto: true }, { k: "forn", r: "Usina siderúrgica / fornecedor", texto: true },
          { k: "qtd", r: "Quantidade do lote de estocagem (3.3)", u: "t" }, { k: "exp", r: "Expansão registrada na EM 262 (4.1)", u: "%" },
          { k: "parecer", r: "Parecer da aceitação pela DNER-EM 262/94", texto: true, ph: "ACEITO" }] },
        { chave: "exp", titulo: "Potencial de expansão — PTM 130 adaptado (DNIT 113-ME)", rotulo: "Ensaio", iniciais: 1, min: 1, dica: "resultados avulsos de expansão (além dos registrados nos lotes)",
          linhas: [{ k: "reg", r: "Registro do ensaio", texto: true }, { k: "lote", r: "Lote / local", texto: true }, { k: "v", r: "Expansão", u: "%" }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(esc(r.camada.replace(/ \(.*\)$/, "").replace(/ — .*/, "")), "Camada") +
        A.cartao(ok(r.expMax) ? fmt(r.expMax, 2) + " <small>%</small>" : "—", "Maior expansão (" + r.nExp + " det.) — limite " + esc(r.limTxt.replace(/ \(.*\)$/, ""))) +
        A.cartao(r.nLotes + (r.qtot ? " · " + fmt(r.qtot, 0) + " t" : ""), "Lotes verificados") + "</div>" + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados;
      if (!r.exps.length) return [];
      var pts = r.exps.map(function (x, i) { return { x: i + 1, y: x.v, fora: x.v > r.lim + 1e-9 }; });
      return [A.grafico("Potencial de expansão (%) por determinação", pts, [{ y: r.lim, tipo: "lim", txt: "máx. " + fmt(r.lim, 1) + " %" }], opt || {}, "idx")];
    },
    relatorio: {
      notas: "DNER-PRO 263/94: a escória de aciaria deve satisfazer as condições gerais da DNER-EM 262/94 (4) e pode ser empregada em sub-base, base e misturas betuminosas, conforme as exigências aprovadas nos projetos (5.1). Nota de 5.1: rigoroso controle da expansão na aceitação — não superior a 3 % ou ao valor da especificação particular do projeto, pelo PTM 130 adaptado (DNIT 113/2009-ME); o texto da nota está truncado no original. Lote de estocagem ≤ 2 000 t (3.3). Sub-base e base: consultar a ABNT EB-2103 (2.1 b). Critério da ficha: toda determinação de expansão deve atender ao limite.",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Parecer", r.parecer.titulo], ["Camada", r.camada], ["Maior expansão", ok(r.expMax) ? fmt(r.expMax, 2) + " % (" + r.nExp + " determinação(ões)) — limite " + r.limTxt : "—"],
          ["Lotes verificados", r.nLotes + (r.qtot ? " (" + fmt(r.qtot, 0) + " t)" : "")]];
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Sub-base — lote aceito pela EM 262 e expansão de 1,64 % (DNIT 113 importada): emprego admitido", dados: function () {
        var d = { ident: { registro: "EMP-EAC-01", data: "2026-06-04", obra: "Obra C", trecho: "Segmento 2", camada: "Sub-base — escória de aciaria" },
          params: { camada: "subbase", eb2103: "S", projeto: "S", nota: "S" }, lotes: [], exp: [] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impLotes", [[EM, 0]]);
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impExp", [[ME, 0]]);
        return d;
      } },
      { nome: "Base — lote de 2 600 t rejeitado pela EM 262, expansão de 4,00 %: emprego não admitido", dados: function () {
        var d = { ident: { registro: "EMP-EAC-02", data: "2026-07-10", obra: "Obra D", trecho: "Segmento 5", camada: "Base — escória de aciaria" },
          params: { camada: "base", eb2103: "S", projeto: "S" },
          lotes: [{ reg: "REC-EAC-09", forn: "Usina E", qtd: "2600", exp: "2,10", parecer: "ACEITO" }], exp: [] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impLotes", [[EM, 1]]);
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impExp", [[ME, 1]]);
        return d;
      } },
    ],
  };
})();
