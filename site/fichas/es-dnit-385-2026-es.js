/*
 * Ficha de ES: DNIT 385/2026-ES — Concreto asfáltico com ligante modificado por polímero elastomérico —
 * ACEITAÇÃO DE LOTE (piloto das fichas de especificação de serviço).
 * Chave própria "dnit-385-2026-es-aceitacao" (a chave "dnit-385-2026-es" é a dosagem Marshall, marshall-dosagem.js).
 *
 * Reúne os resultados de um lote executado (importados das fichas ME ou digitados), confere a frequência mínima
 * da ES e aplica os critérios de aceitação:
 *  - usinagem (7.2, Anexo E — avaliação individual): teor de CAP ± 0,3 % (7.2.2); granulometria do agregado
 *    extraído na faixa de trabalho = projeto ± Tabela 3, limitada pela faixa da Tabela 1 (5.2, 7.2.3, Anexo B);
 *    Vv, RBV e VAM dos CPs de usina (Tabelas 4 e 5 — condição de 7.2.2); estabilidade (Tabela 4, informativa na
 *    produção); Gmm (Rice, 7.2.4 a); RT diária (7.2.4 c); dano por umidade a cada 5 dias (7.2.4 d); temperaturas
 *    (5.4.4, 5.4.5, 7.2.1, 7.3.1);
 *  - execução (7.3 — controle estatístico de 7.5 com o k da Tabela A1): grau de compactação 97–100 % (7.3.1, eq. 1),
 *    espessura ± 5 % (7.3.2), cotas −1/+2 cm, alinhamento ± 5 cm, largura ≥ projeto (7.3.3), deflexão (7.3.4, se
 *    houver valor de projeto), régua de 3 m ≤ 0,5 cm e IRI (7.3.5), mancha de areia, pêndulo britânico ou IFI (7.3.6);
 *  - insumos (7.1) e condições gerais (4, 5.4.1) por contagem.
 * Parecer: REJEITADO (algum critério não conforme) / PENDENTE (falta ensaio obrigatório) / ACEITO COM RESSALVA /
 * ACEITO, com os motivos e as providências que a ES manda.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media, G = FE.granulometria;
  var ID = "dnit-385-2026-es-aceitacao", RHO = 0.9971;  // DNIT 428 eq. 7: MEa = 0,9971 × Gmb

  // ---------- Tabela A1 (Anexo A, p. 25) — amostragem variável ----------
  // É a tabela padrão da biblioteca (A.K_DNIT: n = 5…17, 19, 21 → k = 1,55…1,01); n não tabelado (18, 20): k do maior n
  // tabelado abaixo (mais exigente); n > 21: k = 1,01; n < 5: sem k (avaliação individual). Ver A.estatistica.

  // ---------- faixas (Tabela 1), TNM para a Tabela 5 e pontos de controle (Tabela 2) ----------
  var FX = {
    "dnit-385-2026-es-A-25": { nome: "A-25", vam: "25", tnm: 25.4, pcp: 4.8, ctrl: 40 },
    "dnit-385-2026-es-B-19": { nome: "B-19", vam: "19", tnm: 19.1, pcp: 4.8, ctrl: 47 },
    "dnit-385-2026-es-C-12-5": { nome: "C-12,5", vam: "12.5", tnm: 12.7, pcp: 2.36, ctrl: 39 },
    "dnit-385-2026-es-D-9-5": { nome: "D-9,5", vam: "9.5", tnm: 9.5, pcp: 2.36, ctrl: 47 },
  };
  // Tabela 5 — VAM mínimo por TNM e Vv (3, 4, 5 %), interpolado
  var VAM = { "25": [11, 12, 13], "19": [12, 13, 14], "12.5": [13, 14, 15], "9.5": [14, 15, 16] };
  function vamMinimo(fxId, vv) {
    var l = FX[fxId] && VAM[FX[fxId].vam];
    if (!l || !ok(vv)) return NaN;
    var v = Math.min(Math.max(vv, 3), 5);  // fora de 3–5 %: extremo da tabela (o Vv já não atende)
    return v <= 4 ? l[0] + (l[1] - l[0]) * (v - 3) : l[1] + (l[2] - l[1]) * (v - 4);
  }
  function faixaDe(P) { return G.faixasDisponiveis().filter(function (f) { return f.id === P.faixa; })[0] || null; }
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  // Tabelas D1, D2, D3 (Anexo D) — classes
  var CL_VDR = [[25, "1 – Perigosa"], [32, "2 – Muito lisa"], [40, "3 – Lisa"], [47, "4 – Insuficientemente rugosa"], [55, "5 – Medianamente rugosa"], [75, "6 – Rugosa"], [Infinity, "7 – Muito rugosa"]];
  var CL_HS = [[0.2, "1 – Muito fina"], [0.4, "2 – Fina"], [0.6, "3 – Medianamente fina"], [0.8, "4 – Média"], [1.0, "5 – Medianamente grossa"], [1.2, "6 – Grossa"], [Infinity, "7 – Muito grossa"]];
  var CL_IFI = [[0.06, "1 – Péssimo"], [0.09, "2 – Muito ruim"], [0.12, "3 – Ruim"], [0.15, "4 – Regular"], [0.22, "5 – Bom"], [0.35, "6 – Muito bom"], [Infinity, "7 – Ótimo"]];
  function classe(tab, v) { if (!ok(v)) return ""; for (var i = 0; i < tab.length; i++) if (v < tab[i][0]) return tab[i][1]; return ""; }

  // ---------- estacas e utilidades (biblioteca) ----------
  // "20+10,5" → 20 × 20 + 10,5 = 410,5 m; "20" → 400 m (formato estrito: "100+00 a 110+00" não é estaca)
  function estacaM(s) { return A.estacaM(s, { estrito: true }); }
  var nstr = A.nstr, fmtR = A.fmtR, dataBR = A.dataBR, lim = A.txtLimites;
  function ceil(x) { return A.nMin(x); }

  // ---------- lote ----------
  function lote(P) {
    var L = A.lote(P, { estrito: true }), horas = num(P.horas), dias = num(P.dias);
    var sem = NaN;
    if (P.dataIni && P.dataFim) {
      var d0 = Date.parse(P.dataIni), d1 = Date.parse(P.dataFim);
      if (ok(d0) && ok(d1) && d1 >= d0) sem = Math.ceil((Math.round((d1 - d0) / 864e5) + 1) / 7);
    }
    if (!ok(sem) && ok(dias)) sem = ceil(dias / 7);
    return Object.assign(L, { horas: horas, per: ceil(horas / 4), dias: dias, sem: sem,
      cargas: num(P.nCargas), nCap: num(P.nCap), nFr: ok(num(P.nFracoes)) ? num(P.nFracoes) : 3 });
  }
  function rolamento(P) { return (P.camada || "rolamento") === "rolamento"; }
  function revestimento(P) { return P.camada !== "base"; }

  // ---------- estatística (7.5) ----------
  // lado: mín. e máx., só mín., só máx. n ≥ 5: X̄ − ks ≥ mín. e/ou X̄ + ks ≤ máx. (eq. 2 e 3, Tabela A1);
  // 1 ≤ n < 5: a Tabela A1 não dá k — cada valor individual deve atender.
  function estat(vals, min, max) { return A.estatistica(vals, min, max); }

  // ---------- critérios ----------
  var PESO = { nc: 4, pend: 3, ressalva: 2, ok: 1, info: 0, na: -1 };
  function pior(a, b) { return (PESO[a] || 0) >= (PESO[b] || 0) ? a : b; }
  // crit: {grupo, nome, secao, exig, real, resultado, criterio, sit, motivos[], est?}
  function novoCrit(grupo, nome, secao, criterio) {
    return { grupo: grupo, nome: nome, secao: secao, criterio: criterio, exig: NaN, real: 0, resultado: "—", sit: "ok", motivos: [] };
  }
  function marca(c, sit, motivo) { c.sit = pior(c.sit, sit); if (motivo) c.motivos.push({ sit: sit, t: motivo }); }
  function frequencia(c, exig, real, unid) {
    c.exig = exig; c.real = real;
    if (!ok(exig)) return;
    if (real === 0 && exig > 0) marca(c, "pend", "nenhuma determinação (mínimo " + exig + " " + unid + ")");
    else if (real < exig) marca(c, "ressalva", "frequência abaixo da mínima: " + real + " de " + exig + " " + unid);
  }
  // critério estatístico da execução (7.3/7.5)
  function critEstat(c, e, casas, u, rotulo) {
    c.est = e; c.casas = casas; c.u = u;
    if (!e.n) { c.resultado = "—"; return c; }
    if (e.modo === "estatistico") {
      c.resultado = "n = " + e.n + " · X̄ = " + fmtR(e.X, casas) + " · s = " + fmt(e.s, casas + 1) + " · k = " + fmt(e.k, 2) +
        (ok(e.min) ? " · X̄ − ks = " + fmtR(e.inf, casas) : "") + (ok(e.max) ? " · X̄ + ks = " + fmtR(e.sup, casas) : "");
      var lst = e.fora.map(function (x) { return (x.rot ? x.rot + ": " : "") + fmt(x.v, casas); }).join("; ");
      if (e.okMin === false) marca(c, "nc", "X̄ − ks = " + fmtR(e.inf, casas) + u2(u) + " < " + fmt(e.min, casas) + u2(u) + (rotulo ? " — " + rotulo : ""));
      if (e.okMax === false) marca(c, "nc", "X̄ + ks = " + fmtR(e.sup, casas) + u2(u) + " > " + fmt(e.max, casas) + u2(u) + (rotulo ? " — " + rotulo : ""));
      if (e.fora.length && !e.conforme) c.motivos[c.motivos.length - 1].t += "; valores individuais fora: " + lst;
      if (e.fora.length && e.conforme) marca(c, "ressalva", e.fora.length + " valor(es) individual(is) fora do limite (" + lst + ") — o controle estatístico atende; verificar/corrigir o(s) ponto(s)" + (rotulo ? "; " + rotulo : ""));
      if (!e.kInfo.exato) c.resultado += " (" + (e.n > 21 ? "n > 21: k de n = 21" : "k de n = " + e.kInfo.nTab) + ", Tabela A1)";
    } else {
      c.resultado = "n = " + e.n + " < 5 — avaliação individual: " + fmt(e.vMin, casas) + (e.n > 1 ? " a " + fmt(e.vMax, casas) : "") + u2(u);
      if (e.fora.length) marca(c, "nc", e.fora.length + " valor(es) fora do limite (" + e.fora.map(function (x) {
        return (x.rot ? x.rot + ": " : "") + fmt(x.v, casas);
      }).join("; ") + ")" + (rotulo ? " — " + rotulo : ""));
    }
    return c;
  }
  function u2(u) { return u ? " " + u : ""; }
  // critério individual (usinagem, Anexo E); sufixo = providência acrescentada ao motivo da falha
  function critIndiv(c, vals, min, max, casas, u, sitFalha, sufixo) {
    var v = vals.filter(function (x) { return ok(x.v); });
    c.casas = casas; c.u = u;
    if (!v.length) return c;
    var xs = v.map(function (x) { return x.v; });
    c.resultado = (v.length > 1 ? fmt(Math.min.apply(null, xs), casas) + " a " + fmt(Math.max.apply(null, xs), casas) : fmt(xs[0], casas)) + u2(u) +
      (v.length > 1 ? " (média " + fmt(media(xs), casas) + ")" : "");
    var fora = v.filter(function (x) { return (ok(min) && x.v < min - 1e-9) || (ok(max) && x.v > max + 1e-9); });
    if (fora.length) marca(c, sitFalha || "nc", fora.length + " de " + v.length + " fora (" + fora.map(function (x) { return (x.rot ? x.rot + ": " : "") + fmt(x.v, casas); }).join("; ") + ")" + (sufixo ? " — " + sufixo : ""));
    return c;
  }
  function contar(arr, k) { return (arr || []).filter(function (p) { return ok(num(p[k])); }).length; }
  function valsDe(arr, k, rot) {
    return (arr || []).map(function (p, i) { return { v: num(p[k]), rot: rot(p, i), x: estacaM(p.est) }; });
  }

  // ---------- parâmetros ----------
  var SIM_NAO = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  function impDica(t) { return "marque os ensaios e clique em \"Importar selecionados\": " + t + " (substitui as colunas importadas antes; as colunas digitadas e o que foi digitado nas importadas são mantidos)"; }
  // põe as colunas importadas na tabela (A.importacao.substituir: mantém colunas e campos digitados à mão)
  function importar(d, chave, cols) { A.importacao.substituir(d, chave, cols); }
  var params = [
    // lote
    { k: "estIni", r: "Estaca inicial do lote", ph: "ex.: 20+00", dica: "estaca de 20 m: 20+10,5 = 410,5 m" },
    { k: "estFim", r: "Estaca final do lote", ph: "ex.: 45+00" },
    { k: "ext", r: "Extensão do lote (m) — opcional", ph: "pelas estacas", dica: "vazio = diferença entre as estacas" },
    { k: "largura", r: "Largura executada (m)", dica: "com a extensão, dá a área do lote" },
    { k: "pista", r: "Pista / faixa / lado", ph: "ex.: pista direita, faixa 1" },
    { k: "camada", r: "Camada (seção 4 a)", tipo: "select", recarrega: true,
      opcoes: [["rolamento", "Rolamento (revestimento)"], ["ligacao", "Ligação (binder)"], ["base", "Base, regularização ou reforço"]],
      dica: "régua de 3 m só em revestimento (7.3.5); IRI e condições de segurança só na camada de rolamento (7.3.5, 7.3.6)" },
    { k: "obra", r: "Tipo de obra", tipo: "select", opcoes: [["nova", "Implantação — pavimento novo (IRI ≤ 2,0; IFI ≥ 0,22)"], ["rest", "Restauração (IRI ≤ 2,4; IFI ≥ 0,15)"]] },
    { k: "ligante", r: "CAP modificado (5.1.1)", tipo: "select", opcoes: [["", "—"], ["55/75-E", "CAP 55/75-E"], ["60/85-E", "CAP 60/85-E"], ["65/90-E", "CAP 65/90-E"]] },
    // projeto
    { k: "faixa", r: "Faixa granulométrica do projeto (Tabela 1)", tipo: "select", recarrega: true,
      opcoes: [["", "—"]].concat(Object.keys(FX).map(function (k) { return [k, FX[k].nome + " (TNM " + fmt(FX[k].tnm, 1) + " mm)"]; })),
      dica: "a curva de projeto vai na tabela \"Curva granulométrica de projeto\"; faixa de trabalho = projeto ± Tabela 3, limitada pela faixa (Anexo B)" },
    { k: "teorProj", r: "Teor de CAP de projeto (%)", dica: "mistura total = 100 % (5.2); tolerância ± 0,3 % (7.2.2)" },
    { k: "gmbl", r: "Gmbl — densidade relativa aparente da dosagem", dica: "denominador do grau de compactação (eq. 1)" },
    { k: "gmmProj", r: "Gmm da dosagem (DNIT 427) — opcional", dica: "referência do Rice de controle (Anexo E: \"Dosagem\")" },
    { k: "espProj", r: "Espessura de projeto (cm)", dica: "± 5 % (7.3.2); deve ser ≥ 2,5 × TNM da faixa (5.2)" },
    { k: "largProj", r: "Largura de projeto da plataforma (m)", dica: "a largura acabada não pode ser inferior (7.3.3)" },
    { k: "tCap", r: "Temperatura do CAP indicada (°C)", dica: "faixa de viscosidade do fabricante, entre 140 e 177 °C (5.4.4); ± 5 °C (Anexo E)" },
    { k: "tMist", r: "Temperatura da mistura na saída da usina (°C)", dica: "± 5 °C (Anexo E, 7.2.1 c)" },
    { k: "tApl", r: "Temperatura de aplicação indicada em projeto (°C)", dica: "chegada e antes da compactação: ± 5 °C (7.3.1, Anexo E); evitar < 145 °C" },
    { k: "dProj", r: "Deflexão admissível de projeto (0,01 mm) — se houver", recarrega: "tabela",
      dica: "controle por deflexão só quando definido em contrato/projeto (7.3.4)" },
    { k: "seguranca", r: "Condições de segurança (7.3.6)", tipo: "select", recarrega: true,
      opcoes: [["mp", "Mancha de areia + pêndulo britânico"], ["ifi", "IFI — ASTM E1960 (opcional, em substituição)"]],
      se: function (d) { return rolamento(d.params || {}); } },
    { k: "hsMin", r: "Macrotextura HS mínima de projeto (mm)", dica: "Anexo D, Tabela D2 (ex.: 0,60 para 80–100 km/h)",
      se: function (d) { var P = d.params || {}; return rolamento(P) && P.seguranca !== "ifi"; } },
    { k: "hsMax", r: "Macrotextura HS máxima de projeto (mm) — opcional",
      se: function (d) { var P = d.params || {}; return rolamento(P) && P.seguranca !== "ifi"; } },
    { k: "rtMin", r: "RT mínima no controle diário", tipo: "select", opcoes: [["0,70", "0,70 MPa — Tabela 4 (7.5: condições da seção 5)"], ["0,65", "0,65 MPa — Anexo E"]],
      dica: "a ES diverge: Tabela 4 ≥ 0,70; Anexo E ≥ 0,65" },
    { k: "rrtMin", r: "Dano por umidade — RRT mínima", tipo: "select", opcoes: [["0,75", "0,75 — Tabela 4 (7.5: condições da seção 5)"], ["0,70", "0,70 — Anexo E"]],
      dica: "a ES diverge: Tabela 4 ≥ 0,75; Anexo E ≥ 0,70" },
    { k: "estMin", r: "Estabilidade Marshall mínima (75 golpes)", tipo: "select", opcoes: [["700", "700 kgf — Tabela 4"], ["500", "500 kgf — Anexo E"]],
      dica: "exigência de dosagem; na produção é informativa" },
    // produção
    { k: "dataIni", r: "Início da produção do lote", tipo: "date" },
    { k: "dataFim", r: "Fim da produção do lote", tipo: "date" },
    { k: "horas", r: "Horas de produção da usina no lote (h)", dica: "teor de CAP, granulometria, Rice, temperaturas do CAP e dos agregados: 1 a cada 4 h" },
    { k: "dias", r: "Dias de produção", dica: "RT e umidades: 1 por dia; dano por umidade: 1 a cada 5 dias (7.2.4 d)" },
    { k: "nCargas", r: "Caminhões (cargas) aplicados no lote", dica: "temperatura em cada caminhão (7.2.1 c, d)" },
    { k: "massa", r: "Massa de mistura aplicada (t) — opcional", dica: "medição em toneladas aplicadas (8 a)" },
    { k: "nCap", r: "Carregamentos de CAP recebidos no período", dica: "ensaios de 7.1.1 em todo carregamento" },
    { k: "nFracoes", r: "Frações de agregado (silos frios)", ph: "3", dica: "granulometria de cada fração a cada 4 h (7.1.2 a); mínimo de três frações (5.3.3)" },
    { k: "cal", r: "Material de enchimento (cal hidratada)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — granulometria diária (7.1.2 b)"]] },
    { k: "segExp", r: "Segmento experimental aceito pela fiscalização (5.4.1)", tipo: "select", opcoes: SIM_NAO },
    { k: "tSup", r: "Menor temperatura da superfície da pista na aplicação (°C) — opcional", dica: "> 10 °C; > 15 °C se a espessura for < 3 cm (4 c)" },
    { k: "chuva", r: "Houve aplicação com chuva?", tipo: "select", opcoes: SIM_NAO, dica: "não é permitida (4 b)" },
    // importações
    { k: "impUsina", r: "Extrações (teor + granulometria)", tipo: "importarVarios", de: ["dner-me-053-94", "dnit-412-2025-me"],
      dica: impDica("DNER-ME 053 (teor e granulometria do agregado recuperado) ou DNIT 412 (só granulometria)"),
      aplicar: function (lista, P, d) { importar(d, "usina", lista.map(colUsina).filter(Boolean)); } },
    { k: "impRice", r: "Densidade máxima medida (Rice)", tipo: "importarVarios", de: "dnit-427-2020-me", dica: impDica("DNIT 427"),
      aplicar: function (lista, P, d) {
        importar(d, "rice", lista.map(function (e) {
          var i = e.dados.ident || {}, r = e.resultados || {};
          return { reg: i.registro || "", data: dataBR(i.data), gmm: nstr(r.gmm, 3),
            obs: r.conforme === false ? "amostras fora de ± 0,020 da média (DNIT 427, seção 8)" : "" };
        }));
      } },
    { k: "impMar", r: "CPs de usina — Marshall (controle)", tipo: "importarVarios", de: "dnit-385-2026-es",
      dica: impDica("ficha de dosagem Marshall com um só teor (modo controle); dosagens com vários teores são ignoradas"),
      aplicar: function (lista, P, d) {
        var ign = [], cols = [];
        lista.forEach(function (e) {
          var i = e.dados.ident || {}, t = ((e.resultados || {}).teores) || [];
          if (t.length !== 1) { ign.push((i.registro || "sem registro") + " (" + t.length + " teores)"); return; }
          var u = t[0];
          cols.push({ reg: i.registro || "", data: dataBR(i.data), teor: nstr(u.teor, 2), gmb: nstr(u.gmb, 4), vv: nstr(u.vv, 2), rbv: nstr(u.rbv, 1),
            vam: nstr(u.vam, 2), est: nstr(u.est, 0), ncp: String(u.n) });
        });
        P.impMarIgn = ign.join("; ");
        importar(d, "mar", cols);
      } },
    { k: "impRt", r: "Resistência à tração (RT)", tipo: "importarVarios", de: "dnit-136-2018-me", dica: impDica("DNIT 136"),
      aplicar: function (lista, P, d) {
        importar(d, "rt", lista.map(function (e) {
          var i = e.dados.ident || {}, r = e.resultados || {};
          return { reg: i.registro || "", data: dataBR(i.data), rt: nstr(r.rt, 2),
            obs: r.pista ? "CPs extraídos da pista (o controle pede CPs moldados, DNIT 178)" : r.criterio === false ? "individual a mais de ± 10 % da média (DNIT 136, seção 6)" : "" };
        }));
      } },
    { k: "impDui", r: "Dano por umidade induzida (RRT)", tipo: "importarVarios", de: "dnit-180-2018-me", dica: impDica("DNIT 180"),
      aplicar: function (lista, P, d) {
        importar(d, "dui", lista.map(function (e) {
          var i = e.dados.ident || {}, r = e.resultados || {};
          return { reg: i.registro || "", data: dataBR(i.data), rrt: nstr(r.rrt / 100, 2),
            obs: r.sFora ? r.sFora + " CP(s) com saturação fora de 55–80 % (DNIT 180, 6.5 f)" : "" };
        }));
      } },
    { k: "impPista", r: "Pista — CPs extraídos ou densímetro", tipo: "importarVarios", de: ["dnit-428-2022-me", "dnit-431-2020-me"],
      dica: impDica("DNIT 428 (Gmb e altura de cada CP extraído) ou DNIT 431 (densidade corrigida de cada ponto)"),
      aplicar: function (lista, P, d) {
        var cols = [];
        lista.forEach(function (e) {
          var i = e.dados.ident || {}, r = e.resultados || {};
          if (e.ficha === "dnit-428-2022-me") {
            (r.cps || []).forEach(function (o) {
              if (!o.valido) return;
              cols.push({ est: i.local || "", pos: "CP " + o.nome, reg: (i.registro || "") + " — DNIT 428", gmb: nstr(o.gmb, 4), esp: nstr(o.H, 2) });
            });
          } else {
            (r.pts || []).forEach(function (o) {
              if (!ok(o.corr)) return;
              cols.push({ est: o.estaca || "", pos: o.posicao || "", reg: (i.registro || "") + " — DNIT 431", gmb: nstr(o.corr / RHO, 4) });
            });
          }
        });
        importar(d, "pista", cols);
      } },
  ];

  // coluna da tabela de usinagem a partir de uma extração (053) ou granulometria (412)
  function colUsina(e) {
    var i = e.dados.ident || {}, col = { reg: i.registro || "", data: dataBR(i.data), per: i.local || "" };
    var med = null;
    if (e.ficha === "dner-me-053-94") {
      var c = FE.FICHAS[e.ficha].calcular(e.dados);
      col.teor = nstr(c.resultados.teor, 2);
      col.orig = "DNER-ME 053/94";
      med = c.gr ? c.gr.resultados.media : null;
    } else {
      col.orig = "DNIT 412 (sem teor)";
      med = (e.resultados || {}).media;
    }
    (med || []).forEach(function (m) { if (ok(m.pass)) col[G.chavePen(m.mm)] = nstr(m.pass, 1); });
    return col;
  }

  // ---------- tabelas ----------
  var INS = [  // colunas fixas da tabela de insumos/rotina
    ["cap", "CAP — ensaios por carregamento (7.1.1 a–g)"], ["fr", "Granulometria de cada fração (7.1.2 a)"],
    ["mis", "Granulometria da mistura de agregados no secador (7.1.2 c)"], ["fil", "Granulometria da cal (7.1.2 b)"],
    ["uag", "Umidade da mistura de agregados após secagem < 0,3 % (7.1.2 d)"], ["ea", "Equivalente de areia ≥ 55 % (7.1.2 e)"],
    ["umi", "Umidade da mistura usinada < 0,3 % (7.2.4 b)"]];

  function tabelas(d) {
    var P = d.params || {}, fx = faixaDe(P), T = [];
    var pens = fx ? fx.peneiras : [];
    T.push({ chave: "proj", titulo: "Curva granulométrica de projeto — % passando", rotulo: "Curva", iniciais: 1, min: 1, fixo: true, nomes: ["Projeto"],
      dica: fx ? "do projeto de dosagem (faixa " + fx.faixa + ")" : "escolha a faixa do projeto nos parâmetros",
      linhas: pens.map(function (p) { return { k: G.chavePen(p.mm), r: p.nome + " — " + fmt(p.mm, p.mm < 1 ? 3 : 1) + " mm (faixa " + p.min + "–" + p.max + ")", u: "%" }; }) });
    T.push({ chave: "usina", titulo: "Usinagem — teor de CAP e granulometria do agregado extraído (7.2.2 e 7.2.3)", rotulo: "Amostra", iniciais: 1, min: 1,
      dica: "uma coluna por amostra (mínimo 1 a cada 4 h de produção, na primeira das 4 h); teor corrigido pela calibração do extrator",
      linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data", texto: true }, { k: "per", r: "Hora / período / caminhão", texto: true },
        { k: "orig", r: "Ensaio de origem", texto: true },
        { k: "teor", r: "Teor de CAP (corrigido pela calibração)", u: "%" }, { calc: "dTeor", r: "Desvio do teor de projeto (± 0,3 %)", u: "%", casas: 2, destaque: true },
        { grupo: "Agregado extraído — % passando (DNIT 412)" }]
        .concat(pens.map(function (p) { return { k: G.chavePen(p.mm), r: p.nome + " — " + fmt(p.mm, p.mm < 1 ? 3 : 1) + " mm", u: "%" }; }))
        .concat([{ calc: "nFora", r: "Peneiras fora da faixa de trabalho", u: "nº", casas: 0, destaque: true }]) });
    T.push({ chave: "rice", titulo: "Densidade máxima medida — Rice (7.2.4 a)", rotulo: "Ensaio", iniciais: 1, min: 1,
      dica: "1 a cada 4 h de trabalho, material solto da acabadora",
      linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data", texto: true }, { k: "gmm", r: "Gmm (DNIT 427)", u: "—" },
        { calc: "dGmm", r: "Diferença para o Gmm da dosagem", u: "—", casas: 3 }, { k: "obs", r: "Observação", texto: true }] });
    T.push({ chave: "mar", titulo: "CPs de usina — parâmetros volumétricos e estabilidade (7.2.2, Tabelas 4 e 5)", rotulo: "Conjunto", iniciais: 1, min: 1,
      dica: "médias de cada conjunto de CPs Marshall (75 golpes) moldados com a mistura produzida",
      linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data", texto: true }, { k: "teor", r: "Teor de CAP", u: "%" },
        { k: "gmb", r: "Gmb (DNIT 428)", u: "—" }, { k: "vv", r: "Volume de vazios Vv (3 a 5 %)", u: "%" }, { k: "rbv", r: "RBV (65 a 75 %)", u: "%" },
        { k: "vam", r: "VAM", u: "%" }, { calc: "vamMin", r: "VAM mínimo — Tabela 5 (TNM e Vv)", u: "%", casas: 1 },
        { k: "est", r: "Estabilidade corrigida", u: "kgf" }, { k: "ncp", r: "Nº de CPs", texto: true }] });
    T.push({ chave: "rt", titulo: "Resistência à tração por compressão diametral a 25 °C (7.2.4 c)", rotulo: "Ensaio", iniciais: 1, min: 1,
      dica: "1 por dia de produção, preferencialmente nas primeiras horas; CPs compactados conforme DNIT 178-PRO",
      linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data", texto: true }, { k: "rt", r: "RT (média)", u: "MPa" }, { k: "obs", r: "Observação", texto: true }] });
    T.push({ chave: "dui", titulo: "Dano por umidade induzida (7.2.4 d)", rotulo: "Ensaio", iniciais: 1, min: 1,
      dica: "1 a cada 5 dias de produção, preferencialmente no primeiro dos 5 dias",
      linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data", texto: true }, { k: "rrt", r: "RRT (razão RTc / RT)", u: "—" }, { k: "obs", r: "Observação", texto: true }] });
    T.push({ chave: "temp", titulo: "Temperaturas (5.4.4, 5.4.5, 7.2.1 e 7.3.1)", rotulo: "Carga", iniciais: 1, min: 1,
      dica: "uma coluna por caminhão; CAP e agregados ao menos a cada 4 h (início do turno)",
      linhas: [{ k: "carga", r: "Caminhão / nota", texto: true }, { k: "hora", r: "Hora", texto: true },
        { k: "tcap", r: "CAP antes do misturador (140–177 °C)", u: "°C" }, { k: "tagr", r: "Agregados antes do misturador (CAP + 10 a 15 °C; < 192 °C)", u: "°C" },
        { k: "tsai", r: "Mistura na saída da usina", u: "°C" }, { k: "tche", r: "Mistura na chegada à pista", u: "°C" },
        { k: "tesp", r: "Mistura após o espalhamento (antes da compactação)", u: "°C" }] });
    T.push({ chave: "pista", titulo: "Pista — grau de compactação e espessura (7.3.1 e 7.3.2)", rotulo: "Ponto", iniciais: 1, min: 1,
      dica: "mínimo 1 a cada 100 m, em locais aleatórios, após o resfriamento; os mesmos CPs extraídos servem à espessura e à densidade",
      linhas: [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: "Posição / CP", texto: true }, { k: "reg", r: "Registro / método", texto: true },
        { k: "gmb", r: "Gmbc — densidade relativa aparente de campo", u: "—" }, { calc: "gc", r: "GC = Gmbc / Gmbl × 100 (eq. 1)", u: "%", casas: 1, destaque: true },
        { k: "esp", r: "Espessura do CP extraído", u: "cm" }, { calc: "dEsp", r: "Desvio da espessura de projeto (± 5 %)", u: "%", casas: 1 }] });
    var geo = [{ k: "est", r: "Estaca", texto: true }, { grupo: "Nivelamento após a compactação: cota executada − cota de projeto (−1 a +2 cm)" },
      { k: "cLE", r: "Bordo esquerdo", u: "cm" }, { k: "cEixo", r: "Eixo", u: "cm" }, { k: "cLD", r: "Bordo direito", u: "cm" },
      { grupo: "Alinhamento — desvio em relação à locação (± 5 cm)" }, { k: "aEixo", r: "Eixo", u: "cm" }, { k: "aBordo", r: "Bordo", u: "cm" },
      { k: "larg", r: "Largura da plataforma (trena)", u: "m" }];
    if (ok(num(P.dProj))) geo.push({ k: "d0", r: "Deflexão máxima D0 (7.3.4)", u: "0,01 mm" });
    T.push({ chave: "geo", titulo: "Controle geométrico (7.3.3" + (ok(num(P.dProj)) ? " e 7.3.4" : "") + ")", rotulo: "Seção", iniciais: 1, min: 1,
      dica: "uma coluna por seção, no mínimo a cada 20 m", linhas: geo });
    if (revestimento(P)) {
      var sup = [{ k: "est", r: "Estaca / segmento", texto: true }, { k: "regua", r: "Régua de 3 m transversal — maior variação (≤ 0,5 cm)", u: "cm" }];
      if (rolamento(P)) {
        sup.push({ k: "iri", r: "IRI (DNIT 442-PRO)", u: "m/km" });
        if (P.seguranca === "ifi") sup.push({ k: "ifi", r: "IFI — F60 (ASTM E1960)", u: "—" });
        else sup.push({ k: "hs", r: "Mancha de areia — HS (ABNT NBR 16504)", u: "mm" }, { k: "vdr", r: "Pêndulo britânico — VDR (ABNT NBR 16780)", u: "—" });
      }
      T.push({ chave: "sup", titulo: "Acabamento da superfície" + (rolamento(P) ? " e condições de segurança (7.3.5 e 7.3.6)" : " (7.3.5)"), rotulo: "Segmento", iniciais: 1, min: 1,
        dica: rolamento(P) ? "régua e IRI a cada 200 m; mancha de areia, pêndulo ou IFI a cada 300 m (uma coluna por medição; deixe em branco o que não foi medido)" : "régua a cada 200 m",
        linhas: sup });
    }
    T.push({ chave: "ins", titulo: "Controle dos insumos e verificações de rotina (7.1 e 7.2.4 b) — contagem", rotulo: "Verificação", iniciais: INS.length, min: INS.length,
      fixo: true, nomes: INS.map(function (x) { return x[1]; }),
      dica: "número de ensaios realizados no período do lote e quantos tiveram resultado fora da especificação",
      linhas: [{ calc: "exig", r: "Mínimo exigido no período", u: "nº", casas: 0 }, { k: "real", r: "Realizados", u: "nº" },
        { k: "nc", r: "Com resultado fora da especificação", u: "nº" }] });
    return T;
  }

  // ---------- cálculo ----------
  function calcular(d) {
    var P = d.params || {}, L = lote(P), avisos = [], C = [], fx = faixaDe(P), fxi = FX[P.faixa];
    var teorProj = num(P.teorProj), tol = 0.3, gmbl = num(P.gmbl), gmmProj = num(P.gmmProj), espProj = num(P.espProj);
    var tab = {};

    // ---- dados do lote ----
    if (!ok(L.ext)) avisos.push("Informe as estacas inicial e final (ou a extensão) do lote: as frequências da execução dependem dela.");
    if (!ok(L.horas)) avisos.push("Informe as horas de produção: teor de CAP, granulometria, Rice e temperaturas são exigidos a cada 4 h.");
    if (!ok(L.dias)) avisos.push("Informe os dias de produção: RT (diária) e dano por umidade (a cada 5 dias) dependem deles.");
    if (!fx) avisos.push("Escolha a faixa granulométrica do projeto (Tabela 1).");
    if (fxi && ok(espProj) && espProj * 10 < 2.5 * fxi.tnm - 1e-9) avisos.push("Espessura de projeto de " + fmt(espProj, 1) + " cm menor que 2,5 × TNM da faixa " + fxi.nome +
      " (" + fmt(2.5 * fxi.tnm / 10, 2) + " cm) — 5.2.");
    if (P.impMarIgn) avisos.push("Importação de CPs de usina: ignorados os ensaios com mais de um teor (dosagem, não controle): " + P.impMarIgn + ".");

    // ---- condições gerais ----
    var cg = novoCrit("Condições gerais", "Segmento experimental e condições de execução", "4 b, 4 c, 5.4.1", "segmento experimental aceito; sem chuva; superfície > 10 °C (> 15 °C se esp. < 3 cm)");
    var partes = [];
    if (P.segExp === "sim") partes.push("segmento experimental aceito");
    else if (P.segExp === "nao") { partes.push("segmento experimental NÃO aceito"); marca(cg, "pend", "sem relatório de aceitação do segmento experimental (5.4.1)"); }
    else avisos.push("Informe se o segmento experimental foi aceito pela fiscalização (5.4.1).");
    if (P.chuva === "sim") { partes.push("aplicação com chuva"); marca(cg, "ressalva", "houve aplicação com chuva — não permitida (4 b)"); }
    else if (P.chuva === "nao") partes.push("sem chuva");
    var tSup = num(P.tSup), tLim = ok(espProj) && espProj < 3 ? 15 : 10;
    if (ok(tSup)) {
      partes.push("superfície ≥ " + fmt(tSup, 0) + " °C");
      if (tSup <= tLim) marca(cg, "ressalva", "superfície a " + fmt(tSup, 0) + " °C — a ES exige > " + tLim + " °C (4 c)");
    }
    cg.resultado = partes.length ? partes.join("; ") : "—";
    if (partes.length) C.push(cg);

    // ---- curva de projeto e faixa de trabalho (5.2, Tabela 3, Anexo B) ----
    var proj = (d.proj || [])[0] || {}, trab = [];
    if (fx) {
      var tolTab = fx.tolerancia || [];
      trab = fx.peneiras.map(function (p) {
        var pv = num(proj[G.chavePen(p.mm)]), t = tolTab.filter(function (x) { return perto(p.mm, x.mm); })[0];
        var o = { mm: p.mm, nome: p.nome, fmin: p.min, fmax: p.max, proj: pv, tol: t ? t.tol : NaN, min: NaN, max: NaN, ajuste: "" };
        if (ok(pv)) {
          var a = ok(o.tol) ? pv - o.tol : pv, b = ok(o.tol) ? pv + o.tol : pv;
          if (a < p.min) { a = p.min; o.ajuste = "mín."; }
          if (b > p.max) { b = p.max; o.ajuste += (o.ajuste ? " e " : "") + "máx."; }
          o.min = a; o.max = b;
          if (pv < p.min - 1e-9 || pv > p.max + 1e-9) avisos.push("Curva de projeto fora da faixa " + fx.faixa + " na peneira " + p.nome + " (" + fmt(pv, 1) + " %, faixa " + p.min + "–" + p.max + ") — 5.2.");
        }
        return o;
      });
      var comProj = trab.filter(function (o) { return ok(o.proj); });
      if (!comProj.length) avisos.push("Informe a curva granulométrica de projeto para construir a faixa de trabalho (5.2, Tabela 3).");
      else if (comProj.length < trab.length) avisos.push("Curva de projeto incompleta: " + (trab.length - comProj.length) + " peneira(s) sem % passando.");
      // fração retida entre peneiras consecutivas ≥ 4 %, exceto entre as duas maiores (5.2)
      for (var j = 2; j < trab.length; j++) {
        if (ok(trab[j - 1].proj) && ok(trab[j].proj) && trab[j - 1].proj - trab[j].proj < 4 - 1e-9)
          avisos.push("Curva de projeto: retido entre " + trab[j - 1].nome + " e " + trab[j].nome + " = " + fmt(trab[j - 1].proj - trab[j].proj, 1) + " % (< 4 %, 5.2).");
      }
    }
    var comport = null;
    if (fxi && fx) {
      var pcp = trab.filter(function (o) { return perto(o.mm, fxi.pcp); })[0];
      if (pcp && ok(pcp.proj)) comport = { pcp: fxi.pcp, pass: pcp.proj, ctrl: fxi.ctrl, graudo: pcp.proj < fxi.ctrl };
    }

    // ---- 7.2.2 teor de CAP e 7.2.3 granulometria ----
    var usina = (d.usina || []).map(function (u, i) {
      var o = { teor: num(u.teor) }, rot = "Amostra " + (i + 1) + (u.reg ? " (" + u.reg + ")" : "");
      o.dTeor = ok(o.teor) && ok(teorProj) ? o.teor - teorProj : NaN;
      o.pass = trab.map(function (t) { return num(u[G.chavePen(t.mm)]); });
      o.temGran = o.pass.some(ok);
      o.fora = [];
      if (o.temGran) trab.forEach(function (t, j) {
        var v = o.pass[j];
        if (ok(v) && ok(t.min) && (v < t.min - 1e-9 || v > t.max + 1e-9)) o.fora.push(t.nome + " " + fmt(v, 1) + " % (trabalho " + fmt(t.min, 0) + "–" + fmt(t.max, 0) + ")");
      });
      o.nFora = o.temGran && trab.some(function (t) { return ok(t.min); }) ? o.fora.length : NaN;
      o.rot = rot;
      return o;
    });
    tab.usina = usina;
    var cTeor = novoCrit("Usinagem", "Teor de CAP", "7.2.2", ok(teorProj) ? fmt(teorProj, 2) + " ± 0,3 % (" + fmt(teorProj - tol, 2) + " a " + fmt(teorProj + tol, 2) + " %)" : "projeto ± 0,3 %");
    frequencia(cTeor, L.per, usina.filter(function (o) { return ok(o.teor); }).length, "(1 a cada 4 h)");
    if (!ok(teorProj) && usina.some(function (o) { return ok(o.teor); })) avisos.push("Informe o teor de CAP de projeto.");
    critIndiv(cTeor, usina.map(function (o, i) { return { v: o.teor, rot: "amostra " + (i + 1) }; }), teorProj - tol, teorProj + tol, 2, "%", "nc", "ação corretiva imediata na usina (7.2)");
    C.push(cTeor);
    var cGran = novoCrit("Usinagem", "Granulometria do agregado extraído", "7.2.3, Tabela 3, Anexo B", "dentro da faixa de trabalho (projeto ± Tabela 3, limitada pela faixa " + (fx ? fx.faixa : "") + ")");
    var comGran = usina.filter(function (o) { return o.temGran; });
    frequencia(cGran, L.per, comGran.length, "(1 a cada 4 h)");
    if (comGran.length) {
      var nF = comGran.filter(function (o) { return o.fora.length; });
      cGran.resultado = comGran.length + " curva(s); " + (nF.length ? nF.length + " com peneira(s) fora da faixa de trabalho" : "todas dentro da faixa de trabalho");
      nF.forEach(function (o) {
        marca(cGran, "nc", o.rot + ": " + o.fora.join("; ") + " — a produção deveria ter sido interrompida e corrigida (7.2.3)");
      });
      if (!trab.some(function (t) { return ok(t.min); })) { cGran.resultado = comGran.length + " curva(s) — sem curva de projeto"; marca(cGran, "pend", "sem curva de projeto não há faixa de trabalho"); }
    }
    C.push(cGran);

    // ---- Rice (7.2.4 a) ----
    var rice = (d.rice || []).map(function (r) { var g = num(r.gmm); return { gmm: g, dGmm: ok(g) && ok(gmmProj) ? g - gmmProj : NaN }; });
    tab.rice = rice;
    var cRice = novoCrit("Usinagem", "Densidade máxima medida (Rice)", "7.2.4 a", "registrar (Anexo E: \"Dosagem\" — a ES não fixa tolerância)");
    var gv = rice.filter(function (r) { return ok(r.gmm); });
    frequencia(cRice, L.per, gv.length, "(1 a cada 4 h)");
    if (gv.length) {
      cRice.resultado = "Gmm " + (gv.length > 1 ? fmt(Math.min.apply(null, gv.map(function (r) { return r.gmm; })), 3) + " a " + fmt(Math.max.apply(null, gv.map(function (r) { return r.gmm; })), 3) : fmt(gv[0].gmm, 3)) +
        (ok(gmmProj) ? " · dosagem " + fmt(gmmProj, 3) + " (maior diferença " + fmt(Math.max.apply(null, gv.map(function (r) { return Math.abs(r.dGmm); })), 3) + ")" : "");
      if (cRice.sit === "ok") cRice.sit = "info";
    }
    (d.rice || []).forEach(function (r, i) { if (r.obs) avisos.push("Rice " + (i + 1) + (r.reg ? " (" + r.reg + ")" : "") + ": " + r.obs + "."); });
    C.push(cRice);

    // ---- CPs de usina: Vv, RBV, VAM, estabilidade (Tabelas 4 e 5) ----
    var estMin = num(P.estMin || "700");
    var mar = (d.mar || []).map(function (m) { var vv = num(m.vv); return { vv: vv, vamMin: vamMinimo(P.faixa, vv) }; });
    tab.mar = mar;
    var rotM = function (m, i) { return "conjunto " + (i + 1); };
    var nMar = (d.mar || []).filter(function (m) { return ok(num(m.vv)) || ok(num(m.est)); }).length;
    if (nMar) {
      var cVv = critIndiv(novoCrit("Usinagem", "Volume de vazios dos CPs de usina", "7.2.2, Tabela 4", "3 a 5 %"),
        (d.mar || []).map(function (m, i) { return { v: num(m.vv), rot: rotM(m, i) }; }), 3, 5, 2, "%");
      var cRbv = critIndiv(novoCrit("Usinagem", "Relação betume/vazios dos CPs de usina", "7.2.2, Tabela 4", "65 a 75 %"),
        (d.mar || []).map(function (m, i) { return { v: num(m.rbv), rot: rotM(m, i) }; }), 65, 75, 1, "%");
      var cVam = novoCrit("Usinagem", "VAM dos CPs de usina", "7.2.2, Tabela 5", fxi ? "≥ mínimo da Tabela 5 (TNM " + fxi.vam.replace(".", ",") + " mm, interpolado pelo Vv)" : "Tabela 5 (escolha a faixa)");
      var vamV = (d.mar || []).map(function (m, i) { return { v: num(m.vam), m: mar[i].vamMin, rot: rotM(m, i) }; }).filter(function (x) { return ok(x.v); });
      if (vamV.length) {
        cVam.resultado = vamV.map(function (x) { return fmt(x.v, 1) + " % (mín. " + fmt(x.m, 1) + ")"; }).join("; ");
        var fv = vamV.filter(function (x) { return ok(x.m) && x.v < x.m - 1e-9; });
        if (fv.length) marca(cVam, "nc", fv.map(function (x) { return x.rot + ": " + fmt(x.v, 1) + " % < " + fmt(x.m, 1) + " %"; }).join("; "));
        if (!fxi) marca(cVam, "pend", "escolha a faixa (TNM) para o VAM mínimo");
      }
      var cEst = critIndiv(novoCrit("Usinagem", "Estabilidade Marshall dos CPs de usina", "Tabela 4 / Anexo E", "≥ " + fmt(estMin, 0) + " kgf (exigência de dosagem — informativa na produção)"),
        (d.mar || []).map(function (m, i) { return { v: num(m.est), rot: rotM(m, i) }; }), estMin, NaN, 0, "kgf", "ressalva");
      [cVv, cRbv, cVam].forEach(function (c) { c.motivos.forEach(function (m) { if (m.sit === "nc") m.t += " — o teor só é aceito se atendidas as Tabelas 4 e 5 (7.2.2)"; }); });
      C.push(cVv, cRbv, cVam, cEst);
      (d.mar || []).forEach(function (m, i) {
        var t = num(m.teor);
        if (ok(t) && ok(teorProj) && Math.abs(t - teorProj) > tol + 1e-9) avisos.push("CPs de usina " + (i + 1) + ": moldados com teor de " + fmt(t, 2) + " %, fora do projeto ± 0,3 %.");
      });
    } else avisos.push("Sem CPs de usina (Vv, RBV, VAM): o teor de CAP só é aceito se atendidas as Tabelas 4 e 5 (7.2.2) — importe ou digite os parâmetros volumétricos.");

    // ---- RT (7.2.4 c) e dano por umidade (7.2.4 d) ----
    var rtMin = num(P.rtMin || "0,70"), rrtMin = num(P.rrtMin || "0,75");
    var cRt = novoCrit("Usinagem", "Resistência à tração (25 °C)", "7.2.4 c, Tabela 4 / Anexo E", "≥ " + fmt(rtMin, 2) + " MPa");
    frequencia(cRt, L.dias, contar(d.rt, "rt"), "(1 por dia)");
    critIndiv(cRt, (d.rt || []).map(function (r, i) { return { v: num(r.rt), rot: r.data || "ensaio " + (i + 1) }; }), rtMin, NaN, 2, "MPa");
    C.push(cRt);
    (d.rt || []).forEach(function (r, i) { if (r.obs) avisos.push("RT " + (i + 1) + (r.reg ? " (" + r.reg + ")" : "") + ": " + r.obs + "."); });
    var cDui = novoCrit("Usinagem", "Dano por umidade induzida (RRT)", "7.2.4 d, Tabela 4 / Anexo E", "≥ " + fmt(rrtMin, 2));
    var dui = (d.dui || []).map(function (r, i) { var v = num(r.rrt); if (ok(v) && v > 1.5) v /= 100; return { v: v, rot: r.data || "ensaio " + (i + 1) }; });
    frequencia(cDui, ceil(L.dias / 5), dui.filter(function (x) { return ok(x.v); }).length, "(1 a cada 5 dias)");
    critIndiv(cDui, dui, rrtMin, NaN, 2, "");
    C.push(cDui);
    (d.dui || []).forEach(function (r, i) { if (r.obs) avisos.push("Dano por umidade " + (i + 1) + (r.reg ? " (" + r.reg + ")" : "") + ": " + r.obs + "."); });

    // ---- temperaturas ----
    var tCap = num(P.tCap), tMist = num(P.tMist), tApl = num(P.tApl), temp = d.temp || [];
    var rotT = function (p, i) { return p.carga || "carga " + (i + 1); };
    var capMin = Math.max(140, ok(tCap) ? tCap - 5 : 140), capMax = Math.min(177, ok(tCap) ? tCap + 5 : 177);
    var cTc = novoCrit("Temperaturas", "Temperatura do CAP", "5.4.4, 7.2.1 b, Anexo E", fmt(capMin, 0) + " a " + fmt(capMax, 0) + " °C" + (ok(tCap) ? " (" + fmt(tCap, 0) + " ± 5 °C, dentro de 140–177 °C)" : " (140–177 °C)"));
    frequencia(cTc, L.per, contar(temp, "tcap"), "(1 a cada 4 h)");
    critIndiv(cTc, valsDe(temp, "tcap", rotT), capMin, capMax, 0, "°C", "ressalva");
    var cTa = novoCrit("Temperaturas", "Temperatura dos agregados", "5.4.5, 7.2.1 a", "10 a 15 °C acima do CAP e < 192 °C");
    var agr = temp.map(function (p, i) {
      var ta = num(p.tagr), tc = ok(num(p.tcap)) ? num(p.tcap) : tCap;
      return { v: ta, rot: rotT(p, i), a: ok(tc) ? tc + 10 : NaN, b: ok(tc) ? Math.min(tc + 15, 192) : 192 };
    }).filter(function (x) { return ok(x.v); });
    frequencia(cTa, L.per, agr.length, "(1 a cada 4 h)");
    if (agr.length) {
      cTa.resultado = agr.map(function (x) { return fmt(x.v, 0); }).join("; ") + " °C";
      var fa = agr.filter(function (x) { return x.v >= 192 || (ok(x.a) && (x.v < x.a - 1e-9 || x.v > x.b + 1e-9)); });
      if (fa.length) marca(cTa, "ressalva", fa.map(function (x) { return x.rot + ": " + fmt(x.v, 0) + " °C" + (ok(x.a) ? " (limite " + fmt(x.a, 0) + "–" + fmt(Math.min(x.b, 191), 0) + ")" : ""); }).join("; "));
    }
    var cTs = novoCrit("Temperaturas", "Mistura na saída da usina", "7.2.1 c, Anexo E", ok(tMist) ? fmt(tMist, 0) + " ± 5 °C" : "temperatura indicada ± 5 °C");
    frequencia(cTs, L.cargas, contar(temp, "tsai"), "(cada caminhão)");
    critIndiv(cTs, valsDe(temp, "tsai", rotT), tMist - 5, tMist + 5, 0, "°C", "ressalva");
    var cTch = novoCrit("Temperaturas", "Mistura na chegada à pista", "Anexo E", ok(tApl) ? fmt(tApl, 0) + " ± 5 °C" : "temperatura de projeto ± 5 °C");
    frequencia(cTch, L.cargas, contar(temp, "tche"), "(cada caminhão)");
    critIndiv(cTch, valsDe(temp, "tche", rotT), tApl - 5, tApl + 5, 0, "°C", "ressalva");
    var cTe = novoCrit("Temperaturas", "Mistura após o espalhamento (início da compactação)", "7.2.1 d, 7.3.1", ok(tApl) ? fmt(tApl, 0) + " ± 5 °C; evitar < 145 °C" : "projeto ± 5 °C; evitar < 145 °C");
    frequencia(cTe, L.cargas, contar(temp, "tesp"), "(cada caminhão)");
    critIndiv(cTe, valsDe(temp, "tesp", rotT), tApl - 5, tApl + 5, 0, "°C", "ressalva");
    var frias = valsDe(temp, "tesp", rotT).filter(function (x) { return ok(x.v) && x.v < 145; });
    if (frias.length) avisos.push("Temperatura antes da compactação abaixo de 145 °C (7.3.1: devem ser evitadas): " + frias.map(function (x) { return x.rot + " " + fmt(x.v, 0) + " °C"; }).join("; ") + ".");
    if ((contar(temp, "tsai") || contar(temp, "tesp")) && (!ok(tMist) || !ok(tApl))) avisos.push("Informe as temperaturas de projeto (mistura na saída da usina e de aplicação) para verificar ± 5 °C.");
    [cTs, cTch, cTe, cTc, cTa].forEach(function (c) { c.motivos.forEach(function (m) { if (!/frequência/.test(m.t)) m.t += " — avaliar essas cargas"; }); });
    C.push(cTc, cTa, cTs, cTch, cTe);

    // ---- pista: GC (7.3.1) e espessura (7.3.2) ----
    var pista = (d.pista || []).map(function (p) {
      var g = num(p.gmb), e = num(p.esp);
      return { gc: ok(g) && ok(gmbl) && gmbl > 0 ? g / gmbl * 100 : NaN, dEsp: ok(e) && ok(espProj) && espProj > 0 ? (e - espProj) / espProj * 100 : NaN, x: estacaM(p.est), est: p.est };
    });
    tab.pista = pista;
    if ((d.pista || []).some(function (p) { return ok(num(p.gmb)); }) && !ok(gmbl)) avisos.push("Informe o Gmbl (densidade relativa aparente da dosagem) para o grau de compactação (eq. 1).");
    var rotP = function (p, i) { return p.est ? "est. " + p.est : p.pos || "ponto " + (i + 1); };
    var nPis = ceil(L.ext / 100);
    var eGc = estat((d.pista || []).map(function (p, i) { return { v: pista[i].gc, rot: rotP(p, i), x: pista[i].x }; }), 97, 100);
    var cGc = critEstat(novoCrit("Execução", "Grau de compactação", "7.3.1 e 7.5 (bilateral)", "97 % a 100 %"), eGc, 1, "%");
    frequencia(cGc, nPis, eGc.n, "(1 a cada 100 m)");
    cobertura(cGc, eGc.vals, L, 100, avisos, "GC");
    C.push(cGc);
    var espV = (d.pista || []).map(function (p, i) { return { v: num(p.esp), rot: rotP(p, i), x: pista[i].x }; });
    var eEsp = estat(espV, espProj * 0.95, espProj * 1.05);
    var cEsp = critEstat(novoCrit("Execução", "Espessura da camada", "7.3.2 e 7.5 (bilateral)", ok(espProj) ? fmt(espProj, 1) + " cm ± 5 % (" + fmt(espProj * 0.95, 2) + " a " + fmt(espProj * 1.05, 2) + " cm)" : "projeto ± 5 %"), eEsp, 2, "cm");
    frequencia(cEsp, nPis, eEsp.n, "(1 a cada 100 m)");
    if (eEsp.n && !ok(espProj)) marca(cEsp, "pend", "informe a espessura de projeto");
    cobertura(cEsp, eEsp.vals, L, 100, avisos, "espessura");
    C.push(cEsp);

    // ---- geometria (7.3.3) e deflexão (7.3.4) ----
    var geo = d.geo || [], nGeo = ok(L.ext) ? Math.floor(L.ext / 20 + 1e-9) + 1 : NaN;
    var rotG = function (p, i) { return p.est ? "est. " + p.est : "seção " + (i + 1); };
    var cotas = [];
    geo.forEach(function (p, i) {
      [["cLE", "LE"], ["cEixo", "eixo"], ["cLD", "LD"]].forEach(function (c) { var v = num(p[c[0]]); if (ok(v)) cotas.push({ v: v, rot: rotG(p, i) + " " + c[1], x: estacaM(p.est) }); });
    });
    var eCot = estat(cotas, -1, 2);
    var cCot = critEstat(novoCrit("Geometria", "Nivelamento (cotas do eixo e bordos)", "7.3.3 e 7.5 (bilateral)", "−1 cm a +2 cm da cota de projeto"), eCot, 1, "cm");
    frequencia(cCot, nGeo, geo.filter(function (p) { return ok(num(p.cLE)) || ok(num(p.cEixo)) || ok(num(p.cLD)); }).length, "seções (a cada 20 m)");
    C.push(cCot);
    var alin = [];
    geo.forEach(function (p, i) { [["aEixo", "eixo"], ["aBordo", "bordo"]].forEach(function (c) { var v = num(p[c[0]]); if (ok(v)) alin.push({ v: v, rot: rotG(p, i) + " " + c[1] }); }); });
    var eAl = estat(alin, -5, 5);
    var cAl = critEstat(novoCrit("Geometria", "Alinhamento do eixo e dos bordos", "7.3.3 e 7.5 (bilateral)", "desvios ≤ ± 5 cm"), eAl, 1, "cm");
    frequencia(cAl, nGeo, geo.filter(function (p) { return ok(num(p.aEixo)) || ok(num(p.aBordo)); }).length, "seções (a cada 20 m)");
    C.push(cAl);
    var largProj = num(P.largProj);
    var eLg = estat(valsDe(geo, "larg", rotG), largProj, NaN);
    var cLg = critEstat(novoCrit("Geometria", "Largura da plataforma", "7.3.3 e 7.5 (unilateral)", ok(largProj) ? "≥ " + fmt(largProj, 2) + " m" : "≥ projeto"), eLg, 2, "m");
    frequencia(cLg, nGeo, eLg.n, "seções (a cada 20 m)");
    if (eLg.n && !ok(largProj)) marca(cLg, "pend", "informe a largura de projeto");
    C.push(cLg);
    var dProj = num(P.dProj);
    if (ok(dProj)) {
      var eD = estat(valsDe(geo, "d0", rotG), NaN, dProj);
      var cD = critEstat(novoCrit("Geometria", "Deflexão máxima D0", "7.3.4 e 7.5 (unilateral)", "≤ " + fmt(dProj, 0) + " × 0,01 mm (projeto)"), eD, 0, "× 0,01 mm");
      frequencia(cD, nGeo, eD.n, "(a cada 20 m, faixas alternadas)");
      C.push(cD);
    }

    // ---- acabamento (7.3.5) e segurança (7.3.6) ----
    if (revestimento(P)) {
      var sup = d.sup || [];
      var rotS = function (p, i) { return p.est ? "est. " + p.est : "segmento " + (i + 1); };
      var eRg = estat(valsDe(sup, "regua", rotS), NaN, 0.5);
      var cRg = critEstat(novoCrit("Superfície", "Acabamento transversal — régua de 3,00 m", "7.3.5 e 7.5", "variação ≤ 0,5 cm"), eRg, 1, "cm");
      frequencia(cRg, ceil(L.ext / 200), eRg.n, "(1 a cada 200 m)");
      C.push(cRg);
      if (rolamento(P)) {
        var iriMax = P.obra === "rest" ? 2.4 : 2.0;
        var eIri = estat(valsDe(sup, "iri", rotS), NaN, iriMax);
        var cIri = critEstat(novoCrit("Superfície", "Irregularidade longitudinal (IRI)", "7.3.5 e Anexo E", "≤ " + fmt(iriMax, 1) + " m/km (" + (P.obra === "rest" ? "restauração, QI ≤ 31" : "pavimento novo, QI ≤ 26") + ")"), eIri, 2, "m/km", "suspender, corrigir e reavaliar (7.3.5)");
        frequencia(cIri, ceil(L.ext / 200), eIri.n, "(1 a cada 200 m)");
        // 7.3.5: IRI acima do limite → suspender, corrigir e reavaliar (vale para cada valor)
        cIri.motivos.forEach(function (m) {
          if (m.sit === "ressalva" && /individual/.test(m.t)) { m.sit = "nc"; m.t = m.t.replace(" — o controle estatístico atende; verificar/corrigir o(s) ponto(s)", " — a ES não admite IRI acima do limite"); }
        });
        cIri.sit = cIri.motivos.reduce(function (s, m) { return pior(s, m.sit); }, "ok");
        C.push(cIri);
        var n300 = ceil(L.ext / 300);
        if (P.seguranca === "ifi") {
          var ifiMin = P.obra === "rest" ? 0.15 : 0.22;
          var eIfi = estat(valsDe(sup, "ifi", rotS), ifiMin, NaN);
          var cIfi = critEstat(novoCrit("Segurança", "Atrito — IFI (F60)", "7.3.6 e Anexo E", "≥ " + fmt(ifiMin, 2)), eIfi, 2, "");
          frequencia(cIfi, n300, eIfi.n, "(1 a cada 300 m)");
          if (eIfi.n) cIfi.resultado += " · classe da média: " + classe(CL_IFI, eIfi.X) + " (Tabela D3)";
          C.push(cIfi);
        } else {
          var hsMin = num(P.hsMin), hsMax = num(P.hsMax);
          var eHs = estat(valsDe(sup, "hs", rotS), hsMin, hsMax);
          var cHs = critEstat(novoCrit("Segurança", "Macrotextura — mancha de areia (HS)", "7.3.6 a e Anexo D", ok(hsMin) || ok(hsMax) ? lim(hsMin, hsMax, 2, "mm") + " (projeto)" : "definida em projeto"), eHs, 2, "mm");
          frequencia(cHs, n300, eHs.n, "(1 a cada 300 m)");
          if (eHs.n) cHs.resultado += " · classe da média: " + classe(CL_HS, eHs.X) + " (Tabela D2)";
          if (eHs.n && !ok(hsMin) && !ok(hsMax)) marca(cHs, "pend", "informe a macrotextura de projeto (Anexo D)");
          C.push(cHs);
          var eV = estat(valsDe(sup, "vdr", rotS), 47, NaN);
          var cV = critEstat(novoCrit("Segurança", "Microtextura — pêndulo britânico (VDR)", "7.3.6 b e Anexo D", "VDR ≥ 47"), eV, 0, "");
          frequencia(cV, n300, eV.n, "(1 a cada 300 m)");
          if (eV.n) cV.resultado += " · classe da média: " + classe(CL_VDR, eV.X) + " (Tabela D1)";
          C.push(cV);
        }
      }
    }

    // ---- insumos (7.1) e umidades — contagem ----
    var ins = d.ins || [];
    var exigIns = { cap: L.nCap, fr: ok(L.per) ? L.per * L.nFr : NaN, mis: L.per, fil: P.cal === "sim" ? L.dias : 0, uag: L.dias, ea: L.sem, umi: L.dias };
    tab.ins = INS.map(function (x) { return { exig: exigIns[x[0]] }; });
    var cIns = novoCrit("Insumos", "Controle dos insumos e umidades", "7.1.1, 7.1.2, 7.2.4 b", "frequências de 7.1 e 7.2.4 b; resultados conformes");
    var partesI = [];
    INS.forEach(function (x, i) {
      var p = ins[i] || {}, ex = exigIns[x[0]], re = num(p.real), nc = num(p.nc);
      if (ex === 0) return;
      if (!ok(re)) { if (ok(ex)) marca(cIns, "pend", x[1] + ": informe os realizados (mínimo " + ex + ")"); return; }
      partesI.push(x[1].replace(/ \(.*$/, "") + " " + fmt(re, 0) + (ok(ex) ? "/" + ex : ""));
      if (ok(ex) && re < ex) marca(cIns, re === 0 ? "pend" : "ressalva", x[1] + ": " + fmt(re, 0) + " de " + ex + " exigidos");
      if (ok(nc) && nc > 0) marca(cIns, x[0] === "cap" ? "nc" : "ressalva", x[1] + ": " + fmt(nc, 0) + " resultado(s) fora da especificação" +
        (x[0] === "cap" ? " — o insumo não deve ser aceito (7.1)" : ""));
    });
    cIns.resultado = partesI.length ? partesI.join("; ") : "—";
    if (!ok(L.nCap)) avisos.push("Informe os carregamentos de CAP recebidos (7.1.1: ensaios em todo carregamento).");
    C.push(cIns);

    // ---- parecer ----
    C.forEach(function (c) { if (c.sit === "pend" && !c.motivos.length) c.motivos.push({ sit: "pend", t: "sem resultados" }); });
    var par = parecer(C, P, L);
    return { tab: tab, avisos: avisos, trab: trab, usina: usina,
      resultados: { lote: L, criterios: C, parecer: par, trab: trab, comport: comport, usina: usina, fx: fx, gc: eGc, esp: eEsp, cotas: eCot, pista: pista } };
  }

  // cada trecho de 100 m do lote deve ter ao menos uma determinação (7.3.1, 7.3.2: "no mínimo, uma a cada 100 m")
  function cobertura(c, vals, L, passo, avisos, nome) {
    var r = A.cobertura(vals, L, passo, nome);
    r.avisos.forEach(function (t) { avisos.push(t); });
    if (r.motivo) marca(c, "ressalva", r.motivo);
  }

  var SIT = { ok: ["conforme", "fe-ok"], info: ["registrado", "fe-ok"], ressalva: ["ressalva", "rs"], nc: ["NÃO CONFORME", "fe-nok"], pend: ["pendente", "rs"] };
  function parecer(C, P, L) {
    var nc = [], pend = [], res = [];
    C.forEach(function (c) {
      c.motivos.forEach(function (m) {
        var t = c.nome + " (" + c.secao + "): " + m.t;
        if (m.sit === "nc") nc.push(t); else if (m.sit === "pend") pend.push(t); else if (m.sit === "ressalva") res.push(t);
      });
    });
    var st = nc.length ? "rejeitado" : pend.length ? "pendente" : res.length ? "ressalva" : "aceito";
    var prov = [];
    if (nc.length) {
      prov.push("Os serviços não conformes devem ser refeitos às expensas da empresa executora (7.5); a não conformidade deve ser registrada e tratada conforme a DNIT 011-PRO.");
      if (C.some(function (c) { return c.grupo === "Usinagem" && c.sit === "nc" && /Teor|Granulometria/.test(c.nome); }))
        prov.push("Teor de CAP ou granulometria fora: ações corretivas imediatas na usina; se a interrupção da produção era necessária e não ocorreu, todo o concreto asfáltico produzido a partir daquele momento deve ser rejeitado (7.2, 7.2.3).");
      if (C.some(function (c) { return /IRI/.test(c.nome) && c.sit === "nc"; })) prov.push("IRI acima do limite: suspender os trabalhos, corrigir e reavaliar os trechos corrigidos antes de determinar a espessura final (7.3.5).");
    }
    if (pend.length) prov.push("Completar os ensaios e informações pendentes antes de concluir a aceitação do lote.");
    if (res.length) prov.push("Ressalvas: tratar cada ponto indicado (complementar a frequência, verificar/corrigir localmente, avaliar as cargas) e registrar no relatório periódico (7.5, DNIT 011-PRO).");
    prov.push("A medição do lote deve ser acompanhada deste relatório de controle da qualidade (8 e).");
    var tit = { aceito: "LOTE ACEITO", ressalva: "LOTE ACEITO COM RESSALVA", pendente: "ACEITAÇÃO PENDENTE", rejeitado: "LOTE REJEITADO" }[st];
    var nCrit = C.filter(function (c) { return c.sit !== "na"; }).length, nOk = C.filter(function (c) { return c.sit === "ok" || c.sit === "info"; }).length;
    var frase = st === "aceito" ? "Todos os " + nCrit + " critérios verificados atendem à DNIT 385/2026-ES, com a frequência mínima de ensaios."
      : st === "ressalva" ? "Nenhum critério reprovado; " + res.length + " ressalva(s) a tratar (" + nOk + " de " + nCrit + " critérios sem observação)."
      : st === "pendente" ? "Nenhum critério reprovado, mas faltam ensaios/informações obrigatórios (" + pend.length + ")."
      : nc.length + " não conformidade(s) em " + C.filter(function (c) { return c.sit === "nc"; }).length + " critério(s) — o lote não atende à DNIT 385/2026-ES.";
    return { st: st, titulo: tit, frase: frase, nc: nc, pend: pend, res: res, prov: prov };
  }

  // ---------- apresentação ----------
  function selo(sit, relat) {
    var s = SIT[sit] || ["—", ""];
    if (relat) return s[0];
    if (s[1] === "rs") return '<span style="color:' + A.COR.ambar + ';font-weight:bold">' + s[0] + "</span>";
    return '<span class="' + s[1] + '">' + s[0] + "</span>";
  }
  function freqTxt(c) {
    if (!ok(c.exig)) return c.real ? String(c.real) : "—";
    return c.real + " / " + c.exig;
  }
  function tabelaCriterios(r, relat) {
    var th = relat ? "<th>" : '<th style="text-align:left">';
    var h = '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr>' + th + "Critério</th>" + th + "Seção</th><th>Determ. (realizadas / mínimo)</th>" + th + "Resultado</th>" + th + "Exigido</th>" + th + "Situação</th></tr></thead><tbody>";
    var g = "";
    r.criterios.forEach(function (c) {
      if (c.grupo !== g) { g = c.grupo; h += '<tr><td colspan="6" style="font-weight:bold;background:' + (relat ? "#e9e9e9" : "rgba(127,127,127,.12)") + '">' + esc(g) + "</td></tr>"; }
      var L = relat ? "<td>" : '<td style="text-align:left">';
      h += "<tr>" + L + esc(c.nome) + "</td>" + L + esc(c.secao) + '</td><td style="text-align:center">' + esc(freqTxt(c)) + "</td>" + L + esc(c.resultado) + "</td>" + L + esc(c.criterio) +
        "</td>" + L + (relat ? "<b>" + esc(SIT[c.sit] ? SIT[c.sit][0] : "—") + "</b>" : selo(c.sit)) + "</td></tr>";
    });
    return h + "</tbody></table>";
  }
  function tabelaTrabalho(r, relat) {
    var t = r.trab, us = r.usina.filter(function (o) { return o.temGran; });
    if (!t || !t.length || (!t.some(function (o) { return ok(o.proj); }) && !us.length)) return "";
    var h = '<table class="' + (relat ? "gr" : "fe-resumo fe-gran") + '"><thead><tr><th>Peneira</th><th>Faixa ' + esc(r.fx ? r.fx.faixa : "") + "</th><th>Projeto</th><th>± Tab. 3</th><th>Faixa de trabalho</th>" +
      us.map(function (o, i) { return "<th>Amostra " + (r.usina.indexOf(o) + 1) + "</th>"; }).join("") + "</tr></thead><tbody>";
    t.forEach(function (o, j) {
      h += "<tr><td>" + esc(o.nome) + " — " + fmt(o.mm, o.mm < 1 ? 3 : 1) + "</td><td>" + o.fmin + "–" + o.fmax + "</td><td>" + (ok(o.proj) ? fmt(o.proj, 1) : "—") + "</td><td>" +
        (ok(o.tol) ? "± " + fmt(o.tol, 0) : "—") + "</td><td>" + (ok(o.min) ? fmt(o.min, 0) + "–" + fmt(o.max, 0) + (o.ajuste ? " *" : "") : "—") + "</td>" +
        us.map(function (u) {
          var v = u.pass[j], f = ok(v) && ok(o.min) && (v < o.min - 1e-9 || v > o.max + 1e-9);
          return "<td>" + (ok(v) ? (f ? (relat ? "<b>" + fmt(v, 1) + " FORA</b>" : '<span class="fe-nok">' + fmt(v, 1) + "</span>") : fmt(v, 1)) : "—") + "</td>";
        }).join("") + "</tr>";
    });
    h += "</tbody></table>";
    if (t.some(function (o) { return o.ajuste; })) h += '<p class="' + (relat ? "nota" : "fe-hint") + '">* limite da faixa de trabalho ajustado ao limite da faixa ' + esc(r.fx ? r.fx.faixa : "") + " (Anexo B: ajustam-se só os limites que extrapolam).</p>";
    if (r.comport) h += '<p class="' + (relat ? "nota" : "fe-hint") + '">Comportamento da curva de projeto (Tabela 2): ' + fmt(r.comport.pass, 1) + " % passando na PCP de " + fmt(r.comport.pcp, 2) +
      " mm, controle " + fmt(r.comport.ctrl, 0) + " % → " + (r.comport.graudo ? "graúdo" : "fino") + " (Anexo D: influi na macrotextura).</p>";
    return h;
  }
  function tabelaEstat(r, relat) {
    var cs = r.criterios.filter(function (c) { return c.est && c.est.n; });
    if (!cs.length) return "";
    var h = '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th>Controle estatístico (7.5, Tabela A1)</th><th>n</th><th>X̄</th><th>s</th><th>k</th><th>X̄ − ks</th><th>X̄ + ks</th><th>Mín.–máx. individuais</th><th>Limites</th></tr></thead><tbody>';
    cs.forEach(function (c) {
      var e = c.est, cs2 = c.casas;
      var est = e.modo === "estatistico";
      h += "<tr><td" + (relat ? "" : ' style="text-align:left"') + ">" + esc(c.nome) + (c.u ? " (" + esc(c.u) + ")" : "") + "</td><td>" + e.n + "</td><td>" + fmt(e.X, cs2) + "</td><td>" + fmt(e.s, cs2 + 1) + "</td><td>" + (est ? fmt(e.k, 2) : "n < 5") +
        "</td><td>" + (est && ok(e.min) ? fmtR(e.inf, cs2) : "—") + "</td><td>" + (est && ok(e.max) ? fmtR(e.sup, cs2) : "—") + "</td><td>" + fmt(e.vMin, cs2) + " – " + fmt(e.vMax, cs2) +
        "</td><td>" + esc(lim(e.min, e.max, cs2, "")) + "</td></tr>";
    });
    return h + "</tbody></table>";
  }
  function listaMotivos(par, relat) {
    function ul(tit, arr, cor) {
      if (!arr.length) return "";
      return '<div style="margin-top:6px"><b' + (cor ? ' style="color:' + cor + '"' : "") + ">" + esc(tit) + "</b><ul style=\"margin:3px 0 0 18px;padding:0\">" +
        arr.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>";
    }
    return ul("Não conformidades", par.nc, relat ? "#b00" : "#e5534b") + ul("Pendências", par.pend, A.COR.ambar) + ul("Ressalvas", par.res, A.COR.ambar) + ul("Providências (DNIT 385/2026-ES)", par.prov, "");
  }
  function cabecalhoLote(r, P) {
    var L = r.lote;
    return (P.estIni || P.estFim ? "Est. " + (P.estIni || "?") + " a " + (P.estFim || "?") + " · " : "") + (ok(L.ext) ? fmt(L.ext, 0) + " m" : "extensão ?") +
      (ok(L.larg) ? " × " + fmt(L.larg, 2) + " m = " + fmt(L.area, 0) + " m²" : "") + (P.pista ? " · " + P.pista : "");
  }
  var COR_ST = { aceito: A.COR.verde, ressalva: A.COR.ambar, pendente: A.COR.ambar, rejeitado: A.COR.nok };

  function resultadosHtml(calc, d) {
    var r = calc.resultados, par = r.parecer, P = d.params || {}, L = r.lote;
    var cls = par.st === "aceito" ? "fe-ok" : par.st === "rejeitado" ? "fe-nok" : "";
    var h = '<div class="fe-res"><div class="fe-res-item" style="flex:2 1 320px"><div class="fe-res-v fe-res-p"><span class="' + cls + '"' + (cls ? "" : ' style="color:' + A.COR.ambar + '"') + ">" + esc(par.titulo) + "</span></div>" +
      '<div class="fe-res-r">' + esc(par.frase) + "</div></div>" +
      '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(cabecalhoLote(r, P)) + '</div><div class="fe-res-r">Lote · camada ' + esc({ rolamento: "de rolamento", ligacao: "de ligação", base: "de base/regularização/reforço" }[P.camada || "rolamento"]) +
      (r.fx ? " · faixa " + esc(r.fx.faixa) : "") + "</div></div>" +
      '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(L.horas) ? fmt(L.horas, 1) + " h" : "? h") + " · " + (ok(L.dias) ? fmt(L.dias, 0) + " dia(s)" : "? dias") + (ok(L.cargas) ? " · " + fmt(L.cargas, 0) + " cargas" : "") +
      '</div><div class="fe-res-r">Produção (frequências da usinagem)</div></div></div>';
    h += '<div style="margin:6px 0 10px">' + listaMotivos(par, false) + "</div>";
    h += tabelaCriterios(r, false) + tabelaEstat(r, false) + tabelaTrabalho(r, false);
    return h;
  }

  // ---------- gráficos ----------
  var grafico = A.grafico, linhasEst = A.linhasEst;  // valores × estaca com limites, média e X̄ ± ks
  function graficos(calc, d, opt) {
    var r = calc.resultados, P = d.params || {}, out = [];
    function ptsEst(e) { return e.vals.map(function (v) { return { x: v.x, y: v.v, fora: (ok(e.min) && v.v < e.min - 1e-9) || (ok(e.max) && v.v > e.max + 1e-9) }; }); }
    var g1 = grafico("Grau de compactação (%) × estaca — 7.3.1", ptsEst(r.gc), linhasEst(r.gc, 1, " %"), opt);
    if (g1) out.push(g1);
    var g2 = grafico("Espessura (cm) × estaca — 7.3.2", ptsEst(r.esp), linhasEst(r.esp, 2, " cm"), opt);
    if (g2) out.push(g2);
    var g3 = grafico("Desvio de cota (cm) × estaca — 7.3.3", ptsEst(r.cotas), linhasEst(r.cotas, 1, " cm"), Object.assign({}, opt, { linha: false }));
    if (g3) out.push(g3);
    var tp = num(P.teorProj);
    var tPts = r.usina.map(function (o, i) { return { x: i + 1, y: o.teor, fora: ok(o.dTeor) && Math.abs(o.dTeor) > 0.3 + 1e-9 }; });
    var g4 = grafico("Teor de CAP (%) por amostra — 7.2.2", tPts, ok(tp) ? [{ y: tp - 0.3, tipo: "lim", txt: "mín. " + fmt(tp - 0.3, 2) }, { y: tp + 0.3, tipo: "lim", txt: "máx. " + fmt(tp + 0.3, 2) },
      { y: tp, tipo: "med", txt: "projeto " + fmt(tp, 2) }] : [], opt, "idx");
    if (g4) out.push(g4);
    // curvas das extrações com a faixa de trabalho sombreada (gráfico da DNIT 412)
    var us = r.usina.filter(function (o) { return o.temGran; });
    if (us.length && r.trab.some(function (t) { return ok(t.min); })) {
      var am = us.map(function (o) { return { pen: r.trab.map(function (t, j) { return { mm: t.mm, pass: o.pass[j] }; }).filter(function (x) { return ok(x.pass); }) }; });
      var med = r.trab.map(function (t, j) {
        var v = media(us.map(function (o) { return o.pass[j]; }));
        return { mm: t.mm, pass: v, lim: ok(t.min) ? { min: t.min, max: t.max } : null, dentro: ok(v) && ok(t.min) ? v >= t.min - 1e-9 && v <= t.max + 1e-9 : null };
      }).filter(function (x) { return ok(x.pass); });
      var svg = G.grafico({ amostras: am, resultados: { media: med } }, opt);
      var cor = opt && opt.imprimir ? "#222" : "var(--text-dim)";
      out.push(svg.replace("</svg>", '<text x="56" y="28" fill="' + cor + '" font-weight="bold">' + esc("Agregado extraído × faixa de trabalho — 7.2.3" + (us.length > 1 ? " (tracejadas: amostras; cheia: média)" : "")) + "</text></svg>"));
    }
    return out;
  }

  // ---------- relatório ----------
  function relResultados(calc, d) {
    var r = calc.resultados, par = r.parecer, P = d.params || {}, L = r.lote, rows = [];
    rows.push(["PARECER DO LOTE", par.titulo + " — " + par.frase]);
    rows.push(["Lote", cabecalhoLote(r, P) + (ok(num(P.massa)) ? " · " + fmt(num(P.massa), 1) + " t aplicadas" : "")]);
    rows.push(["Produção", (ok(L.horas) ? fmt(L.horas, 1) + " h (" + L.per + " período(s) de 4 h)" : "horas não informadas") + " · " + (ok(L.dias) ? fmt(L.dias, 0) + " dia(s)" : "dias não informados") +
      (ok(L.cargas) ? " · " + fmt(L.cargas, 0) + " cargas" : "") + (P.dataIni ? " · " + dataBR(P.dataIni) + (P.dataFim && P.dataFim !== P.dataIni ? " a " + dataBR(P.dataFim) : "") : "")]);
    rows.push(["Critérios", r.criterios.length + " verificados: " + ["ok", "info", "ressalva", "pend", "nc"].map(function (s) {
      var n = r.criterios.filter(function (c) { return c.sit === s; }).length;
      return n ? n + " " + SIT[s][0].toLowerCase() : "";
    }).filter(Boolean).join(", ")]);
    return rows;
  }

  FE.FICHAS[ID] = {
    norma: "dnit-385-2026-es",
    rotuloLink: "Aceitação de lote",
    lote: true,
    titulo: "Concreto asfáltico com CAP modificado por polímero — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência mínima e aplica os critérios da ES: teor de CAP ± 0,3 %, faixa de trabalho, Vv/RBV/VAM, RT, dano por umidade, temperaturas, grau de compactação e espessura (controle estatístico X̄ ± ks, Tabela A1), geometria, régua, IRI e segurança; parecer do lote.",
    blocos: [],
    params: params,
    padrao: { camada: "rolamento", obra: "nova", ligante: "", faixa: "", seguranca: "mp", rtMin: "0,70", rrtMin: "0,75", estMin: "700", cal: "nao", segExp: "", chuva: "" },
    tabelas: tabelas,
    calcular: calcular,
    resultadosHtml: resultadosHtml,
    graficos: graficos,
    relatorio: {
      notas: "Critérios da DNIT 385/2026-ES. Usinagem (7.2, Anexo E): avaliação individual de cada determinação. Execução (7.3): controle estatístico de 7.5 — X̄ − ks ≥ mínimo e/ou X̄ + ks ≤ máximo, s com n − 1 (eq. 2 e 3), k da Tabela A1 " +
        "(n = 5: 1,55; 6: 1,41; 7: 1,36; 8: 1,31; 9: 1,25; 10: 1,21; 11: 1,19; 12: 1,16; 13: 1,13; 14: 1,11; 15: 1,10; 16: 1,08; 17: 1,06; 19: 1,04; 21: 1,01); n não tabelado usa o k do n tabelado imediatamente abaixo; " +
        "com n < 5 (fora da Tabela A1) cada valor individual deve atender. Valores individuais fora do limite com o controle estatístico atendido geram ressalva. GC = Gmbc / Gmbl × 100 (eq. 1); densímetro (DNIT 431): Gmbc = densidade corrigida / 0,9971. " +
        "Faixa de trabalho = curva de projeto ± Tabela 3, limitada pela faixa da Tabela 1 (Anexo B). VAM mínimo da Tabela 5 interpolado pelo Vv. Temperaturas e estabilidade fora do limite: ressalva (avaliar as cargas); insumos por contagem de ensaios. " +
        "Parecer: rejeitado se algum critério não conforme; pendente se faltar ensaio obrigatório; aceito com ressalva se houver ressalvas; aceito se tudo atender.",
      resultados: relResultados,
      extraHtml: function (calc) {
        var r = calc.resultados, cor = COR_ST[r.parecer.st];
        return '<div style="border:2px solid ' + cor + ';padding:6px 9px;margin-top:8px"><div style="font-size:13px;font-weight:bold;color:' + cor + '">' + esc(r.parecer.titulo) + "</div>" +
          "<div>" + esc(r.parecer.frase) + "</div>" + listaMotivos(r.parecer, true) + "</div>" +
          tabelaCriterios(r, true) + tabelaEstat(r, true) +
          (r.trab && r.trab.length ? "<h2>Granulometria — faixa de trabalho</h2>" + tabelaTrabalho(r, true) : "");
      },
    },
    exemplos: [],
  };

  // =====================================================================================
  // exemplos
  // =====================================================================================
  function aplicarEx(d, k, refs) { A.exemplos.importar(params, d, k, refs); }  // como o botão "Importar selecionados"
  function col(sieves, vals) { var o = {}; sieves.forEach(function (mm, j) { if (ok(vals[j])) o[G.chavePen(mm)] = nstr(vals[j], 1); }); return o; }
  var PEN_C = [19.1, 12.7, 9.5, 6.3, 4.8, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075];
  var PEN_B = [25.4, 19.1, 12.7, 9.5, 6.3, 4.8, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075];
  var PROJ_C = [100, 95, 84, 68, 58, 42, 30, 22, 15, 10, 6];
  var PROJ_B = [100, 95, 80, 68, 55, 48, 34, 24, 17, 12, 8, 4];
  function insumos(v) { return v.map(function (x) { return { real: x[0] === null ? "" : String(x[0]), nc: x[1] === null ? "" : String(x[1]) }; }); }
  // desvios pseudoaleatórios reprodutíveis
  function serie(n, seed, a, b) { var out = [], s = seed; for (var i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; out.push(a + (b - a) * s / 233280); } return out; }

  // 1 — lote aceito, montado com exemplos das fichas ME
  function ex1() {
    var d = { ident: { registro: "LOTE-CAP-001", data: "2026-09-10", obra: "Obra A", trecho: "BR-000 — km 40, faixa direita", local: "Est. 20+00 a 25+00",
      camada: "Revestimento — CA com CAP 60/85-E, faixa C-12,5", origem: "Usina A", laboratorista: "Equipe de controle" },
      params: { estIni: "20+00", estFim: "25+00", largura: "3,60", pista: "pista direita, faixa 1", camada: "rolamento", obra: "nova", ligante: "60/85-E",
        faixa: "dnit-385-2026-es-C-12-5", teorProj: "4,6", gmbl: "2,398", gmmProj: "2,515", espProj: "5,0", largProj: "3,60",
        tCap: "165", tMist: "160", tApl: "152", seguranca: "mp", hsMin: "0,60", rtMin: "0,70", rrtMin: "0,75", estMin: "700",
        dataIni: "2026-09-10", dataFim: "2026-09-10", horas: "4", dias: "1", nCargas: "3", massa: "45,5", nCap: "1", nFracoes: "3", cal: "nao",
        segExp: "sim", tSup: "28", chuva: "nao" },
      proj: [col(PEN_C, PROJ_C)],
      usina: [Object.assign({ reg: "EXT-0910-1", data: "10/09/2026", per: "07h30 — 1º caminhão", orig: "DNER-ME 053/94", teor: "4,68" },
        col(PEN_C, [100, 96.1, 85.2, 69.5, 59.0, 43.6, 31.2, 22.8, 15.4, 10.3, 6.4]))],
      rt: [{ reg: "RT-0910", data: "10/09/2026", rt: "0,86" }],
      temp: [{ carga: "Caminhão 1", hora: "07h30", tcap: "166", tagr: "178", tsai: "161", tche: "155", tesp: "151" },
        { carga: "Caminhão 2", hora: "08h40", tsai: "158", tche: "152", tesp: "148" },
        { carga: "Caminhão 3", hora: "09h50", tsai: "163", tche: "156", tesp: "152" }],
      geo: ["20+00", "21+00", "22+00", "23+00", "24+00", "25+00"].map(function (e, i) {
        var c = [[0.4, 0.8, 0.2], [0.6, 1.1, 0.3], [-0.2, 0.5, 0.1], [0.3, 0.9, 0.6], [0.0, 0.4, -0.4], [0.5, 1.0, 0.2]][i];
        return { est: e, cLE: fmt(c[0], 1), cEixo: fmt(c[1], 1), cLD: fmt(c[2], 1), aEixo: fmt([1, -1, 2, 0, -2, 1][i], 0), aBordo: fmt([2, 1, -1, 3, 0, -2][i], 0),
          larg: ["3,62", "3,61", "3,64", "3,60", "3,63", "3,62"][i] };
      }),
      sup: [{ est: "22+10", regua: "0,3", iri: "1,62", hs: "0,72", vdr: "56" }],
      ins: insumos([[1, 0], [3, 0], [1, 0], [null, null], [1, 0], [1, 0], [1, 0]]),
      obs: "Lote de demonstração montado com exemplos de outras fichas: CPs de usina (dosagem Marshall — controle, 3 CPs), Rice (DNIT 427), dano por umidade (DNIT 180) e grau de compactação pelo densímetro (DNIT 431) foram importados; extração, RT, espessuras dos CPs, temperaturas e geometria digitados. Gmbl = 2,391 / 0,9971 (massa específica de projeto do exemplo da DNIT 431)." };
    aplicarEx(d, "impMar", [["dnit-385-2026-es", 1]]);
    aplicarEx(d, "impRice", [["dnit-427-2020-me", 0]]);
    aplicarEx(d, "impDui", [["dnit-180-2018-me", 1]]);
    aplicarEx(d, "impPista", [["dnit-431-2020-me", 0]]);
    ["5,02", "5,10", "4,96", "5,05", "4,98", "5,08"].forEach(function (e, i) { if (d.pista[i]) d.pista[i].esp = e; });
    d.params.impUsina = []; d.params.impRt = [];
    return d;
  }

  // 2 — lote aceito com ressalvas (dados gerados)
  function ex2() {
    var gmbl = 2.405, ests = ["100+12", "105+08", "108+15", "111+04", "116+18", "121+06"], gc = [98.4, 98.9, 97.9, 98.6, 99.1, 98.2], esp = [6.08, 5.96, 6.12, 6.03, 5.94, 6.10];
    var geo = [], dv = serie(78, 17, -0.6, 1.4), al = serie(52, 5, -3, 3), lg = serie(26, 11, 3.61, 3.66);
    for (var i = 0; i <= 25; i++) {
      var g = { est: (100 + i) + "+00", cLE: fmt(dv[3 * i], 1), cEixo: fmt(dv[3 * i + 1], 1), cLD: fmt(dv[3 * i + 2], 1), aEixo: fmt(al[2 * i], 0), aBordo: fmt(al[2 * i + 1], 0), larg: fmt(lg[i], 2) };
      geo.push(g);
    }
    geo[13].cEixo = "2,4";  // um ponto isolado acima de +2 cm
    var tsai = [161, 159, 163, 158, 168, 160, 162, 157, 161, 159], tche = [155, 153, 157, 152, 160, 154, 156, 151, 155, 153], tesp = [150, 149, 153, 148, 155, 150, 152, 147, 151, 149];
    var temp = tsai.map(function (t, i) {
      var o = { carga: "Caminhão " + (i + 1), hora: ["07h10", "07h45", "08h20", "09h00", "09h40", "10h20", "11h00", "11h40", "12h20", "13h00"][i], tsai: String(t), tche: String(tche[i]), tesp: String(tesp[i]) };
      if (i === 0) { o.tcap = "165"; o.tagr = "177"; }
      if (i === 6) { o.tcap = "166"; o.tagr = "179"; }
      return o;
    });
    return { ident: { registro: "LOTE-CAP-014", data: "2026-10-06", obra: "Obra B", trecho: "BR-000 — km 112 ao km 112,5", local: "Est. 100+00 a 125+00",
      camada: "Camada de ligação — CA com CAP 55/75-E, faixa B-19", origem: "Usina B", laboratorista: "Equipe de controle" },
      params: { estIni: "100+00", estFim: "125+00", largura: "3,60", pista: "pista esquerda", camada: "ligacao", obra: "nova", ligante: "55/75-E",
        faixa: "dnit-385-2026-es-B-19", teorProj: "4,9", gmbl: fmt(gmbl, 3), gmmProj: "2,491", espProj: "6,0", largProj: "3,60",
        tCap: "165", tMist: "160", tApl: "153", seguranca: "mp", rtMin: "0,70", rrtMin: "0,75", estMin: "700",
        dataIni: "2026-10-06", dataFim: "2026-10-06", horas: "8", dias: "1", nCargas: "10", massa: "262", nCap: "2", nFracoes: "4", cal: "sim",
        segExp: "sim", tSup: "24", chuva: "nao", impUsina: [], impRice: [], impMar: [], impRt: [], impDui: [], impPista: [] },
      proj: [col(PEN_B, PROJ_B)],
      usina: [Object.assign({ reg: "EXT-1006-1", data: "06/10/2026", per: "07h10 — 1º período", orig: "DNIT 158-ME (Soxhlet)", teor: "4,82" }, col(PEN_B, [100, 96.2, 81.5, 69.8, 56.1, 47.0, 33.1, 23.4, 16.2, 11.6, 7.7, 4.3])),
        Object.assign({ reg: "EXT-1006-2", data: "06/10/2026", per: "11h00 — 2º período", orig: "DNIT 158-ME (Soxhlet)", teor: "5,03" }, col(PEN_B, [100, 94.1, 78.6, 66.9, 53.8, 49.2, 35.4, 25.1, 17.9, 12.4, 8.3, 4.6]))],
      rice: [{ reg: "RICE-1006-1", data: "06/10/2026", gmm: "2,489" }],
      mar: [{ reg: "MAR-1006-1", data: "06/10/2026", teor: "4,85", gmb: "2,386", vv: "4,20", rbv: "71,0", vam: "14,50", est: "912", ncp: "3" },
        { reg: "MAR-1006-2", data: "06/10/2026", teor: "5,00", gmb: "2,380", vv: "4,60", rbv: "69,0", vam: "14,90", est: "680", ncp: "3" }],
      rt: [{ reg: "RT-1006", data: "06/10/2026", rt: "0,92" }],
      dui: [{ reg: "DUI-1006", data: "06/10/2026", rrt: "0,81" }],
      temp: temp,
      pista: ests.map(function (e, i) { return { est: e, pos: ["LD 1,0 m", "LE 2,0 m", "eixo", "LD 2,5 m", "LE 1,0 m", "eixo"][i], reg: "CP-" + (i + 1) + " — DNIT 428", gmb: fmt(gc[i] * gmbl / 100, 4), esp: fmt(esp[i], 2) }; }),
      geo: geo,
      sup: [{ est: "100+00 a 110+00", regua: "0,2" }, { est: "110+00 a 120+00", regua: "0,3" }, { est: "120+00 a 125+00", regua: "0,4" }],
      ins: insumos([[2, 0], [8, 0], [2, 0], [1, 0], [1, 0], [1, 0], [1, 0]]),
      obs: "Dados gerados para demonstração. Caminhão 5 saiu da usina a 168 °C (usina ajustada em seguida). Est. 113+00 (eixo): cota 2,4 cm acima do projeto — ponto isolado a verificar. Rice do 2º período não realizado." };
  }

  // 3 — lote rejeitado: resultados importados dos exemplos das fichas ME
  function ex3() {
    var d = { ident: { registro: "LOTE-CAP-022", data: "2026-03-02", obra: "Obra C", trecho: "BR-000 — km 35 ao km 35,5", local: "Est. 35+00 a 60+00",
      camada: "Revestimento — CA com CAP 60/85-E, faixa C-12,5 (restauração)", origem: "Usina C", laboratorista: "Equipe de controle" },
      params: { estIni: "35+00", estFim: "60+00", largura: "3,50", pista: "pista direita", camada: "rolamento", obra: "rest", ligante: "60/85-E",
        faixa: "dnit-385-2026-es-C-12-5", teorProj: "4,5", gmbl: "2,360", gmmProj: "2,470", espProj: "6,0", largProj: "3,50",
        tCap: "165", tMist: "160", tApl: "152", seguranca: "mp", hsMin: "0,60", rtMin: "0,70", rrtMin: "0,75", estMin: "700",
        dataIni: "2026-02-24", dataFim: "2026-02-25", horas: "16", dias: "2", nCargas: "4", massa: "250", nCap: "3", nFracoes: "3", cal: "nao",
        segExp: "sim", tSup: "22", chuva: "nao" },
      proj: [col(PEN_C, PROJ_C)],
      temp: [{ carga: "Caminhão 1", hora: "07h20", tcap: "179", tagr: "186", tsai: "163", tche: "156", tesp: "150" },
        { carga: "Caminhão 2", hora: "08h10", tsai: "158", tche: "150", tesp: "143" },
        { carga: "Caminhão 3", hora: "09h00", tsai: "161", tche: "154", tesp: "149" }],
      geo: ["35+00", "36+00", "37+00", "38+00", "39+00", "40+00"].map(function (e, i) {
        var c = [[0.6, 1.2, 0.4], [0.9, 1.6, 0.7], [-0.5, 0.3, -0.8], [0.2, 0.9, 0.1], [1.1, 1.9, 0.8], [0.4, 0.7, -0.2]][i];
        return { est: e, cLE: fmt(c[0], 1), cEixo: fmt(c[1], 1), cLD: fmt(c[2], 1), aEixo: String([1, 2, -1, 0, 3, 1][i]), aBordo: String([2, -2, 1, 3, 0, -1][i]), larg: ["3,54", "3,52", "3,53", "3,55", "3,52", "3,54"][i] };
      }),
      sup: [{ est: "35+00 a 45+00", regua: "0,4", iri: "2,18", hs: "0,66", vdr: "52" }, { est: "45+00 a 55+00", regua: "0,6", iri: "2,63", hs: "0,58", vdr: "49" }],
      ins: insumos([[2, 0], [9, 0], [3, 0], [null, null], [2, 0], [1, 0], [2, 1]]),
      obs: "Lote de demonstração com resultados importados dos exemplos das fichas ME (extração DNER-ME 053, Rice DNIT 427, CPs de usina, RT DNIT 136, dano por umidade DNIT 180, CPs extraídos DNIT 428 e densímetro DNIT 431); temperaturas, geometria e superfície digitadas. Os CPs extraídos (DNIT 428) não trazem estaca no ensaio de origem." };
    aplicarEx(d, "impUsina", [["dner-me-053-94", 0], ["dner-me-053-94", 1]]);
    aplicarEx(d, "impRice", [["dnit-427-2020-me", 2]]);
    aplicarEx(d, "impMar", [["dnit-385-2026-es", 1]]);
    aplicarEx(d, "impRt", [["dnit-136-2018-me", 2]]);
    aplicarEx(d, "impDui", [["dnit-180-2018-me", 2]]);
    aplicarEx(d, "impPista", [["dnit-428-2022-me", 1], ["dnit-431-2020-me", 1]]);
    return d;
  }

  FE.FICHAS[ID].exemplos = [
    { nome: "Lote aceito — faixa C-12,5, 100 m (CPs de usina, Rice, dano por umidade e densímetro importados dos exemplos)", dados: ex1 },
    { nome: "Lote aceito com ressalvas — binder faixa B-19, 500 m (dados gerados)", dados: ex2 },
    { nome: "Lote rejeitado — teor, granulometria, RT, dano por umidade, GC, espessura e IRI (importados dos exemplos das fichas ME)", dados: ex3 },
  ];
  FE.FICHAS[ID].exemplo = ex1;
})();
