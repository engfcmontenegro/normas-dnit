/*
 * Fichas de ACEITAÇÃO DE LOTE — grupo "pinturas, tratamentos superficiais e macadame betuminoso":
 *   DNIT 144/2014-ES imprimação (este arquivo) · DNIT 145/2012-ES pintura de ligação · DNIT 146/147/148-2012-ES tratamentos
 *   superficiais simples/duplo/triplo · DNIT 149/2010-ES macadame betuminoso por penetração · DNER-ES 395/99 pintura de
 *   ligação com asfalto polímero.
 *
 * Este arquivo define também o MOTOR COMUM do grupo, exposto em FE.aceitacaoG4a (usado por es-dnit-145…149 e es-dner-es-395),
 * montado sobre a biblioteca FE.aceitacao (es-comum.js):
 *   - taxa de aplicação do ligante (por camada/aplicação) e de espalhamento do agregado (por camada), importadas da ficha
 *     de taxa por bandeja (dnit-144-2014-es.js — cada bandeja vira uma coluna, na camada da ficha de origem) ou digitadas;
 *     aceitação estatística X̄ − k·s ≥ mín. e X̄ + k·s ≤ máx. (mín./máx. = projeto ∓ tolerância da ES), k da Tabela 1 da
 *     DNER-PRO 277/97 (a mesma da tabela de amostragem variável da DNER-ES 395/99, 7.2.2.3 — sem n = 11);
 *   - recebimento de cada carregamento de ligante (importado das fichas DNIT 095/2006-EM, DNIT 165/2013-EM, DNER-EM 362/97 e
 *     363/97): tipo de ligante admitido pela ES, resultado do carregamento e ensaios exigidos pela ES para cada carregamento;
 *   - agregados (tratamentos e macadame): granulometria por camada na faixa de projeto (curva de projeto ± tolerância da
 *     Tabela 1 da ES, ou a própria faixa quando não há curva), Los Angeles, índice de forma, durabilidade, adesividade;
 *   - temperatura do ligante no distribuidor, verificações (sim/não), controle do produto (réguas, alinhamento, espessura);
 *   - frequências (área do segmento: até 4.000 m² → 5 determinações; 4.000 a 20.000 m² → plano de amostragem; ou 5 por
 *     segmento de área inferior a 3.000 m²) e parecer do lote (A.parecer).
 * Registro da DNIT 144: FE.FICHAS["dnit-144-2014-es-aceitacao"] (a chave "dnit-144-2014-es" é a ficha de taxa por bandeja).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  if (!A) { if (window.console) console.error("es-dnit-144-2014-es.js: carregue antes site/fichas/es-comum.js."); return; }

  // =====================================================================================
  // MOTOR COMUM (FE.aceitacaoG4a)
  // =====================================================================================
  // DNER-PRO 277/97, Tabela 1 (amostragem variável): n = 5…10, 12…17, 19, 21 (não tabela n = 11) — [n, k, α]
  var K_277 = [[5, 1.55, 0.45], [6, 1.41, 0.35], [7, 1.36, 0.30], [8, 1.31, 0.25], [9, 1.25, 0.19], [10, 1.21, 0.15], [12, 1.16, 0.10],
    [13, 1.13, 0.08], [14, 1.11, 0.06], [15, 1.10, 0.05], [16, 1.08, 0.04], [17, 1.06, 0.03], [19, 1.04, 0.02], [21, 1.01, 0.01]];
  var TAXA = "dnit-144-2014-es";  // ficha de taxa por bandeja (origem das importações de taxa)
  var COD = A.codigoCurto, nstr = A.nstr;
  var EPS = 1e-9;
  function ord(c) { return c + "ª"; }
  // ligantes da ficha de taxa por bandeja (parâmetro "ligante" de dnit-144-2014-es.js)
  var NOMES_TX = { eai: "EAI", cm30: "CM-30", rr1c: "RR-1C", outra145: "outra emulsão (ex.: RR-2C)", cap: "CAP-150/200", rr2c: "RR-2C",
    capPol: "CAP modificado por polímero", emuPol: "emulsão modificada por polímero", emuPol395: "RR-1C modificada por polímero" };
  function nomeTx(x) { return NOMES_TX[x] || x; }
  function P_(d) { return d.params || {}; }
  function cheia(c, ks) { return ks.some(function (k) { return String(c[k] === undefined || c[k] === null ? "" : c[k]).trim() !== ""; }); }
  function norm(s) { return String(s || "").toUpperCase().replace(/[\s\-–_]/g, "").replace("CAP", ""); }
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  function kPen(mm) { return "p" + String(mm).replace(".", "_"); }
  function faixaPorId(id) { return FE.granulometria.faixasDisponiveis().filter(function (f) { return f.id === id; })[0] || null; }
  function simNao(t) {
    t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
    if (!t) return null;
    if (/^(s|sim|ok|c|conforme|atende|x|1|sat)/.test(t)) return true;
    if (/^(n|n[aã]o|nc|0|insat)/.test(t)) return false;
    return null;
  }
  // "aprovado"/"reprovado"/"parcial" ou A/R digitados
  function sitReceb(t) {
    t = String(t || "").trim().toLowerCase();
    if (!t) return null;
    if (/^(rep|r$|n[aã]o|nc)/.test(t)) return "reprovado";
    if (/^(parc|aprovado nos)/.test(t)) return "parcial";
    if (/^(ap|a$|conf|s|ok)/.test(t)) return "aprovado";
    return null;
  }

  function criar(cfg) {
    var ID = cfg.id, REFS = cfg.refs, TABK = cfg.tabelaK || K_277;
    var nLig = cfg.nLig || function () { return 1; }, nAgr = cfg.nAgr || function () { return 0; };
    var MAXL = cfg.maxLig || 1, MAXA = cfg.maxAgr || 0;
    function ligDe(P) {
      var l = cfg.ligantes.filter(function (x) { return x.id === P.ligante; })[0];
      return l || cfg.ligantes[0];
    }
    var temAgr = MAXA > 0, AG = cfg.agregado || null, PR = cfg.produto || {};

    // ---------- importações ----------
    function aplicarTaxa(lista, P, d) {
      var porL = {}, porA = {};
      lista.forEach(function (e) {
        var dp = e.dados.params || {}, cam = Number(dp.camada) || 1, srv = dp.servico || "144", lig = dp.ligante || "", id = A.importacao.ident(e);
        var T = null;
        try { T = FE.FICHAS[TAXA].calcular(JSON.parse(JSON.stringify(e.dados))).tab; } catch (err) { T = { lig: [], agr: [] }; }
        (e.resultados.itL || []).forEach(function (o) {
          var c = (e.dados.lig || [])[o.i] || {}, t = (T.lig || [])[o.i] || {};
          (porL[cam] = porL[cam] || []).push({ est: c.est || id.local || "", pos: o.lado || c.lado || "", reg: A.importacao.rotulo(e, "bandeja " + (o.i + 1)),
            x: nstr(o.x, 3), res: cfg.residual && ok(t.trv) ? nstr(t.trv, 3) : "", srv: srv, lig: lig });
        });
        (e.resultados.itA || []).forEach(function (o) {
          var c = (e.dados.agr || [])[o.i] || {};
          (porA[cam] = porA[cam] || []).push({ est: c.est || id.local || "", pos: o.lado || c.lado || "", reg: A.importacao.rotulo(e, "bandeja " + (o.i + 1)),
            x: nstr(o.x, 2), srv: srv, lig: lig });
        });
      });
      for (var c = 1; c <= 3; c++) {
        if (c <= MAXL || porL[c]) A.importacao.substituir(d, "lig" + c, porL[c] || []);
        if (temAgr && (c <= MAXA || porA[c])) A.importacao.substituir(d, "agr" + c, porA[c] || []);
      }
    }
    function aplicarReceb(lista, P, d) {
      A.importacao.substituir(d, "rec", lista.map(function (e) {
        var r = e.resultados || {}, V = r.V || {};
        var ens = (r.ensaios || []).filter(function (o) { return o.situacao !== null; }).map(function (o) { return o.e.id; });
        var res = ok(V.residuo) ? V.residuo : ok(V.res360) ? V.res360 : NaN;
        return { reg: A.importacao.rotulo(e, (e.dados.params || {}).dataCarga || ""), classe: (e.dados.params || {}).classe || r.classe || "",
          sit: r.geral || "", res: nstr(res, 1), ens: ens.join(","), fid: e.ficha };
      }), { chave: ["reg"] });
    }
    function aplicarGran(c) {
      return function (lista, P, d) {
        var fx = faixaPorId(P["faixa" + c]);
        A.importacao.substituir(d, "gran" + c, lista.map(function (e) {
          var r = e.resultados || {}, col = { est: A.importacao.ident(e).local || "", reg: A.importacao.rotulo(e) };
          (fx ? fx.peneiras : []).forEach(function (p) {
            var m = (r.media || []).filter(function (x) { return perto(x.mm, p.mm) && ok(x.pass); })[0];
            col[kPen(p.mm)] = m ? nstr(m.pass, 1) : "";
          });
          return col;
        }), { chave: ["reg"] });
      };
    }
    function aplicarAgq(lista, P, d) {
      A.importacao.substituir(d, "agq", A.importacao.juntarPorRegistro(lista.map(function (e) {
        var r = e.resultados || {}, i = A.importacao.ident(e), col = { reg: A.importacao.rotulo(e), la: "", fi: "", dur: "", ades: "" };
        if (e.ficha === "dnit-451-2024-me") col.la = ok(r.A) ? nstr(r.A, 0) : "";
        else if (e.ficha === "dnit-424-2020-me") col.fi = ok(r.fR) ? nstr(r.fR, 2) : "";
        else if (e.ficha === "dnit-452-2024-me") col.ades = r.status === "sat" ? "satisfatória" : r.status === "satDope" ? "satisfatória com " + fmt(r.teor, 2) + " % de melhorador" : r.status === "nao" ? "não satisfatória" : "";
        return { chave: i.registro || "", cod: COD(e.ficha), col: col };
      })), { chave: ["reg"] });
    }

    // ---------- parâmetros ----------
    var params = A.paramsLote({ largura: true });
    params[3].r = "Largura executada (m)";
    params[3].dica = "com a extensão, dá a área do segmento (frequência das determinações de taxa)";
    params.push({ k: "ligante", r: "Ligante asfáltico (" + cfg.secLig + ")", tipo: "select", recarrega: true,
      opcoes: cfg.ligantes.map(function (l) { return [l.id, l.nome]; }) });
    (cfg.params || []).forEach(function (p) { params.push(p); });
    params.push({ k: "tMin", r: "Temperatura mínima de aplicação (°C) — relação viscosidade × temperatura", ph: "ex.: 60",
      dica: "intervalo definido pela relação viscosidade × temperatura do ligante (" + cfg.secTemp + ")" });
    params.push({ k: "tMax", r: "Temperatura máxima de aplicação (°C)", ph: cfg.tMaxFixo ? String(cfg.tMaxFixo) : "ex.: 70",
      dica: cfg.tMaxFixo ? cfg.secTMax + ": não deve ultrapassar " + cfg.tMaxFixo + " °C" : "" });
    params.push({ k: "nAplic", r: "Aplicações (cargas do distribuidor) no lote", ph: "1", dica: "a temperatura é medida no distribuidor antes de cada aplicação (" + cfg.secTemp + ")" });
    params.push({ k: "nCarreg", r: "Carregamentos de ligante que atendem o lote", ph: "1", dica: "cada carregamento que chega à obra é ensaiado (" + cfg.secReceb + ")" });
    params.push({ k: "ton", r: "Ligante recebido para o lote (t)", ph: "ex.: 30", dica: "ensaios a cada 100 t (" + cfg.secReceb100 + ")" });
    if (cfg.freqTaxa.tipo === "4000") params.push({ k: "nPlano", r: "Determinações de taxa pelo plano de amostragem (segmento > 4.000 m²)", ph: cfg.freqTaxa.phPlano || "5",
      dica: "plano aprovado pela Fiscalização (DNER-PRO 277/97) para segmentos de 4.000 a 20.000 m² (" + cfg.freqTaxa.secPlano + ")" });
    if (temAgr) {
      params.push({ k: "jornadas", r: "Jornadas de trabalho no lote", ph: "1", dica: "granulometria do agregado a cada jornada (" + AG.secFreq + ")" });
      params.push({ k: "volAgr", r: "Volume de agregado aplicado no lote (m³) — opcional", dica: "índice de forma a cada 900 m³ (" + AG.secFreq + ")" });
      params.push({ k: "laDesemp", r: "Desempenho anterior satisfatório do agregado comprovado? (" + AG.secLA + ")", tipo: "select",
        opcoes: [["nao", "Não"], ["sim", "Sim — admite-se desgaste Los Angeles maior que " + AG.laMax + " %"]] });
    }
    if (PR.esp) params.push({ k: "espProj", r: "Espessura de projeto da camada (cm)", dica: "tolerância ± 10 % (" + PR.esp + ")" });
    params.push({ k: "impTaxa", r: "Taxas por bandeja — importar (ficha de taxa de aplicação, DNIT 144)", tipo: "importarVarios", de: TAXA, aplicar: aplicarTaxa,
      dica: "cada bandeja vira uma coluna na tabela da camada/aplicação da ficha de origem (parâmetro \"Camada\")" });
    params.push({ k: "impReceb", r: "Recebimento dos carregamentos de ligante — importar (" + cfg.recebFichas.map(COD).join(" / ") + ")", tipo: "importarVarios",
      de: cfg.recebFichas, aplicar: aplicarReceb, dica: "um carregamento por coluna: tipo, resultado, resíduo e ensaios realizados" });
    if (temAgr) {
      for (var c = 1; c <= MAXA; c++) (function (c) {
        params.push({ k: "impGran" + c, r: "Granulometria do agregado — " + cfg.nomeAgr(c) + " — importar (DNIT 412)", tipo: "importarVarios",
          de: "dnit-412-2025-me", aplicar: aplicarGran(c), se: function (d) { return nAgr(P_(d)) >= c; },
          dica: "o passante de cada peneira da faixa escolhida é tomado da ficha de origem (aberturas equivalentes)" });
      })(c);
      params.push({ k: "impAgq", r: "Los Angeles, índice de forma e adesividade — importar (DNIT 451 / 424 / 452)", tipo: "importarVarios",
        de: ["dnit-451-2024-me", "dnit-424-2020-me", "dnit-452-2024-me"], aplicar: aplicarAgq, dica: "ensaios com o mesmo registro vão para a mesma coluna" });
    }

    // ---------- tabelas ----------
    var L_EST = { k: "est", r: "Estaca", texto: true }, L_POS = { k: "pos", r: "Posição (LE / eixo / LD)", texto: true }, L_REG = { k: "reg", r: "Registro / origem", texto: true };
    function tabelas(d) {
      var P = P_(d), T = [], nl = nLig(P), na = nAgr(P), lg = ligDe(P);
      for (var c = 1; c <= nl; c++) {
        var lim = cfg.limLig(P, c, lg);
        var li = [L_EST, L_POS, L_REG, { k: "x", r: cfg.nomeTaxaLig(P, c).replace(/^./, function (x) { return x.toUpperCase(); }) + " (bandeja)", u: "l/m²" }];
        if (cfg.residual) li.push({ k: "res", r: "Taxa de ligante residual (bandeja) — opcional", u: "l/m²" });
        T.push({ chave: "lig" + c, titulo: cfg.nomeLig(c, P) + " — taxa de aplicação por bandeja (" + cfg.secTaxa + ")", rotulo: "Bandeja", iniciais: 1, min: 1,
          dica: "exigido: " + (lim.txt || "—") + "; bandejas ao acaso na pista (calcule na ficha de taxa por bandeja e importe)", linhas: li });
      }
      for (c = 1; c <= na; c++) {
        var la = cfg.limAgr(P, c, lg);
        T.push({ chave: "agr" + c, titulo: "Agregado — " + cfg.nomeAgr(c) + " — taxa de espalhamento por bandeja (" + cfg.secTaxaAgr + ")", rotulo: "Bandeja", iniciais: 1, min: 1,
          dica: "exigido: " + (la.txt || "—"), linhas: [L_EST, L_POS, L_REG, { k: "x", r: "Taxa de espalhamento (bandeja)", u: "kg/m²" }] });
      }
      var rl = [L_REG, { k: "classe", r: "Tipo / classe do ligante", texto: true }, { k: "sit", r: "Resultado (aprovado / reprovado / parcial)", texto: true },
        { k: "res", r: "Resíduo (%) — " + (cfg.nomeResiduo || "resíduo do ensaio de recebimento"), u: "%" }];
      if (cfg.recElastica) rl.push({ k: "rec", r: "Recuperação elástica do resíduo (DNER-ME 382)", u: "%" });
      T.push({ chave: "rec", titulo: "Recebimento dos carregamentos de ligante (" + cfg.secReceb + ")", rotulo: "Carreg.", iniciais: 1, min: 1,
        dica: "um carregamento por coluna; importe das fichas de recebimento (" + cfg.recebFichas.map(COD).join(", ") + ") ou digite", linhas: rl });
      T.push({ chave: "temp", titulo: "Temperatura do ligante no distribuidor, antes da aplicação (" + cfg.secTemp + ")", rotulo: "Leitura", iniciais: 1, min: 1,
        dica: "intervalo da relação viscosidade × temperatura" + (cfg.tMaxFixo ? "; máximo " + cfg.tMaxFixo + " °C (" + cfg.secTMax + ")" : ""),
        linhas: [{ k: "est", r: "Estaca / local", texto: true }, L_REG, { k: "t", r: "Temperatura", u: "°C" }] });
      if (temAgr && na) {
        for (c = 1; c <= na; c++) {
          var fx = faixaPorId(P["faixa" + c]);
          T.push({ chave: "gran" + c, titulo: "Granulometria do agregado — " + cfg.nomeAgr(c) + (fx ? " — faixa " + fx.faixa : "") + " — % passando (" + AG.secGran + ")",
            rotulo: "Amostra", iniciais: 1, min: 1, dica: fx ? "uma amostra por jornada; tolerância da faixa de projeto: " + fx.tolerancia.map(function (t) { return "± " + t.tol; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(" / ") : "escolha a faixa da camada nos parâmetros",
            linhas: [{ k: "est", r: "Estaca / data", texto: true }, L_REG].concat((fx ? fx.peneiras : []).map(function (p) { return { k: kPen(p.mm), r: p.nome + " (" + fmt(p.mm, p.mm < 1 ? 3 : 1).replace(/,?0+$/, "") + " mm)", u: "%" }; })) });
        }
        var pens = penUniao(P, na);
        if (pens.length) T.push({ chave: "proj", titulo: "Curva granulométrica de projeto de cada camada — % passando (faixa de trabalho = projeto ± tolerância da Tabela " + (AG.tabGran || "1") + ")",
          rotulo: "Camada", iniciais: na, min: na, fixo: true, nomes: range(na).map(function (c) { return cfg.nomeAgr(c); }),
          dica: "deixe vazio para verificar diretamente a faixa da Tabela " + (AG.tabGran || "1"), linhas: pens.map(function (p) { return { k: kPen(p.mm), r: p.nome, u: "%" }; }) });
        T.push({ chave: "agq", titulo: "Qualidade do agregado (" + AG.secQual + ")", rotulo: "Amostra", iniciais: 1, min: 1,
          dica: "Los Angeles ≤ " + AG.laMax + " %; índice de forma > 0,5; durabilidade (perda) < 12 %; adesividade satisfatória",
          linhas: [L_REG, { k: "la", r: "Desgaste Los Angeles (DNIT 451)", u: "%" }, { k: "fi", r: "Índice de forma f (DNIT 424 — crivos)", u: "" },
            { k: "dur", r: "Durabilidade — perda (DNER-ME 089)", u: "%" }, { k: "ades", r: "Adesividade (DNIT 452): satisfatória / não", texto: true }] });
      }
      if (PR.regua || PR.alinh || PR.esp) {
        var gl = [L_EST];
        if (PR.regua) gl.push({ k: "r12", r: "Régua de 1,20 m — maior variação", u: "cm" }, { k: "r3", r: "Régua de 3,00 m — maior variação", u: "cm" });
        if (PR.alinh) gl.push({ k: "ae", r: "Desvio do eixo", u: "cm" }, { k: "ale", r: "Desvio da borda esquerda", u: "cm" }, { k: "ald", r: "Desvio da borda direita", u: "cm" });
        if (PR.esp) gl.push({ k: "ee", r: "Espessura no eixo", u: "cm" }, { k: "ele", r: "Espessura na borda esquerda", u: "cm" }, { k: "eld", r: "Espessura na borda direita", u: "cm" });
        T.push({ chave: "geo", titulo: "Verificação do produto nas estacas de locação (" + [PR.regua, PR.alinh, PR.esp].filter(Boolean).join(", ") + ")", rotulo: "Seção", iniciais: 1, min: 1,
          dica: [PR.regua ? "variação ≤ 0,5 cm em qualquer régua" : "", PR.alinh ? "desvios ≤ ± 5 cm" : "", PR.esp ? "espessura ± 10 % do projeto" : ""].filter(Boolean).join("; "), linhas: gl });
      }
      var its = cfg.verif;
      if (Array.isArray(d.verif)) while (d.verif.length < its.length) d.verif.push({});
      T.push({ chave: "verif", titulo: "Verificações e inspeções", rotulo: "Item", iniciais: its.length, min: its.length, fixo: true,
        nomes: its.map(function (it) { return it.texto + " (" + it.secao + ")"; }),
        dica: "uma coluna por item da ES: \"S\" ou \"N\"; ou o número de verificações realizadas e de não conformes",
        linhas: [{ k: "atende", r: "Atende? (S / N)", texto: true }, { k: "real", r: "Verificações / ensaios realizados", u: "nº" },
          { k: "nc", r: "Não conformes", u: "nº" }, { k: "obs", r: "Observação", texto: true }] });
      return T;
    }
    function range(n) { var a = []; for (var i = 1; i <= n; i++) a.push(i); return a; }
    function penUniao(P, na) {
      var out = [];
      range(na).forEach(function (c) {
        var fx = faixaPorId(P["faixa" + c]);
        (fx ? fx.peneiras : []).forEach(function (p) { if (!out.some(function (o) { return perto(o.mm, p.mm); })) out.push(p); });
      });
      return out.sort(function (a, b) { return b.mm - a.mm; });
    }

    // ---------- cálculo ----------
    function pontos(arr, k, rot) {
      return (arr || []).map(function (c, i) { return { v: num(c[k]), est: c.est || "", x: A.estacaM(c.est), rot: (rot || "det. ") + (i + 1), c: c }; })
        .filter(function (p) { return ok(p.v); });
    }
    function freqTaxa(P, L, avisos, rotulo, real, qual) {
      var area = L.area, F = cfg.freqTaxa, o = { ensaio: rotulo, metodo: "bandejas (" + cfg.secTaxa + ")", realizado: real };
      if (!ok(area)) { o.exigido = 5; o.regra = "mín. 5 (informe extensão e largura)"; return A.frequencia(o); }
      if (F.tipo === "3000") {
        var seg = Math.max(1, Math.ceil(area / 3000 - EPS));
        o.exigido = 5 * seg;
        o.regra = "5 por segmento de área < 3.000 m² (" + F.sec + ")" + (seg > 1 ? " — " + seg + " segmentos (adotado)" : "");
        if (seg > 1 && qual === 0) avisos.push("Área do lote de " + fmt(area, 0) + " m²: a ES fixa no mínimo 5 determinações por segmento de área inferior a 3.000 m² (" + F.sec +
          ") — exigidas 5 por 3.000 m² (" + o.exigido + "); compatibilize com o plano de amostragem variável (7.4).");
        return A.frequencia(o);
      }
      if (area <= 4000 + EPS) { o.exigido = 5; o.regra = "área ≤ 4.000 m²: mín. 5 (" + F.sec + ")"; return A.frequencia(o); }
      var np = num(P.nPlano), pad = F.plano ? F.plano(area) : 5;
      o.exigido = ok(np) && np >= 5 ? Math.round(np) : pad;
      o.regra = "4.000 a 20.000 m²: plano de amostragem (" + F.secPlano + ")" + (ok(np) ? "" : F.txtPlano ? " — " + F.txtPlano : " — mín. 5 (adotado)");
      if (qual === 0) {
        if (area >= 20000 - EPS) avisos.push("Segmento de " + fmt(area, 0) + " m²: a ES trata segmentos de até 20.000 m² (" + F.secPlano + ") — subdivida o controle.");
        if (!ok(np)) avisos.push("Segmento de " + fmt(area, 0) + " m² (> 4.000 m²): o número de determinações de taxa é o do plano de amostragem aprovado pela Fiscalização (" +
          F.secPlano + ") — informe-o; adotado " + o.exigido + (F.txtPlano ? " (" + F.txtPlano + ")" : "") + ".");
      }
      return A.frequencia(o);
    }

    function calcular(d) {
      var P = P_(d), avisos = [], linhas = [], freqs = [], L = A.lote(P), lg = ligDe(P), nl = nLig(P), na = nAgr(P);
      if (!ok(L.ext)) avisos.push("Informe as estacas inicial e final (ou a extensão) do lote.");
      if (!ok(L.larg)) avisos.push("Informe a largura executada: a frequência das determinações de taxa depende da área do segmento.");
      function fora(pts, rot) {
        if (!ok(L.ini) || !ok(L.fim)) return;
        var f = pts.filter(function (p) { return ok(p.x) && (p.x < L.ini - 1e-6 || p.x > L.fim + 1e-6); });
        if (f.length) avisos.push(rot + ": " + f.length + " determinação(ões) fora das estacas do lote (" + f.map(function (p) { return p.est; }).join("; ") + ").");
      }
      var ctx = { d: d, P: P, L: L, lg: lg, linhas: linhas, freqs: freqs, avisos: avisos, cfg: cfg };

      // ----- taxas de aplicação do ligante (por camada / aplicação) -----
      var ligsImp = {};
      for (var c = 1; c <= nl; c++) {
        var lim = cfg.limLig(P, c, lg), pts = pontos(d["lig" + c], "x", "bandeja ");
        fora(pts, cfg.nomeLig(c, P));
        (d["lig" + c] || []).forEach(function (col) { if (col.imp && col.lig) ligsImp[col.lig] = 1; });
        var l = A.avaliar({ id: "lig" + c, grupo: "Taxa de aplicação do ligante e de espalhamento do agregado", criterio: cfg.nomeLig(c, P) + " — " + cfg.nomeTaxaLig(P, c),
          secao: lim.sec, unid: "l/m²", casas: 2, pontos: pts, min: lim.min, max: lim.max, exigido: lim.txt, tabelaK: TABK, refs: REFS, falha: "nao_conforme" });
        if (l.n && !ok(lim.min) && !ok(lim.max)) A.marcar(l, "pendente", lim.falta || "informe a taxa de projeto");
        (lim.avisos || []).forEach(function (t) { avisos.push(t); });
        if (lim.informativo && l.n) { l.situacao = "informativo"; l.motivos = []; l.motivo = lim.informativo; }
        var srvFora = (d["lig" + c] || []).filter(function (col) { return col.imp && col.srv && cfg.servicos.indexOf(col.srv) < 0 && ok(num(col.x)); });
        if (srvFora.length) A.marcar(l, "ressalva", srvFora.length + " bandeja(s) importada(s) de ficha de taxa configurada para outro serviço (" +
          srvFora.map(function (x) { return "serviço " + x.srv; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(", ") + ") — confira a forma de cálculo da taxa");
        var fr = freqTaxa(P, L, avisos, cfg.nomeLig(c, P) + " — taxa de aplicação", l.n, c - 1);
        if (fr.situacao === "insuficiente" && l.n) A.marcar(l, "ressalva", "frequência abaixo da mínima: " + l.n + " de " + fr.exigido + " (" + fr.regra + ")");
        linhas.push(l); freqs.push(fr);
        if (cfg.residual) {
          var rp = pontos(d["lig" + c], "res", "bandeja "), rr = cfg.residual.rec;
          var lr = A.avaliar({ id: "res" + c, grupo: "Taxa de aplicação do ligante e de espalhamento do agregado", criterio: "Taxa de ligante residual (recomendada)",
            secao: cfg.residual.sec, unid: "l/m²", casas: 2, pontos: rp, min: rr[0], max: rr[1], individual: true, falha: "ressalva",
            exigido: fmt(rr[0], 1) + " a " + fmt(rr[1], 1) + " l/m² (recomendada; média)" });
          if (!lr.n) { lr.situacao = "informativo"; lr.motivo = "sem determinações da taxa residual (recomendação, não exigência) — calcule-a pelo resíduo do carregamento"; lr.motivos = []; }
          else {
            var mr = lr.media;
            lr.fora = []; lr.motivos = [];
            lr.resultado = "média " + fmt(mr, 2) + " l/m² (n = " + lr.n + ")";
            if (mr < rr[0] - EPS || mr > rr[1] + EPS) { lr.situacao = "ressalva"; lr.motivo = "taxa residual média de " + fmt(mr, 2) + " l/m², fora da recomendada de " + fmt(rr[0], 1) + " a " + fmt(rr[1], 1) + " l/m² (" + cfg.residual.sec + ") — rever a taxa de projeto"; lr.motivos = [{ situacao: "ressalva", texto: lr.motivo }]; }
            else { lr.situacao = "conforme"; lr.motivo = "média " + fmt(mr, 2) + " l/m² dentro da recomendada"; }
          }
          linhas.push(lr);
        }
      }
      for (c = nl + 1; c <= 3; c++) if (pontos(d["lig" + c], "x").length) avisos.push("Há taxas de ligante lançadas para a " + ord(c) + " aplicação, que não existe neste serviço — não avaliadas.");
      var nomesLig = Object.keys(ligsImp).map(nomeTx), ligsIds = Object.keys(ligsImp);
      if (cfg.ligUnico && nomesLig.length > 1) {
        var lu = A.linha({ id: "ligunico", grupo: "Materiais — ligante", criterio: "Mesmo ligante em todas as camadas", secao: cfg.ligUnico, exigido: "emulsão só se empregada em todas as camadas", n: nomesLig.length, resultado: nomesLig.join(", ") });
        A.marcar(lu, "nao_conforme", "as bandejas importadas vêm de ligantes diferentes (" + nomesLig.join(", ") + ")");
        linhas.push(lu);
      }
      if (ligsIds.length && lg.taxaLig && ligsIds.some(function (x) { return lg.taxaLig.indexOf(x) < 0; }))
        avisos.push("Taxas importadas de ficha de taxa com ligante diferente do escolhido aqui (" + nomesLig.join(", ") + " × " + lg.nome + ") — confira.");

      // ----- taxa de espalhamento do agregado -----
      for (c = 1; c <= na; c++) {
        var la = cfg.limAgr(P, c, lg), pa = pontos(d["agr" + c], "x", "bandeja ");
        fora(pa, "Agregado " + cfg.nomeAgr(c));
        var l2 = A.avaliar({ id: "agr" + c, grupo: "Taxa de aplicação do ligante e de espalhamento do agregado", criterio: "Agregado — " + cfg.nomeAgr(c) + " — taxa de espalhamento",
          secao: la.sec, unid: "kg/m²", casas: 1, pontos: pa, min: la.min, max: la.max, exigido: la.txt, tabelaK: TABK, refs: REFS });
        (la.avisos || []).forEach(function (t) { avisos.push(t); });
        if (la.informativo && l2.n) { l2.situacao = "informativo"; l2.motivos = []; l2.motivo = la.informativo; }
        else if (l2.n && !ok(la.min) && !ok(la.max)) A.marcar(l2, "pendente", la.falta || "informe a taxa de projeto do agregado");
        var fa = freqTaxa(P, L, avisos, "Agregado " + cfg.nomeAgr(c) + " — taxa de espalhamento", l2.n, 9);
        if (fa.situacao === "insuficiente" && l2.n) A.marcar(l2, "ressalva", "frequência abaixo da mínima: " + l2.n + " de " + fa.exigido + " (" + fa.regra + ")");
        linhas.push(l2); freqs.push(fa);
      }

      // ----- recebimento do ligante -----
      var recs = (d.rec || []).filter(function (x) { return cheia(x, ["classe", "sit", "res", "rec"]); });
      var lrc = A.linha({ id: "receb", grupo: "Materiais — ligante", criterio: "Recebimento dos carregamentos (" + lg.nome.replace(/ \(.*/, "") + ")", secao: cfg.secReceb,
        exigido: "tipo admitido; carregamento aprovado; ensaios da ES", n: recs.length });
      var nAp = 0;
      recs.forEach(function (x, i) {
        var rot = x.reg ? x.reg.split(" · ")[0] : "carregamento " + (i + 1), s = sitReceb(x.sit);
        var cls = norm(x.classe), okCls = !cls || lg.classes.some(function (k) { return cls.indexOf(norm(k)) >= 0; });
        if (!okCls) A.marcar(lrc, "nao_conforme", rot + ": ligante " + x.classe + " não admitido — a ES exige " + lg.classes.join(" ou ") + " (" + cfg.secLig + ")");
        if (s === "reprovado") A.marcar(lrc, "nao_conforme", rot + ": carregamento reprovado no recebimento (fora da especificação do material)");
        else if (s === "aprovado" || s === "parcial") nAp++;
        else A.marcar(lrc, "pendente", rot + ": informe o resultado do recebimento");
        if (x.ens !== undefined && x.ens !== null && x.fid && lg.ens) {
          var feitos = String(x.ens).split(","), falta = lg.ens.filter(function (e) { return e[0].split("|").every(function (id) { return feitos.indexOf(id) < 0; }); });
          if (falta.length) A.marcar(lrc, "ressalva", rot + ": ensaio(s) exigido(s) pela ES em todo carregamento não realizado(s): " + falta.map(function (e) { return e[1]; }).join("; ") + " (" + cfg.secReceb + ")");
        }
        if (cfg.recElastica && !ok(num(x.rec))) A.marcar(lrc, "ressalva", rot + ": recuperação elástica do resíduo não informada (" + cfg.recElastica + ")");
      });
      lrc.resultado = recs.length ? nAp + " de " + recs.length + " aprovado(s)" : "—";
      if (!recs.length) A.marcar(lrc, "sem_dados", "nenhum carregamento registrado");
      else if (lrc.situacao === "conforme") lrc.motivo = "todos os carregamentos aprovados, com os ensaios exigidos";
      linhas.push(lrc);
      var nCar = ok(num(P.nCarreg)) && num(P.nCarreg) > 0 ? Math.round(num(P.nCarreg)) : 1;
      freqs.push(A.frequencia({ ensaio: "Recebimento do ligante (ensaios por carregamento)", metodo: cfg.recebFichas.map(COD).join(" / "), regra: "todo carregamento (" + cfg.secReceb + ")",
        exigido: nCar, realizado: recs.length }));
      if (lg.aviso) avisos.push(lg.aviso);
      var resMed = media(recs.map(function (x) { return num(x.res); }).filter(ok));
      if (ok(resMed) && lg.resMin && resMed < lg.resMin) avisos.push("Resíduo médio dos carregamentos de " + fmt(resMed, 1) + " %, abaixo do mínimo da especificação do material para " + lg.nome.replace(/ \(.*/, "") + " (" + lg.resMin + " %).");

      // ----- temperatura -----
      var tMin = num(P.tMin), tMax = num(P.tMax);
      if (cfg.tMaxFixo && (!ok(tMax) || tMax > cfg.tMaxFixo)) { if (ok(tMax)) avisos.push("Temperatura máxima informada acima de " + cfg.tMaxFixo + " °C: vale o limite da ES (" + cfg.secTMax + ")."); tMax = cfg.tMaxFixo; }
      var tp = pontos(d.temp, "t", "leitura ");
      var lt = A.avaliar({ id: "temp", grupo: "Execução", criterio: "Temperatura do ligante no distribuidor", secao: cfg.secTemp, unid: "°C", casas: 0, pontos: tp,
        min: tMin, max: tMax, individual: true, exigido: ok(tMin) || ok(tMax) ? A.txtLimites(tMin, tMax, 0, "°C") + " (viscosidade × temperatura)" : "intervalo da relação viscosidade × temperatura" });
      if (lt.n && !ok(tMin) && !ok(tMax)) A.marcar(lt, "pendente", "informe o intervalo de temperatura da relação viscosidade × temperatura");
      linhas.push(lt);
      var nApl = ok(num(P.nAplic)) && num(P.nAplic) > 0 ? Math.round(num(P.nAplic)) : 1;
      freqs.push(A.frequencia({ ensaio: "Temperatura do ligante", metodo: "termômetro do distribuidor", regra: "antes de cada aplicação (" + cfg.secTemp + ")", exigido: nApl, realizado: lt.n }));

      // ----- agregado -----
      if (temAgr && na) {
        var jorn = ok(num(P.jornadas)) && num(P.jornadas) > 0 ? Math.round(num(P.jornadas)) : 1;
        var grans = [];
        for (c = 1; c <= na; c++) {
          var fx = faixaPorId(P["faixa" + c]), proj = (d.proj || [])[c - 1] || {};
          var cols = (d["gran" + c] || []).filter(function (x) { return fx && fx.peneiras.some(function (p) { return ok(num(x[kPen(p.mm)])); }); });
          var temProj = fx && fx.peneiras.some(function (p) { return ok(num(proj[kPen(p.mm)])); });
          var porPen = (fx ? fx.peneiras : []).map(function (p) {
            var k = kPen(p.mm), tol = ((fx.tolerancia || []).filter(function (t) { return perto(t.mm, p.mm); })[0] || {}).tol, pj = num(proj[k]);
            var mn = temProj && ok(pj) ? Math.max(0, pj - tol) : temProj ? NaN : p.min, mx = temProj && ok(pj) ? Math.min(100, pj + tol) : temProj ? NaN : p.max;
            var av = A.avaliar({ id: "pen" + c + k, criterio: p.nome, unid: "%", casas: 1, pontos: pontos(d["gran" + c], k, "amostra "), min: mn, max: mx, tabelaK: TABK, refs: REFS });
            if (temProj && ok(pj) && (pj < p.min - EPS || pj > p.max + EPS)) avisos.push("Curva de projeto da " + cfg.nomeAgr(c) + ": " + p.nome + " = " + fmt(pj, 0) + " %, fora da faixa " + fx.faixa + " (" + p.min + "–" + p.max + ") da Tabela " + (AG.tabGran || "1") + ".");
            return { p: p, tol: tol, proj: pj, av: av };
          });
          var lg1 = A.linha({ id: "gran" + c, grupo: "Materiais — agregado", criterio: "Granulometria — " + cfg.nomeAgr(c) + (fx ? " (faixa " + fx.faixa + ")" : ""), secao: AG.secGran,
            exigido: temProj ? "projeto ± tolerância (Tabela " + (AG.tabGran || "1") + ")" : "faixa da Tabela " + (AG.tabGran || "1"), n: cols.length, semMedia: true, txtEstat: "—" });
          if (!fx) A.marcar(lg1, cols.length ? "pendente" : "sem_dados", "escolha a faixa granulométrica da camada");
          else if (!cols.length) A.marcar(lg1, "sem_dados", "sem determinações");
          else {
            var nc = porPen.filter(function (g) { return g.av.situacao === "nao_conforme"; }), cr = porPen.filter(function (g) { return g.av.situacao === "ressalva"; });
            lg1.resultado = cols.length + " amostra(s)";
            if (nc.length) A.marcar(lg1, "nao_conforme", "fora " + (temProj ? "da faixa de trabalho" : "da faixa " + fx.faixa) + ": " + nc.map(function (g) { return g.p.nome + " — " + g.av.motivo; }).join(" | "));
            if (cr.length) A.marcar(lg1, "ressalva", cr.map(function (g) { return g.p.nome + " — " + g.av.motivo; }).join(" | "));
            if (!nc.length && !cr.length) lg1.motivo = "todas as peneiras atendem" + (cols.length >= 5 ? " (X̄ ± k·s)" : " (valores individuais, n < 5)");
            if (!temProj) A.marcar(lg1, "ressalva", "sem curva de projeto: verificada a faixa " + fx.faixa + " da Tabela " + (AG.tabGran || "1") + " (a faixa de trabalho é a curva de projeto ± tolerância)");
          }
          linhas.push(lg1);
          grans.push({ c: c, fx: fx, porPen: porPen, temProj: temProj, n: cols.length });
          freqs.push(A.frequencia({ ensaio: "Granulometria do agregado — " + cfg.nomeAgr(c), metodo: "DNIT 412 (DNER-ME 083)", regra: "1 por jornada de trabalho (" + AG.secFreq + ")", exigido: jorn, realizado: cols.length }));
        }
        ctx.grans = grans;
        var aq = (d.agq || []);
        var laMax = AG.laMax;
        var lla = A.avaliar({ id: "la", grupo: "Materiais — agregado", criterio: "Desgaste Los Angeles", secao: AG.secLA, unid: "%", casas: 0, pontos: pontos(aq, "la", "amostra "),
          max: laMax, individual: true, aplica: AG.laExige !== false || pontos(aq, "la").length > 0, naoAplicaPor: AG.laNaoExige || "" });
        if (lla.situacao === "nao_conforme" && P.laDesemp === "sim") { lla.situacao = "ressalva"; lla.motivo = "desgaste acima de " + laMax + " %, admitido por desempenho anterior satisfatório comprovado (" + AG.secLA + ") — anexar a comprovação"; lla.motivos = [{ situacao: "ressalva", texto: lla.motivo }]; }
        var lfi = A.avaliar({ id: "fi", grupo: "Materiais — agregado", criterio: "Índice de forma", secao: AG.secIF, unid: "", casas: 2, pontos: pontos(aq, "fi", "amostra "), min: 0.5, minEstrito: true,
          individual: true, exigido: "> 0,50" });
        var ldu = A.avaliar({ id: "dur", grupo: "Materiais — agregado", criterio: "Durabilidade — perda", secao: AG.secDur, unid: "%", casas: 1, pontos: pontos(aq, "dur", "amostra "), max: 12 - 1e-6,
          individual: true, exigido: "< 12 %" });
        var ads = aq.filter(function (x) { return String(x.ades || "").trim(); });
        var lad = A.linha({ id: "ades", grupo: "Materiais — agregado", criterio: "Adesividade ao ligante", secao: AG.secAdes, exigido: "satisfatória (com melhorador, se necessário)", n: ads.length });
        var comDope = 0;
        ads.forEach(function (x, i) {
          var t = String(x.ades).toLowerCase();
          if (/n[aã]o|insat/.test(t)) A.marcar(lad, "nao_conforme", "amostra " + (i + 1) + ": adesividade não satisfatória — empregar melhorador de adesividade (" + AG.secMelh + ")");
          else if (/melhorador|dope/.test(t)) comDope++;
        });
        lad.resultado = ads.length ? ads.map(function (x) { return x.ades; }).join("; ") : "—";
        if (!ads.length) A.marcar(lad, "sem_dados", "sem ensaio de adesividade");
        else if (lad.situacao === "conforme") lad.motivo = comDope ? "satisfatória com melhorador: confirme a adição do melhorador ao ligante e o ensaio a cada incorporação (" + AG.secMelh + ")" : "satisfatória";
        linhas.push(lla, lfi, ldu, lad);
        if (comDope) avisos.push("Adesividade satisfatória só com melhorador: o melhorador deve ser adicionado ao ligante no canteiro, com recirculação (" + AG.secMelh + "), e a adesividade ensaiada a cada incorporação do aditivo.");
        var vol = num(P.volAgr);
        freqs.push(A.frequencia({ ensaio: "Índice de forma", metodo: "DNIT 424 (DNER-ME 086)", regra: ok(vol) ? "1 a cada 900 m³ (" + AG.secFreq + ")" : "1 a cada 900 m³ (" + AG.secFreq + ") — mín. 1 (volume não informado)",
          exigido: ok(vol) ? A.nMin(vol, 900) : 1, realizado: lfi.n }));
        freqs.push(A.frequencia({ ensaio: "Adesividade", metodo: "DNIT 452 (DNER-ME 078)", regra: "todo carregamento de ligante e mudança do material (" + AG.secFreq + ")", exigido: nCar, realizado: ads.length }));
        if (AG.laExige !== false) freqs.push(A.frequencia({ ensaio: "Desgaste Los Angeles", metodo: "DNIT 451 (DNER-ME 035)", regra: "caracterização (" + AG.secLA + ") — mín. 1 por lote (adotado)", exigido: 1, realizado: lla.n }));
        freqs.push(A.frequencia({ ensaio: "Durabilidade", metodo: "DNER-ME 089", regra: "caracterização (" + AG.secDur + ") — mín. 1 por lote (adotado)", exigido: 1, realizado: ldu.n }));
      }

      // ----- produto -----
      var geo = d.geo || [];
      if (PR.regua || PR.alinh || PR.esp) {
        var nSec = geo.filter(function (x) { return cheia(x, ["r12", "r3", "ae", "ale", "ald", "ee", "ele", "eld"]); }).length;
        function gp(ks, suf) { var o = []; ks.forEach(function (k, j) { o = o.concat(pontos(geo, k, "seção ").map(function (p) { p.rot += suf[j]; return p; })); }); return o; }
        if (PR.regua) linhas.push(A.avaliar({ id: "regua", grupo: "Produto", criterio: "Acabamento — variação sob as réguas de 1,20 m e 3,00 m", secao: PR.regua, unid: "cm", casas: 1,
          pontos: gp(["r12", "r3"], [" (1,20 m)", " (3,00 m)"]), max: 0.5, tabelaK: TABK, refs: REFS }));
        if (PR.alinh) linhas.push(A.avaliar({ id: "alinh", grupo: "Produto", criterio: "Alinhamento — desvios do eixo e das bordas", secao: PR.alinh, unid: "cm", casas: 1,
          pontos: gp(["ae", "ale", "ald"], [" eixo", " LE", " LD"]), min: -5, max: 5, tabelaK: TABK, refs: REFS }));
        if (PR.esp) {
          var ep = num(P.espProj);
          var le = A.avaliar({ id: "esp", grupo: "Produto", criterio: "Espessura (eixo e bordas)", secao: PR.esp, unid: "cm", casas: 1, pontos: gp(["ee", "ele", "eld"], [" eixo", " LE", " LD"]),
            min: ok(ep) ? ep * 0.9 : NaN, max: ok(ep) ? ep * 1.1 : NaN, tabelaK: TABK, refs: REFS, exigido: ok(ep) ? fmt(ep * 0.9, 1) + " a " + fmt(ep * 1.1, 1) + " cm (projeto " + fmt(ep, 1) + " ± 10 %)" : "projeto ± 10 %" });
          if (le.n && !ok(ep)) A.marcar(le, "pendente", "informe a espessura de projeto");
          linhas.push(le);
        }
        freqs.push(A.frequencia({ ensaio: "Verificação do produto (seções)", metodo: "réguas / trena / nivelamento", regra: "estacas de locação — a cada 20 m (" + [PR.regua, PR.alinh, PR.esp].filter(Boolean).join(", ") + ")",
          exigido: ok(L.ext) ? A.nPontos(L.ext, 20) : 1, realizado: nSec }));
      }

      // ----- verificações sim/não -----
      cfg.verif.forEach(function (it, i) {
        var v = (d.verif || [])[i] || {}, sn = simNao(v.atende), real = num(v.real), nc = num(v.nc);
        if (!ok(real)) real = sn === null ? (ok(nc) ? nc : 0) : 1;
        if (!ok(nc)) nc = sn === false ? 1 : 0;
        if (nc > real) real = nc;
        var aplica = !it.se || it.se(P);
        var lv = A.linha({ id: it.id, grupo: "Verificações", criterio: it.texto, secao: it.secao, exigido: it.exigido, n: real,
          resultado: real ? (real - nc) + " de " + real + " conforme(s)" + (v.obs ? " — " + v.obs : "") : "—" });
        if (!aplica) { lv.situacao = "nao_exigido"; lv.motivo = it.naoAplicaPor || "não se aplica"; }
        else if (!real && it.opcional) { lv.situacao = "informativo"; lv.motivo = "não registrado" + (it.naoRegistrado ? " — " + it.naoRegistrado : ""); }
        else if (!real) A.marcar(lv, "sem_dados", "não verificado");
        else if (nc > 0) A.marcar(lv, it.falha || "nao_conforme", nc + " de " + real + " não conforme(s)" + (v.obs ? " — " + v.obs : ""));
        else lv.motivo = real + " verificação(ões) conforme(s)";
        linhas.push(lv);
        if (aplica && it.freq) {
          var ex = it.freq(P, L);
          if (ok(ex.exigido)) freqs.push(A.frequencia({ ensaio: it.texto, metodo: it.metodo || "—", regra: ex.regra, exigido: ex.exigido, realizado: real }));
        }
      });

      if (cfg.extra) cfg.extra(ctx);
      freqs.forEach(function (f) { if (f.situacao === "insuficiente") avisos.push("Frequência: " + f.ensaio + " — " + f.realizado + " de " + f.exigido + " (" + f.regra + ")."); });
      var nota = linhas.filter(function (l) { return (l.situacao === "conforme" || l.situacao === "ressalva") && /^valores individuais \(n </.test(l.regra || ""); }).map(function (l) { return l.criterio; });
      var par = A.parecer(linhas, freqs, { textos: textos(), nota: nota.length ? "Avaliados por valor individual (n < 5, fora da " + REFS.tabela + "): " + nota.join("; ") + "." : "" });
      var med = function (id) { var l = linhas.filter(function (x) { return x.id === id; })[0]; return l && l.n ? l.media : NaN; };
      return { tab: {}, resultados: { lote: L, linhas: linhas, freqs: freqs, parecer: par, grans: ctx.grans || [], lig: lg.nome, nl: nl, na: na,
        medL: range(nl).map(function (c) { return med("lig" + c); }), medA: range(na).map(function (c) { return med("agr" + c); }),
        conforme: par.parecer === "ACEITO" || par.parecer === "RESSALVA" }, avisos: avisos };
    }
    function textos() {
      return {
        ACEITO: { titulo: "LOTE ACEITO", texto: "Todos os critérios da " + cfg.codigo + " atendidos, com a frequência exigida." },
        RESSALVA: { titulo: "LOTE ACEITO COM RESSALVAS", texto: "Nenhum critério reprovado, mas há pontos a corrigir ou a documentar: \"todo detalhe incorreto ou mal executado deve ser corrigido\" (" + cfg.secConf + ")." },
        PENDENTE: { titulo: "LOTE PENDENTE — CONTROLE INCOMPLETO", texto: "Nenhum critério reprovado, mas faltam ensaios, determinações ou informações exigidos (" + cfg.secPlano + "): complete o controle antes de aceitar o lote." },
        REJEITADO: { titulo: "LOTE REJEITADO", texto: cfg.textoRejeicao || "Há critério não conforme (" + cfg.secConf + "): o serviço deve ser corrigido e só é aceito se as correções o colocarem em conformidade com a ES; caso contrário, deve ser rejeitado." },
      };
    }

    // ---------- apresentação ----------
    function cartoes(r) {
      var L = r.lote, h = '<div class="fe-res">' + A.cartao(ok(L.ext) ? fmt(L.ext, 0) + " m" : "—", "Extensão do lote" + (ok(L.ini) && ok(L.fim) ? " (est. " + A.fmtEstaca(L.ini) + " a " + A.fmtEstaca(L.fim) + ")" : "")) +
        A.cartao(ok(L.area) ? fmt(L.area, 0) + " m²" : "—", "Área do segmento (extensão × largura)");
      r.medL.forEach(function (m, i) { if (ok(m)) h += A.cartao(fmt(m, 2) + " l/m²", "Ligante — média " + (r.nl > 1 ? "da " + ord(i + 1) + " aplicação" : "das bandejas")); });
      r.medA.forEach(function (m, i) { if (ok(m)) h += A.cartao(fmt(m, 1) + " kg/m²", "Agregado — média da " + ord(i + 1) + " camada"); });
      return h + "</div>";
    }
    function tabGran(r, relat) {
      var gs = (r.grans || []).filter(function (g) { return g.fx && (g.n || g.temProj); });
      if (!gs.length) return "";
      var cls = relat ? "gr" : "fe-resumo";
      return gs.map(function (g) {
        return '<table class="' + cls + '"><thead><tr><th style="text-align:left">' + esc(cfg.nomeAgr(g.c)) + " — faixa " + esc(g.fx.faixa) + "</th><th>Faixa (Tabela " + (AG.tabGran || "1") + ")</th><th>Projeto</th><th>Tolerância</th><th>Limites adotados</th><th>n</th><th>X̄</th><th>X̄ − k·s / X̄ + k·s</th><th>Situação</th></tr></thead><tbody>" +
          g.porPen.map(function (x) {
            var a = x.av, lim = a.lim || {};
            return '<tr><td style="text-align:left">' + esc(x.p.nome) + "</td><td>" + x.p.min + "–" + x.p.max + "</td><td>" + (ok(x.proj) ? fmt(x.proj, 0) : "—") + "</td><td>± " + (x.tol || "—") +
              "</td><td>" + (ok(lim.min) ? fmt(lim.min, 0) + "–" + fmt(lim.max, 0) : "—") + "</td><td>" + (a.n || 0) + "</td><td>" + (a.n ? fmt(a.media, 1) : "—") + "</td><td>" +
              (ok(a.inf) ? fmt(a.inf, 1) + " / " + fmt(a.sup, 1) : "—") + "</td><td>" + A.situacaoHtml(a.situacao, relat) + "</td></tr>";
          }).join("") + "</tbody></table>";
      }).join("");
    }
    function resultadosHtml(calc) {
      var r = calc.resultados, g = tabGran(r, false);
      return A.htmlParecer(r.parecer) + cartoes(r) +
        '<h4 style="margin:12px 0 4px">Critérios de aceitação</h4>' + A.htmlCriterios(r.linhas, { estilo: "estatistico" }) +
        '<h4 style="margin:12px 0 4px">Frequência dos ensaios e determinações</h4>' + A.htmlFrequencia(r.freqs) +
        (g ? '<h4 style="margin:12px 0 4px">Granulometria do agregado por peneira</h4>' + g : "");
    }
    function graficos(calc, d, opt) {
      var out = calc.resultados.linhas.filter(function (l) { return l.est && l.n && l.situacao !== "nao_exigido" && (ok((l.lim || {}).min) || ok((l.lim || {}).max)); })
        .map(function (l) { return A.graficoLinha(l, opt); }).filter(Boolean);
      return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com as taxas e medições do lote.</div>'];
    }
    var F = {
      titulo: cfg.titulo, rotuloLink: cfg.rotuloLink || "Aceitação de lote", resumo: cfg.resumo, blocos: [], params: params, padrao: cfg.padrao,
      tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: graficos,
      relatorio: {
        notas: cfg.notas + " Controle estatístico (" + cfg.secConf + "): X̄ − k·s ≥ valor mínimo e X̄ + k·s ≤ valor máximo, X̄ = Σxᵢ/n, s = √[Σ(xᵢ − X̄)²/(n − 1)], k da " + REFS.tabela +
          " (n = 5…10, 12…17, 19, 21 → k = 1,55; 1,41; 1,36; 1,31; 1,25; 1,21; 1,16; 1,13; 1,11; 1,10; 1,08; 1,06; 1,04; 1,01). Critérios adotados pela ficha: n < 5 → valores individuais; n não tabelado (11, 18, 20) → k do n tabelado imediatamente inferior; n > 21 → k = 1,01; com a estatística atendida, valor individual fora do limite gera ressalva (corrigir o local). Parecer: rejeitado se algum critério não conforme; pendente se faltar ensaio/determinação exigido; aceito com ressalva se houver ressalvas.",
        parametros: [["Critério de aceitação", cfg.codigo + ", " + cfg.secConf + " — controle estatístico com a " + REFS.tabela]],
        resultados: function (calc) {
          var r = calc.resultados, L = r.lote, rows = [["Parecer do lote", r.parecer.titulo],
            ["Lote", (ok(L.ini) && ok(L.fim) ? "estaca " + A.fmtEstaca(L.ini) + " a " + A.fmtEstaca(L.fim) + " · " : "") + (ok(L.ext) ? fmt(L.ext, 0) + " m" : "—") + (ok(L.area) ? " · " + fmt(L.area, 0) + " m²" : "")],
            ["Ligante", r.lig]];
          r.medL.forEach(function (m, i) { if (ok(m)) rows.push(["Taxa de ligante — média" + (r.nl > 1 ? " (" + ord(i + 1) + " aplicação)" : ""), fmt(m, 2) + " l/m²"]); });
          r.medA.forEach(function (m, i) { if (ok(m)) rows.push(["Taxa de agregado — média (" + ord(i + 1) + " camada)", fmt(m, 1) + " kg/m²"]); });
          return rows;
        },
        extraHtml: function (calc) {
          var r = calc.resultados, g = tabGran(r, true);
          return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Critérios de aceitação</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "estatistico" }) +
            "<h2>Frequência dos ensaios e determinações</h2>" + A.htmlFrequencia(r.freqs, true) + (g ? "<h2>Granulometria do agregado por peneira</h2>" + g : "");
        },
      },
      exemplos: [],
    };
    if (cfg.norma) F.norma = cfg.norma;
    FE.FICHAS[ID] = F;
    // exemplos (precisam de F registrado para A.exemplos.importar)
    F.exemplos = (cfg.exemplos || []).map(function (ex) {
      return { nome: ex.nome, dados: function () {
        var d = ex.dados();
        d.params = Object.assign({}, F.padrao, d.params || {});
        (ex.importar || []).forEach(function (imp) { A.exemplos.importar(params, d, imp[0], imp[1]); });
        if (ex.depois) ex.depois(d);
        return d;
      } };
    });
    return F;
  }

  // ---------- utilidades para os exemplos ----------
  // bandejas digitadas: [[estaca, posição, valor], ...] → colunas
  function bandejas(lista, casas, reg) {
    return lista.map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: (reg || "Bandeja") + " " + (i + 1), x: fmt(x[2], casas === undefined ? 2 : casas).replace(/\./g, "") }; });
  }
  function verif(lista) { return lista.map(function (x) { return typeof x === "string" ? { atende: x } : { atende: x[0], real: x[1] === undefined ? "" : String(x[1]), nc: x[2] === undefined ? "" : String(x[2]), obs: x[3] || "" }; }); }

  // tipos de ligante e ensaios exigidos por carregamento (ids das fichas de recebimento; "a|b" = qualquer um)
  var LIG = {
    cap150: { id: "cap", nome: "CAP-150/200 (DNIT 095/2006-EM)", classes: ["150/200"], taxaLig: ["cap"],
      ens: [["pen", "penetração a 25 °C"], ["sf135", "viscosidade Saybolt-Furol a 135 °C"], ["fulgor", "ponto de fulgor"], ["espuma", "espuma"], ["ist", "índice de suscetibilidade térmica (penetração + ponto de amolecimento)"]] },
    rr2c: { id: "rr2c", nome: "Emulsão RR-2C (DNER-EM 369/97)", classes: ["RR-2C"], taxaLig: ["rr2c"], resMin: 67,
      ens: [["residuo|solv", "resíduo (destilação NBR 6568)"], ["pen084", "peneiramento"], ["desem", "desemulsibilidade"], ["carga", "carga da partícula"]] },
  };

  // ---------- tratamentos superficiais simples, duplo e triplo (DNIT 146, 147 e 148/2012-ES) ----------
  // o: {id, codigo, nome ("simples"), nc (camadas), rec: [[lig mín, lig máx, agr mín, agr máx] por camada] (Tabela 2),
  //     faixas: [[ids das faixas da Tabela 1 admitidas] por camada], ligUnico (seção), resumo, exemplos}
  function tratamento(o) {
    var nc = o.nc, REFS = { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "Tabela 1 da DNER-PRO 277/97" };
    function nomeCam(c) { return nc === 1 ? "camada única" : ord(c) + " camada"; }
    var params = [];
    for (var c = 1; c <= nc; c++) (function (c) {
      var r = o.rec[c - 1];
      params.push({ k: "projL" + c, r: "Taxa de ligante de projeto — " + nomeCam(c) + " (l/m²)", ph: "ex.: " + fmt((r[0] + r[1]) / 2, 1),
        dica: "fixada no projeto e ajustada no campo (5.1.4 a); recomendada " + fmt(r[0], 1) + " a " + fmt(r[1], 1) + " l/m² (Tabela 2); tolerância ± 0,2 l/m² (7.2.2 a)" });
      params.push({ k: "projA" + c, r: "Taxa de agregado de projeto — " + nomeCam(c) + " (kg/m²)", ph: "ex.: " + fmt((r[2] + r[3]) / 2, 0),
        dica: "recomendada " + r[2] + " a " + r[3] + " kg/m² (Tabela 2); tolerância ± 1,5 kg/m² (7.2.2 c)" });
      params.push({ k: "faixa" + c, r: "Faixa granulométrica do agregado — " + nomeCam(c) + " (Tabela 1)", tipo: "select", recarrega: true,
        opcoes: function () { return o.faixas[c - 1].map(function (id) { var f = faixaPorId(id); return [id, f ? "Faixa " + f.faixa + (f.condicao ? " (" + f.condicao + ")" : "") : id]; }); } });
    })(c);
    var padrao = { ligante: "cap", nCarreg: "1", nAplic: String(nc), jornadas: "1", laDesemp: "nao" };
    for (c = 1; c <= nc; c++) padrao["faixa" + c] = o.faixas[c - 1][0];
    function limTaxa(P, c, lg, tipo) {
      var ehL = tipo === "L", pj = num(P["proj" + tipo + c]), tol = ehL ? 0.2 : 1.5, u = ehL ? "l/m²" : "kg/m²", cs = ehL ? 2 : 1, r = o.rec[c - 1];
      var rec = ehL ? [r[0], r[1]] : [r[2], r[3]];
      var x = { sec: (ehL ? "7.2.2 a" : "7.2.2 c") + " / 7.5", min: ok(pj) ? pj - tol : NaN, max: ok(pj) ? pj + tol : NaN, avisos: [] };
      x.txt = ok(pj) ? fmt(pj - tol, cs) + " a " + fmt(pj + tol, cs) + " " + u + " (projeto " + fmt(pj, cs) + " ± " + fmt(tol, 1) + ")" : "projeto ± " + fmt(tol, 1) + " " + u;
      x.falta = "informe a taxa de projeto " + (ehL ? "do ligante" : "do agregado") + " da " + nomeCam(c);
      if (ok(pj) && (pj < rec[0] - EPS || pj > rec[1] + EPS)) x.avisos.push("Taxa de projeto " + (ehL ? "do ligante" : "do agregado") + " da " + nomeCam(c) + " (" + fmt(pj, cs) + " " + u +
        ") fora da recomendada de " + fmt(rec[0], cs) + " a " + fmt(rec[1], cs) + " " + u + " (Tabela 2) — admissível se fixada no projeto e ajustada no campo (5.1.4).");
      if (ehL && lg.id === "rr2c" && c === 1) x.avisos.push("A tolerância de ± 0,2 l/m² está escrita no caso do cimento asfáltico (7.2.2 a); para a RR-2C (7.2.2 b) a ES não repete o valor — aplicada por analogia.");
      return x;
    }
    return criar({
      id: o.id, codigo: o.codigo, titulo: "Tratamento superficial " + o.nome + " — aceitação de lote", resumo: o.resumo,
      refs: REFS, secConf: "7.5", secPlano: "7.4", secLig: "5.1.1", secTaxa: "7.2.2 a, b", secTaxaAgr: "7.2.2 c", secTemp: "7.2.1", secReceb: "7.1.1", secReceb100: "7.1.1",
      servicos: [o.id.split("-")[1]], ligantes: [LIG.cap150, LIG.rr2c], ligUnico: o.ligUnico,
      recebFichas: ["dnit-095-2006-em", "dnit-165-2013-em"], nomeResiduo: "resíduo da emulsão",
      maxLig: nc, maxAgr: nc, nLig: function () { return nc; }, nAgr: function () { return nc; },
      nomeLig: function (c) { return nc === 1 ? "Ligante" : "Ligante — " + nomeCam(c); },
      nomeAgr: nomeCam,
      nomeTaxaLig: function (P) { return P.ligante === "rr2c" ? "taxa T da emulsão" : "taxa T do cimento asfáltico"; },
      limLig: function (P, c, lg) { return limTaxa(P, c, lg, "L"); },
      limAgr: function (P, c, lg) { return limTaxa(P, c, lg, "A"); },
      params: params, padrao: padrao,
      freqTaxa: { tipo: "3000", sec: "7.2.2 d" },
      agregado: { laMax: 40, secLA: "5.1.3 a", secIF: "5.1.3 b", secDur: "5.1.3 c", secGran: "5.1.3 d / 7.1.2", secAdes: "5.1.2 / 7.1.2", secMelh: "5.1.2 / 5.3 c / 7.1.3",
        secFreq: "7.1.2", secQual: "5.1.3", tabGran: "1" },
      produto: { regua: "7.3.1", alinh: "7.3.2" },
      verif: [
        { id: "clima", texto: "Condições para distribuir o ligante: temperatura ambiente ≥ 10 °C, sem chuva, superfície sem excesso de umidade", secao: "4 a", exigido: "atendidas em todas as aplicações" },
        { id: "cert", texto: "Certificado do fabricante/distribuidor em cada carregamento", secao: "4 b", exigido: "certificado com os ensaios de caracterização" },
        { id: "e100", texto: "Ensaios a cada 100 t: Saybolt-Furol a diferentes temperaturas (relação viscosidade × temperatura)", secao: "7.1.1", exigido: "1 a cada 100 t",
          freq: function (P) { var t = num(P.ton); return { exigido: ok(t) ? A.nMin(t, 100) : NaN, regra: "1 a cada 100 t" }; }, metodo: "DNER-ME 004" },
        { id: "melh", texto: "Adesividade do ligante com melhorador, a cada incorporação do aditivo (se usado)", secao: "7.1.3", exigido: "satisfatória (NBR 14329)", opcional: true, naoRegistrado: "exigido só quando se usa melhorador de adesividade" },
        { id: "exec", texto: "Execução: ligante em toda a largura de uma só vez, agregado logo após, compressão imediata, sem tráfego durante a aplicação", secao: "5.3 d, f, g, i", exigido: "conforme 5.3" },
      ],
      notas: "Taxas por bandeja (7.2.2): cimento asfáltico T = (P₂ − P₁)/A; RR-2C: TR = (P₂ − P₁)/A após a ruptura total e T pelo resíduo do carregamento; agregado: massa espalhada por área (ficha de taxa por bandeja). " +
        "Aceitação: taxa de projeto ± 0,2 l/m² (ligante) e ± 1,5 kg/m² (agregado) em cada camada, com o controle estatístico de 7.5 (k \"tabelado\": adotada a Tabela 1 da DNER-PRO 277/97, citada em 7.4); mínimo de 5 determinações por segmento de área inferior a 3.000 m² (7.2.2 d). " +
        "Agregado: Los Angeles ≤ 40 % (maior, com desempenho anterior satisfatório), índice de forma > 0,5, durabilidade < 12 %, granulometria na faixa de projeto (curva de projeto ± tolerância da Tabela 1) por jornada; adesividade a cada carregamento de ligante. " +
        "Produto: réguas de 1,20 m e 3,00 m (variação ≤ 0,5 cm) e alinhamento (± 5 cm) nas estacas de locação (7.3). Métodos citados e substituídos: DNER-ME 035 → DNIT 451; DNER-ME 083 → DNIT 412; DNER-ME 086 → DNIT 424; DNER-ME 078 → DNIT 452.",
      exemplos: o.exemplos,
    });
  }

  FE.aceitacaoG4a = { criar: criar, tratamento: tratamento, K_277: K_277, LIG: LIG, bandejas: bandejas, verif: verif, faixaPorId: faixaPorId, kPen: kPen };

  // =====================================================================================
  // DNIT 144/2014-ES — Imprimação com ligante asfáltico
  // =====================================================================================
  var REFS144 = { reprova: "7.5 a", atende: "7.5 a", corrige: "7.5 b", regra: "7.5", tabela: "Tabela 1 da DNER-PRO 277/97" };
  var USUAL = { eai: [0.9, 1.7], cm30: [0.8, 1.6] };
  criar({
    id: "dnit-144-2014-es-aceitacao", norma: "dnit-144-2014-es", codigo: "DNIT 144/2014-ES",
    titulo: "Imprimação — aceitação de lote",
    resumo: "Reúne as taxas de aplicação por bandeja (importadas da ficha de taxa ou digitadas), o recebimento dos carregamentos de ligante (EAI ou CM-30), as temperaturas e as verificações; " +
      "aplica o controle estatístico da taxa T (projeto ± 0,2 l/m², 5.3 e e 7.5) com o k da DNER-PRO 277/97 e confere a frequência (7.2.2 b, c).",
    refs: REFS144, secConf: "7.5", secPlano: "7.4", secLig: "5.1 a", secTaxa: "7.2.2 a", secTemp: "7.2.1", secReceb: "7.1.1 a / 7.1.2 a", secReceb100: "7.1.1 b / 7.1.2 b",
    servicos: ["144"],
    ligantes: [
      { id: "eai", nome: "Emulsão asfáltica EAI (DNIT 165/2013-EM)", classes: ["EAI"], taxaLig: ["eai"], resMin: 45,
        ens: [["sf25", "viscosidade Saybolt-Furol a 25 °C"], ["residuo", "resíduo por evaporação"], ["pen084", "peneiração"], ["carga", "carga da partícula"]] },
      { id: "cm30", nome: "Asfalto diluído CM-30 (DNER-EM 363/97)", classes: ["CM-30"], taxaLig: ["cm30"],
        ens: [["vcin", "viscosidade cinemática a 60 °C"], ["fulgor", "ponto de fulgor (vaso aberto Tag)"]] },
    ],
    recebFichas: ["dnit-165-2013-em", "dner-em-363-97", "dner-em-362-97"], nomeResiduo: "resíduo por evaporação (EAI) ou a 360 °C (CM-30)",
    nomeLig: function () { return "Imprimação"; },
    nomeTaxaLig: function () { return "taxa de aplicação T"; },
    limLig: function (P, c, lg) {
      var pj = num(P.projL), o = { sec: "5.3 e / 7.5", min: ok(pj) ? pj - 0.2 : NaN, max: ok(pj) ? pj + 0.2 : NaN };
      o.txt = ok(pj) ? fmt(pj - 0.2, 2) + " a " + fmt(pj + 0.2, 2) + " l/m² (projeto " + fmt(pj, 2) + " ± 0,2)" : "projeto ± 0,2 l/m²";
      var u = USUAL[lg.id];
      if (ok(pj) && u && (pj < u[0] || pj > u[1])) o.avisos = ["Taxa de projeto de " + fmt(pj, 2) + " l/m², fora da ordem usual de " + fmt(u[0], 1) + " a " + fmt(u[1], 1) + " l/m² para " + lg.nome.replace(/ \(.*/, "") + " (5.1 b) — admissível se fixada experimentalmente na obra (taxa absorvida em 24 h)."];
      return o;
    },
    params: [{ k: "projL", r: "Taxa de aplicação T de projeto, ajustada no campo (l/m²)", ph: "ex.: 1,20", dica: "tolerância ± 0,2 l/m² (5.3 e); usual 0,8–1,6 (CM-30) ou 0,9–1,7 (EAI) (5.1 b)" }],
    freqTaxa: { tipo: "4000", sec: "7.2.2 b", secPlano: "7.2.2 c e 7.4" },
    verif: [
      { id: "clima", texto: "Condições para distribuir o ligante: temperatura ambiente ≥ 10 °C, sem chuva, base sem excesso de umidade", secao: "4 a", exigido: "atendidas em todas as aplicações" },
      { id: "cert", texto: "Certificado do fabricante/distribuidor em cada carregamento", secao: "4 b", exigido: "certificado com os ensaios de caracterização" },
      { id: "visual", texto: "Homogeneidade da aplicação, penetração do ligante na base e efetiva cura (inspeção visual)", secao: "7.3", exigido: "sem falhas; falhas corrigidas (5.3 g)" },
      { id: "e100", texto: "Ensaios a cada 100 t: viscosidade Saybolt-Furol em 3 temperaturas e destilação (CM-30) ou sedimentação (EAI)", secao: "7.1.1 b / 7.1.2 b", exigido: "1 conjunto a cada 100 t",
        freq: function (P) { var t = num(P.ton); return { exigido: ok(t) ? A.nMin(t, 100) : NaN, regra: "1 a cada 100 t" }; }, metodo: "NBR 14491 / 14856 / 6570" },
      { id: "expos", texto: "Exposição da base imprimada ao tráfego, após a cura, ≤ 30 dias", secao: "5.3 f", exigido: "≤ 30 dias", opcional: true, falha: "ressalva", naoRegistrado: "registre quando a base imprimada for aberta ao tráfego" },
    ],
    notas: "Taxa de aplicação T por bandeja (7.2.2 a): TR = (P₂ − P₁)/A com a bandeja pesada após a cura total; T = TR / resíduo do carregamento (calculada na ficha de taxa por bandeja). " +
      "Aceitação: T de projeto ± 0,2 l/m² (5.3 e) com o controle estatístico de 7.5. Frequência: segmento de até 4.000 m² — mínimo de 5 determinações (7.2.2 b); de 4.000 a 20.000 m² — plano de amostragem variável aprovado (7.2.2 c, 7.4). " +
      "Recebimento (7.1): cada carregamento com os ensaios de 7.1.1 a (CM-30: viscosidade cinemática a 60 °C e fulgor) ou 7.1.2 a (EAI: Saybolt-Furol a 25 °C, resíduo por evaporação, peneiração e carga da partícula); a DNER-EM 362/97 (CR) é aceita na importação só para acusar ligante não admitido.",
    padrao: { ligante: "eai", nCarreg: "1", nAplic: "1" },
    exemplos: [
      { nome: "Lote aceito — imprimação com EAI, 12 bandejas (exemplo da ficha de taxa) em 2.400 m²", importar: [["impTaxa", [["dnit-144-2014-es", 0]]]],
        dados: function () {
          return { ident: { registro: "LOTE-IMP-001", data: "2026-01-25", obra: "Obra A", trecho: "Rua C / Rua B", local: "Est. 0 a 20", camada: "Imprimação — EAI" },
            params: { estIni: "0", estFim: "20", largura: "6,00", ligante: "eai", projL: "1,10", tMin: "20", tMax: "40", nAplic: "2", nCarreg: "1", ton: "8" },
            rec: [{ reg: "REC-EAI-01 · DNIT 165 (digitado)", classe: "EAI", sit: "aprovado", res: "58,6" }],
            temp: [{ est: "0", reg: "carga 1", t: "32" }, { est: "10", reg: "carga 2", t: "34" }],
            verif: verif(["S", "S", "S", ["S", 1, 0], "S"]), obs: "Taxas das bandejas importadas do exemplo da ficha de taxa por bandeja (planilha de 25/01/2026)." };
        },
        depois: function (d) { d.lig1.forEach(function (c, i) { if (c.imp) c.est = String([1, 1, 1, 6, 6, 6, 11, 11, 11, 16, 16, 16][i] || c.est); }); } },
      { nome: "Lote rejeitado — CM-30 com taxa baixa e carregamento reprovado; 6.000 m² sem plano de amostragem", importar: [["impReceb", [["dner-em-363-97", 1]]]],
        dados: function () {
          var t = [0.92, 0.98, 1.05, 0.88, 0.95, 1.10, 0.90, 0.97, 1.02, 0.86], ests = [51, 53, 55, 58, 61, 64, 67, 70, 73, 76];
          return { ident: { registro: "LOTE-IMP-002", data: "2026-03-10", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 50 a 80", camada: "Imprimação — CM-30" },
            params: { estIni: "50", estFim: "80", largura: "10,00", ligante: "cm30", projL: "1,20", tMin: "40", tMax: "60", nAplic: "3", nCarreg: "2", ton: "12" },
            lig1: bandejas(t.map(function (v, i) { return [ests[i], ["LE", "eixo", "LD"][i % 3], v]; })),
            temp: [{ est: "50", t: "52" }, { est: "60", t: "66" }, { est: "70", t: "55" }],
            verif: verif(["S", ["N", 2, 1, "sem certificado do 2º carregamento"], "S", ["", 0, 0], ""]), obs: "Exemplo de reprovação." };
        } },
    ],
  });
})();
