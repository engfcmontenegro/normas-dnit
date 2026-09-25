/*
 * Ficha: DNIT 095/2006-EM — Cimentos asfálticos de petróleo (CAP) — recebimento do carregamento.
 *
 * Este arquivo também define o motor comum das fichas de RECEBIMENTO DE LIGANTES (FE.recebimentoLigante),
 * usado por site/fichas/dnit-165-2013-em.js (emulsões) e site/fichas/dner-em-362-97.js (asfaltos diluídos).
 * Por isso ele deve ser carregado antes desses dois (ordem das tags <script> em index.html).
 *
 * Cada ensaio da tabela da EM vira uma ou mais linhas da tabela de determinações (1 a 3 colunas); o resultado
 * do ensaio é a média das determinações, comparada com o limite da classe escolhida.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // =====================================================================================
  // Motor comum — recebimento de ligantes asfálticos
  // =====================================================================================
  // Ensaio (cfg.ensaios[]):
  //   {id, grupo, r, u, metodo, casas, lim: {classe: {min, max} | {igual} | null}, se?(P), abs?,
  //    tipo: "num" (padrão: uma linha de entrada por determinação)
  //        | "qual" (texto: "positiva", "não espuma"...; opcoes: [[chave, rótulo, /regex/]])
  //        | "aux"  (entrada usada por outro ensaio, sem limite próprio)
  //        | "col"  (entradas [{k, r, u}] + valor calculado por determinação: col(p) -> número)
  //        | "deriv" (calculado a partir das médias de outros ensaios: f(V) -> número; usa: [ids])}
  var NDET = 3;

  function L(min, max) { return { min: ok(min) ? min : null, max: ok(max) ? max : null }; }
  function arred(x, c) { var f = Math.pow(10, c || 0); return ok(x) ? Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f : NaN; }
  function fmtLim(l, casas) {
    if (!l) return "—";
    if (l.igual) return l.igual;
    var c = function (v) { return fmt(v, casasDe(v, casas)).replace(/^-/, "−"); };
    if (l.min !== null && l.max !== null) return c(l.min) + " a " + c(l.max);
    if (l.min !== null) return "mín. " + c(l.min);
    if (l.max !== null) return "máx. " + c(l.max);
    return "—";
  }
  function casasDe(v) { var s = String(v); return s.indexOf(".") === -1 ? 0 : s.split(".")[1].length; }
  // "> 100" / "≥100" (ductilidade além do curso do ductilômetro) -> {v: 100, maior: true}
  function lerValor(v) {
    var s = String(v === undefined || v === null ? "" : v).trim();
    var maior = /^[>≥]/.test(s);
    return { v: num(s.replace(/^[>≥]\s*/, "")), maior: maior };
  }

  function criar(cfg) {
    var ENS = cfg.ensaios;
    var byId = {};
    ENS.forEach(function (e) { byId[e.id] = e; });

    function classe(d) { return (d.params || {}).classe || cfg.padrao.classe; }
    function limite(e, d) {
      if (e.tipo === "aux") return null;
      var l = typeof e.lim === "function" ? e.lim(classe(d), d.params || {}) : (e.lim || {})[classe(d)];
      return l || null;
    }
    // ensaio visível: condição (se) atendida e a classe tem limite para ele (aux: se algum ensaio que o usa aparece)
    function visivel(e, d) {
      if (e.se && !e.se(d.params || {})) return false;
      if (e.tipo === "aux") return ENS.some(function (o) { return (o.usa || []).indexOf(e.id) !== -1 && visivel(o, d); });
      return !!limite(e, d);
    }
    function linhas(d) {
      var out = [], grupo = null;
      ENS.forEach(function (e) {
        if (e.tipo === "deriv" || !visivel(e, d)) return;
        if (e.grupo && e.grupo !== grupo) { out.push({ grupo: e.grupo }); grupo = e.grupo; }
        if (e.tipo === "col") {
          e.entradas.forEach(function (x) { out.push({ k: x.k, r: x.r, u: x.u }); });
          out.push({ calc: e.id, r: e.rCalc || e.r, u: e.u, casas: e.casasCol !== undefined ? e.casasCol : e.casas + 1, destaque: true });
        } else if (e.tipo === "qual") {
          out.push({ k: e.id, r: e.r, u: "", texto: true, ph: e.ph || "" });
        } else {
          out.push({ k: e.id, r: e.r + (e.metodoLinha ? " — " + e.metodoLinha : ""), u: e.u, ph: e.ph || "" });
        }
      });
      return out;
    }

    function calcular(d) {
      var P = d.params || {}, avisos = [];
      d.det = d.det || [];
      while (d.det.length < NDET) d.det.push({});
      if (d.det.length > NDET) d.det = d.det.slice(0, NDET);
      var tab = d.det.map(function () { return {}; });
      var V = {}, res = [];
      // valores por coluna dos ensaios "col"
      ENS.forEach(function (e) {
        if (e.tipo !== "col" || !visivel(e, d)) return;
        d.det.forEach(function (p, i) { tab[i][e.id] = e.col(p, P); });
      });
      ENS.forEach(function (e) {
        if (!visivel(e, d) && !(e.tipo === "deriv" && limite(e, d) && (!e.se || e.se(P)))) return;
        var o = { e: e, lim: limite(e, d), dets: [], valor: NaN, maior: false, texto: "", situacao: null };
        if (e.tipo === "qual") {
          var txt = d.det.map(function (p) { return String(p[e.id] || "").trim(); }).filter(Boolean);
          o.dets = txt;
          if (txt.length) {
            var chaves = txt.map(function (t) {
              var op = e.opcoes.filter(function (x) { return x[2].test(t); })[0];
              return op ? op[0] : null;
            });
            if (chaves.some(function (c) { return c === null; })) {
              avisos.push(e.r + ": resultado \"" + txt.join("; ") + "\" não reconhecido — escreva " + e.opcoes.map(function (x) { return "\"" + x[1] + "\""; }).join(" ou ") + ".");
            } else {
              var dif = chaves.filter(function (c, i) { return chaves.indexOf(c) === i; });
              var rot = function (c) { return e.opcoes.filter(function (x) { return x[0] === c; })[0][1]; };
              o.texto = dif.map(rot).join(" / ");
              if (dif.length > 1) avisos.push(e.r + ": as determinações discordam (" + o.texto + ").");
              o.situacao = dif.length === 1 && rot(dif[0]) === o.lim.igual;
            }
          }
        } else {
          var vals;
          if (e.tipo === "deriv") {
            var falta = (e.usa || []).some(function (id) { return !ok(V[id]); });
            o.valor = falta ? NaN : e.f(V, P);
          } else {
            if (e.tipo === "col") vals = tab.map(function (t) { return { v: t[e.id], maior: false }; });
            else vals = d.det.map(function (p) { return lerValor(p[e.id]); });
            vals = vals.filter(function (x) { return ok(x.v); });
            o.dets = vals.map(function (x) { return (x.maior ? "> " : "") + fmt(x.v, e.tipo === "col" ? (e.casasCol !== undefined ? e.casasCol : e.casas + 1) : casasDe(x.v)); });
            if (vals.length) {
              o.valor = vals.reduce(function (a, x) { return a + x.v; }, 0) / vals.length;
              o.maior = vals.some(function (x) { return x.maior; });
            }
            if (e.nMin && vals.length && vals.length < e.nMin) avisos.push(e.r + ": " + vals.length + " determinação(ões); o método pede " + e.nMin + (e.nMinRef ? " (" + e.nMinRef + ")" : "") + ".");
            if (e.verifica) e.verifica(vals.map(function (x) { return x.v; }), avisos, P);
          }
          V[e.id] = o.valor;
          V[e.id + ">"] = o.maior;  // valor lançado como "> x"
          o.exato = o.valor;
          o.valor = arred(o.valor, e.casas);
          if (ok(o.valor) && o.lim) {
            var x = e.abs ? Math.abs(o.valor) : o.valor;
            o.situacao = (o.lim.min === null || x >= o.lim.min - 1e-9) && (o.lim.max === null || x <= o.lim.max + 1e-9);
          }
        }
        if (e.tipo !== "aux") res.push(o);
      });
      // regras especiais da EM (ex.: ductilidade a 15 °C dos asfaltos diluídos)
      if (cfg.ajustar) cfg.ajustar(res, V, P, avisos, d);
      var ensaiados = res.filter(function (o) { return o.situacao !== null; });
      var reprov = ensaiados.filter(function (o) { return o.situacao === false; });
      var nao = res.filter(function (o) { return o.situacao === null; });
      var geral = !ensaiados.length ? null : reprov.length ? "reprovado" : nao.length ? "parcial" : "aprovado";
      if (reprov.length) avisos.unshift(ponto("Fora da especificação: " + lista(reprov)));
      if (ensaiados.length && nao.length) {
        avisos.push("Ensaios da " + cfg.tabela + " não realizados neste carregamento: " + ponto(lista(nao)) +
          " " + cfg.textoTodos);
      }
      if (cfg.avisos) cfg.avisos(res, V, P, avisos, geral, d);
      return { tab: { det: tab }, resultados: { ensaios: res, geral: geral, classe: nomeClasse(d), nEnsaiados: ensaiados.length,
        nReprov: reprov.length, nNao: nao.length, V: V }, avisos: avisos };
    }
    function lista(arr) { return arr.map(function (o) { return o.e.curto || o.e.r; }).join("; "); }
    function ponto(t) { return /\.$/.test(t) ? t : t + "."; }
    function nomeClasse(d) {
      var c = classe(d);
      return (cfg.classes.filter(function (x) { return x[0] === c; })[0] || ["", c])[1];
    }
    function valorTxt(o) {
      if (o.e.tipo === "qual") return o.texto || "—";
      if (!ok(o.valor)) return "—";
      return (o.maior ? "> " : "") + fmt(o.valor, o.e.casas).replace(/^-/, "−");
    }
    function sitTxt(o, relat) {
      if (o.situacao === null) return relat ? "não ensaiado" : '<span style="opacity:.6">não ensaiado</span>';
      if (relat) return o.situacao ? "APROVADO" : "REPROVADO";
      return o.situacao ? '<span class="fe-ok">aprovado</span>' : '<span class="fe-nok">reprovado</span>';
    }
    function geralTxt(r, relat) {
      if (!r.geral) return "—";
      if (r.geral === "reprovado") return relat ? "REPROVADO — carregamento não conforme" : '<span class="fe-nok">REPROVADO</span>';
      if (r.geral === "parcial") return relat ? "APROVADO nos ensaios realizados (" + r.nNao + " ensaio(s) da " + cfg.tabela + " não realizado(s))"
        : '<span class="fe-ok">APROVADO</span> <small>nos ensaios realizados</small>';
      return relat ? "APROVADO — carregamento conforme" : '<span class="fe-ok">APROVADO</span>';
    }
    function tabelaResumo(calc, relat) {
      var r = calc.resultados;
      var h = '<table class="' + (relat ? "gr" : "fe-resumo") + '"' + (relat ? "" : ' style="width:100%"') + "><thead><tr><th" + (relat ? "" : ' style="text-align:left"') +
        ">Ensaio</th><th>Método</th><th>Determinações</th><th>Resultado</th><th>Especificação</th><th>Situação</th></tr></thead><tbody>";
      var grupo = null;
      r.ensaios.forEach(function (o) {
        if (o.e.grupo && o.e.grupo !== grupo) {
          grupo = o.e.grupo;
          h += '<tr><td colspan="6" style="text-align:left;font-weight:bold' + (relat ? ";background:#f2f2f2" : "") + '">' + esc(grupo) + "</td></tr>";
        }
        h += '<tr><td style="text-align:left">' + esc(o.e.curto || o.e.r) + (o.e.u ? " (" + esc(o.e.u) + ")" : "") + "</td><td>" + esc(o.e.metodo || "") + "</td><td>" +
          esc(o.e.tipo === "deriv" ? (o.e.formula || "calculado") : o.dets.join("; ")) + "</td><td><b>" + esc(valorTxt(o)) + "</b></td><td>" +
          esc(fmtLim(o.lim)) + "</td><td>" + sitTxt(o, relat) + "</td></tr>";
      });
      return h + "</tbody></table>";
    }

    var params = [
      { k: "classe", r: cfg.rotuloClasse || "Tipo/classe do ligante", tipo: "select", recarrega: true, opcoes: cfg.classes,
        dica: "carrega os limites da " + cfg.tabela },
    ].concat(cfg.params || []).concat([
      { k: "nf", r: "Nota fiscal nº" },
      { k: "quantidade", r: "Quantidade do carregamento (t)", ph: "ex.: 30,8" },
      { k: "procedencia", r: "Procedência (distribuidora / refinaria)" },
      { k: "certificado", r: "Certificado de análise nº" },
      { k: "dataCert", r: "Data do certificado (fabricação/análise)", ph: "dd/mm/aaaa" },
      { k: "dataCarga", r: "Data do carregamento", ph: "dd/mm/aaaa" },
      { k: "veiculo", r: "Veículo / placa / lacre" },
      { k: "tanque", r: "Tanque de descarga / estocagem" },
    ]);

    return {
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      blocos: [],
      params: params,
      padrao: cfg.padrao,
      tabelas: function (d) {
        return [{ chave: "det", titulo: "Ensaios de recebimento — determinações", rotulo: "Determinação", iniciais: NDET, min: NDET, fixo: true,
          nomes: ["1ª", "2ª", "3ª"], linhas: linhas(d),
          dica: "1 a 3 determinações por ensaio (o resultado é a média); deixe em branco o ensaio não realizado" + (cfg.dicaTabela ? "; " + cfg.dicaTabela : "") }];
      },
      calcular: calcular,
      resultadosHtml: function (calc) {
        var r = calc.resultados;
        return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + geralTxt(r, false) + '</div><div class="fe-res-r">Resultado do carregamento — ' +
          esc(r.classe) + "</div></div>" +
          '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + r.nEnsaiados + " ensaiado(s) · " + r.nReprov + " reprovado(s) · " + r.nNao + " não ensaiado(s)</div>" +
          '<div class="fe-res-r">Ensaios exigidos pela ' + esc(cfg.tabela) + " para a classe</div></div></div>" +
          '<div class="fe-tab-wrap">' + tabelaResumo(calc, false) + "</div>";
      },
      relatorio: {
        notas: cfg.notas,
        resultados: function (calc) {
          var r = calc.resultados;
          return [["Ligante", r.classe], ["Resultado do carregamento", geralTxt(r, true)],
            ["Ensaios", r.nEnsaiados + " realizado(s), " + r.nReprov + " reprovado(s), " + r.nNao + " não realizado(s)"]];
        },
        extraHtml: function (calc) { return tabelaResumo(calc, true); },
      },
      exemplos: cfg.exemplos,
    };
  }
  function lerData(s) {  // "dd/mm/aaaa" ou "aaaa-mm-dd" -> ms
    var m = String(s || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : Date.parse(s);
  }
  function diasEntre(a, b) {
    var x = lerData(a), y = lerData(b);
    return ok(x) && ok(y) ? Math.round((y - x) / 86400000) : NaN;
  }
  // tolerância entre as penetrações de uma mesma amostra (NBR 6576 / ASTM D 5: diferença máxima entre a maior e a menor)
  function tolPenetracao(rot) {
    return function (vals, avisos) {
      if (vals.length < 2) return;
      var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals), m = (mx + mn) / 2;
      var tol = m < 50 ? 2 : m < 150 ? 4 : m < 250 ? 12 : 20;
      if (mx - mn > tol) avisos.push(rot + ": diferença de " + fmt(mx - mn, 0) + " × 0,1 mm entre a maior e a menor penetração, acima da tolerância de " +
        tol + " do método (NBR 6576 / ASTM D 5) — repita o ensaio.");
    };
  }
  FE.recebimentoLigante = { criar: criar, L: L, lerValor: lerValor, diasEntre: diasEntre, tolPenetracao: tolPenetracao, fmtLim: fmtLim };

  // =====================================================================================
  // DNIT 095/2006-EM — CAP (Tabela 1)
  // =====================================================================================
  var C = ["30/45", "50/70", "85/100", "150/200"];
  function por(vals) {  // [v30, v50, v85, v150] -> {classe: limite}
    var o = {};
    C.forEach(function (c, i) { o[c] = vals[i]; });
    return o;
  }
  function mins(a) { return por(a.map(function (v) { return L(v, null); })); }
  function faixas(a) { return por(a.map(function (v) { return L(v[0], v[1]); })); }
  function todos(l) { return por([l, l, l, l]); }
  var visc = function (tipo) { return function (P) { var v = P.viscosidade || "sf"; return v === tipo || v === "ambos"; }; };
  var G1 = "CAP original (Tabela 1)", G2 = "Efeito do calor e do ar — RTFOT a 163 °C, 85 min (ASTM D 2872)";
  var SF = "NBR 14950 · ASTM E 102 · DNER-ME 004/94", BK = "NBR 15184 · ASTM D 4402";

  var ENSAIOS_CAP = [
    { id: "pen", grupo: G1, r: "Penetração (100 g, 5 s, 25 °C)", curto: "Penetração (100 g, 5 s, 25 °C)", u: "0,1 mm", casas: 0, metodo: "NBR 6576 · ASTM D 5 · DNER-ME 003/99",
      lim: faixas([[30, 45], [50, 70], [85, 100], [150, 200]]), nMin: 3, nMinRef: "NBR 6576", verifica: tolPenetracao("Penetração") },
    { id: "pa", grupo: G1, r: "Ponto de amolecimento (anel e bola), mín.", curto: "Ponto de amolecimento, mín.", u: "°C", casas: 1, metodo: "NBR 6560 · ASTM D 36",
      lim: mins([52, 46, 43, 37]) },
    { id: "sf135", grupo: G1, r: "Viscosidade Saybolt-Furol a 135 °C, mín.", u: "s", casas: 1, metodo: SF, se: visc("sf"), lim: mins([192, 141, 110, 80]) },
    { id: "sf150", grupo: G1, r: "Viscosidade Saybolt-Furol a 150 °C, mín.", u: "s", casas: 1, metodo: SF, se: visc("sf"), lim: mins([90, 50, 43, 36]) },
    { id: "sf177", grupo: G1, r: "Viscosidade Saybolt-Furol a 177 °C", u: "s", casas: 1, metodo: SF, se: visc("sf"), lim: faixas([[40, 150], [30, 150], [15, 60], [15, 60]]) },
    { id: "bk135", grupo: G1, r: "Viscosidade Brookfield a 135 °C, SP 21, 20 rpm, mín.", u: "cP", casas: 0, metodo: BK, se: visc("bk"), lim: mins([374, 274, 214, 155]) },
    { id: "bk150", grupo: G1, r: "Viscosidade Brookfield a 150 °C, SP 21, mín.", u: "cP", casas: 0, metodo: BK, se: visc("bk"), lim: mins([203, 112, 97, 81]) },
    { id: "bk177", grupo: G1, r: "Viscosidade Brookfield a 177 °C, SP 21", u: "cP", casas: 0, metodo: BK, se: visc("bk"), lim: faixas([[76, 285], [57, 285], [28, 114], [28, 114]]) },
    { id: "ist", grupo: G1, tipo: "deriv", r: "Índice de suscetibilidade térmica (obs. 1)", curto: "Índice de suscetibilidade térmica — IST (obs. 1)", u: "", casas: 1,
      metodo: "Tabela 1, obs. 1 (ou Tabela 2)", usa: ["pen", "pa"], formula: "IST = (500 log PEN + 20 T − 1951) / (120 − 50 log PEN + T)",
      lim: todos(L(-1.5, 0.7)),
      f: function (V) {
        var lp = Math.log10(V.pen), T = V.pa;
        return V.pen > 0 ? (500 * lp + 20 * T - 1951) / (120 - 50 * lp + T) : NaN;
      } },
    { id: "fulgor", grupo: G1, r: "Ponto de fulgor (vaso aberto Cleveland), mín.", curto: "Ponto de fulgor, mín.", u: "°C", casas: 1, metodo: "NBR 11341 · ASTM D 92 · DNER-ME 148/94",
      lim: todos(L(235, null)) },
    { id: "solub", grupo: G1, r: "Solubilidade em tricloroetileno, mín.", u: "% massa", casas: 1, metodo: "NBR 14855 · ASTM D 2042", lim: todos(L(99.5, null)) },
    { id: "duct", grupo: G1, r: "Ductilidade a 25 °C, mín. (\"> 100\" se passar do curso)", curto: "Ductilidade a 25 °C, mín.", u: "cm", casas: 0,
      metodo: "NBR 6293 · ASTM D 113 · DNER-ME 163/98", lim: mins([60, 60, 100, 100]), ph: "ex.: > 100" },
    { id: "espuma", grupo: G1, tipo: "qual", r: "Espuma ao ser aquecido a 175 °C (seção 5)", curto: "Não espumar a 175 °C (seção 5)", u: "", metodo: "seção 5 (condições gerais)",
      ph: "não espuma / espuma", lim: todos({ igual: "não espuma" }),
      opcoes: [["nao", "não espuma", /^(n[aã]o|ausente|sem|ok|aus)/i], ["sim", "espuma", /^(sim|espuma|espumou|presen)/i]] },
    { id: "rtfot", grupo: G2, tipo: "col", r: "Variação em massa, máx. (obs. 2)", rCalc: "ΔM = (Mi − Mf) / Mi × 100 (obs. 2)", u: "% massa", casas: 2, casasCol: 3,
      metodo: "ASTM D 2872", abs: true, lim: todos(L(null, 0.5)),
      entradas: [{ k: "mi", r: "Massa antes do RTFOT (Mi) — recipiente", u: "g" }, { k: "mf", r: "Massa após o RTFOT (Mf)", u: "g" }],
      col: function (p) { var mi = num(p.mi), mf = num(p.mf); return ok(mi) && ok(mf) && mi > 0 ? (mi - mf) / mi * 100 : NaN; } },
    { id: "ductR", grupo: G2, r: "Ductilidade a 25 °C após RTFOT, mín.", u: "cm", casas: 0, metodo: "NBR 6293 · ASTM D 113 · DNER-ME 163/98", lim: mins([10, 20, 50, 50]), ph: "ex.: > 100" },
    { id: "paR", grupo: G2, tipo: "aux", r: "Ponto de amolecimento após RTFOT", u: "°C", casas: 1 },
    { id: "dpa", grupo: G2, tipo: "deriv", r: "Aumento do ponto de amolecimento, máx.", u: "°C", casas: 1, metodo: "NBR 6560 · ASTM D 36", usa: ["paR", "pa"],
      formula: "PA após RTFOT − PA original", lim: todos(L(null, 8)), f: function (V) { return V.paR - V.pa; } },
    { id: "penR", grupo: G2, tipo: "aux", r: "Penetração após RTFOT (100 g, 5 s, 25 °C)", u: "0,1 mm", casas: 1, verifica: tolPenetracao("Penetração após RTFOT"),
      usa: [] },
    { id: "pret", grupo: G2, tipo: "deriv", r: "Penetração retida, mín. (obs. 3)", u: "%", casas: 1, metodo: "NBR 6576 · ASTM D 5 · DNER-ME 003/99", usa: ["penR", "pen"],
      formula: "PEN após RTFOT / PEN original × 100", lim: mins([60, 55, 55, 50]), f: function (V) { return V.pen > 0 ? V.penR / V.pen * 100 : NaN; } },
  ];

  FE.FICHAS["dnit-095-2006-em"] = criar({
    titulo: "Recebimento de CAP — cimento asfáltico de petróleo",
    resumo: "Ensaios de recebimento do carregamento comparados com a Tabela 1 da EM (CAP 30/45, 50/70, 85/100, 150/200): penetração, ponto de amolecimento, viscosidades, IST calculado, fulgor, solubilidade, ductilidade, espuma e RTFOT.",
    tabela: "Tabela 1",
    textoTodos: "A amostra deve ser submetida aos ensaios da Tabela 1 (seção 7); o resultado geral vale só para os ensaios realizados.",
    classes: C.map(function (c) { return [c, "CAP " + c]; }),
    padrao: { classe: "50/70", viscosidade: "sf" },
    params: [
      { k: "viscosidade", r: "Viscosidade ensaiada", tipo: "select", recarrega: true,
        opcoes: [["sf", "Saybolt-Furol (s)"], ["bk", "Brookfield (cP)"], ["ambos", "Saybolt-Furol e Brookfield"]],
        dica: "a Tabela 1 exige Saybolt-Furol OU Brookfield" },
    ],
    dicaTabela: "RTFOT: uma coluna por recipiente",
    ensaios: ENSAIOS_CAP,
    avisos: function (res, V, P, avisos) {
      var ist = res.filter(function (o) { return o.e.id === "ist"; })[0];
      if (ist && ok(ist.exato)) avisos.push("IST calculado pela equação da obs. 1 com PEN = " + fmt(V.pen, 1) + " e T = " + fmt(V.pa, 1) + " °C: " + fmt(ist.exato, 2).replace(/^-/, "−") +
        " (a Tabela 2 da norma omite os sinais negativos — use a equação).");
      if (ok(V.penR) && !ok(V.pen)) avisos.push("Penetração retida: informe também a penetração do CAP original.");
      if (ok(V.paR) && !ok(V.pa)) avisos.push("Aumento do ponto de amolecimento: informe também o ponto de amolecimento do CAP original.");
    },
    notas: "Resultado de cada ensaio = média das determinações, arredondada como indicado, comparada com a Tabela 1 da DNIT 095/2006-EM para a classe. " +
      "IST = (500 log PEN + 20 T − 1951) / (120 − 50 log PEN + T), com PEN a 25 °C e T = ponto de amolecimento (obs. 1; limites −1,5 a +0,7). " +
      "ΔM = (Mi − Mf) / Mi × 100, comparada em valor absoluto com 0,5 % (obs. 2). Penetração retida = PEN após RTFOT / PEN original × 100 (obs. 3). " +
      "Aceitação (seção 7): todos os resultados atendendo, o fornecimento é aceito; um ou mais fora, pode ser rejeitado.",
    exemplos: [
      { nome: "CAP 50/70 — carregamento de 26/01/2026 (planilha do laboratório)", dados: function () {
        return { ident: { registro: "REC-CAP-2026-01", data: "2026-01-26", obra: "Unidade A — usina de asfalto", origem: "Distribuidora C", camada: "CAP 50/70",
          laboratorista: "Equipe laboratório usina" },
          params: { classe: "50/70", viscosidade: "sf", quantidade: "30,8", procedencia: "Distribuidora C", dataCarga: "26/01/2026" },
          det: [{ sf135: "287", sf150: "75", sf177: "135", pen: "69", fulgor: "350" },
            { sf135: "285", sf150: "77", sf177: "138", pen: "65", fulgor: "335" },
            { pen: "65" }] };
      } },
      { nome: "CAP 30/45 — caracterização completa com Brookfield e RTFOT", dados: function () {
        return { ident: { registro: "REC-CAP-EX-02", obra: "Exemplo", origem: "Distribuidora A", camada: "CAP 30/45" },
          params: { classe: "30/45", viscosidade: "bk", nf: "004512", quantidade: "29,6", procedencia: "Distribuidora A", certificado: "CQ-2291",
            dataCert: "10/02/2026", dataCarga: "11/02/2026" },
          det: [{ pen: "38", pa: "54,2", bk135: "421", bk150: "216", bk177: "81", fulgor: "302", solub: "99,8", duct: "> 100", espuma: "não espuma",
            mi: "35,012", mf: "34,958", ductR: "25", paR: "58,9", penR: "26" },
          { pen: "39", pa: "54,6", bk135: "418", bk150: "213", bk177: "80", fulgor: "298", duct: "> 100", mi: "35,104", mf: "35,049", ductR: "28", paR: "59,3", penR: "25" },
          { pen: "37", penR: "26" }] };
      } },
      { nome: "CAP 85/100 — carregamento reprovado (penetração, viscosidade, fulgor, espuma)", dados: function () {
        return { ident: { registro: "REC-CAP-EX-03", obra: "Exemplo", origem: "Distribuidora B", camada: "CAP 85/100" },
          params: { classe: "85/100", viscosidade: "sf", nf: "118877", quantidade: "31,2", procedencia: "Distribuidora B", certificado: "LB-0457" },
          det: [{ pen: "104", pa: "44,1", sf135: "105", sf150: "48", sf177: "25", fulgor: "220", duct: "> 100", espuma: "espuma" },
            { pen: "108", pa: "44,3", sf135: "107", sf150: "47", sf177: "26", fulgor: "224", duct: "> 100" },
            { pen: "103" }] };
      } },
    ],
  });
})();
