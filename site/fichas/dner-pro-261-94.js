/*
 * Ficha: DNER-PRO 261/94 — Emprego de escórias de alto-forno em pavimentos rodoviários (procedimento).
 * Registra-se em window.FE (usa FE.aceitacao: linhas de critério e parecer).
 *
 * O que a PRO manda:
 *   4     a escória satisfaz as condições gerais da DNER-EM 260/94 (aceitação do lote — importável da ficha da EM 260);
 *   5.1 a 5.4  subleito (aterro), camada de regularização, sub-base e base, revestimento de pavimento flexível:
 *         escória do tipo NÃO GRANULADO (EM 260, 3.5);
 *   5.5   revestimento de pavimento rígido: tipos granulado e não granulado (EM 260, 3.4 e 3.5);
 *   2.1 b sub-base e base: consultar a ABNT EB-2103 (materiais estabilizados granulometricamente) — fora do acervo:
 *         registrada como verificação;
 *   Nota  especificações particulares e dados complementares definidos pelo projeto de engenharia.
 * Cada lote (coluna) recebe a verificação do tipo de escória × camada e o parecer da aceitação pela EM 260.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-pro-261-94", EM = "dner-em-260-94";
  var CAMADAS = [["subleito", "Subleito / aterro (5.1)", "5.1"], ["regularizacao", "Camada de regularização / nivelamento (5.2)", "5.2"],
    ["base", "Sub-base ou base (5.3)", "5.3"], ["revFlex", "Revestimento de pavimento flexível (5.4)", "5.4"], ["revRig", "Revestimento de pavimento rígido (5.5)", "5.5"]];
  var SN = [["", "— não verificado"], ["S", "Atende"], ["N", "Não atende"], ["NA", "Não se aplica"]];
  function camada(P) { return CAMADAS.filter(function (c) { return c[0] === (P.camada || "base"); })[0] || CAMADAS[2]; }
  function tipoDe(t) {
    var s = String(t || "").trim().toLowerCase();
    if (!s) return "";
    if (/^n|n[ãa]o\s*gran|resfriad[ao] ao ar|britad/.test(s)) return "ng";
    if (/^g|granulad/.test(s)) return "gr";
    return "?";
  }
  var NOME_TIPO = { ng: "não granulada", gr: "granulada" };
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
    else if (!v) A.marcar(l, "pendente", "verificação não registrada");
    return l;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [], C = camada(P), rig = C[0] === "revRig";
    var permitidos = rig ? ["ng", "gr"] : ["ng"];
    var exigTipo = rig ? "granulada ou não granulada (EM 260, 3.4 e 3.5)" : "não granulada (EM 260, 3.5)";
    var lotes = (d.lotes || []).filter(function (c) { return ["reg", "tipo", "parecer", "qtd"].some(function (k) { return String(c[k] || "").trim(); }); });
    var tab = (d.lotes || []).map(function () { return {}; }), qtot = 0;
    lotes.forEach(function (c, i) {
      var rot = "Lote " + (c.reg ? c.reg : i + 1), G = rot + (c.forn ? " — " + c.forn : "");
      var t = tipoDe(c.tipo), q = num(c.qtd);
      if (ok(q)) qtot += q;
      var lt = A.linha({ id: "tipo" + i, grupo: G, criterio: rot + ": tipo de escória × camada", secao: C[2], exigido: exigTipo, n: t ? 1 : 0,
        resultado: t === "ng" || t === "gr" ? NOME_TIPO[t] : t === "?" ? String(c.tipo) : "—" });
      if (!t) A.marcar(lt, "pendente", "tipo de escória não informado");
      else if (t === "?") A.marcar(lt, "pendente", "tipo \"" + c.tipo + "\" não reconhecido — informe granulada ou não granulada");
      else if (permitidos.indexOf(t) < 0) A.marcar(lt, "nao_conforme", "escória " + NOME_TIPO[t] + " não é admitida em " + C[1].replace(/ \(.*\)$/, "").toLowerCase() + " (" + C[2] + ")");
      linhas.push(lt);
      var sp = situacaoParecer(c.parecer);
      var le = A.linha({ id: "em" + i, grupo: G, criterio: rot + ": aceitação pela DNER-EM 260/94", secao: "4", exigido: "lote aceito", n: sp ? 1 : 0,
        resultado: c.parecer ? String(c.parecer) + (ok(q) ? " · " + fmt(q, 0) + " t" : "") : "—" });
      if (!sp) A.marcar(le, "pendente", "sem o resultado da aceitação pela EM 260 — importe a ficha da DNER-EM 260/94 ou informe o parecer");
      else if (sp === "?") A.marcar(le, "pendente", "parecer \"" + c.parecer + "\" não reconhecido (use ACEITO / REJEITADO / PENDENTE)");
      else if (sp === "nao_conforme") A.marcar(le, "nao_conforme", "lote rejeitado na aceitação pela EM 260 — não satisfaz as condições gerais (4)");
      else if (sp === "pendente") A.marcar(le, "pendente", "aceitação pela EM 260 incompleta");
      else if (sp === "ressalva") A.marcar(le, "ressalva", "lote aceito com ressalva pela EM 260");
      linhas.push(le);
      if (c.camEM && c.camEM !== C[0] && !(C[0] === "revRig" && c.camEM === "revFlex")) avisos.push(rot + ": a aceitação pela EM 260 foi feita para \"" + c.camEMr + "\" — confira se os limites da EM valem para a camada desta ficha.");
      tab[(d.lotes || []).indexOf(c)] = { ok: permitidos.indexOf(t) >= 0 && sp === "conforme" ? 1 : 0 };
    });
    if (!lotes.length) linhas.push(A.marcar(A.linha({ id: "lotes", grupo: "Lotes de escória", criterio: "Lotes de escória a empregar", secao: "4 / 5", exigido: "ao menos um lote" }), "sem_dados", "nenhum lote informado"));
    var G2 = "Projeto e normas complementares";
    if (C[0] === "base") linhas.push(linhaSN(P.eb2103, { id: "eb", grupo: G2, criterio: "Material de sub-base/base atende à ABNT EB-2103 (estabilizado granulometricamente)", secao: "2.1 b", exigido: "atende" }));
    linhas.push(linhaSN(P.projeto, { id: "proj", grupo: G2, criterio: "Especificações particulares e dados complementares do projeto de engenharia", secao: "Nota", exigido: "atende" }));
    if (rig) avisos.push("5.5: no revestimento de pavimento rígido a escória granulada (areia de escória) e a não granulada são admitidas — confira no projeto a função de cada uma (agregado miúdo/graúdo).");
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "EMPREGO ADMITIDO", texto: "Escória do tipo previsto para a camada e lote(s) aceito(s) pela DNER-EM 260/94 (4 e 5)." },
      RESSALVA: { titulo: "EMPREGO ADMITIDO COM RESSALVA", texto: "Nenhuma exigência descumprida, mas há pontos a documentar ou corrigir." },
      PENDENTE: { titulo: "VERIFICAÇÃO INCOMPLETA", texto: "Faltam o tipo de escória, a aceitação pela EM 260 ou verificações de projeto para decidir." },
      REJEITADO: { titulo: "EMPREGO NÃO ADMITIDO", texto: "Tipo de escória não previsto para a camada ou lote rejeitado pela DNER-EM 260/94." } } });
    return { tab: { lotes: tab }, resultados: { linhas: linhas, parecer: par, camada: C[1], nLotes: lotes.length, qtot: qtot, exigTipo: exigTipo }, avisos: avisos };
  }

  FE.FICHAS[ID] = {
    titulo: "Escória de alto-forno — emprego por camada",
    lote: true,
    resumo: "Verifica, lote a lote, o tipo de escória de alto-forno exigido para a camada (5.1 a 5.5: não granulada em subleito, regularização, sub-base, base e revestimento flexível; granulada ou não granulada no revestimento rígido) e a aceitação pela DNER-EM 260/94 (4), importável da ficha da EM; parecer do emprego.",
    rotuloImportar: function (r) { return (r.camada ? r.camada.replace(/ \(.*\)$/, "") + " · " : "") + (r.parecer ? r.parecer.titulo.toLowerCase() : "—"); },
    params: [
      { k: "camada", r: "Camada de emprego (5)", tipo: "select", recarrega: true, opcoes: CAMADAS.map(function (c) { return [c[0], c[1]]; }) },
      { k: "impLotes", r: "Importar lotes aceitos/rejeitados na ficha da DNER-EM 260/94", tipo: "importarVarios", de: EM,
        dica: "cada ensaio da EM 260 vira uma coluna (registro, fornecedor, quantidade, tipo e parecer)",
        aplicar: function (lista, P, d) {
          var cols = lista.map(function (e) {
            var p = e.dados.params || {}, r = e.resultados || {};
            var cam = { base: "base", subbase: "base", rev: "revFlex" }[p.camada] || "";
            var camR = { base: "base", subbase: "sub-base", rev: "revestimento" }[p.camada] || "";
            return { reg: (e.dados.ident || {}).registro || "", forn: p.fornecedor || (e.dados.ident || {}).origem || "", qtd: p.quantidade || "",
              tipo: p.tipo === "gr" ? "granulada" : "não granulada", parecer: r.parecer ? r.parecer.titulo.replace(/^LOTE /, "") : "", camEM: cam, camEMr: camR };
          });
          A.importacao.substituir(d, "lotes", cols, { chave: ["reg"] });
        } },
      { k: "eb2103", r: "Sub-base/base: atende à ABNT EB-2103 (2.1 b)", tipo: "select", opcoes: SN, se: function (d) { return ((d.params || {}).camada || "base") === "base"; } },
      { k: "projeto", r: "Especificações particulares do projeto atendidas (Nota)", tipo: "select", opcoes: SN },
    ],
    padrao: { camada: "base" },
    tabelas: function () {
      return [{ chave: "lotes", titulo: "Lotes de escória de alto-forno", rotulo: "Lote", iniciais: 1, min: 1, dica: "um lote por coluna; tipo: \"não granulada\" ou \"granulada\"; parecer da EM 260: ACEITO / REJEITADO / PENDENTE",
        linhas: [{ k: "reg", r: "Registro do recebimento (EM 260)", texto: true }, { k: "forn", r: "Usina siderúrgica / fornecedor", texto: true },
          { k: "qtd", r: "Quantidade do lote", u: "t" }, { k: "tipo", r: "Tipo de escória (EM 260, 3.4 / 3.5)", texto: true, ph: "não granulada" },
          { k: "parecer", r: "Parecer da aceitação pela DNER-EM 260/94", texto: true, ph: "ACEITO" }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(esc(r.camada.replace(/ \(.*\)$/, "")), "Camada") + A.cartao(esc(r.exigTipo.replace(/ \(.*\)$/, "")), "Tipo exigido (5)") +
        A.cartao(r.nLotes + (r.qtot ? " · " + fmt(r.qtot, 0) + " t" : ""), "Lotes verificados") + "</div>" + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    relatorio: {
      notas: "DNER-PRO 261/94: a escória de alto-forno deve satisfazer as condições gerais da DNER-EM 260/94 (4). Tipo por camada (5): subleito/aterro, camada de regularização, sub-base, base e revestimento de pavimento flexível — escória não granulada (EM 260, 3.5); revestimento de pavimento rígido — granulada e não granulada (EM 260, 3.4 e 3.5). Sub-base e base: consultar a ABNT EB-2103 (2.1 b). As especificações particulares e dados complementares são definidos pelo projeto de engenharia (Nota).",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Parecer", r.parecer.titulo], ["Camada", r.camada], ["Tipo de escória exigido", r.exigTipo], ["Lotes verificados", r.nLotes + (r.qtot ? " (" + fmt(r.qtot, 0) + " t)" : "")]];
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Base com escória britada — lote aceito pela EM 260 (importado): emprego admitido", dados: function () {
        var d = { ident: { registro: "EMP-EAF-01", data: "2026-04-16", obra: "Obra A", trecho: "Segmento 1", camada: "Base — escória de alto-forno" },
          params: { camada: "base", eb2103: "S", projeto: "S" }, lotes: [] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impLotes", [[EM, 0]]);
        return d;
      } },
      { nome: "Revestimento flexível — escória granulada e lote rejeitado pela EM 260: emprego não admitido", dados: function () {
        var d = { ident: { registro: "EMP-EAF-02", data: "2026-05-22", obra: "Obra B", trecho: "Segmento 3", camada: "Revestimento — CBUQ com escória" },
          params: { camada: "revFlex", projeto: "S" },
          lotes: [{ reg: "REC-EAF-07", forn: "Usina B — granulador", qtd: "900", tipo: "granulada", parecer: "ACEITO" }] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impLotes", [[EM, 1]]);
        return d;
      } },
    ],
  };
})();
