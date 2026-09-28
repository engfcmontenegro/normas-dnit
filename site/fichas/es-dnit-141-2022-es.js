/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 141/2022-ES — Base estabilizada granulometricamente.
 * Não calcula um ensaio: reúne os resultados dos ensaios de um lote/segmento executado (importados das fichas ME ou
 * digitados), confere a frequência exigida pela ES e aplica os critérios de aceitação, dando o parecer do lote.
 *
 * O que a ES manda (seções do PDF):
 *   5.1   materiais: expansão ≤ 0,5 % (DNIT 172); projeto empírico: ISC ≥ 60 % (N ≤ 5×10⁶) ou ≥ 80 % (N > 5×10⁶),
 *         LL ≤ 25 % (DNER-ME 122), IP ≤ 6 % (DNER-ME 082), EA > 30 % quando LL/IP forem ultrapassados,
 *         passante na nº 200 ≤ 2/3 do passante na nº 40; Los Angeles ≤ 55 % (agregado retido na nº 10), admitindo-se
 *         mais com desempenho anterior satisfatório; projeto mecanicista: MR e DP conforme projeto.
 *   5.3.4 umidade para início da compactação: h ót ± 1 %.        5.3.6 espessura compactada entre 10 e 20 cm.
 *   7.2.1 a) umidade a cada 100 m; compactação, expansão e ISC: 1 amostra por camada a cada 200 m ou por jornada
 *         diária (NOTA 4: 400 m com material homogêneo, a critério da Fiscalização); MR a cada 1500 m se no projeto.
 *   7.2.1 b) grau de compactação ≥ 100 % (DNER-ME 092 [hoje DNIT 458], DNER-ME 036 ou DNIT 417).
 *   7.2.2 deflexão: mín. 15 determinações, a cada 20 m em faixas alternadas; Dc = D₀médio + k·S ≤ LSE (eq. 1).
 *   7.3   geometria: largura até +10 cm (sem falta); flecha até +20 % ou declividade até +0,5 % (sem falta);
 *         espessura ± 10 % da de projeto.
 *   7.5   conformidade: X̄ − k·s ≥ mínimo; X̄ + k·s ≤ máximo (eq. 2 e 3); k da Tabela B1 (Anexo B, normativo).
 *   8     medição em m³ com largura e espessura médias do controle geométrico, limitada ao projeto.
 * Fichas de origem (importarVarios): 456, 164, 172, 458, DNER-ME 036/037, 417, 405, 412, DNER-ME 122/082, 450, 451.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ID = "dnit-141-2022-es";

  // ---------- Tabela B1 — Amostragem Variável (Anexo B, normativo; PDF p. 10): [n, k, α] ----------
  var K_B1 = [[5, 1.55, 0.45], [6, 1.41, 0.35], [7, 1.36, 0.30], [8, 1.31, 0.25], [9, 1.25, 0.19], [10, 1.21, 0.15],
    [11, 1.19, 0.13], [12, 1.16, 0.10], [13, 1.13, 0.08], [14, 1.11, 0.06], [15, 1.10, 0.05], [16, 1.08, 0.04],
    [17, 1.06, 0.03], [19, 1.04, 0.02], [21, 1.01, 0.01]];
  // n < 5: fora da tabela (sem controle estatístico). n não tabelado (18, 20): k do maior n tabelado abaixo dele
  // (k maior = mais conservador). n > 21: 1,01 (último da tabela).
  function coefK(n) {
    if (!(n >= 5)) return null;
    var sel = null;
    K_B1.forEach(function (x) { if (x[0] <= n) sel = x; });
    return { k: sel[1], alfa: sel[2], nTab: sel[0], exato: sel[0] === n };
  }

  // ---------- peneiras da Tabela A1 (Anexo A, informativo; PDF p. 9) e tolerâncias da faixa de projeto ----------
  var PEN = [[50.8, "2\"", 7], [25.4, "1\"", 7], [9.5, "3/8\"", 7], [4.8, "nº 4", 5], [2.0, "nº 10", 5], [0.42, "nº 40", 2], [0.074, "nº 200", 2]];
  function kPen(mm) { return "p" + String(mm).replace(".", "_"); }
  function rotPen(p) { return p[1] + " (" + fmt(p[0], p[0] < 1 ? 3 : 1).replace(/,?0+$/, "") + " mm)"; }
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  function faixasRef() {
    return FE.granulometria.faixasDisponiveis().filter(function (f) { return f.norma === ID; });
  }

  // códigos curtos das fichas de origem (registro da importação)
  var COD = { "dnit-456-2025-me": "DNIT 456", "dnit-164-2013-me": "DNIT 164", "dnit-172-2016-me": "DNIT 172",
    "dnit-458-2025-me": "DNIT 458", "dner-me-036-94": "DNER-ME 036", "dner-me-037-94": "DNER-ME 037",
    "dnit-417-2019-me": "DNIT 417", "dnit-405-2017-me": "DNIT 405", "dnit-412-2025-me": "DNIT 412",
    "dner-me-122-94": "DNER-ME 122", "dner-me-082-94": "DNER-ME 082", "dnit-450-2024-me": "DNIT 450", "dnit-451-2024-me": "DNIT 451" };
  var GC_FONTES = ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me", "dner-me-037-94", "dnit-405-2017-me"];
  var GC_NAO_CITADAS = ["dner-me-037-94", "dnit-405-2017-me"];


  // ---------- estacas (20 m) ----------
  // aceita "40", "40+10", "40 + 10,00", "Estaca 42", "E-42"
  function estacaM(s) {
    var m = /(\d+)(?:\s*\+\s*([\d.,]+))?/.exec(String(s || ""));
    if (!m) return NaN;
    return Number(m[1]) * 20 + (m[2] ? num(m[2]) : 0);
  }
  function txtEstaca(m) {
    if (!ok(m)) return "—";
    var e = Math.floor(m / 20 + 1e-9), r = m - e * 20;
    return String(e) + (r > 0.005 ? " + " + fmt(r, 2) : "");
  }
  function numOuNP(v) {
    var t = String(v === undefined || v === null ? "" : v).trim();
    if (/^n\.?\s*p\.?$/i.test(t)) return { np: true, v: NaN };
    return { np: false, v: num(t) };
  }

  // ---------- estatística (7.5, eq. 2 e 3) ----------
  function estat(vals) {
    var n = vals.length, xm = media(vals), s = NaN;
    if (n >= 2) s = Math.sqrt(vals.reduce(function (a, x) { return a + (x - xm) * (x - xm); }, 0) / (n - 1));
    return { n: n, xm: xm, s: s };
  }

  // Avalia um critério com mínimo e/ou máximo (7.5).
  // cfg: {id, nome, secao, unid, casas, pontos: [{v, est, rot}], min, max, minEstrito, obrigMin, obrigMax, exigido, naoExigidoPor}
  // situação: C conforme · CR conforme com ressalva · NC não conforme · SD sem dados · NE não exigido · I informativo
  function avaliar(cfg) {
    var o = { id: cfg.id, nome: cfg.nome, secao: cfg.secao, unid: cfg.unid || "", casas: cfg.casas === undefined ? 1 : cfg.casas,
      min: cfg.min, max: cfg.max, minEstrito: !!cfg.minEstrito, pontos: cfg.pontos || [], exigido: cfg.exigido !== false,
      grafico: cfg.grafico };
    var vals = o.pontos.map(function (p) { return p.v; }).filter(ok);
    var E = estat(vals);
    o.n = E.n; o.xm = E.xm; o.s = E.s;
    o.exigTxt = cfg.exigTxt || exigidoTxt(o);
    if (!o.exigido) { o.sit = "NE"; o.motivo = cfg.naoExigidoPor || "não exigido"; return o; }
    if (!o.n) { o.sit = "SD"; o.motivo = "sem determinações"; return o; }
    function abaixo(v) { return ok(o.min) && (o.minEstrito ? v <= o.min + 1e-9 : v < o.min - 1e-9); }
    function acima(v) { return ok(o.max) && v > o.max + 1e-9; }
    o.fora = o.pontos.filter(function (p) { return ok(p.v) && (abaixo(p.v) || acima(p.v)); });
    var foraObrig = o.pontos.filter(function (p) { return ok(p.v) && ((cfg.obrigMin && abaixo(p.v)) || (cfg.obrigMax && acima(p.v))); });
    var listaFora = o.fora.map(function (p) { return fmt(p.v, o.casas) + (p.est ? " (est. " + p.est + ")" : p.rot ? " (" + p.rot + ")" : ""); }).join("; ");
    var K = coefK(o.n);
    if (K) {
      o.k = K.k; o.alfa = K.alfa; o.kExato = K.exato; o.nTab = K.nTab;
      var sv = ok(o.s) ? o.s : 0;
      o.inf = o.xm - o.k * sv; o.sup = o.xm + o.k * sv;
      o.regra = "estatística (7.5)";
      var falhas = [];
      if (ok(o.min) && abaixo(o.inf)) falhas.push("X̄ − k·s = " + fmt(o.inf, o.casas + 1) + (o.minEstrito ? " ≤ " : " < ") + fmt(o.min, o.casas) + " " + o.unid);
      if (ok(o.max) && acima(o.sup)) falhas.push("X̄ + k·s = " + fmt(o.sup, o.casas + 1) + " > " + fmt(o.max, o.casas) + " " + o.unid);
      if (falhas.length) { o.sit = "NC"; o.motivo = falhas.join("; ") + " (7.5 b)"; }
      else if (foraObrig.length) { o.sit = "NC"; o.motivo = "a estatística atende, mas a ES não tolera valores individuais fora: " + listaFora; }
      else if (o.fora.length) { o.sit = "CR"; o.motivo = "a estatística atende (7.5 a); " + o.fora.length + " valor(es) individual(is) fora do limite — corrigir o local (7.5): " + listaFora; }
      else { o.sit = "C"; o.motivo = "X̄ " + (ok(o.min) ? "− k·s = " + fmt(o.inf, o.casas + 1) : "") + (ok(o.min) && ok(o.max) ? " e X̄ " : "") +
        (ok(o.max) ? "+ k·s = " + fmt(o.sup, o.casas + 1) : "") + " " + o.unid + " (7.5 a)"; }
      if (!K.exato) o.motivo += o.n > 21 ? " — n > 21: k = 1,01 (último da Tabela B1)" : " — n = " + o.n + " não tabelado: k de n = " + K.nTab;
    } else {
      o.regra = "valores individuais (n < 5)";
      if (o.fora.length) { o.sit = "NC"; o.motivo = "valor individual fora do limite (n < 5, sem estatística): " + listaFora; }
      else { o.sit = "C"; o.motivo = "todos os valores individuais atendem (n < 5, sem estatística)"; }
    }
    return o;
  }
  function exigidoTxt(o) {
    var u = o.unid ? " " + o.unid : "", c = o.casas;
    if (ok(o.min) && ok(o.max)) return fmt(o.min, c) + " a " + fmt(o.max, c) + u;
    if (ok(o.min)) return (o.minEstrito ? "> " : "≥ ") + fmt(o.min, c) + u;
    if (ok(o.max)) return "≤ " + fmt(o.max, c) + u;
    return "—";
  }

  var SIT = {
    C: ["conforme", "fe-ok", "CONFORME"], CR: ["conforme com ressalva", "", "CONFORME COM RESSALVA"],
    NC: ["não conforme", "fe-nok", "NÃO CONFORME"], SD: ["sem dados", "fe-nok", "SEM DADOS"],
    NE: ["não exigido", "", "não exigido"], I: ["informativo", "", "informativo"],
    ATENDE: ["atende", "fe-ok", "atende"], FALTA: ["insuficiente", "fe-nok", "INSUFICIENTE"],
  };
  var AMBAR = "color:#c77d12;font-weight:600";
  function sitHtml(s, relat) {
    var x = SIT[s] || [s, "", s];
    if (relat) return x[2];
    if (s === "CR") return '<span style="' + AMBAR + '">' + x[0] + "</span>";
    return x[1] ? '<span class="' + x[1] + '">' + x[0] + "</span>" : "<span>" + x[0] + "</span>";
  }

  // ---------- importação (importarVarios) ----------
  function rotReg(e, extra) {
    var i = (e.dados || {}).ident || {};
    return (i.registro || "sem registro") + " · " + (COD[e.ficha] || e.ficha) + (extra ? " · " + extra : "");
  }
  // colunas digitadas (sem marca de importação) com algum valor são mantidas; as importadas são substituídas
  function trocarImportadas(d, chave, novas) {
    var manter = (d[chave] || []).filter(function (c) {
      return !c.imp && Object.keys(c).some(function (k) { return k !== "usar" && c[k] !== "" && c[k] !== undefined && c[k] !== null; });
    });
    d[chave] = manter.concat(novas);
    if (!d[chave].length) d[chave].push({});
  }
  // junta na mesma coluna ensaios de um mesmo registro (ex.: LL/IP e EA da mesma amostra)
  function juntarPorRegistro(itens) {
    var out = [], por = {};
    itens.forEach(function (it) {
      var c = it.col, key = it.chave;
      if (key && por[key]) {
        var alvo = por[key];
        Object.keys(c).forEach(function (k) {
          if (k === "reg") return;
          if (c[k] !== "" && c[k] !== undefined && (alvo[k] === "" || alvo[k] === undefined)) alvo[k] = c[k];
        });
        if (alvo.reg.indexOf(it.cod) === -1) alvo.reg += " + " + it.cod;
      } else { out.push(c); if (key) por[key] = c; }
    });
    return out;
  }
  function identDe(e) { return (e.dados || {}).ident || {}; }

  var APLICAR = {
    umid: function (lista, P, d) {
      trocarImportadas(d, "umid", lista.map(function (e) {
        var r = e.resultados || {};
        return { imp: "1", est: identDe(e).local || "", reg: rotReg(e), w: ok(r.w) ? fmt(r.w, 1) : "" };
      }));
    },
    comp: function (lista, P, d) {
      trocarImportadas(d, "comp", juntarPorRegistro(lista.map(function (e) {
        var r = e.resultados || {}, i = identDe(e), e172 = e.ficha === "dnit-172-2016-me";
        return { chave: i.registro || "", cod: COD[e.ficha], col: { imp: "1", est: i.local || "", reg: rotReg(e),
          gs: ok(r.gsMax) ? fmt(r.gsMax, 3) : "", hot: ok(r.hOt) ? fmt(r.hOt, 1) : "",
          isc: e172 && ok(r.isc) ? fmt(Math.round(r.isc), 0) : "", exp: e172 && ok(r.exp) ? fmt(r.exp, 2) : "" } };
      })));
    },
    gc: function (lista, P, d) {
      var cols = [];
      lista.forEach(function (e) {
        var r = e.resultados || {}, i = identDe(e), pts = r.furos || r.pts || [];
        var nome = e.ficha === "dnit-417-2019-me" || e.ficha === "dnit-405-2017-me" ? "ponto " : "furo ";
        pts.forEach(function (f, j) {
          if (!ok(f.GC)) return;
          var w = ok(f.uW) ? f.uW : f.w;
          cols.push({ imp: "1", fonte: e.ficha, est: f.estaca || i.local || "", pos: f.posicao || "", reg: rotReg(e, nome + (j + 1)),
            gc: fmt(f.GC, 1), w: ok(w) ? fmt(w, 1) : "" });
        });
      });
      trocarImportadas(d, "gc", cols);
    },
    gran: function (lista, P, d) {
      trocarImportadas(d, "gran", lista.map(function (e) {
        var r = e.resultados || {}, c = { imp: "1", est: identDe(e).local || "", reg: rotReg(e) };
        PEN.forEach(function (p) {
          var m = (r.media || []).filter(function (x) { return perto(x.mm, p[0]) && ok(x.pass); })[0];
          c[kPen(p[0])] = m ? fmt(m.pass, 1) : "";
        });
        return c;
      }));
    },
    lim: function (lista, P, d) {
      trocarImportadas(d, "lim", juntarPorRegistro(lista.map(function (e) {
        var r = e.resultados || {}, i = identDe(e), c = { imp: "1", est: i.local || "", reg: rotReg(e), ll: "", ip: "", ea: "" };
        if (e.ficha === "dner-me-082-94") {
          c.ll = r.llNP ? "NP" : ok(r.LL) ? fmt(r.LL, 0) : "";
          c.ip = r.ipNP ? "NP" : ok(r.IP) ? fmt(r.IP, 0) : "";
        } else if (e.ficha === "dner-me-122-94") {
          c.ll = r.np ? "NP" : ok(r.LL) ? fmt(r.LL, 0) : "";
        } else if (e.ficha === "dnit-450-2024-me") {
          c.ea = ok(r.ea) ? fmt(r.ea, 0) : "";
        }
        return { chave: i.registro || "", cod: COD[e.ficha], col: c };
      })));
    },
    la: function (lista, P, d) {
      trocarImportadas(d, "la", lista.map(function (e) {
        var r = e.resultados || {};
        return { imp: "1", reg: rotReg(e, r.g ? "graduação " + r.g : ""), la: ok(r.A) ? fmt(Math.round(r.A), 0) : "" };
      }));
    },
  };

  // ---------- parâmetros ----------
  function P_(d) { return d.params || {}; }
  function mec(d) { return P_(d).dimens === "mec"; }
  function deflExigida(d) { return P_(d).defl !== "dispensada"; }

  var PARAMS = [
    { k: "estIni", r: "Estaca inicial do lote", ph: "ex.: 40 ou 40 + 10,00" },
    { k: "estFim", r: "Estaca final do lote", ph: "ex.: 55" },
    { k: "ext", r: "Extensão do lote (m) — opcional", dica: "se vazia, calculada pelas estacas (20 m)" },
    { k: "largura", r: "Largura de projeto da plataforma da base (m)", dica: "controle geométrico (7.3 a) e área do lote" },
    { k: "espessura", r: "Espessura de projeto da camada compactada (cm)", dica: "entre 10 e 20 cm (5.3.6); tolerância ± 10 % (7.3 c)" },
    { k: "dimens", r: "Dimensionamento do pavimento (5.1)", tipo: "select", recarrega: true,
      opcoes: [["emp", "Empírico — ISC, LL, IP e EA exigidos"], ["mec", "Mecanicista — MR e DP conforme projeto"]] },
    { k: "nN", r: "Número N de projeto (5.1)", tipo: "select",
      opcoes: [["gt5", "N > 5 × 10⁶ — ISC ≥ 80 %"], ["le5", "N ≤ 5 × 10⁶ — ISC ≥ 60 %"]],
      se: function (d) { return !mec(d); } },
    { k: "iscProj", r: "ISC no controle da execução (7.2.1 a)", tipo: "select",
      opcoes: [["sim", "Especificado em projeto — exigido"], ["nao", "Não especificado — só controle da mistura (7.1)"]],
      se: function (d) { return !mec(d); } },
    { k: "freq", r: "Frequência de compactação, expansão e ISC (NOTA 4)", tipo: "select",
      opcoes: [["200", "1 amostra a cada 200 m (ou por jornada diária)"], ["400", "1 amostra a cada 400 m — materiais homogêneos, a critério da Fiscalização"]] },
    { k: "jornadas", r: "Jornadas diárias de trabalho no lote", ph: "1", dica: "NOTA 4: também 1 amostra por camada por jornada diária" },
    { k: "hOt", r: "Umidade ótima de referência (%) — opcional", dica: "se vazia, média das umidades ótimas da tabela de compactação" },
    { k: "gcMin", r: "Grau de compactação mínimo (%)", ph: "100", dica: "7.2.1 b: ≥ 100 %" },
    { k: "espGC", r: "Plano de amostragem: espaçamento das determinações de GC (m) — opcional",
      dica: "a ES remete ao plano (7.4); vazio = mínimo de 5 determinações (menor n da Tabela B1)" },
    { k: "faixa", r: "Faixa granulométrica de referência (Anexo A, informativo)", tipo: "select",
      opcoes: function () {
        return [["", "— nenhuma —"]].concat(faixasRef().map(function (f) { return [f.id, "Faixa " + f.faixa + " (" + f.condicao + ")"]; }));
      },
      dica: "NOTA 2: faixas exemplificativas — só informam; a faixa de trabalho vem da curva de projeto (tabela abaixo)" },
    { k: "agreg", r: "Há agregado retido na peneira nº 10? (5.1)", tipo: "select",
      opcoes: [["sim", "Sim — abrasão Los Angeles ≤ 55 %"], ["nao", "Não — Los Angeles não se aplica"]] },
    { k: "laMax", r: "Desgaste Los Angeles máximo (%)", ph: "55", se: function (d) { return P_(d).agreg !== "nao"; } },
    { k: "laDesemp", r: "Desempenho anterior satisfatório comprovado? (5.1)", tipo: "select",
      opcoes: [["nao", "Não"], ["sim", "Sim — admite-se desgaste maior que o máximo"]], se: function (d) { return P_(d).agreg !== "nao"; } },
    { k: "mrProj", r: "Módulo de resiliência de projeto (MPa)", se: mec, dica: "7.1 e 7.2.1 a: não deve variar significativamente do projeto" },
    { k: "defl", r: "Controle de deflexão (7.2.2)", tipo: "select", recarrega: true,
      opcoes: [["exigido", "Exigido — Viga Benkelman ou FWD"], ["dispensada", "Dispensado pela Fiscalização (NOTA 6, justificado)"]] },
    { k: "lse", r: "Deflexão admissível de projeto — LSE (0,01 mm)", se: deflExigida },
    { k: "secao", r: "Seção transversal (7.3 b)", tipo: "select", recarrega: true,
      opcoes: [["simples", "Declividade transversal de caimento simples (%)"], ["abaul", "Abaulamento — flecha (cm)"]] },
    { k: "declProj", r: "Declividade transversal de projeto (%)", ph: "3", se: function (d) { return P_(d).secao !== "abaul"; } },
    { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: function (d) { return P_(d).secao === "abaul"; } },
    { k: "espGeo", r: "Espaçamento das seções do controle geométrico (m)", ph: "20", dica: "a ES não fixa; padrão: uma seção por estaca" },
    // importações
    { k: "impUmid", r: "Umidade antes da compactação — importar (DNIT 456)", tipo: "importarVarios", de: "dnit-456-2025-me", aplicar: APLICAR.umid,
      dica: "estaca = campo \"Estaca / local\" da ficha de origem" },
    { k: "impComp", r: "Compactação, expansão e ISC — importar (DNIT 172 / DNIT 164)", tipo: "importarVarios",
      de: ["dnit-172-2016-me", "dnit-164-2013-me"], aplicar: APLICAR.comp, dica: "a DNIT 172 traz γs,máx, h ót, ISC e expansão; a 164 só γs,máx e h ót" },
    { k: "impGC", r: "Grau de compactação — importar furos/pontos (DNIT 458, DNER-ME 036, DNIT 417…)", tipo: "importarVarios",
      de: GC_FONTES, aplicar: APLICAR.gc, dica: "cada furo/ponto vira uma coluna, com a estaca e a posição da ficha de origem" },
    { k: "impGran", r: "Granulometria — importar (DNIT 412)", tipo: "importarVarios", de: "dnit-412-2025-me", aplicar: APLICAR.gran },
    { k: "impLim", r: "LL, IP e equivalente de areia — importar (DNER-ME 122 / 082, DNIT 450)", tipo: "importarVarios",
      de: ["dner-me-082-94", "dner-me-122-94", "dnit-450-2024-me"], aplicar: APLICAR.lim, dica: "ensaios com o mesmo registro vão para a mesma coluna" },
    { k: "impLA", r: "Abrasão Los Angeles — importar (DNIT 451)", tipo: "importarVarios", de: "dnit-451-2024-me", aplicar: APLICAR.la,
      se: function (d) { return P_(d).agreg !== "nao"; } },
  ];

  // ---------- tabelas ----------
  var L_EST = { k: "est", r: "Estaca", texto: true };
  var L_REG = { k: "reg", r: "Registro / origem", texto: true };
  function tabelas(d) {
    var P = P_(d);
    var t = [
      { chave: "umid", titulo: "Teor de umidade imediatamente antes da compactação (7.2.1 a; 5.3.4)", rotulo: "Det.", iniciais: 1, min: 1,
        dica: "a cada 100 m; admitido h ót ± 1 % para início da compactação",
        linhas: [L_EST, L_REG, { k: "w", r: "Teor de umidade (w)", u: "%" },
          { k: "hot", r: "Umidade ótima de referência", u: "%", padrao: "hOt" },
          { calc: "dw", r: "Δw = w − h ót (admitido ± 1)", u: "p.p.", casas: 1, destaque: true }] },
      { chave: "comp", titulo: "Compactação, expansão e ISC da mistura (7.2.1 a, NOTA 4)", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "1 amostra por camada a cada 200 m ou por jornada diária",
        linhas: [L_EST, L_REG, { k: "gs", r: "γs,máx (DNIT 164)", u: "g/cm³" }, { k: "hot", r: "Umidade ótima", u: "%" },
          { k: "isc", r: "ISC (DNIT 172)", u: "%" }, { k: "exp", r: "Expansão (DNIT 172)", u: "%" }] },
      { chave: "gc", titulo: "Grau de compactação na pista (7.2.1 b)", rotulo: "Furo", iniciais: 1, min: 1,
        dica: "GC ≥ 100 %; massa específica in situ pela DNIT 458 (antiga DNER-ME 092), DNER-ME 036 ou DNIT 417",
        linhas: [L_EST, { k: "pos", r: "Posição (LE / eixo / LD)", texto: true }, L_REG,
          { k: "gc", r: "Grau de compactação (GC)", u: "%" }, { k: "w", r: "Umidade do furo (informativa)", u: "%" }] },
      { chave: "gran", titulo: "Granulometria da mistura — % passando (5.1; Anexo A)", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "DNIT 412 (substitui a DNER-ME 080 citada); verificação da faixa de trabalho e da relação nº 200 / nº 40",
        linhas: [L_EST, L_REG].concat(PEN.map(function (p) { return { k: kPen(p[0]), r: rotPen(p), u: "%" }; }))
          .concat([{ calc: "rel", r: "Passante nº 200 / passante nº 40 (≤ 2/3)", u: "", casas: 2, destaque: true }]) },
      { chave: "proj", titulo: "Curva granulométrica de projeto — % passando (define a faixa de trabalho)", rotulo: "Curva", iniciais: 1, min: 1,
        fixo: true, nomes: ["Projeto"], dica: "faixa de trabalho = projeto ± 7 / 5 / 2 % (Tabela A1, última coluna); deixe vazio se não houver",
        linhas: PEN.map(function (p) { return { k: kPen(p[0]), r: rotPen(p) + " — tolerância ± " + p[2], u: "%" }; }) },
      { chave: "lim", titulo: "Limites de consistência e equivalente de areia (5.1)", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "LL ≤ 25 %, IP ≤ 6 %; EA > 30 % quando esses limites forem ultrapassados; \"NP\" aceito",
        linhas: [L_EST, L_REG, { k: "ll", r: "Limite de liquidez (DNER-ME 122)", u: "%", texto: true },
          { k: "ip", r: "Índice de plasticidade (DNER-ME 082)", u: "%", texto: true }, { k: "ea", r: "Equivalente de areia (DNIT 450)", u: "%" }] },
    ];
    if (P.agreg !== "nao") t.push({ chave: "la", titulo: "Abrasão Los Angeles do agregado retido na nº 10 (5.1)", rotulo: "Amostra", iniciais: 1, min: 1,
      dica: "DNIT 451 (substitui a DNER-ME 035 citada); desgaste ≤ 55 %",
      linhas: [L_REG, { k: "la", r: "Desgaste Los Angeles", u: "%" }] });
    if (P.dimens === "mec") t.push({ chave: "mr", titulo: "Módulo de resiliência (7.2.1 a — se especificado em projeto)", rotulo: "Ensaio", iniciais: 1, min: 1,
      dica: "triplicata (DNIT 134) a cada 1500 m, ou confirmação com equipamento de campo calibrado",
      linhas: [L_EST, L_REG, { k: "mr", r: "Módulo de resiliência (média da triplicata)", u: "MPa" }] });
    if (P.defl !== "dispensada") t.push({ chave: "defl", titulo: "Deflexões recuperáveis máximas D₀ (7.2.2)", rotulo: "Det.", iniciais: 15, min: 1,
      dica: "a cada 20 m em faixas alternadas (40 m na mesma faixa); mínimo de 15 determinações",
      linhas: [L_EST, { k: "faixa", r: "Faixa / bordo (LE / LD)", texto: true }, { k: "d0", r: "D₀", u: "0,01 mm" }] });
    var geo = [L_EST, { k: "larg", r: "Largura da plataforma", u: "m" }, { k: "esp", r: "Espessura da camada", u: "cm" }];
    if (P.secao === "abaul") geo.push({ k: "flecha", r: "Flecha de abaulamento", u: "cm" });
    else geo.push({ k: "dle", r: "Declividade transversal — lado esquerdo", u: "%" }, { k: "dld", r: "Declividade transversal — lado direito", u: "%" });
    t.push({ chave: "geo", titulo: "Controle geométrico — relocação e nivelamento do eixo e bordas (7.3)", rotulo: "Seção", iniciais: 1, min: 1,
      dica: "largura até +10 cm (sem falta); espessura ± 10 %; flecha até +20 % ou declividade até +0,5 % (sem falta)", linhas: geo });
    return t;
  }

  // ---------- cálculo ----------
  function cheia(c, chaves) { return chaves.some(function (k) { return String(c[k] === undefined ? "" : c[k]).trim() !== ""; }); }

  function calcular(d) {
    var P = P_(d), av = [];
    var ini = estacaM(P.estIni), fim = estacaM(P.estFim);
    var L = ok(num(P.ext)) ? num(P.ext) : ok(ini) && ok(fim) && fim > ini ? fim - ini : NaN;
    var larg = num(P.largura), espP = num(P.espessura), emp = P.dimens !== "mec";
    var area = ok(L) && ok(larg) ? L * larg : NaN;
    if (!ok(L)) av.push("Informe as estacas inicial e final (ou a extensão) do lote: as frequências dependem da extensão.");
    if (ok(ini) && ok(fim) && fim <= ini) av.push("A estaca final deve ser maior que a inicial.");
    if (ok(espP) && (espP < 10 || espP > 20)) av.push("Espessura de projeto de " + fmt(espP, 1) + " cm: a camada compactada deve ter entre 10 e 20 cm; acima de 20 cm, subdividir em camadas de no mínimo 10 cm (5.3.6).");
    if (!ok(larg)) av.push("Informe a largura de projeto (controle geométrico, 7.3 a).");
    if (!ok(espP)) av.push("Informe a espessura de projeto (controle geométrico, 7.3 c).");

    function dentroLote(est, rot) {
      var m = estacaM(est);
      if (ok(m) && ok(ini) && ok(fim) && (m < ini - 1e-6 || m > fim + 1e-6)) av.push(rot + ": estaca " + est + " fora do lote (" + txtEstaca(ini) + " a " + txtEstaca(fim) + ").");
    }
    function pontoDe(c, v, rot) { return { v: v, est: c.est || "", x: estacaM(c.est), rot: rot }; }

    // compactação / ISC / expansão
    var comp = (d.comp || []).filter(function (c) { return cheia(c, ["gs", "hot", "isc", "exp"]); });
    comp.forEach(function (c, i) { dentroLote(c.est, "Compactação, amostra " + (i + 1)); });
    var hRef = ok(num(P.hOt)) ? num(P.hOt) : media(comp.map(function (c) { return num(c.hot); }));

    // umidade
    var tabUmid = (d.umid || []).map(function (c, i) {
      var w = num(c.w), h = ok(num(c.hot)) ? num(c.hot) : hRef;
      if (ok(w)) dentroLote(c.est, "Umidade, determinação " + (i + 1));
      return { dw: ok(w) && ok(h) ? w - h : NaN };
    });
    var umidN = (d.umid || []).filter(function (c) { return ok(num(c.w)); }).length;
    if (umidN && !ok(hRef) && (d.umid || []).some(function (c) { return ok(num(c.w)) && !ok(num(c.hot)); }))
      av.push("Sem umidade ótima de referência: importe a compactação (DNIT 164/172) ou informe a h ót.");

    // grau de compactação
    var gcCols = (d.gc || []).filter(function (c) { return ok(num(c.gc)); });
    gcCols.forEach(function (c, i) { dentroLote(c.est, "Grau de compactação, furo " + (i + 1)); });
    var fontesNC = {};
    gcCols.forEach(function (c) { if (GC_NAO_CITADAS.indexOf(c.fonte) !== -1) fontesNC[COD[c.fonte]] = 1; });
    if (Object.keys(fontesNC).length) av.push("Grau de compactação por " + Object.keys(fontesNC).join(" e ") +
      ": método não citado pela ES (7.2.1 b cita DNER-ME 092 — hoje DNIT 458 —, DNER-ME 036 e DNIT 417); aceitar só com anuência da Fiscalização.");
    if (gcCols.some(function (c) { return c.fonte === "dnit-417-2019-me"; })) av.push("Densímetro eletromagnético: confirme a calibração conforme a DNIT 417 para este material (NOTA 5).");

    // granulometria
    var proj = (d.proj || [])[0] || {};
    var fx = faixasRef().filter(function (f) { return f.id === P.faixa; })[0] || null;
    var tabGran = (d.gran || []).map(function (c) {
      var p200 = num(c[kPen(0.074)]), p40 = num(c[kPen(0.42)]);
      return { rel: ok(p200) && ok(p40) && p40 > 0 ? p200 / p40 : NaN };
    });
    var granCols = (d.gran || []).filter(function (c) { return PEN.some(function (p) { return ok(num(c[kPen(p[0])])); }); });
    granCols.forEach(function (c, i) { dentroLote(c.est, "Granulometria, amostra " + (i + 1)); });
    var temProj = PEN.some(function (p) { return ok(num(proj[kPen(p[0])])); });

    // ----- frequência (7.2.1, NOTA 4, 7.2.2, 7.3; materiais: plano de amostragem 7.4) -----
    var jorn = ok(num(P.jornadas)) && num(P.jornadas) > 0 ? Math.round(num(P.jornadas)) : 1;
    var intComp = P.freq === "400" ? 400 : 200;
    var nComp = ok(L) ? Math.max(Math.ceil(L / intComp - 1e-9), jorn) : NaN;
    var espGC = num(P.espGC), espGeo = ok(num(P.espGeo)) && num(P.espGeo) > 0 ? num(P.espGeo) : 20;
    var deflExig = P.defl !== "dispensada", iscExig = emp && P.iscProj !== "nao";
    var laExig = P.agreg !== "nao";
    function conta(arr, k) { return (arr || []).filter(function (c) { return ok(num(c[k])); }).length; }
    function contaNP(arr, k) { return (arr || []).filter(function (c) { var x = numOuNP(c[k]); return x.np || ok(x.v); }).length; }
    var freq = [
      { ens: "Teor de umidade antes da compactação", norma: "DNER-ME 052 / 088 → DNIT 456", regra: "1 a cada 100 m (7.2.1 a)",
        exig: ok(L) ? Math.max(1, Math.ceil(L / 100 - 1e-9)) : NaN, real: umidN },
      { ens: "Compactação (γs,máx e h ót)", norma: "DNIT 164", regra: "1 a cada " + intComp + " m ou por jornada (NOTA 4)", exig: nComp, real: conta(d.comp, "gs") },
      { ens: "Expansão", norma: "DNIT 172", regra: "1 a cada " + intComp + " m ou por jornada (NOTA 4)", exig: nComp, real: conta(d.comp, "exp") },
      { ens: "Índice de Suporte Califórnia", norma: "DNIT 172", regra: iscExig ? "1 a cada " + intComp + " m ou por jornada (NOTA 4)" : "não especificado em projeto",
        exig: iscExig ? nComp : 0, real: conta(d.comp, "isc"), naoExig: !iscExig },
      { ens: "Grau de compactação", norma: "DNIT 458 / DNER-ME 036 / DNIT 417", regra: ok(espGC) && espGC > 0 ? "1 a cada " + fmt(espGC, 0) + " m (plano, 7.4); mín. 5" : "plano de amostragem (7.4): mín. 5 (Tabela B1)",
        exig: ok(espGC) && espGC > 0 && ok(L) ? Math.max(5, Math.ceil(L / espGC - 1e-9)) : 5, real: gcCols.length },
      { ens: "Granulometria", norma: "DNIT 412", regra: emp || temProj ? "caracterização (5.1) — mín. 1 por lote (adotado)" : "sem curva de projeto (mecanicista)",
        exig: emp || temProj ? 1 : 0, real: granCols.length, naoExig: !(emp || temProj) },
      { ens: "Limite de liquidez e índice de plasticidade", norma: "DNER-ME 122 / 082", regra: emp ? "caracterização (5.1) — mín. 1 por lote (adotado)" : "projeto mecanicista",
        exig: emp ? 1 : 0, real: Math.min(contaNP(d.lim, "ll"), contaNP(d.lim, "ip")), naoExig: !emp },
    ];
    if (laExig) freq.push({ ens: "Abrasão Los Angeles", norma: "DNIT 451", regra: "caracterização (5.1) — mín. 1 por lote (adotado)", exig: 1, real: conta(d.la, "la") });
    if (!emp) freq.push({ ens: "Módulo de resiliência", norma: "DNIT 134", regra: "1 a cada 1500 m (7.2.1 a)",
      exig: ok(L) ? Math.max(1, Math.ceil(L / 1500 - 1e-9)) : 1, real: conta(d.mr, "mr") });
    if (deflExig) freq.push({ ens: "Deflexão D₀", norma: "DNER-ME 024 / DNER-PRO 273", regra: "a cada 20 m em faixas alternadas; mín. 15 (7.2.2)",
      exig: ok(L) ? Math.max(15, Math.floor(L / 20 + 1e-9) + 1) : 15, real: conta(d.defl, "d0") });
    freq.push({ ens: "Controle geométrico (seções)", norma: "—", regra: "eixo e bordas (7.3); 1 seção a cada " + fmt(espGeo, 0) + " m (adotado)",
      exig: ok(L) ? Math.floor(L / espGeo + 1e-9) + 1 : NaN, real: (d.geo || []).filter(function (c) { return cheia(c, ["larg", "esp", "dle", "dld", "flecha"]); }).length });
    freq.forEach(function (f) {
      f.sit = f.naoExig ? "NE" : !ok(f.exig) ? "SD" : f.real >= f.exig ? "ATENDE" : "FALTA";
      if (f.sit === "FALTA") av.push("Frequência: " + f.ens + " — " + f.real + " de " + f.exig + " exigida(s) (" + f.regra + ").");
    });

    // ----- critérios -----
    var crit = [];
    // umidade: h ót ± 1 (5.3.4)
    crit.push(avaliar({ id: "umid", nome: "Umidade antes da compactação: Δw = w − h ót", secao: "5.3.4 / 7.2.1 a", unid: "p.p.", casas: 1, exigTxt: "h ót ± 1,0 (Δw de −1,0 a +1,0)",
      min: -1, max: 1, pontos: (d.umid || []).map(function (c, i) { return pontoDe(c, tabUmid[i].dw, "det. " + (i + 1)); }), grafico: true }));
    // expansão ≤ 0,5 (5.1 / 7.2.1 a)
    crit.push(avaliar({ id: "exp", nome: "Expansão", secao: "5.1 / 7.2.1 a", unid: "%", casas: 2, max: 0.5,
      pontos: (d.comp || []).map(function (c, i) { return pontoDe(c, num(c.exp), "amostra " + (i + 1)); }) }));
    // ISC (projeto empírico; na execução, se especificado em projeto)
    var iscMin = P.nN === "le5" ? 60 : 80;
    crit.push(avaliar({ id: "isc", nome: "Índice de Suporte Califórnia (N " + (P.nN === "le5" ? "≤" : ">") + " 5 × 10⁶)", secao: "5.1 / 7.2.1 a", unid: "%", casas: 0,
      min: iscMin, exigido: iscExig, naoExigidoPor: emp ? "ISC não especificado em projeto para o controle da execução" : "projeto mecanicista (5.1)",
      pontos: (d.comp || []).map(function (c, i) { return pontoDe(c, num(c.isc), "amostra " + (i + 1)); }) }));
    // grau de compactação ≥ 100 (7.2.1 b)
    var gcMin = ok(num(P.gcMin)) ? num(P.gcMin) : 100;
    if (gcMin < 100) av.push("GC mínimo informado (" + fmt(gcMin, 1) + " %) menor que o da ES (≥ 100 %, 7.2.1 b).");
    crit.push(avaliar({ id: "gc", nome: "Grau de compactação", secao: "7.2.1 b", unid: "%", casas: 1, min: gcMin, grafico: true,
      pontos: (d.gc || []).map(function (c, i) { return pontoDe(c, num(c.gc), "furo " + (i + 1)); }) }));

    // granulometria: relação nº 200 / nº 40 ≤ 2/3 (5.1)
    crit.push(avaliar({ id: "rel", nome: "Passante nº 200 / passante nº 40", secao: "5.1", unid: "", casas: 2, max: 2 / 3,
      exigido: emp, naoExigidoPor: "projeto mecanicista (5.1: requisito do dimensionamento empírico)",
      pontos: (d.gran || []).map(function (c, i) { return pontoDe(c, tabGran[i].rel, "amostra " + (i + 1)); }) }));
    // faixa de trabalho (curva de projeto ± tolerância da Tabela A1)
    var granPen = PEN.map(function (p) {
      var k = kPen(p[0]), pj = num(proj[k]);
      var pts = (d.gran || []).map(function (c, i) { return pontoDe(c, num(c[k]), "amostra " + (i + 1)); });
      var lim = fx ? fx.peneiras.filter(function (x) { return perto(x.mm, p[0]); })[0] : null;
      var o = { mm: p[0], nome: p[1], tol: p[2], proj: pj, ref: lim ? { min: lim.min, max: lim.max } : null };
      o.av = avaliar({ id: "pen" + k, nome: "Peneira " + p[1], secao: "Anexo A", unid: "%", casas: 1, pontos: pts, exigido: ok(pj),
        min: ok(pj) ? Math.max(0, pj - p[2]) : NaN, max: ok(pj) ? Math.min(100, pj + p[2]) : NaN, naoExigidoPor: "sem curva de projeto" });
      var vals = pts.map(function (x) { return x.v; }).filter(ok);
      o.media = media(vals);
      o.refDentro = o.ref && ok(o.media) ? o.media >= o.ref.min - 1e-9 && o.media <= o.ref.max + 1e-9 : null;
      return o;
    });
    var gFaixa = { id: "faixa", nome: "Granulometria na faixa de trabalho (projeto ± tolerância)", secao: "Anexo A / projeto", unid: "", casas: 1,
      exigTxt: "projeto ± 7 / 5 / 2 %", n: granCols.length, pontos: [] };
    if (!temProj) { gFaixa.sit = "NE"; gFaixa.motivo = "sem curva granulométrica de projeto (as faixas A–F são só de referência, NOTA 2)"; }
    else if (!granCols.length) { gFaixa.sit = "SD"; gFaixa.motivo = "sem determinações"; }
    else {
      var nc = granPen.filter(function (g) { return g.av.sit === "NC"; }), cr = granPen.filter(function (g) { return g.av.sit === "CR"; });
      gFaixa.sit = nc.length ? "NC" : cr.length ? "CR" : "C";
      gFaixa.motivo = nc.length ? "fora da faixa de trabalho: " + nc.map(function (g) { return g.nome + " — " + g.av.motivo; }).join(" | ")
        : cr.length ? "ressalva: " + cr.map(function (g) { return g.nome + " — " + g.av.motivo; }).join(" | ")
        : (granCols.length >= 5 ? "todas as peneiras atendem X̄ ± k·s (7.5)" : "todas as peneiras atendem (valores individuais, n < 5)");
    }
    crit.push(gFaixa);
    if (fx) {
      var foraRef = granPen.filter(function (g) { return g.refDentro === false; });
      if (foraRef.length) av.push("Granulometria média fora da faixa " + fx.faixa + " de referência em " + foraRef.map(function (g) {
        return g.nome + " (" + fmt(g.media, 1) + " %; " + g.ref.min + "–" + g.ref.max + ")"; }).join(", ") + " — apenas informativo (Anexo A, NOTA 2).");
      if (fx.condicao && ((/</.test(fx.condicao) && P.nN !== "le5") || (/>/.test(fx.condicao) && P.nN === "le5")) && emp)
        av.push("A faixa " + fx.faixa + " da Tabela A1 é indicada para " + fx.condicao + ", diferente do N informado.");
    }

    // LL, IP, EA (projeto empírico)
    var limCols = d.lim || [];
    var llPts = [], ipPts = [], llNP = 0;
    limCols.forEach(function (c, i) {
      var ll = numOuNP(c.ll), ip = numOuNP(c.ip);
      if (ll.np) llNP++;
      if (ok(ll.v)) llPts.push(pontoDe(c, ll.v, "amostra " + (i + 1)));
      if (ip.np || ok(ip.v)) ipPts.push(pontoDe(c, ip.np ? 0 : ip.v, "amostra " + (i + 1)));
    });
    var cLL = avaliar({ id: "ll", nome: "Limite de liquidez", secao: "5.1", unid: "%", casas: 0, max: 25, pontos: llPts,
      exigido: emp, naoExigidoPor: "projeto mecanicista (5.1)" });
    if (emp && !llPts.length && llNP) { cLL.sit = "C"; cLL.n = llNP; cLL.motivo = "LL não determinado (NP) em todas as amostras"; }
    else if (llNP && cLL.sit !== "NE") cLL.motivo += " (+" + llNP + " amostra(s) NP, conformes)";
    var cIP = avaliar({ id: "ip", nome: "Índice de plasticidade", secao: "5.1", unid: "%", casas: 0, max: 6, pontos: ipPts,
      exigido: emp, naoExigidoPor: "projeto mecanicista (5.1)" });
    var plastFora = cLL.sit === "NC" || cIP.sit === "NC";
    var cEA = avaliar({ id: "ea", nome: "Equivalente de areia (se LL ou IP ultrapassados)", secao: "5.1", unid: "%", casas: 0, min: 30, minEstrito: true,
      pontos: limCols.map(function (c, i) { return pontoDe(c, num(c.ea), "amostra " + (i + 1)); }),
      exigido: emp && plastFora, naoExigidoPor: emp ? "LL e IP atendem" : "projeto mecanicista (5.1)" });
    if (plastFora && (cEA.sit === "C" || cEA.sit === "CR")) {
      [cLL, cIP].forEach(function (c) {
        if (c.sit === "NC") { c.sit = "C"; c.motivo = "acima do limite, admitido porque EA > 30 % (5.1): " + c.motivo; }
      });
    }
    crit.push(cLL, cIP, cEA);

    // Los Angeles
    var laMax = ok(num(P.laMax)) ? num(P.laMax) : 55;
    if (laMax > 55) av.push("Desgaste máximo informado (" + fmt(laMax, 0) + " %) maior que o da ES (55 %, 5.1).");
    var cLA = avaliar({ id: "la", nome: "Desgaste Los Angeles (agregado retido na nº 10)", secao: "5.1", unid: "%", casas: 0, max: laMax,
      pontos: (d.la || []).map(function (c, i) { return { v: num(c.la), est: "", rot: "amostra " + (i + 1) }; }),
      exigido: laExig, naoExigidoPor: "sem agregado retido na nº 10" });
    if (cLA.sit === "NC" && P.laDesemp === "sim") {
      cLA.sit = "CR";
      cLA.motivo = "desgaste acima de " + fmt(laMax, 0) + " % (" + cLA.fora.map(function (p) { return fmt(p.v, 0) + " %"; }).join("; ") +
        "), admitido por desempenho anterior satisfatório do material (5.1) — anexar a comprovação";
    }
    crit.push(cLA);

    // módulo de resiliência (mecanicista)
    var mrProj = num(P.mrProj);
    if (!emp) {
      var mrPts = (d.mr || []).map(function (c, i) { return pontoDe(c, num(c.mr), "ensaio " + (i + 1)); }).filter(function (p) { return ok(p.v); });
      var cMR = { id: "mr", nome: "Módulo de resiliência", secao: "7.1 / 7.2.1 a", unid: "MPa", casas: 0, n: mrPts.length, pontos: mrPts,
        xm: media(mrPts.map(function (p) { return p.v; })), exigTxt: ok(mrProj) ? "≈ " + fmt(mrProj, 0) + " MPa (projeto)" : "conforme projeto" };
      if (!mrPts.length) { cMR.sit = "SD"; cMR.motivo = "sem determinações"; }
      else if (!ok(mrProj)) { cMR.sit = "CR"; cMR.motivo = "informe o MR de projeto para comparar"; }
      else {
        var dv = (cMR.xm - mrProj) / mrProj * 100;
        cMR.sit = dv < 0 ? "CR" : "C";
        cMR.motivo = "média " + fmt(cMR.xm, 0) + " MPa, " + (dv >= 0 ? "+" : "−") + fmt(Math.abs(dv), 1) + " % em relação ao projeto" +
          (dv < 0 ? " — a ES não fixa tolerância numérica: submeter à Supervisora/Projetista (7.1, NOTA 3)" : "");
      }
      crit.push(cMR);
    }

    // deflexão (7.2.2, eq. 1)
    var lse = num(P.lse), cDef = null;
    if (deflExig) {
      var dPts = (d.defl || []).map(function (c, i) { return pontoDe(c, num(c.d0), "det. " + (i + 1)); }).filter(function (p) { return ok(p.v); });
      (d.defl || []).forEach(function (c, i) { if (ok(num(c.d0))) dentroLote(c.est, "Deflexão, determinação " + (i + 1)); });
      var Ed = estat(dPts.map(function (p) { return p.v; })), Kd = coefK(Ed.n);
      cDef = { id: "defl", nome: "Deflexão característica Dc = D₀médio + k·S", secao: "7.2.2 (eq. 1)", unid: "0,01 mm", casas: 0, n: Ed.n,
        xm: Ed.xm, s: Ed.s, pontos: dPts, max: lse, exigTxt: ok(lse) ? "Dc ≤ " + fmt(lse, 0) + " (LSE); n ≥ 15" : "Dc ≤ LSE; n ≥ 15", grafico: true };
      if (Kd) { cDef.k = Kd.k; cDef.kExato = Kd.exato; cDef.nTab = Kd.nTab; cDef.sup = Ed.xm + Kd.k * (ok(Ed.s) ? Ed.s : 0); }
      if (!Ed.n) { cDef.sit = "SD"; cDef.motivo = "sem determinações"; }
      else if (!ok(lse)) { cDef.sit = "SD"; cDef.motivo = "informe a deflexão de projeto (LSE)"; }
      else if (Ed.n < 15) {
        cDef.sit = "SD"; cDef.motivo = "apenas " + Ed.n + " determinações: a ES exige no mínimo 15 por subtrecho (7.2.2)" +
          (ok(cDef.sup) ? "; com as disponíveis, Dc = " + fmt(cDef.sup, 1) + (cDef.sup <= lse ? " ≤ " : " > ") + fmt(lse, 0) : "");
      } else if (cDef.sup > lse + 1e-9) { cDef.sit = "NC"; cDef.motivo = "Dc = " + fmt(cDef.sup, 1) + " > LSE = " + fmt(lse, 0) + " (0,01 mm)"; }
      else { cDef.sit = "C"; cDef.motivo = "Dc = " + fmt(cDef.sup, 1) + " ≤ LSE = " + fmt(lse, 0) + " (0,01 mm)"; }
      if (cDef.n && cDef.k && !cDef.kExato) cDef.motivo += cDef.n > 21 ? " — n > 21: k = 1,01 (último da Tabela B1)" : " — n = " + cDef.n + " não tabelado: k de n = " + cDef.nTab;
      crit.push(cDef);
    } else {
      crit.push({ id: "defl", nome: "Deflexão característica", secao: "7.2.2", sit: "NE", n: 0, exigTxt: "—", motivo: "dispensada pela Fiscalização (NOTA 6) — registrar a justificativa" });
    }

    // geometria (7.3)
    var geo = d.geo || [];
    geo.forEach(function (c, i) { if (cheia(c, ["larg", "esp", "dle", "dld", "flecha"])) dentroLote(c.est, "Controle geométrico, seção " + (i + 1)); });
    function gp(k) { return geo.map(function (c, i) { return pontoDe(c, num(c[k]), "seção " + (i + 1)); }); }
    crit.push(avaliar({ id: "larg", nome: "Largura da plataforma", secao: "7.3 a", unid: "m", casas: 2, min: larg, max: ok(larg) ? larg + 0.10 : NaN,
      obrigMin: true, pontos: gp("larg"), exigido: ok(larg), naoExigidoPor: "informe a largura de projeto" }));
    crit.push(avaliar({ id: "esp", nome: "Espessura da camada", secao: "7.3 c", unid: "cm", casas: 1, grafico: true,
      min: ok(espP) ? espP * 0.9 : NaN, max: ok(espP) ? espP * 1.1 : NaN, pontos: gp("esp"), exigido: ok(espP), naoExigidoPor: "informe a espessura de projeto" }));
    if (P.secao === "abaul") {
      var fl = num(P.flechaProj);
      crit.push(avaliar({ id: "flecha", nome: "Flecha de abaulamento", secao: "7.3 b", unid: "cm", casas: 1, min: fl, max: ok(fl) ? fl * 1.2 : NaN,
        obrigMin: true, pontos: gp("flecha"), exigido: ok(fl), naoExigidoPor: "informe a flecha de projeto" }));
    } else {
      var dp = ok(num(P.declProj)) ? num(P.declProj) : NaN;
      var dPts2 = geo.map(function (c, i) { return pontoDe(c, num(c.dle), "seção " + (i + 1) + " LE"); })
        .concat(geo.map(function (c, i) { return pontoDe(c, num(c.dld), "seção " + (i + 1) + " LD"); }));
      crit.push(avaliar({ id: "decl", nome: "Declividade transversal (caimento simples)", secao: "7.3 b", unid: "%", casas: 1, min: dp, max: ok(dp) ? dp + 0.5 : NaN,
        obrigMin: true, pontos: dPts2, exigido: ok(dp), naoExigidoPor: "informe a declividade de projeto" }));
    }

    // ----- medição (seção 8) -----
    var largM = media(geo.map(function (c) { return num(c.larg); })), espM = media(geo.map(function (c) { return num(c.esp); }));
    var vExec = ok(L) && ok(largM) && ok(espM) ? L * largM * espM / 100 : NaN;
    var vProj = ok(L) && ok(larg) && ok(espP) ? L * larg * espP / 100 : NaN;
    var vMed = ok(vExec) && ok(vProj) ? Math.min(vExec, vProj) : vExec;

    // ----- parecer -----
    var nc = crit.filter(function (c) { return c.sit === "NC"; });
    var sd = crit.filter(function (c) { return c.sit === "SD"; });
    var falta = freq.filter(function (f) { return f.sit === "FALTA" || f.sit === "SD"; });
    var cr = crit.filter(function (c) { return c.sit === "CR"; });
    var parecer = nc.length ? "REJEITADO" : (sd.length || falta.length) ? "PENDENTE" : cr.length ? "RESSALVA" : "ACEITO";
    var obs = crit.filter(function (c) { return (c.sit === "C" || c.sit === "CR") && /n < 5/.test(c.motivo || ""); }).map(function (c) { return c.nome; });
    if (P.defl === "dispensada") av.push("Controle de deflexão dispensado (NOTA 6): anexe a justificativa; a base só pode ser liberada ao tráfego após liberação pelo controle de deflexão (5.3.8).");

    return {
      tab: { umid: tabUmid, gran: tabGran },
      resultados: { L: L, area: area, ini: ini, fim: fim, larg: larg, espP: espP, emp: emp, hRef: hRef, freq: freq, crit: crit,
        granPen: granPen, faixaRef: fx, temProj: temProj, largM: largM, espM: espM, vExec: vExec, vProj: vProj, vMed: vMed,
        parecer: parecer, nc: nc, sd: sd, falta: falta, cr: cr, obsN5: obs, defl: cDef, conforme: parecer === "ACEITO" || parecer === "RESSALVA" },
      avisos: av,
    };
  }

  // ---------- apresentação ----------
  var PARECER = {
    ACEITO: ["LOTE ACEITO", "fe-ok", "Todos os critérios da DNIT 141/2022-ES atendidos, com a frequência exigida."],
    RESSALVA: ["LOTE ACEITO COM RESSALVAS", "", "Os critérios de aceitação (7.5) são atendidos, mas há pontos a corrigir ou a documentar: \"todo detalhe incorreto ou mal executado deve ser corrigido\" (7.5)."],
    PENDENTE: ["LOTE PENDENTE — CONTROLE INCOMPLETO", "", "Nenhum critério reprovado, mas faltam ensaios ou determinações exigidos: complete o controle antes de aceitar o lote (7.4 e 7.5)."],
    REJEITADO: ["LOTE REJEITADO", "fe-nok", "Há critério não conforme (7.5 b). \"Qualquer serviço corrigido só deve ser aceito se as correções executadas o colocarem em conformidade\" (7.5)."],
  };
  function listaMotivos(r) {
    var m = [];
    r.nc.forEach(function (c) { m.push(["Não conforme", c.nome + " (" + c.secao + "): " + c.motivo]); });
    r.sd.forEach(function (c) { m.push(["Pendente", c.nome + " (" + c.secao + "): " + c.motivo]); });
    r.falta.forEach(function (f) { m.push(["Pendente", "frequência de " + f.ens.toLowerCase() + ": " + f.real + " de " + (ok(f.exig) ? f.exig : "?") + " (" + f.regra + ")"]); });
    r.cr.forEach(function (c) { m.push(["Ressalva", c.nome + " (" + c.secao + "): " + c.motivo]); });
    return m;
  }
  function parecerHtml(r, relat) {
    var p = PARECER[r.parecer], mot = listaMotivos(r);
    var n5 = r.obsN5.length ? "Avaliados por valor individual (n < 5 — a Tabela B1 começa em n = 5): " + r.obsN5.join("; ") + "." : "";
    var cor = r.parecer === "ACEITO" ? "#1e7d4f" : r.parecer === "REJEITADO" ? "#c0392b" : "#c77d12";
    if (relat) {
      return '<div style="border:2px solid ' + cor + ';padding:6px 9px;margin:6px 0"><div style="font-size:14px;font-weight:bold;color:' + cor + '">PARECER: ' + p[0] +
        '</div><div style="margin-top:2px">' + esc(p[2]) + "</div>" +
        (mot.length ? '<ol style="margin:5px 0 0 18px;padding:0">' + mot.map(function (x) { return "<li><b>" + esc(x[0]) + ":</b> " + esc(x[1]) + "</li>"; }).join("") + "</ol>" : "") +
        (n5 ? '<div style="margin-top:4px;color:#555">' + esc(n5) + "</div>" : "") + "</div>";
    }
    return '<div style="border:2px solid ' + cor + ';border-radius:8px;padding:10px 14px;margin:4px 0 12px">' +
      '<div style="font-size:1.25em;font-weight:700;color:' + cor + '">' + p[0] + "</div>" +
      '<div style="margin-top:3px;opacity:.9">' + esc(p[2]) + "</div>" +
      (mot.length ? '<ol style="margin:8px 0 0 20px;padding:0">' + mot.map(function (x) {
        var c = x[0] === "Não conforme" ? "fe-nok" : x[0] === "Pendente" ? "" : "";
        return '<li style="margin:2px 0"><b' + (c ? ' class="' + c + '"' : ' style="' + AMBAR + '"') + ">" + esc(x[0]) + ":</b> " + esc(x[1]) + "</li>";
      }).join("") + "</ol>" : "") + (n5 ? '<div style="margin-top:6px;font-size:.9em;opacity:.8">' + esc(n5) + "</div>" : "") + "</div>";
  }
  function vTxt(c, v, extra) { return ok(v) ? fmt(v, (c.casas || 0) + (extra || 0)) : "—"; }
  function tabCriterios(r, relat) {
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Critério</th><th style="text-align:left">Seção</th><th>n</th><th>X̄</th><th>s</th><th>k</th><th>X̄ ∓ k·s</th>' +
      "<th>Exigido</th><th style=\"text-align:left\">Situação</th></tr></thead><tbody>" + r.crit.map(function (c) {
        var est = c.id === "defl" ? (ok(c.sup) ? "Dc = " + fmt(c.sup, 1) : "—")
          : ok(c.inf) || ok(c.sup) ? [ok(c.min) ? fmt(c.inf, (c.casas || 0) + 1) : "", ok(c.max) ? fmt(c.sup, (c.casas || 0) + 1) : ""].filter(Boolean).join(" / ") : "—";
        return '<tr><td style="text-align:left">' + esc(c.nome) + '</td><td style="text-align:left">' + esc(c.secao) + "</td><td>" + (c.n || 0) + "</td><td>" + (c.id === "faixa" ? "—" : vTxt(c, c.xm, 1)) +
          "</td><td>" + (c.id === "faixa" ? "—" : vTxt(c, c.s, 1)) + "</td><td>" + (ok(c.k) ? fmt(c.k, 2) : "—") + "</td><td>" + esc(est) + "</td><td>" + esc(c.exigTxt || "—") +
          "</td><td style=\"text-align:left\">" + sitHtml(c.sit, relat) + (c.motivo ? '<br><small style="font-size:.9em">' + esc(c.motivo) + "</small>" : "") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function tabFrequencia(r, relat) {
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Ensaio / determinação</th><th style="text-align:left">Método</th><th style="text-align:left">Frequência (ES)</th><th>Exigido</th><th>Realizado</th><th>Situação</th></tr></thead><tbody>' +
      r.freq.map(function (f) {
        var L = '<td style="text-align:left">';
        return "<tr>" + L + esc(f.ens) + "</td>" + L + esc(f.norma) + "</td>" + L + esc(f.regra) + "</td><td>" + (f.naoExig ? "—" : ok(f.exig) ? f.exig : "?") +
          "</td><td>" + f.real + "</td><td>" + sitHtml(f.sit, relat) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function tabGranulometria(r, relat) {
    if (!r.granPen.some(function (g) { return g.av.n || ok(g.proj); })) return "";
    var cls = relat ? "gr" : "fe-resumo", fx = r.faixaRef;
    return '<table class="' + cls + '"><thead><tr><th>Peneira</th><th>Projeto</th><th>Faixa de trabalho</th>' + (fx ? "<th>Faixa " + esc(fx.faixa) + " (ref.)</th>" : "") +
      "<th>n</th><th>X̄</th><th>X̄ − k·s / X̄ + k·s</th><th>Situação</th></tr></thead><tbody>" + r.granPen.map(function (g) {
        var a = g.av;
        return "<tr><td>" + esc(g.nome) + " (" + fmt(g.mm, g.mm < 1 ? 3 : 1).replace(/,?0+$/, "") + " mm)</td><td>" + (ok(g.proj) ? fmt(g.proj, 0) : "—") + "</td><td>" +
          (ok(a.min) ? fmt(a.min, 0) + "–" + fmt(a.max, 0) : "—") + "</td>" +
          (fx ? "<td>" + (g.ref ? g.ref.min + "–" + g.ref.max + (g.refDentro === false ? (relat ? " (fora)" : ' <span class="fe-nok">fora</span>') : "") : "—") + "</td>" : "") +
          "<td>" + (a.n || 0) + "</td><td>" + (ok(g.media) ? fmt(g.media, 1) : "—") + "</td><td>" + (ok(a.inf) ? fmt(a.inf, 1) + " / " + fmt(a.sup, 1) : "—") + "</td><td>" +
          sitHtml(a.sit, relat) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function cartao(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }

  function resultadosHtml(calc, d) {
    var r = calc.resultados;
    return parecerHtml(r, false) +
      '<div class="fe-res">' +
      cartao(ok(r.L) ? fmt(r.L, 0) + " m" : "—", "Extensão do lote" + (ok(r.ini) && ok(r.fim) ? " (est. " + txtEstaca(r.ini) + " a " + txtEstaca(r.fim) + ")" : "")) +
      cartao(ok(r.area) ? fmt(r.area, 0) + " m²" : "—", "Área (extensão × largura de projeto)") +
      cartao(ok(r.hRef) ? fmt(r.hRef, 1) + " %" : "—", "Umidade ótima de referência") +
      cartao(ok(r.vMed) ? fmt(r.vMed, 1) + " m³" : "—", "Volume para medição (8 b, c)" + (ok(r.vExec) && ok(r.vProj) && r.vExec > r.vProj ? " — limitado ao projeto" : "")) +
      "</div>" +
      '<h4 style="margin:12px 0 4px">Critérios de aceitação</h4>' + tabCriterios(r, false) +
      '<h4 style="margin:12px 0 4px">Frequência dos ensaios</h4>' + tabFrequencia(r, false) +
      (tabGranulometria(r, false) ? '<h4 style="margin:12px 0 4px">Granulometria por peneira</h4>' + tabGranulometria(r, false) : "");
  }

  // ---------- gráficos: valores ao longo das estacas ----------
  function grafEstacas(cfg, opt) {
    opt = opt || {};
    var pts = cfg.pontos.filter(function (p) { return ok(p.v); });
    if (!pts.length) return "";
    var usaEst = pts.every(function (p) { return ok(p.x); });
    pts.forEach(function (p, i) { p.xx = usaEst ? p.x : i + 1; });
    var W = opt.w || 600, H = opt.h || 250, m = { l: 52, r: 16, t: 26, b: 40 };
    var xs = pts.map(function (p) { return p.xx; });
    if (usaEst && ok(cfg.ini) && ok(cfg.fim)) xs.push(cfg.ini, cfg.fim);
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    if (x1 === x0) { x0 -= 20; x1 += 20; }
    var ys = pts.map(function (p) { return p.v; }).concat((cfg.linhas || []).map(function (l) { return l.y; }).filter(ok));
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = (y1 - y0) * 0.15 || Math.abs(y1) * 0.05 || 1;
    y0 -= pad; y1 += pad;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cor = imp ? "#1f5fbf" : "#4f8cff", verm = "#e5534b";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    s += '<text x="' + m.l + '" y="14" fill="' + txt + '" font-weight="bold">' + esc(cfg.titulo) + "</text>";
    // grade
    var passoY = (function () { var r = (y1 - y0) / 5, p = Math.pow(10, Math.floor(Math.log10(r))); return r / p > 5 ? 10 * p : r / p > 2 ? 5 * p : r / p > 1 ? 2 * p : p; })();
    for (var gy = Math.ceil(y0 / passoY) * passoY; gy <= y1; gy += passoY) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy, passoY < 0.1 ? 2 : passoY < 1 ? 1 : 0) + "</text>";
    }
    // eixo x: estacas inteiras (passo 1, 2, 5, 10… estacas) ou nº da determinação
    var un = usaEst ? 20 : 1, faixaU = (x1 - x0) / un, passoX = [1, 2, 5, 10, 20, 50, 100, 200, 500].filter(function (p) { return faixaU / p <= 10; })[0] || 1000;
    for (var xv = Math.ceil(x0 / un / passoX) * passoX * un; xv <= x1 + 1e-6; xv += passoX * un) {
      s += '<line x1="' + X(xv) + '" y1="' + m.t + '" x2="' + X(xv) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.4"/>';
      s += '<text x="' + X(xv) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + (usaEst ? txtEstaca(xv) : fmt(xv, 0)) + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">' + (usaEst ? "Estaca" : "Determinação") + "</text>";
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">' + esc(cfg.yRot) + "</text>";
    // faixa admitida
    if (cfg.banda && ok(cfg.banda[0]) && ok(cfg.banda[1])) {
      s += '<rect x="' + m.l + '" y="' + Y(cfg.banda[1]) + '" width="' + (W - m.l - m.r) + '" height="' + (Y(cfg.banda[0]) - Y(cfg.banda[1])) +
        '" fill="' + (imp ? "rgba(52,160,110,.12)" : "rgba(52,195,143,.12)") + '"/>';
    }
    (cfg.linhas || []).forEach(function (l) {
      if (!ok(l.y)) return;
      s += '<line x1="' + m.l + '" y1="' + Y(l.y) + '" x2="' + (W - m.r) + '" y2="' + Y(l.y) + '" stroke="' + l.cor + '" stroke-width="1.3"' + (l.tr ? ' stroke-dasharray="5 3"' : "") + "/>";
      s += '<text x="' + (m.l + 4) + '" y="' + (Y(l.y) - 3) + '" text-anchor="start" fill="' + l.cor + '">' + esc(l.rot) + "</text>";
    });
    var ord = pts.slice().sort(function (a, b) { return a.xx - b.xx; });
    s += '<path d="' + ord.map(function (p, j) { return (j ? "L" : "M") + X(p.xx).toFixed(1) + " " + Y(p.v).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1" opacity="0.5"/>';
    ord.forEach(function (p) {
      var fora = (ok(cfg.min) && p.v < cfg.min - 1e-9) || (ok(cfg.max) && p.v > cfg.max + 1e-9);
      s += '<circle cx="' + X(p.xx).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="3.8" fill="' + (fora ? verm : cor) + '"/>';
    });
    return s + "</svg>";
  }

  function graficos(calc, d, opt) {
    var r = calc.resultados, out = [], verde = "#2e8b57", ambar = "#c77d12", verm = "#c0392b";
    function C(id) { return r.crit.filter(function (c) { return c.id === id; })[0]; }
    var gc = C("gc");
    if (gc && gc.n) out.push(grafEstacas({ titulo: "Grau de compactação (7.2.1 b)", yRot: "GC (%)", pontos: gc.pontos, ini: r.ini, fim: r.fim, min: gc.min,
      linhas: [{ y: gc.min, rot: "mínimo " + fmt(gc.min, 0) + " %", cor: verde }, { y: gc.inf, rot: "X̄ − k·s = " + fmt(gc.inf, 2), cor: gc.inf < gc.min ? verm : ambar, tr: true }] }, opt));
    var u = C("umid");
    if (u && u.n) out.push(grafEstacas({ titulo: "Umidade antes da compactação — Δw = w − h ót (5.3.4)", yRot: "Δw (p.p.)", pontos: u.pontos, ini: r.ini, fim: r.fim,
      min: -1, max: 1, banda: [-1, 1], linhas: [{ y: -1, rot: "−1", cor: verde }, { y: 1, rot: "+1", cor: verde }] }, opt));
    var e = C("esp");
    if (e && e.n && ok(r.espP)) out.push(grafEstacas({ titulo: "Espessura da camada (7.3 c)", yRot: "Espessura (cm)", pontos: e.pontos, ini: r.ini, fim: r.fim,
      min: e.min, max: e.max, banda: [e.min, e.max], linhas: [{ y: r.espP, rot: "projeto " + fmt(r.espP, 1), cor: verde, tr: true },
        { y: e.min, rot: "−10 %", cor: verde }, { y: e.max, rot: "+10 %", cor: verde }] }, opt));
    var df = r.defl;
    if (df && df.n) out.push(grafEstacas({ titulo: "Deflexão D₀ (7.2.2)", yRot: "D₀ (0,01 mm)", pontos: df.pontos, ini: r.ini, fim: r.fim, max: df.max,
      linhas: [{ y: df.max, rot: "LSE " + fmt(df.max, 0), cor: verde }, { y: df.sup, rot: "Dc = " + fmt(df.sup, 1), cor: ok(df.max) && df.sup > df.max ? verm : ambar, tr: true }] }, opt));
    // curva granulométrica com a faixa de trabalho (desenho da DNIT 412)
    var amostras = (d.gran || []).map(function (c) {
      var pen = PEN.map(function (p) { return { mm: p[0], pass: num(c[kPen(p[0])]) }; }).filter(function (x) { return ok(x.pass); });
      return pen.length >= 2 ? { pen: pen } : null;
    }).filter(Boolean);
    if (amostras.length) {
      var med = r.granPen.filter(function (g) { return ok(g.media); }).map(function (g) {
        var lim = ok(g.av.min) ? { min: g.av.min, max: g.av.max } : g.ref;
        return { mm: g.mm, pass: g.media, lim: lim, dentro: lim ? g.media >= lim.min - 1e-9 && g.media <= lim.max + 1e-9 : null };
      });
      out.push(FE.granulometria.grafico({ amostras: amostras, resultados: { media: med } }, opt));
    }
    return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com os resultados do lote.</div>'];
  }

  // ---------- relatório ----------
  var NOTAS = "Conformidade (7.5): X̄ − k·s ≥ valor mínimo e X̄ + k·s ≤ valor máximo, com X̄ = Σxᵢ/n (eq. 2) e s = √[Σ(xᵢ − X̄)²/(n − 1)] (eq. 3). " +
    "Deflexão (7.2.2): Dc = D₀médio + k·S ≤ LSE (eq. 1), mínimo de 15 determinações. " +
    "k da Tabela B1 (Anexo B, normativo): n = 5 a 17, 19 e 21 → k = 1,55; 1,41; 1,36; 1,31; 1,25; 1,21; 1,19; 1,16; 1,13; 1,11; 1,10; 1,08; 1,06; 1,04; 1,01 " +
    "(α = 0,45 a 0,01). Critérios adotados pela ficha: n < 5 (fora da Tabela B1) → avaliação por valor individual; n = 18 e 20 (não tabelados) → k do n tabelado imediatamente " +
    "inferior; n > 21 → k = 1,01. Com a estatística atendida, valores individuais fora do limite geram ressalva (corrigir o local); largura menor que a de projeto e flecha/declividade " +
    "abaixo do projeto reprovam (7.3: \"não se tolerando falta\"). EA exigido só quando LL ou IP ultrapassam os limites; IP \"NP\" = 0. Umidade: tolerância ± 1 ponto percentual " +
    "em torno da h ót; declividade: + 0,5 ponto percentual. Faixas A–F da Tabela A1 são informativas (NOTA 2); a faixa de trabalho é a curva de projeto ± 7/5/2 %. " +
    "Métodos citados e substituídos: DNER-ME 080 → DNIT 412; DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458; DNER-ME 054 → DNIT 450; DNER-ME 035 → DNIT 451.";

  FE.FICHAS[ID] = {
    titulo: "Base estabilizada granulometricamente — aceitação de lote",
    rotuloLink: "Aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência exigida (7.2) e aplica os critérios da ES: " +
      "umidade, expansão, ISC, grau de compactação, granulometria, LL/IP/EA, Los Angeles, deflexão e controle geométrico, com o controle estatístico da 7.5.",
    blocos: [],
    params: PARAMS,
    padrao: { dimens: "emp", nN: "gt5", iscProj: "sim", freq: "200", jornadas: "1", gcMin: "100", faixa: "", agreg: "sim", laMax: "55", laDesemp: "nao",
      defl: "exigido", secao: "simples", declProj: "3", espGeo: "20" },
    tabelas: tabelas,
    calcular: calcular,
    resultadosHtml: resultadosHtml,
    graficos: graficos,
    relatorio: {
      notas: NOTAS,
      parametros: [["Critério de aceitação", "DNIT 141/2022-ES, 7.5 — controle estatístico com a Tabela B1 (Anexo B)"]],
      resultados: function (calc) {
        var r = calc.resultados, p = PARECER[r.parecer];
        var rows = [["Parecer do lote", p[0]],
          ["Lote", (ok(r.ini) && ok(r.fim) ? "estaca " + txtEstaca(r.ini) + " a " + txtEstaca(r.fim) + " · " : "") + (ok(r.L) ? fmt(r.L, 0) + " m" : "—") +
            (ok(r.area) ? " · " + fmt(r.area, 0) + " m²" : "")],
          ["Dimensionamento", r.emp ? "empírico (ISC, LL, IP e EA exigidos)" : "mecanicista (MR e DP conforme projeto)"]];
        if (ok(r.largM) || ok(r.espM)) rows.push(["Largura / espessura médias (controle geométrico)", (ok(r.largM) ? fmt(r.largM, 2) + " m" : "—") + " / " + (ok(r.espM) ? fmt(r.espM, 1) + " cm" : "—")]);
        if (ok(r.vMed)) rows.push(["Volume para medição (8 b, c)", fmt(r.vMed, 1) + " m³" + (ok(r.vExec) && ok(r.vProj) && r.vExec > r.vProj ? " (executado " + fmt(r.vExec, 1) + " m³, limitado ao projeto)" : "")]);
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados, g = tabGranulometria(r, true);
        return parecerHtml(r, true) + "<h2>Critérios de aceitação</h2>" + tabCriterios(r, true) +
          "<h2>Frequência dos ensaios</h2>" + tabFrequencia(r, true) + (g ? "<h2>Granulometria por peneira</h2>" + g : "");
      },
    },
    exemplos: [],
  };

  // =====================================================================================
  // Exemplos: lotes montados com os EXEMPLOS das fichas ME (importados como faria o botão "Importar selecionados")
  // e determinações digitadas para completar a frequência.
  // =====================================================================================
  function ensaioEx(fid, i) {
    var X = FE.FICHAS[fid], exs = X.exemplos || [{ dados: X.exemplo }];
    var dados = JSON.parse(JSON.stringify(exs[i].dados()));
    dados.params = Object.assign({}, X.padrao || {}, dados.params || {});
    dados.ident = dados.ident || {};
    return { ficha: fid, dados: dados, resultados: X.calcular(dados).resultados };
  }
  function importa(d, k, refs) {
    var f = PARAMS.filter(function (x) { return x.k === k; })[0];
    d.params[k] = refs.map(function (r) { return "ex:" + r[0] + ":" + r[1]; });
    f.aplicar(refs.map(function (r) { return ensaioEx(r[0], r[1]); }), d.params, d);
  }
  function vazio(ch) { return [{}]; }
  // seções geométricas a cada 20 m: [largura, espessura, decl LE, decl LD] por estaca
  function secoes(ini, lista) {
    return lista.map(function (x, i) { return { est: String(ini + i), larg: fmt(x[0], 2), esp: fmt(x[1], 1), dle: fmt(x[2], 1), dld: fmt(x[3], 1) }; });
  }
  function deflexoes(ini, vals) {
    return vals.map(function (v, i) { return { est: String(ini + i), faixa: i % 2 ? "LD" : "LE", d0: String(v) }; });
  }

  FE.FICHAS[ID].exemplos = [
    { nome: "Lote aceito — base de solo-brita, 300 m (ensaios dos exemplos ME + campo digitado)", dados: function () {
      var d = { ident: { registro: "LOTE-B-001", data: "2026-08-14", obra: "Obra A — BR-000", trecho: "Lote 1 — pista direita", local: "Est. 40 a 55",
          origem: "Jazida 4 + Pedreira X", camada: "Base estabilizada granulometricamente (solo-brita)" },
        params: Object.assign({}, FE.FICHAS[ID].padrao, { estIni: "40", estFim: "55", largura: "8,60", espessura: "15", faixa: "dnit-141-2022-es-B",
          lse: "70", jornadas: "2" }),
        umid: vazio(), comp: vazio(), gc: vazio(), gran: vazio(), lim: vazio(), la: vazio(), obs: "" };
      // umidade: 1 importada (DNIT 456, estaca 42) + 2 digitadas
      importa(d, "impUmid", [["dnit-456-2025-me", 2]]);
      d.umid = d.umid.concat([{ est: "47", reg: "Campo — Speedy", w: "7,1" }, { est: "53", reg: "Campo — Speedy", w: "6,2" }]);
      // compactação/ISC/expansão: DNIT 172 (base granular) + 1 amostra digitada (2 exigidas: 300 m / 200 m)
      importa(d, "impComp", [["dnit-172-2016-me", 2]]);
      d.comp[0].est = "44";
      d.comp.push({ est: "51", reg: "ISC-0457 · DNIT 172 (digitado)", gs: "2,176", hot: "6,8", isc: "94", exp: "0,09" });
      // GC: 6 furos digitados (planilha de campo)
      d.gc = [["41", "LE", 101.4, 6.5], ["43", "eixo", 100.8, 6.9], ["46", "LD", 102.1, 6.3], ["49", "LE", 101.0, 6.8], ["52", "eixo", 100.6, 7.0], ["54", "LD", 101.7, 6.4]]
        .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1), w: fmt(x[3], 1) }; });
      importa(d, "impGran", [["dnit-412-2025-me", 1]]);
      d.gran[0].est = "44";
      d.proj = [{ p50_8: "100", p25_4: "88", p9_5: "62", p4_8: "47", p2: "33", p0_42: "19", p0_074: "10" }];
      importa(d, "impLim", [["dner-me-082-94", 0]]);
      importa(d, "impLA", [["dnit-451-2024-me", 2]]);
      d.defl = deflexoes(40, [48, 52, 45, 55, 50, 47, 58, 53, 49, 51, 46, 54, 57, 50, 48, 52]);
      d.geo = secoes(40, [[8.64, 15.2, 3.1, 3.0], [8.62, 14.8, 3.2, 3.1], [8.66, 15.6, 3.0, 3.3], [8.61, 14.6, 3.1, 3.2], [8.65, 15.1, 3.3, 3.0],
        [8.63, 15.4, 3.2, 3.1], [8.60, 14.9, 3.0, 3.2], [8.64, 15.3, 3.1, 3.1], [8.67, 15.0, 3.2, 3.0], [8.62, 14.7, 3.3, 3.2], [8.63, 15.5, 3.1, 3.1],
        [8.65, 15.2, 3.0, 3.3], [8.61, 14.9, 3.2, 3.2], [8.64, 15.1, 3.1, 3.0], [8.66, 15.4, 3.3, 3.1], [8.62, 15.0, 3.2, 3.2]]);
      d.obs = "Exemplo: umidade, compactação/ISC, granulometria, LL/IP e Los Angeles importados dos exemplos das fichas ME; GC, deflexões e geometria digitados.";
      return d;
    } },
    { nome: "Lote rejeitado — GC, plasticidade, espessura e deflexão fora; frequência incompleta", dados: function () {
      var d = { ident: { registro: "LOTE-B-002", data: "2026-08-20", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 10 a 30",
          origem: "Jazida 1", camada: "Base estabilizada granulometricamente" },
        params: Object.assign({}, FE.FICHAS[ID].padrao, { estIni: "10", estFim: "30", largura: "7,20", espessura: "15", nN: "le5", lse: "75",
          faixa: "dnit-141-2022-es-E" }),
        umid: vazio(), comp: vazio(), gc: vazio(), gran: vazio(), lim: vazio(), la: vazio(), obs: "" };
      d.umid = [{ est: "11", reg: "Campo — Speedy", w: "6,9" }, { est: "16", reg: "Campo — Speedy", w: "8,1" }, { est: "22", reg: "Campo — Speedy", w: "6,4" },
        { est: "27", reg: "Campo — Speedy", w: "7,0" }];
      importa(d, "impComp", [["dnit-172-2016-me", 2]]);
      d.comp[0].est = "18";
      // GC: 4 furos do exemplo DNIT 458 (um em 99,1 %) + 2 digitados
      importa(d, "impGC", [["dnit-458-2025-me", 1]]);
      d.gc = d.gc.concat([{ est: "12", pos: "LD", reg: "DNIT 458 — furo digitado", gc: "98,6", w: "7,4" }, { est: "28", pos: "LE", reg: "DNIT 458 — furo digitado", gc: "100,2", w: "6,5" }]);
      importa(d, "impGran", [["dnit-412-2025-me", 1]]);
      d.gran[0].est = "20";
      d.proj = [{ p50_8: "100", p25_4: "90", p9_5: "66", p4_8: "50", p2: "36", p0_42: "20", p0_074: "9" }];
      importa(d, "impLim", [["dner-me-082-94", 1], ["dnit-450-2024-me", 2]]);
      importa(d, "impLA", [["dnit-451-2024-me", 0]]);
      d.defl = deflexoes(10, [62, 75, 58, 81, 70, 66, 88, 73, 64, 79, 71, 69, 84, 60, 77, 72, 68, 80, 65, 74, 70]);
      d.geo = secoes(10, [[7.24, 14.1, 3.0, 3.1], [7.22, 13.2, 3.1, 3.0], [7.18, 13.6, 2.8, 3.2], [7.25, 14.4, 3.0, 3.0], [7.21, 13.0, 3.2, 3.1],
        [7.23, 14.0, 3.1, 2.9], [7.26, 13.8, 3.0, 3.1], [7.22, 13.4, 3.3, 3.0], [7.24, 14.2, 3.1, 3.2], [7.20, 13.9, 3.0, 3.1], [7.25, 13.5, 3.2, 3.0],
        [7.23, 14.3, 3.0, 3.1], [7.22, 13.7, 3.1, 3.2], [7.21, 13.3, 3.0, 3.0], [7.24, 14.1, 3.2, 3.1], [7.26, 13.6, 3.1, 3.0], [7.23, 14.0, 3.0, 3.2],
        [7.22, 13.8, 3.1, 3.1], [7.25, 13.2, 3.0, 3.0], [7.24, 14.5, 3.2, 3.1], [7.23, 13.9, 3.1, 3.0]]);
      d.obs = "Exemplo de reprovação: GC com X̄ − k·s < 100 %, LL/IP acima dos limites com EA < 30 %, espessura média baixa, largura abaixo do projeto na estaca 12, Dc > LSE e só 1 ensaio de compactação/ISC para 400 m.";
      return d;
    } },
    { nome: "Lote aceito com ressalvas — projeto mecanicista, deflexão dispensada (NOTA 6)", dados: function () {
      var d = { ident: { registro: "LOTE-B-003", data: "2026-09-02", obra: "Obra C — Rua A", trecho: "Segmento único", local: "Est. 0 a 10",
          origem: "Jazida 4 + Pedreira Y", camada: "Base estabilizada granulometricamente" },
        params: Object.assign({}, FE.FICHAS[ID].padrao, { estIni: "0", estFim: "10", largura: "7,00", espessura: "12", dimens: "mec", mrProj: "280",
          defl: "dispensada", faixa: "dnit-141-2022-es-C", laDesemp: "sim" }),
        umid: vazio(), comp: vazio(), gc: vazio(), gran: vazio(), lim: vazio(), la: vazio(), mr: vazio(), obs: "" };
      d.umid = [{ est: "2", reg: "Campo — Speedy", w: "6,3" }, { est: "7", reg: "Campo — Speedy", w: "7,2" }];
      importa(d, "impComp", [["dnit-172-2016-me", 2]]);
      d.comp[0].est = "5";
      d.gc = [["1", "LE", 101.8], ["3", "eixo", 102.4], ["4", "LD", 99.6], ["6", "LE", 102.0], ["8", "eixo", 101.5], ["9", "LD", 102.6]]
        .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 417 — ponto " + (i + 1), gc: fmt(x[2], 1) }; });
      importa(d, "impGran", [["dnit-412-2025-me", 1]]);
      d.gran[0].est = "5";
      d.la = [{ reg: "LA-0311 · DNIT 451 (digitado)", la: "58" }];
      d.mr = [{ est: "5", reg: "MR-0098 · DNIT 134 (triplicata)", mr: "265" }];
      d.geo = secoes(0, [[7.05, 12.4, 3.1, 3.0], [7.02, 12.1, 3.2, 3.1], [7.08, 11.8, 3.0, 3.2], [7.04, 12.6, 3.1, 3.1], [7.06, 12.2, 3.3, 3.0],
        [7.03, 11.6, 3.1, 3.2], [7.07, 12.3, 3.0, 3.1], [7.05, 12.0, 3.2, 3.0], [7.04, 12.5, 3.1, 3.2], [7.06, 11.9, 3.0, 3.1], [7.05, 12.2, 3.2, 3.0]]);
      d.obs = "Pequena obra urbana: controle de deflexão dispensado pela Fiscalização (NOTA 6) — justificativa em anexo. Agregado com LA de 58 % aceito por desempenho anterior satisfatório na mesma rodovia.";
      return d;
    } },
  ];
})();
