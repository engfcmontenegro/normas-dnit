/*
 * Ficha: DNER-EM 036/95 — Cimento Portland — recebimento e aceitação.
 *
 * Este arquivo também define o MOTOR COMUM DAS FICHAS DE RECEBIMENTO DE MATERIAL (FE.recebimentoMaterialEM), usado pelas
 * fichas de EM carregadas depois dele (DNIT 050-EM, DNER-EM 230, 260, 262, 367, DNIT 418, 454, 462-EM). Por isso ele deve
 * ser carregado antes delas (ordem das tags <script> em index.html) e depois de es-comum.js (FE.aceitacao).
 *
 * Modelo: cada requisito da EM é um "ensaio" (linha da tabela de resultados; colunas = determinações/amostras do lote;
 * o resultado é a média das colunas preenchidas, arredondada), comparado com o limite da classe/tipo escolhido. Os
 * resultados podem ser digitados ou importados das fichas ME (parâmetros "importarVarios"). Verificações de inspeção
 * (embalagem, contaminação...) são parâmetros Atende / Não atende. O parecer do lote usa FE.aceitacao (ACEITO /
 * ACEITO COM RESSALVA / PENDENTE / REJEITADO).
 *
 * cfg de RM.criar:
 *   titulo, resumo, tabela (texto: "Quadros III e IV"), classes [[k, rótulo]] (opcional), rotuloClasse, padrao {},
 *   params [...] (depois da classe), lote: {unid, rotuloQtd, dataAmostra, dataLab} | false, rotuloDet, ndet,
 *   inspecao: [{k, r, secao, exigido, falha, opcional, se(P)}],
 *   ensaios: [{id, grupo, r, secao, metodo, u, casas, tipo "num" | "qual" | "deriv", lim: {min, max, minEstrito,
 *     maxEstrito, texto, casas, info} | function (P) (null = não se aplica à classe: a linha some), facultativo: bool |
 *     function (P), falha ("nao_conforme" | "ressalva"), regra ("media" | "todos": todas as determinações devem
 *     atender), opcoes (qual: [[chave, rótulo, /regex/, conforme true|false|null]]), usa + f(V, P) (deriv),
 *     formula (texto), ph, verifica(vals, avisos, P)}],
 *   importar: [{k, r, de, ensaios: [ids], valores(e, P) -> {id: valor}, rot(e) -> texto, dica}],
 *   contraprova: {secao, texto} (repetição no exemplar testemunho/nova amostragem), extra(ctx), textos, providencias,
 *   notas, graficos(calc, d, opt), htmlExtra(calc, d, relat), exemplos.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var EPS = 1e-9;

  // =====================================================================================
  // utilidades
  // =====================================================================================
  function arred(x, c) { var f = Math.pow(10, c || 0); return ok(x) ? Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f : NaN; }
  function casasDe(v) { var s = String(v); return s.indexOf(".") === -1 ? 0 : s.split(".")[1].length; }
  function fmtV(x, c) { return ok(x) ? fmt(x, c).replace(/^-/, "−") : "—"; }
  function vazio(x) { return x === undefined || x === null || String(x).trim() === ""; }
  // "> 100" / "≥100" / "< 0,5" → {v, maior, menor}
  function lerValor(v) {
    var s = String(v === undefined || v === null ? "" : v).trim();
    return { v: num(s.replace(/^[<>≤≥]\s*/, "")), maior: /^[>≥]/.test(s), menor: /^[<≤]/.test(s) };
  }
  function txtLim(l, u) {
    if (!l) return "—";
    if (l.texto) return l.texto;
    var c = function (v) { return fmt(v, l.casas !== undefined ? l.casas : casasDe(v)); };
    var U = u ? " " + u : "", mn = ok(l.min), mx = ok(l.max);
    if (mn && mx && !l.minEstrito && !l.maxEstrito) return c(l.min) + " a " + c(l.max) + U;
    var p = [];
    if (mn) p.push((l.minEstrito ? "> " : "≥ ") + c(l.min));
    if (mx) p.push((l.maxEstrito ? "< " : "≤ ") + c(l.max));
    return p.length ? p.join(" e ") + U : "—";
  }
  function atende(x, l) {
    if (!l || !ok(x)) return null;
    if (ok(l.min) && (l.minEstrito ? x <= l.min + EPS : x < l.min - EPS)) return false;
    if (ok(l.max) && (l.maxEstrito ? x >= l.max - EPS : x > l.max + EPS)) return false;
    return true;
  }
  // datas "dd/mm/aaaa" ou "aaaa-mm-dd" → ms (UTC)
  function lerData(s) {
    var t = String(s || "").trim(), m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
    m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
  }
  function dias(a, b) { var x = lerData(a), y = lerData(b); return ok(x) && ok(y) ? Math.round((y - x) / 86400000) : NaN; }
  function somaMeses(s, meses) {
    var x = lerData(s);
    if (!ok(x)) return NaN;
    var d = new Date(x);
    d.setUTCMonth(d.getUTCMonth() + meses);
    return d.getTime();
  }
  // lista "49,8; 50,2 50,1" → números
  function lista(s) {
    return String(s || "").split(/[;\s]+/).map(function (t) { return num(t); }).filter(ok);
  }
  var SN = [["S", "atende", /^(s|sim|atende|ok|conforme|a)\b/i, true], ["N", "não atende", /^(n|n[aã]o)\b/i, false]];
  var OPC_INSP = [["", "— não verificado —"], ["S", "Atende"], ["N", "Não atende"], ["NA", "Não se aplica"]];
  var TEXTOS = {
    ACEITO: { titulo: "LOTE ACEITO", texto: "Todos os requisitos da especificação de material atendidos nos ensaios e na inspeção de recebimento." },
    RESSALVA: { titulo: "LOTE ACEITO COM RESSALVA", texto: "Nenhum requisito reprovado, mas há pontos a documentar ou corrigir (ressalvas abaixo)." },
    PENDENTE: { titulo: "LOTE PENDENTE — RECEBIMENTO INCOMPLETO", texto: "Nenhum requisito reprovado, mas faltam ensaios, determinações ou verificações exigidos: complete-os antes de liberar o material." },
    REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há requisito da especificação de material não atendido: o material não deve ser empregado." },
  };

  // =====================================================================================
  // motor
  // =====================================================================================
  function criar(cfg) {
    var ENS = cfg.ensaios, byId = {}, IMP = cfg.importar || [], INSP = cfg.inspecao || [];
    ENS.forEach(function (e) { byId[e.id] = e; });
    var NDET = cfg.ndet || 3;

    function limite(e, P) { var l = typeof e.lim === "function" ? e.lim(P) : e.lim; return l || null; }
    function facultativo(e, P) { return typeof e.facultativo === "function" ? !!e.facultativo(P) : !!e.facultativo; }
    function visivel(e, P) { return (!e.se || e.se(P)) && !!limite(e, P); }
    function classe(P) { return P.classe || (cfg.padrao || {}).classe; }
    function nomeClasse(P) {
      if (!cfg.classes) return "";
      var c = classe(P);
      return (cfg.classes.filter(function (x) { return x[0] === c; })[0] || ["", c || "—"])[1];
    }

    function linhasTabela(d) {
      var P = d.params || {}, out = [], g = null;
      ENS.forEach(function (e) {
        if (e.tipo === "deriv" || !visivel(e, P)) return;
        if (e.grupo && e.grupo !== g) { out.push({ grupo: e.grupo }); g = e.grupo; }
        var l = limite(e, P);
        out.push({ k: e.id, r: e.r + (e.secao ? " (" + e.secao + ")" : "") + (facultativo(e, P) ? " — facultativo" : ""), u: e.u || "",
          texto: e.tipo === "qual", ph: e.ph || (e.tipo === "qual" ? e.opcoes.map(function (o) { return o[1]; }).join(" / ") : txtLim(l, "")) });
      });
      var cols = d.det || [];
      var usados = IMP.filter(function (x) { return cols.some(function (p) { return !vazio(p["_o_" + x.k]); }); });
      if (usados.length) {
        out.push({ grupo: "Origem dos resultados importados" });
        usados.forEach(function (x) { out.push({ k: "_o_" + x.k, r: "Registro — " + x.r, u: "", texto: true }); });
      }
      return out;
    }

    function calcular(d) {
      var P = d.params || {}, avisos = [], linhas = [], V = {};
      d.det = d.det || [];
      if (!d.det.length) d.det.push({});
      ENS.forEach(function (e) {
        if (!visivel(e, P)) return;
        var lim = limite(e, P), fac = facultativo(e, P), u = e.u || "", casas = e.casas === undefined ? 1 : e.casas;
        var l = A.linha({ id: e.id, grupo: e.grupo || "", criterio: e.r + (e.metodo && e.metodo !== "—" ? " — " + e.metodo : ""), nome: e.r, secao: e.secao || "", unid: u,
          casas: casas, exigido: txtLim(lim, u) + (fac ? " (facultativo)" : ""), lim: lim, metodo: e.metodo });
        var o = { e: e, lim: lim, valor: NaN, n: 0, texto: "" };
        if (e.tipo === "qual") {
          var txt = d.det.map(function (p) { return String(p[e.id] || "").trim(); }).filter(Boolean);
          l.n = txt.length;
          if (txt.length) {
            var ops = txt.map(function (t) { return e.opcoes.filter(function (x) { return x[2].test(t); })[0] || null; });
            if (ops.some(function (x) { return !x; })) {
              A.marcar(l, "pendente", "resultado \"" + txt.join("; ") + "\" não reconhecido — escreva " + e.opcoes.map(function (x) { return "\"" + x[1] + "\""; }).join(" ou "));
              l.resultado = txt.join("; ");
            } else {
              var dif = ops.filter(function (x, i) { return ops.indexOf(x) === i; });
              o.texto = l.resultado = dif.map(function (x) { return x[1]; }).join(" / ");
              if (dif.some(function (x) { return x[3] === false; })) A.marcar(l, e.falha || "nao_conforme", "resultado: " + l.resultado);
              else if (dif.some(function (x) { return x[3] === null; })) A.marcar(l, "ressalva", "resultado no limite do critério: " + l.resultado);
            }
          }
        } else {
          if (e.tipo === "deriv") {
            var falta = (e.usa || []).filter(function (id) { return !ok(V[id]); });
            o.valor = falta.length ? NaN : e.f(V, P);
            l.n = ok(o.valor) ? 1 : 0;
            o.exato = o.valor;
          } else {
            var vals = d.det.map(function (p) { return lerValor(p[e.id]); }).filter(function (x) { return ok(x.v); });
            l.n = vals.length;
            o.vals = vals.map(function (x) { return x.v; });
            if (vals.length) {
              o.exato = o.vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
              o.valor = o.exato;
              o.maior = vals.some(function (x) { return x.maior; });
              o.menor = vals.some(function (x) { return x.menor; });
            }
            if (e.verifica && vals.length) e.verifica(o.vals, avisos, P);
          }
          o.valor = arred(o.valor, casas);
          V[e.id] = o.valor;
          V["_" + e.id] = o;
          if (ok(o.valor)) {
            var pre = o.maior ? "> " : o.menor ? "< " : "";
            l.media = o.valor;
            l.resultado = pre + fmtV(o.valor, casas) + (u ? " " + u : "") +
              (o.vals && o.vals.length > 1 ? " (média de " + o.vals.length + ": " + o.vals.map(function (v) { return fmtV(v, casasDe(v) > casas + 1 ? casas + 1 : casasDe(v)); }).join("; ") + ")" : "") +
              (e.tipo === "deriv" && e.formula ? " — " + e.formula : "");
            if (lim && !lim.info) {
              var okM = e.regra === "todos" ? o.vals.every(function (v) { return atende(v, lim); }) && atende(o.valor, lim) : atende(o.valor, lim);
              if (!okM) {
                var fora = e.regra === "todos" ? o.vals.filter(function (v) { return !atende(v, lim); }) : [];
                A.marcar(l, e.falha || "nao_conforme", (fora.length ? "determinação(ões) fora: " + fora.map(function (v) { return fmtV(v, casasDe(v)); }).join("; ") : "resultado " + pre + fmtV(o.valor, casas) + (u ? " " + u : "")) +
                  " — exigido " + txtLim(lim, u) + (e.secao ? " (" + e.secao + ")" : ""));
              }
            } else if (lim && lim.info) l.situacao = "informativo";
          }
        }
        if (!l.n) {
          if (fac) { l.situacao = "nao_exigido"; l.motivo = "facultativo — não ensaiado"; }
          else if (e.tipo === "deriv") A.marcar(l, "pendente", "falta(m) o(s) dado(s) para o cálculo");
          else A.marcar(l, "pendente", "ensaio não realizado");
        }
        o.linha = l;
        linhas.push(l);
      });
      // inspeção / condições gerais
      INSP.forEach(function (it) {
        if (it.se && !it.se(P)) return;
        var v = P[it.k] || "";
        var l = A.linha({ id: it.k, grupo: it.grupo || "Inspeção e condições gerais", criterio: it.r, secao: it.secao || "", exigido: it.exigido || "atende",
          n: v && v !== "NA" ? 1 : 0, resultado: v === "S" ? "atende" : v === "N" ? "não atende" : v === "NA" ? "não se aplica" : "—" });
        if (v === "N") A.marcar(l, it.falha || "nao_conforme", it.motivoFalha || "não atende" + (it.secao ? " (" + it.secao + ")" : ""));
        else if (v === "NA") { l.situacao = "nao_exigido"; l.motivo = "não se aplica"; }
        else if (!v) { if (it.opcional) { l.situacao = "nao_exigido"; l.motivo = "não verificado"; } else A.marcar(l, "pendente", "verificação não registrada"); }
        linhas.push(l);
      });
      var ctx = { d: d, P: P, V: V, linhas: linhas, avisos: avisos, A: A, item: {} };
      linhas.forEach(function (l) { ctx.item[l.id] = l; });
      if (cfg.extra) cfg.extra(ctx);
      // contraprova (repetição no exemplar testemunho / nova amostragem)
      var prov = [];
      var ncEns = linhas.filter(function (l) { return l.situacao === "nao_conforme" && byId[l.id]; });
      if (cfg.contraprova) {
        var cp = P.contraprova || "";
        if (cp === "atende" && ncEns.length) {
          ncEns.forEach(function (l) {
            l.situacao = "ressalva";
            l.motivos = [{ situacao: "ressalva", texto: l.motivo + " — a repetição " + cfg.contraprova.texto + " atendeu (" + cfg.contraprova.secao + ")" }];
            l.motivo = l.motivos[0].texto;
          });
          avisos.push("Contraprova: os ensaios reprovados foram repetidos " + cfg.contraprova.texto + " e atenderam (" + cfg.contraprova.secao + ") — registre os resultados da repetição nas observações.");
        } else if (cp === "nao" && ncEns.length) {
          avisos.push("Contraprova realizada " + cfg.contraprova.texto + " sem atender: rejeição confirmada (" + cfg.contraprova.secao + ").");
        } else if (!cp && ncEns.length) {
          prov.push("Antes de rejeitar em definitivo, a especificação prevê a repetição dos ensaios " + cfg.contraprova.texto + " (" + cfg.contraprova.secao + ").");
        }
      }
      var textos = {};
      Object.keys(TEXTOS).forEach(function (k) { textos[k] = Object.assign({}, TEXTOS[k], (cfg.textos || {})[k] || {}); });
      var par = A.parecer(linhas, [], { textos: textos, providencias: function (p) {
        var x = prov.slice();
        if (cfg.providencias) x = x.concat(typeof cfg.providencias === "function" ? cfg.providencias(p, linhas, P) || [] : cfg.providencias);
        return x;
      } });
      var cont = { conforme: 0, nao_conforme: 0, pendente: 0, ressalva: 0 };
      linhas.forEach(function (l) {
        var s = l.situacao === "sem_dados" ? "pendente" : l.situacao;
        if (cont[s] !== undefined) cont[s]++;
      });
      var fora = linhas.filter(function (l) { return l.situacao === "nao_conforme"; });
      if (fora.length) avisos.unshift("Fora da especificação: " + fora.map(function (l) { return l.nome || l.criterio; }).join("; ") + ".");
      return { tab: {}, resultados: { linhas: linhas, parecer: par, classe: nomeClasse(P), V: V, cont: cont, ctx: ctx.extraRes || {} }, avisos: avisos };
    }

    function htmlResumo(calc, relat) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer, { relat: relat }) + (relat ? "" : '<div class="fe-tab-wrap">') +
        A.htmlCriterios(r.linhas.filter(function (l) { return l.situacao !== "nao_exigido" || l.n; }).concat(
          r.linhas.filter(function (l) { return l.situacao === "nao_exigido" && !l.n; })), { relat: relat, estilo: "resultado" }) +
        (relat ? "" : "</div>") + (cfg.htmlExtra ? cfg.htmlExtra(calc, relat) : "");
    }

    var params = [];
    if (cfg.classes) params.push({ k: "classe", r: cfg.rotuloClasse || "Tipo / classe do material", tipo: "select", recarrega: true, opcoes: cfg.classes,
      dica: "carrega os limites da " + (cfg.tabela || "especificação") });
    params = params.concat(cfg.params || []);
    if (cfg.lote !== false) {
      var L = cfg.lote || {};
      params = params.concat([
        { k: "fornecedor", r: L.rotuloFornecedor || "Fornecedor / fabricante (marca)" },
        { k: "nf", r: "Nota fiscal / guia de remessa nº" },
        { k: "quantidade", r: L.rotuloQtd || "Quantidade do lote (" + (L.unid || "t") + ")", ph: L.phQtd || "" },
        { k: "dataReceb", r: "Data de recebimento", ph: "dd/mm/aaaa" },
        { k: "dataAmostra", r: "Data da amostragem", ph: "dd/mm/aaaa" },
      ]).concat(L.extra || []);
    }
    INSP.forEach(function (it) {
      params.push({ k: it.k, r: it.r + (it.secao ? " (" + it.secao + ")" : ""), tipo: "select", opcoes: OPC_INSP, se: it.se ? function (d) { return it.se(d.params || {}); } : undefined,
        dica: it.dica || it.exigido });
    });
    if (cfg.contraprova) params.push({ k: "contraprova", r: "Contraprova — repetição " + cfg.contraprova.texto + " (" + cfg.contraprova.secao + ")", tipo: "select",
      opcoes: [["", "— não realizada —"], ["atende", "Realizada — atende"], ["nao", "Realizada — não atende"]], dica: "só quando algum ensaio foi reprovado" });
    IMP.forEach(function (g) {
      params.push({ k: g.k, r: g.r, tipo: "importarVarios", de: g.de, dica: g.dica || "cada ensaio importado ocupa uma coluna (amostra) da tabela",
        aplicar: function (lst, P, d) { aplicarImp(g, lst, P, d); } });
    });

    function aplicarImp(g, lst, P, d) {
      d.det = d.det || [];
      // valores(e) pode devolver um objeto (uma coluna) ou uma lista de objetos (várias colunas: amostras do mesmo ensaio)
      var limpar = (g.ensaios || []).slice(), novos = [], origem = [];
      lst.forEach(function (e) {
        var v = g.valores(e, P) || {};
        (Array.isArray(v) ? v : [v]).forEach(function (x, i, arr) { novos.push(x || {}); origem.push([e, arr.length > 1 ? i + 1 : 0]); });
      });
      novos.forEach(function (v) { Object.keys(v).forEach(function (k) { if (limpar.indexOf(k) < 0) limpar.push(k); }); });
      d.det.forEach(function (p) { limpar.forEach(function (k) { delete p[k]; }); delete p["_o_" + g.k]; });
      novos.forEach(function (v, j) {
        while (d.det.length <= j) d.det.push({});
        Object.keys(v).forEach(function (k) {
          var x = v[k], en = byId[k];
          if (x === null || x === undefined || x === "" || (typeof x === "number" && !ok(x))) return;
          d.det[j][k] = typeof x === "number" ? A.nstr(x, en && en.casasImp !== undefined ? en.casasImp : Math.min(4, (en && en.casas !== undefined ? en.casas : 1) + 2)) : String(x);
        });
        var e = origem[j][0], i = origem[j][1];
        d.det[j]["_o_" + g.k] = A.importacao.rotulo(e, [g.rot ? g.rot(e, i) : "", i ? "amostra " + i : ""].filter(Boolean).join(" · "));
      });
      while (d.det.length > NDET && !Object.keys(d.det[d.det.length - 1]).some(function (k) { return !vazio(d.det[d.det.length - 1][k]); })) d.det.pop();
    }

    return {
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      norma: cfg.norma,
      lote: true,
      rotuloImportar: cfg.rotuloImportar || function (r) {
        return (r.classe ? r.classe + " · " : "") + (r.parecer ? r.parecer.titulo.replace(/^LOTE /, "").toLowerCase() : "—");
      },
      blocos: [],
      params: params,
      padrao: cfg.padrao || {},
      tabelas: function (d) {
        return [{ chave: "det", titulo: cfg.tituloTabela || "Resultados dos ensaios de recebimento", rotulo: cfg.rotuloDet || "Determinação", iniciais: NDET, min: 1,
          linhas: linhasTabela(d), dica: cfg.dicaTabela || "uma coluna por determinação/amostra do lote (o resultado é a média); deixe em branco o ensaio não realizado" }];
      },
      calcular: calcular,
      resultadosHtml: function (calc) {
        var c = calc.resultados.cont;
        return '<div class="fe-res">' + A.cartao(esc(calc.resultados.parecer.titulo), "Parecer do lote" + (calc.resultados.classe ? " — " + esc(calc.resultados.classe) : "")) +
          A.cartao(c.conforme + " conforme(s) · " + c.nao_conforme + " não conforme(s) · " + c.pendente + " pendente(s)" + (c.ressalva ? " · " + c.ressalva + " ressalva(s)" : ""),
            "Requisitos da " + esc(cfg.tabela || "especificação")) + "</div>" + htmlResumo(calc, false);
      },
      graficos: cfg.graficos,
      relatorio: {
        notas: cfg.notas,
        resultados: function (calc, d) {
          var r = calc.resultados, c = r.cont, P = d.params || {};
          var rows = [];
          if (r.classe) rows.push([cfg.rotuloClasse || "Material", r.classe]);
          if (P.fornecedor || P.quantidade) rows.push(["Lote", [P.fornecedor, P.quantidade ? P.quantidade + " " + ((cfg.lote || {}).unid || "t") : "", P.nf ? "NF " + P.nf : ""].filter(Boolean).join(" · ")]);
          rows.push(["Parecer", r.parecer.titulo]);
          rows.push(["Requisitos", c.conforme + " conforme(s), " + c.nao_conforme + " não conforme(s), " + c.pendente + " pendente(s)" + (c.ressalva ? ", " + c.ressalva + " com ressalva" : "")]);
          return rows;
        },
        extraHtml: function (calc) { return htmlResumo(calc, true); },
      },
      exemplos: cfg.exemplos,
    };
  }

  // gráfico granulométrico simples: curvas [{nome, pts: [{mm, pass}]}], faixa [{mm, min, max}]
  function graficoGran(titulo, curvas, faixa, opt) {
    opt = opt || {};
    var pts = [];
    curvas.forEach(function (c) { c.pts.forEach(function (p) { if (ok(p.pass) && p.mm > 0) pts.push(p); }); });
    if (!pts.length) return '<div class="fe-graf-vazio">A curva aparece com os resultados da granulometria.</div>';
    var W = opt.w || 600, H = opt.h || 300, m = { l: 46, r: 14, t: 22, b: 42 };
    var mms = pts.map(function (p) { return p.mm; }).concat((faixa || []).map(function (f) { return f.mm; }));
    var xmin = Math.log10(Math.min.apply(null, mms) / 1.5), xmax = Math.log10(Math.max.apply(null, mms) * 1.5);
    function X(mm) { return m.l + (Math.log10(mm) - xmin) / (xmax - xmin) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / 100 * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff";
    var corF = imp ? "rgba(52,160,110,.18)" : "rgba(52,195,143,.16)", corFl = imp ? "#2e8b57" : "#34c38f";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">' + esc(titulo) + "</text>";
    [0.075, 0.15, 0.3, 0.6, 1.18, 2.36, 4.8, 9.5, 19, 37.5, 75].forEach(function (mm) {
      if (Math.log10(mm) < xmin || Math.log10(mm) > xmax) return;
      s += '<line x1="' + X(mm) + '" y1="' + m.t + '" x2="' + X(mm) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(mm) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + String(mm).replace(".", ",") + "</text>";
    });
    for (var v = 0; v <= 100; v += 20) {
      s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 5) + '" y="' + (Y(v) + 3) + '" text-anchor="end" fill="' + txt + '">' + v + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Abertura da peneira (mm) — escala logarítmica</text>';
    s += '<text transform="translate(12 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">% passando</text>';
    var fx = (faixa || []).filter(function (f) { return ok(f.min) && ok(f.max); }).sort(function (a, b) { return a.mm - b.mm; });
    if (fx.length >= 2) {
      var sup = fx.map(function (f) { return X(f.mm).toFixed(1) + " " + Y(f.max).toFixed(1); });
      var inf = fx.slice().reverse().map(function (f) { return X(f.mm).toFixed(1) + " " + Y(f.min).toFixed(1); });
      s += '<path d="M' + sup.join(" L") + " L" + inf.join(" L") + ' Z" fill="' + corF + '" stroke="' + corFl + '" stroke-width="1" stroke-dasharray="4 3"/>';
    }
    curvas.forEach(function (c, i) {
      var q = c.pts.filter(function (p) { return ok(p.pass) && p.mm > 0; }).sort(function (a, b) { return a.mm - b.mm; });
      if (!q.length) return;
      s += '<path d="' + q.map(function (p, j) { return (j ? "L" : "M") + X(p.mm).toFixed(1) + " " + Y(p.pass).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor +
        '" stroke-width="' + (i ? 1.2 : 2.2) + '"' + (i ? ' stroke-dasharray="3 3"' : "") + "/>";
      q.forEach(function (p) { s += '<circle cx="' + X(p.mm) + '" cy="' + Y(p.pass) + '" r="3" fill="' + (p.fora ? "#e5534b" : cor) + '"/>'; });
    });
    return s + "</svg>";
  }

  // exemplos: importa exemplos de fichas ME num exemplo desta ficha (depois do registro da ficha)
  function importarEx(fid, d, k, refs) {
    return A.exemplos.importar(FE.FICHAS[fid].params, d, k, refs);
  }

  FE.recebimentoMaterialEM = { criar: criar, SN: SN, lerData: lerData, dias: dias, somaMeses: somaMeses, lista: lista, arred: arred,
    txtLim: txtLim, atende: atende, graficoGran: graficoGran, importarEx: importarEx, lerValor: lerValor };

  // =====================================================================================
  // CIMENTO PORTLAND — DNER-EM 036/95 (Quadros III, IV e V) e DNIT 050/2004-EM (Tabelas 1, 2 e 3)
  // =====================================================================================
  // classes: [chave, rótulo, família, classe de resistência]
  var CIM = [];
  [["I", "CP I"], ["IS", "CP I-S"], ["IIE", "CP II-E"], ["IIZ", "CP II-Z"], ["IIF", "CP II-F"], ["III", "CP III"], ["IV", "CP IV"]].forEach(function (f) {
    (f[0] === "IV" ? [25, 32] : [25, 32, 40]).forEach(function (c) { CIM.push([f[0] + "-" + c, f[1] + "-" + c, f[0], c]); });
  });
  CIM.push(["V", "CP V-ARI", "V", null]);
  function fam(P) { var c = (CIM.filter(function (x) { return x[0] === P.classe; })[0] || CIM[4]); return { f: c[2], c: c[3] }; }
  function mx(v, x) { return ok(v) ? { max: v, casas: x === undefined ? 1 : x } : null; }
  function mn(v, x) { return ok(v) ? { min: v, casas: x === undefined ? 1 : x } : null; }
  function pc(tab) { return function (P) { var k = fam(P); return tab[k.f]; }; }

  // norma: "036" (DNER-EM 036/95) ou "050" (DNIT 050/2004-EM)
  function ensaiosCimento(norma) {
    var d050 = norma === "050";
    var Q = d050 ? { q: "Tabela 2", f: "Tabela 3", t: "Tabela 1" } : { q: "Quadro III", f: "Quadro IV", t: "Quadro V" };
    var GQ = "Exigências químicas — " + Q.q, GF = "Exigências físicas e mecânicas — " + Q.f;
    var GT = d050 ? "Composição — teores dos componentes (Tabela 1, informativo)" : "Exigências facultativas — Quadro V (aplicáveis quando solicitadas, 5.3)";
    var RI = { I: 1.0, IS: 5.0, IIE: 2.5, IIZ: 16.0, IIF: 2.5, III: 1.5, IV: null, V: 1.0 };
    var PF = { I: 2.0, IS: 4.5, IIE: 6.5, IIZ: 6.5, IIF: 6.5, III: 4.5, IV: 4.5, V: 4.5 };
    var CO2 = { I: 1.0, IS: 3.0, IIE: 5.0, IIZ: 5.0, IIF: 5.0, III: 3.0, IV: 3.0, V: 3.0 };
    function res075(P) { var k = fam(P); return k.f === "III" || k.f === "IV" ? 8 : k.f === "V" ? 6 : k.c === 40 ? 10 : 12; }
    function blaine(P) { var k = fam(P); return k.f === "III" || k.f === "IV" ? null : k.f === "V" ? 300 : k.c === 25 ? 240 : k.c === 32 ? 260 : 280; }
    function rc(idade) {
      return function (P) {
        var k = fam(P);
        if (k.f === "V") return mn({ 1: 14, 3: 24, 7: 34 }[idade], 0);
        if (idade === 1) return null;
        if (idade === 91) return k.f === "III" ? mn({ 25: 32, 32: 40, 40: 48 }[k.c], 0) : k.f === "IV" ? mn({ 25: 32, 32: 40 }[k.c], 0) : null;
        if (k.f === "III" && k.c === 40) return mn({ 3: 12, 7: 23, 28: 40 }[idade], 0);
        return mn({ 25: { 3: 8, 7: 15, 28: 25 }, 32: { 3: 10, 7: 20, 28: 32 }, 40: { 3: 15, 7: 25, 28: 40 } }[k.c][idade], 0);
      };
    }
    var E = [
      { id: "ri", grupo: GQ, r: "Resíduo insolúvel (RI)", metodo: d050 ? "NBR 5744 / NBR 8347" : "NBR 5744 (pozolânico: NBR 8347)", secao: d050 ? "Tab. 2" : "6.6 a/b", u: "%", casas: 2,
        lim: function (P) { return mx(RI[fam(P).f]); } },
      { id: "pf", grupo: GQ, r: "Perda ao fogo (PF)", metodo: "NBR 5743", secao: d050 ? "Tab. 2" : "6.6 c", u: "%", casas: 2, lim: pc(mapear(PF, mx)) },
      { id: "mgo", grupo: GQ, r: "Óxido de magnésio (MgO)", metodo: "NBR 5742 / NBR 9203", secao: d050 ? "Tab. 2" : "6.6 e", u: "%", casas: 2,
        lim: function (P) { return fam(P).f === "III" ? null : mx(6.5); } },
      { id: "so3", grupo: GQ, r: "Trióxido de enxofre (SO₃)", metodo: "NBR 5745", secao: d050 ? "Tab. 2, nota 2" : "6.6 d; nota 1", u: "%", casas: 2,
        lim: function (P) { return fam(P).f === "V" ? mx(P.c3a === "mais8" ? 4.5 : 3.5) : mx(4.0); } },
      { id: "co2", grupo: GQ, r: "Anidrido carbônico (CO₂)", metodo: "NBR 11583", secao: d050 ? "Tab. 2" : "6.6 l", u: "%", casas: 2, lim: pc(mapear(CO2, mx)) },
      { id: "s", grupo: d050 ? GQ : GT, r: "Enxofre na forma de sulfeto (S)", metodo: "NBR 5746", secao: d050 ? "Tab. 2" : "6.6 p", u: "%", casas: 2, facultativo: !d050,
        lim: function (P) { return fam(P).f === "III" ? mx(1.0) : null; } },
      { id: "r075", grupo: GF, r: "Finura — resíduo na peneira 0,075 mm", metodo: "NBR 11579", secao: d050 ? "Tab. 3" : "6.6 g", u: "%", casas: 1, lim: function (P) { return mx(res075(P), 0); } },
      { id: "blaine", grupo: GF, r: "Finura — área específica (Blaine)", metodo: "NBR 7224", secao: d050 ? "Tab. 3" : "6.6 f", u: "m²/kg", casas: 0, lim: function (P) { return mn(blaine(P), 0); } },
      { id: "pegaIni", grupo: GF, r: "Tempo de início de pega", metodo: "NBR 11581", secao: d050 ? "Tab. 3" : "6.6 i", u: "h", casas: 1, lim: mn(1, 0) },
      { id: "pegaFim", grupo: d050 ? GF : GT, r: "Tempo de fim de pega", metodo: "NBR 11581", secao: d050 ? "Tab. 3 (1)" : "Quadro V", u: "h", casas: 1, facultativo: true,
        lim: function (P) { var f = fam(P).f; return mx(f === "III" || f === "IV" ? 12 : 10, 0); } },
      { id: "expQ", grupo: GF, r: "Expansibilidade a quente", metodo: "NBR 11582", secao: d050 ? "Tab. 3" : "6.6 h", u: "mm", casas: 1, lim: mx(5, 0) },
      { id: "expF", grupo: d050 ? GF : GT, r: "Expansibilidade a frio", metodo: "NBR 11582", secao: d050 ? "Tab. 3 (1)" : "Quadro V", u: "mm", casas: 1, facultativo: true, lim: mx(5, 0) },
      { id: "rc1", grupo: GF, r: "Resistência à compressão — 1 dia", metodo: "NBR 7215", secao: d050 ? "Tab. 3" : "Quadro IV, nota", u: "MPa", casas: 1, lim: rc(1) },
      { id: "rc3", grupo: GF, r: "Resistência à compressão — 3 dias", metodo: "NBR 7215", secao: d050 ? "Tab. 3" : "6.6 j", u: "MPa", casas: 1, lim: rc(3) },
      { id: "rc7", grupo: GF, r: "Resistência à compressão — 7 dias", metodo: "NBR 7215", secao: d050 ? "Tab. 3" : "6.6 j", u: "MPa", casas: 1, lim: rc(7) },
      { id: "rc28", grupo: GF, r: "Resistência à compressão — 28 dias", metodo: "NBR 7215", secao: d050 ? "Tab. 3" : "6.6 j", u: "MPa", casas: 1, lim: rc(28) },
      { id: "rc91", grupo: d050 ? GF : GT, r: "Resistência à compressão — 91 dias", metodo: "NBR 7215", secao: d050 ? "Tab. 3" : "Quadro V", u: "MPa", casas: 1, facultativo: !d050, lim: rc(91) },
      // teores dos componentes
      { id: "tEsc", grupo: GT, r: "Teor de escória granulada de alto-forno", metodo: "NBR 5754", secao: d050 ? "Tab. 1" : "6.6 k", u: "%", casas: 0, facultativo: true,
        lim: function (P) { var f = fam(P).f; return f === "IIE" ? { min: 6, max: 34 } : f === "III" ? { min: 35, max: 70 } : null; } },
      { id: "tPoz", grupo: GT, r: "Teor de material pozolânico", metodo: d050 ? "resíduo insolúvel (Tab. 2, nota 1)" : "NBR 5753 / NBR 8347", secao: d050 ? "Tab. 1" : "6.6 o", u: "%", casas: 0, facultativo: true,
        lim: function (P) { var f = fam(P).f; return f === "IIZ" ? { min: 6, max: 14 } : f === "IV" ? (d050 ? { min: 15, max: 50 } : null) : null; } },
      { id: "tCarb", grupo: GT, r: "Teor de material carbonático", metodo: "—", secao: d050 ? "Tab. 1" : "Quadro V", u: "%", casas: 0, facultativo: true,
        lim: function (P) {
          var f = fam(P).f;
          if (f === "IIE" || f === "IIZ") return { min: 0, max: 10 };
          if (f === "IIF") return { min: 6, max: 10 };
          if (f === "V") return { max: 5 };
          if (d050 && (f === "III" || f === "IV")) return { min: 0, max: 5 };
          if (d050 && f === "IS") return { min: 1, max: 5 };
          return null;
        } },
      { id: "tAd", grupo: GT, r: "Teor de adições (pozolana + escória + carbonático)", metodo: "—", secao: "Quadro V", u: "%", casas: 0, facultativo: true,
        lim: function (P) { return !d050 && fam(P).f === "IS" ? { max: 5 } : null; } },
    ];
    return E;
  }
  function mapear(o, f) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = f(o[k]); }); return r; }

  // regras de recebimento comuns (embalagem, massa dos sacos, armazenamento, prazos)
  function extraCimento(norma) {
    var d050 = norma === "050";
    var S = d050 ? { saco: "7 e", media: "7 f", arm: "7 d", lab: "6 f", lote: "6 c" } : { saco: "7.4", media: "7.4", arm: "7.3", lab: "6.5", lote: "6.2" };
    return function (ctx) {
      var P = ctx.P, linhas = ctx.linhas, avisos = ctx.avisos, RMx = FE.recebimentoMaterialEM;
      var G = "Recebimento, amostragem e armazenamento";
      var saco = (P.entrega || "sacos") === "sacos";
      // massa dos sacos: variação máxima de 2 % sobre 50 kg; massa média de 30 sacos ≥ 50 kg
      if (saco) {
        var m = RMx.lista(P.massasSacos), n = m.length;
        var lm = A.linha({ id: "sacos", grupo: G, criterio: "Massa média dos sacos (30 unidades ao acaso)", secao: S.media, unid: "kg", casas: 2, n: n, exigido: "≥ 50,00 kg (média de 30 sacos)" });
        var li = A.linha({ id: "sacosInd", grupo: G, criterio: "Massa de cada saco — variação máxima de 2 % sobre 50 kg", secao: S.saco, unid: "kg", casas: 2, n: n, exigido: "49,00 a 51,00 kg" });
        if (!n) {
          A.marcar(lm, "pendente", "pese 30 sacos tomados ao acaso");
          A.marcar(li, "pendente", "sem pesagens");
        } else {
          var med = m.reduce(function (a, b) { return a + b; }, 0) / n;
          lm.media = med;
          lm.resultado = fmt(med, 2) + " kg (n = " + n + ")";
          if (med < 50 - EPS) A.marcar(lm, "nao_conforme", "massa média " + fmt(med, 2) + " kg < 50 kg: todo o lote deve ser rejeitado (" + S.media + ")");
          if (n < 30) A.marcar(lm, "pendente", "pesados " + n + " sacos; a especificação pede 30 unidades");
          var fora = m.filter(function (x) { return x < 49 - EPS || x > 51 + EPS; });
          li.resultado = fmt(Math.min.apply(null, m), 2) + " a " + fmt(Math.max.apply(null, m), 2) + " kg";
          if (fora.length) A.marcar(li, "ressalva", fora.length + " saco(s) fora de 50 kg ± 2 % (" + fora.map(function (x) { return fmt(x, 2); }).join("; ") +
            " kg): esses sacos devem ser rejeitados (" + S.saco + ")");
        }
        linhas.push(lm, li);
      }
      // prazo entre a coleta e a chegada ao laboratório
      var dl = RMx.dias(P.dataAmostra, P.dataLab);
      var ll = A.linha({ id: "prazoLab", grupo: G, criterio: "Prazo entre a amostragem e a chegada ao laboratório", secao: S.lab, unid: "dias", casas: 0, n: ok(dl) ? 1 : 0, exigido: "≤ 10 dias" });
      if (ok(dl)) {
        ll.resultado = dl + " dia(s)";
        if (dl < 0) A.marcar(ll, "pendente", "data de chegada anterior à da amostragem — confira");
        else if (dl > 10) A.marcar(ll, "ressalva", dl + " dias entre a amostragem e a chegada ao laboratório (máx. 10)");
      } else { ll.situacao = "nao_exigido"; ll.motivo = "datas não informadas"; }
      linhas.push(ll);
      // armazenamento prolongado: reensaio (granel/contêiner > 6 meses; sacos > 3 meses)
      var lim = saco ? 3 : 6, dataVer = P.dataUso, t0 = P.dataReceb;
      var la = A.linha({ id: "armaz", grupo: G, criterio: "Tempo de armazenamento — reensaio se exceder " + lim + " meses (" + (saco ? "sacos" : "granel/contêiner") + ")",
        secao: S.arm, exigido: "≤ " + lim + " meses, ou reensaiado", n: 0 });
      var tLim = RMx.somaMeses(t0, lim), tUso = RMx.lerData(dataVer), tAm = RMx.lerData(P.dataAmostra);
      if (ok(tLim) && ok(tUso)) {
        la.n = 1;
        var meses = RMx.dias(t0, dataVer) / 30.44;
        la.resultado = fmt(meses, 1) + " meses até " + dataVer;
        if (tUso > tLim) {
          if (ok(tAm) && tAm >= tLim) la.resultado += " — reensaiado (amostragem em " + P.dataAmostra + ")";
          else A.marcar(la, "pendente", "armazenado por mais de " + lim + " meses: o cimento deve ser reensaiado antes do emprego (" + S.arm + ")");
        }
      } else { la.situacao = "nao_exigido"; la.motivo = "informe a data de recebimento e a data de emprego"; }
      linhas.push(la);
      if (d050) {
        var q = num(P.quantidade);
        var lq = A.linha({ id: "lote30", grupo: G, criterio: "Tamanho do lote (mesmo tipo, classe e marca, mesma data)", secao: S.lote, unid: "t", casas: 1, n: ok(q) ? 1 : 0, exigido: "≤ 30 t por lote/amostra" });
        if (ok(q)) {
          lq.resultado = fmt(q, 1) + " t";
          if (q > 30 + EPS) A.marcar(lq, "pendente", "lote de " + fmt(q, 1) + " t acima de 30 t: divida em " + Math.ceil(q / 30 - EPS) + " lotes, cada um com sua amostra (" + S.lote + ")");
        } else A.marcar(lq, "pendente", "informe a quantidade do lote");
        linhas.push(lq);
      } else {
        var q2 = num(P.quantidade), nSacos = ok(q2) ? Math.ceil(q2 * 1000 / 50 / 100 - EPS) : NaN;
        if (ok(nSacos)) avisos.push("Amostragem (6.2): lote de " + fmt(q2, 1) + " t ≈ " + Math.round(q2 * 20) + " sacos → " + nSacos + " amostra(s) parcial(is) de ≥ 5 kg (uma a cada 100 sacos), " +
          "compondo a amostra média de ≥ 50 kg em dois exemplares de 25 kg (um para ensaio e um testemunho, 6.4).");
      }
    };
  }

  function paramsCimento(norma) {
    var d050 = norma === "050";
    return [
      { k: "c3a", r: "C₃A do clínquer (só CP V-ARI — limite de SO₃)", tipo: "select", opcoes: [["ate8", "C₃A ≤ 8 % → SO₃ ≤ 3,5 %"], ["mais8", "C₃A > 8 % → SO₃ ≤ 4,5 %"]],
        se: function (d) { return (d.params || {}).classe === "V"; }, dica: d050 ? "Tabela 2, nota (2)" : "Quadro III, nota 1" },
      { k: "entrega", r: "Forma de entrega", tipo: "select", recarrega: true, opcoes: [["sacos", "Em sacos de 50 kg"], ["granel", "A granel"], ["conteiner", "Em contêiner"]] },
      { k: "massasSacos", r: "Massas dos sacos pesados (kg) — 30 ao acaso", ph: "ex.: 50,2; 49,8; 50,1 ...", se: function (d) { return ((d.params || {}).entrega || "sacos") === "sacos"; },
        dica: d050 ? "7 e / 7 f: variação máx. de 2 % por saco; média de 30 sacos ≥ 50 kg" : "7.4: variação máx. de 2 % por saco; média de 30 sacos ≥ 50 kg" },
      { k: "dataFab", r: "Data de fabricação (na embalagem/documento)", ph: "dd/mm/aaaa" },
      { k: "dataLab", r: "Data de chegada da amostra ao laboratório", ph: "dd/mm/aaaa", dica: "máx. 10 dias após a amostragem" },
      { k: "dataUso", r: "Data de emprego / verificação do estoque", ph: "dd/mm/aaaa", dica: "para o prazo de armazenamento (reensaio)" },
    ];
  }
  function inspecaoCimento(norma) {
    var d050 = norma === "050";
    return [
      { k: "iMarc", r: "Marcação: sigla e classe (letras ≥ 60 mm), denominação, fabricante" + (d050 ? " e data de fabricação" : ""), secao: d050 ? "4.1.1 / 4.1.2" : "4.3.2 / 4.3.4",
        exigido: "sacos marcados / documentação da entrega completa", falha: "nao_conforme" },
      { k: "iInteg", r: "Sacos íntegros, secos e sem avarias; granel/contêiner sem sinais de contaminação", secao: d050 ? "7 b" : "7.2", exigido: "sem avarias nem contaminação" },
      { k: "iArm", r: "Armazenamento: local seco e protegido, pilhas de até 10 sacos sobre estrados" + (d050 ? " a ≥ 30 cm do piso e das paredes; silos estanques" : ""), secao: d050 ? "4.3" : "4.4",
        exigido: "armazenamento conforme", falha: "ressalva", opcional: true },
      { k: "iTest", r: "Amostra em dois exemplares (ensaio + testemunho), herméticos e identificados", secao: d050 ? "6 d / 6 e" : "6.2 / 6.4", exigido: "2 exemplares de ~25 kg", falha: "ressalva" },
    ];
  }
  function cimento(norma, extra) {
    var d050 = norma === "050";
    return Object.assign({
      classes: CIM.map(function (c) { return [c[0], c[1]]; }),
      rotuloClasse: "Tipo e classe do cimento",
      padrao: { classe: "IIE-32", entrega: "sacos", c3a: "ate8" },
      params: paramsCimento(norma),
      lote: { unid: "t", rotuloFornecedor: "Fabricante / marca", extra: [] },
      inspecao: inspecaoCimento(norma),
      ensaios: ensaiosCimento(norma),
      extra: extraCimento(norma),
      rotuloDet: "Determinação",
      ndet: 2,
      dicaTabela: "resultados do laudo do laboratório (uma coluna por determinação; o resultado é a média); ensaios facultativos só quando solicitados",
    }, extra || {});
  }
  FE.recebimentoMaterialEM.cimento = cimento;

  // =====================================================================================
  // DNER-EM 036/95
  // =====================================================================================
  var ID = "dner-em-036-95";
  FE.FICHAS[ID] = criar(cimento("036", {
    titulo: "Recebimento de cimento Portland",
    resumo: "Lote de cimento (CP I a CP V-ARI): exigências químicas (Quadro III), físicas e mecânicas (Quadro IV) e facultativas (Quadro V) por tipo e classe; embalagem, massa dos sacos (7.4), armazenamento (7.3) e prazo da amostra (6.5); parecer do lote.",
    tabela: "DNER-EM 036/95",
    contraprova: { secao: "6.4", texto: "no exemplar testemunho" },
    notas: "Limites dos Quadros III, IV e V da DNER-EM 036/95 por tipo e classe (Quadro I). Resultado de cada ensaio = média das determinações, arredondada como indicado. " +
      "Aceitação (7.1): automática quando todos os resultados atendem; 7.2: rejeitar sacos rasgados, molhados ou avariados e granel/contêiner contaminado; 7.3: reensaiar o cimento armazenado " +
      "a granel/contêiner por mais de 6 meses ou em sacos por mais de 3 meses; 7.4: rejeitar os sacos com variação > 2 % sobre 50 kg e o lote se a média de 30 sacos for < 50 kg. " +
      "Quadro IV: onde o PDF traz \"≤ 260\" (Blaine do CP II-F-32) e \"≥ 5\" (expansibilidade do CP II-F-32 e do CP III-32), foram adotados ≥ 260 m²/kg e ≤ 5 mm, como nas demais classes. " +
      "SO₃ do CP V-ARI pela nota 1 do Quadro III (C₃A do clínquer).",
    exemplos: [
      { nome: "CP II-E-32 em sacos — lote aceito", dados: function () {
        return { ident: { registro: "REC-CIM-01", data: "2026-03-02", obra: "Obra A", origem: "Fabricante A", camada: "Cimento para concreto de obras de arte" },
          params: { classe: "IIE-32", entrega: "sacos", fornecedor: "Fabricante A — marca X", nf: "004211", quantidade: "15", dataReceb: "02/03/2026", dataAmostra: "02/03/2026",
            dataFab: "20/02/2026", dataLab: "04/03/2026", dataUso: "10/04/2026", iMarc: "S", iInteg: "S", iArm: "S", iTest: "S",
            massasSacos: "50,2; 50,1; 49,9; 50,3; 50,0; 50,4; 50,1; 49,8; 50,2; 50,0; 50,3; 50,1; 50,5; 49,9; 50,2; 50,0; 50,1; 50,3; 49,7; 50,2; 50,4; 50,0; 50,1; 50,2; 49,9; 50,3; 50,1; 50,0; 50,2; 50,1" },
          det: [{ ri: "1,62", pf: "5,10", mgo: "4,35", so3: "2,85", co2: "3,90", r075: "2,1", blaine: "362", pegaIni: "3,2", pegaFim: "4,3", expQ: "0,5", rc3: "22,4", rc7: "28,1", rc28: "37,6", tEsc: "28" },
            { ri: "1,58", pf: "5,16", mgo: "4,41", so3: "2,81", co2: "3,96", r075: "2,3", blaine: "358", pegaIni: "3,4", pegaFim: "4,5", expQ: "0,5", rc3: "23,0", rc7: "28,7", rc28: "38,2" }] };
      } },
      { nome: "CP V-ARI a granel — reprovado (SO₃, resistência a 1 dia) e armazenamento vencido", dados: function () {
        return { ident: { registro: "REC-CIM-02", data: "2026-05-18", obra: "Obra B", origem: "Fabricante B", camada: "Cimento para pré-moldados" },
          params: { classe: "V", c3a: "ate8", entrega: "granel", fornecedor: "Fabricante B — marca Y", quantidade: "28", dataReceb: "05/10/2025", dataAmostra: "10/10/2025",
            dataLab: "24/10/2025", dataUso: "18/05/2026", iMarc: "S", iInteg: "S", iTest: "N" },
          det: [{ ri: "0,74", pf: "3,62", mgo: "2,10", so3: "3,78", co2: "2,60", r075: "0,2", blaine: "452", pegaIni: "2,1", expQ: "0,0", rc1: "12,8", rc3: "27,2", rc7: "35,5" },
            { ri: "0,70", pf: "3,58", mgo: "2,16", so3: "3,74", co2: "2,64", r075: "0,3", blaine: "448", pegaIni: "2,3", expQ: "0,5", rc1: "13,2", rc3: "27,9", rc7: "36,1" }] };
      } },
    ],
  }));
})();
