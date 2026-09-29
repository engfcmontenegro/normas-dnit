/*
 * Ficha: DNER-PAD 111/97 — Fichas para representação de perfis individuais de sondagem a percussão (Anexo A) e
 * rotativa ou mista (Anexo B), com as notas do Anexo C (IR, RQD, IF, IFr e variações do NA).
 * Boletim por amostra (golpes por 15 cm → 1ª e 2ª séries de 30 cm), limites e umidade, camadas com a classificação
 * do material e granulometria; na sondagem mista, manobras com IR = Tb/Mp × 100, RQD, fendilhamento (f/M) e
 * fracionamento (fr/M) — podem ser importadas de um boletim da DNER-PRO 102/97. Desenha o perfil individual em SVG
 * com as colunas e as convenções gráficas das fichas da norma. Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  // limites padrão do índice de resistência à penetração (ABNT NBR 6484:2020, Anexo A — fora do acervo; editáveis)
  var LIM_ARG = "2; 5; 10; 19; 30", LIM_ARE = "4; 8; 18; 40";
  var NOM_ARG = ["Muito mole", "Mole", "Média", "Rija", "Muito rija", "Dura"];
  var NOM_ARE = ["Fofa", "Pouco compacta", "Medianamente compacta", "Compacta", "Muito compacta"];

  function lista(t) { return String(t || "").split(/[;\s]+/).map(num).filter(ok); }
  function classe(N, tipo, P) {
    if (!ok(N) || !tipo) return "";
    var lim = lista(tipo === "A" ? (P.limArg || LIM_ARG) : (P.limAre || LIM_ARE)), nomes = tipo === "A" ? NOM_ARG : NOM_ARE;
    for (var i = 0; i < lim.length; i++) if (N <= lim[i]) return nomes[i] || "";
    return nomes[Math.min(lim.length, nomes.length - 1)];
  }
  function tipoSolo(c) {
    var t = String(c.tipo || "").trim().toUpperCase();
    if (t === "A" || t === "S") return t;
    var s = String(c.desc || "").toLowerCase().trim();
    if (/^(argila|silte argil|turfa|solo orgânico argil)/.test(s)) return "A";
    if (/^(areia|silte arenos|pedregulho)/.test(s)) return "S";
    return "";
  }
  function mista(P) { return P.tipo === "mista"; }

  function amostras(d) {
    return (d.am || []).map(function (x) {
      var o = { prof: num(x.prof), nAm: x.nAm || "", g1: num(x.g1), g2: num(x.g2), g3: num(x.g3), pen: num(x.pen),
        LL: num(x.LL), LP: num(x.LP), w: num(x.w), vazio: /^s/i.test(String(x.vazio || "").trim()) };
      var pen3 = ok(o.pen) ? o.pen : 15;
      o.s1 = ok(o.g1) && ok(o.g2) ? o.g1 + o.g2 : NaN;           // 1ª série: primeiros 30 cm
      o.N = ok(o.g2) && ok(o.g3) ? o.g2 + o.g3 : NaN;             // 2ª série: últimos 30 cm (índice de resistência)
      o.parcial = ok(o.g3) && pen3 < 15;
      o.txtN = !ok(o.N) ? (ok(o.g1) && !ok(o.g2) ? fmt(o.g1, 0) + "/" + (ok(o.pen) ? fmt(o.pen, 0) : "15") : "") :
        o.parcial ? fmt(o.N, 0) + "/" + fmt(15 + pen3, 0) : fmt(o.N, 0);
      o.IP = ok(o.LL) && ok(o.LP) ? o.LL - o.LP : NaN;
      return o;
    });
  }
  function camadas(d, P) {
    var cota = num(P.cota);
    return (d.cam || []).map(function (x) {
      var o = { de: num(x.de), ate: num(x.ate), desc: x.desc || "", tipo: tipoSolo(x),
        arg: num(x.arg), sil: num(x.sil), are: num(x.are), ped: num(x.ped) };
      o.esp = ok(o.de) && ok(o.ate) ? o.ate - o.de : NaN;
      o.cotaBase = ok(cota) && ok(o.ate) ? cota - o.ate : NaN;
      var g = [o.arg, o.sil, o.are, o.ped].filter(ok);
      o.somaG = g.length ? g.reduce(function (a, b) { return a + b; }, 0) : NaN;
      return o;
    });
  }
  function manobras(d) {
    return (d.man || []).map(function (x) {
      var o = { de: num(x.de), ate: num(x.ate), tb: num(x.tb), q: num(x.q), f: num(x.f), fr: num(x.fr), desc: x.desc || "" };
      o.mp = ok(o.de) && ok(o.ate) ? o.ate - o.de : NaN;
      o.IR = ok(o.mp) && o.mp > 0 && ok(o.tb) ? o.tb / o.mp * 100 : NaN;
      o.RQD = ok(o.mp) && o.mp > 0 && ok(o.q) ? o.q / o.mp * 100 : NaN;
      return o;
    });
  }
  function camadaDe(cs, z) {
    for (var i = 0; i < cs.length; i++) if (ok(cs[i].de) && ok(cs[i].ate) && z >= cs[i].de - 1e-9 && z < cs[i].ate - 1e-9) return cs[i];
    return null;
  }

  FE.FICHAS["dner-pad-111-97"] = {
    titulo: "Perfil individual de sondagem a percussão e rotativa/mista",
    resumo: "Boletim e perfil individual de sondagem (Anexos A e B): golpes por 15 cm → 1ª e 2ª séries de 30 cm, amostrador vazio, N > 44, LL, LP e umidade, camadas com classificação e granulometria, NA e suas variações (Anexo C); na sondagem mista, IR = Tb/Mp × 100, RQD, fendilhamento e fracionamento por manobra (Anexo C). Desenha o perfil em SVG com as convenções da norma.",
    rotuloImportar: function (r) { return "prof. " + fmt(r.prof, 2) + " m · " + (r.nAm || 0) + " amostra(s)" + (ok(r.Nmax) ? " · N máx. " + fmt(r.Nmax, 0) : ""); },
    params: [
      { k: "tipo", r: "Ficha (4.1)", tipo: "select", recarrega: true, opcoes: [["percussao", "Anexo A — sondagem a percussão (SP)"], ["mista", "Anexo B — sondagem rotativa ou mista (SR)"]] },
      { k: "furo", r: "Furo nº (SP / SR)" },
      { k: "diam", r: "Ø do amostrador / furo (Anexo A: Ø 5,08 cm)", ph: "5,08 cm" },
      { k: "diamInt", r: "Ø interno / Ø externo (Anexo B)", ph: "ex.: NX 54 mm / 76 mm", se: function (d) { return mista(d.params || {}); } },
      { k: "rodovia", r: "Rodovia (BR) e km", ph: "BR-000 km 10" },
      { k: "estaca", r: "Estaca / afastamento" },
      { k: "cota", r: "Cota da boca do furo, m" },
      { k: "escala", r: "Escala do perfil", ph: "1:100" },
      { k: "numero", r: "Número da ficha" },
      { k: "pnv", r: "Código PNV" },
      { k: "naIni", r: "Nível d'água — leitura inicial, m", ph: "profundidade ou \"seco\"" },
      { k: "naFin", r: "Nível d'água — leitura final (estabilizado), m" },
      { k: "naVar", r: "Variações do NA estático e/ou piezométrico (Anexo C)", ph: "ex.: 2,10 em 12/05; 1,85 em 13/05" },
      { k: "limArg", r: "Consistência (argilas/siltes argilosos): limites superiores de N", ph: LIM_ARG,
        dica: "muito mole ≤ 2; mole ≤ 5; média ≤ 10; rija ≤ 19; muito rija ≤ 30; dura > 30 (ABNT NBR 6484:2020; a PAD não fixa os limites)" },
      { k: "limAre", r: "Compacidade (areias/siltes arenosos): limites superiores de N", ph: LIM_ARE,
        dica: "fofa ≤ 4; pouco compacta ≤ 8; medianamente compacta ≤ 18; compacta ≤ 40; muito compacta > 40" },
      { k: "impRot", r: "Trecho rotativo: importar boletim da DNER-PRO 102/97", tipo: "importarVarios", de: "dner-pro-102-97",
        se: function (d) { return mista(d.params || {}); }, dica: "usa o primeiro boletim selecionado; substitui a tabela de manobras",
        aplicar: function (lst, P, d) {
          var e = lst[0]; if (!e) return;
          var src = e.dados || {}, SP = src.params || {}, ii = src.ident || {};
          d.man = (src.man || []).map(function (m) {
            return { de: m.de || "", ate: m.ate || "", tb: m.rec || "", q: m.sRqd || "", f: m.nFr || "", fr: m.nPec || "", desc: m.classe || "", reg: ii.registro || "" };
          });
          if (!String(P.cota || "").trim() && SP.cota) P.cota = SP.cota;
          if (!String(P.naIni || "").trim() && SP.naIni) P.naIni = SP.naIni;
          if (!String(P.naFin || "").trim() && SP.naFin) P.naFin = SP.naFin;
          if (!String(P.furo || "").trim() && ii.registro) P.furo = ii.registro;
        } },
    ],
    padrao: { tipo: "percussao", diam: "5,08 cm", escala: "1:100" },
    tabelas: function (d) {
      var P = d.params || {}, t = [
        { chave: "am", titulo: "Penetração e amostras (Anexo A)", rotulo: "Amostra", iniciais: 6, min: 1, dica: "uma coluna por amostra (em geral a cada metro); golpes para cada 15 cm do amostrador",
          linhas: [
            { k: "prof", r: "Profundidade do início da cravação", u: "m" },
            { k: "nAm", r: "Nº da amostra", texto: true },
            { k: "g1", r: "Golpes — 1º trecho de 15 cm", u: "nº" },
            { k: "g2", r: "Golpes — 2º trecho de 15 cm", u: "nº" },
            { k: "g3", r: "Golpes — 3º trecho de 15 cm", u: "nº" },
            { k: "pen", r: "Penetração do 3º trecho, se < 15 cm (impenetrável)", u: "cm" },
            { calc: "s1", r: "1ª série — golpes nos 30 cm iniciais", u: "nº", casas: 0 },
            { calc: "N", r: "2ª série — golpes nos 30 cm finais (índice de resistência)", u: "nº", casas: 0, destaque: true },
            { k: "vazio", r: "Amostrador vazio ⊗ (sim/não)", texto: true },
            { grupo: "Limites e umidade (coluna da esquerda da ficha)" },
            { k: "LL", r: "Limite de liquidez ▼", u: "%" },
            { k: "LP", r: "Limite de plasticidade ▽", u: "%" },
            { calc: "IP", r: "Índice de plasticidade", u: "%", casas: 0 },
            { k: "w", r: "Teor de umidade |", u: "%" },
          ] },
        { chave: "cam", titulo: "Camadas e classificação do material", rotulo: "Camada", iniciais: 3, min: 1, dica: "profundidades a partir da boca do furo",
          linhas: [
            { k: "de", r: "Profundidade — de", u: "m" },
            { k: "ate", r: "Profundidade — até", u: "m" },
            { calc: "esp", r: "Espessura", u: "m", casas: 2 },
            { calc: "cotaBase", r: "Cota da base da camada", u: "m", casas: 2 },
            { k: "desc", r: "Classificação do material (descrição)", texto: true },
            { k: "tipo", r: "Tipo p/ consistência/compacidade (A = argila/silte argiloso; S = areia/silte arenoso)", texto: true },
            { grupo: "Granulometria (0,002 mm · # 200 · # 10)" },
            { k: "arg", r: "Argila", u: "%" }, { k: "sil", r: "Silte", u: "%" }, { k: "are", r: "Areia", u: "%" }, { k: "ped", r: "Pedregulho", u: "%" },
          ] }];
      if (mista(P)) t.push({ chave: "man", titulo: "Trecho rotativo — manobras (Anexo B; Anexo C)", rotulo: "Manobra", iniciais: 3, min: 1,
        dica: "uma coluna por manobra (cada retirada da composição)",
        linhas: [
          { k: "de", r: "Profundidade — de", u: "m" }, { k: "ate", r: "Profundidade — até", u: "m" },
          { calc: "mp", r: "Metragem perfurada (Mp)", u: "m", casas: 2 },
          { k: "tb", r: "Testemunho trazido pelo barrilete (Tb)", u: "m" },
          { calc: "IR", r: "Índice de recuperação IR = Tb/Mp × 100", u: "%", casas: 0, destaque: true },
          { k: "q", r: "Soma dos pedaços de rocha dura, não alterada, ≥ 10 cm", u: "m" },
          { calc: "RQD", r: "RQD", u: "%", casas: 0 },
          { k: "f", r: "Fendilhamento IF — fendas naturais na manobra (f/M)", u: "nº" },
          { k: "fr", r: "Fracionamento IFr — pedaços artificiais na manobra (fr/M)", u: "nº" },
          { k: "desc", r: "Classificação (solos e/ou rochas)", texto: true },
        ] });
      return t;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], am = amostras(d), cs = camadas(d, P), ms = mista(P) ? manobras(d) : [];
      var ant = NaN, prof = NaN, nAm = 0, Nmax = NaN;
      am.forEach(function (o, i) {
        var rot = "Amostra " + (o.nAm || i + 1);
        if (!ok(o.prof)) return;
        nAm++;
        if (ok(ant) && o.prof <= ant) avisos.push(rot + ": profundidade não crescente (" + fmt(o.prof, 2) + " m após " + fmt(ant, 2) + " m).");
        ant = o.prof; prof = Math.max(ok(prof) ? prof : 0, o.prof + 0.45);
        if (ok(o.N)) Nmax = ok(Nmax) ? Math.max(Nmax, o.N) : o.N;
        if (!ok(o.g1) && !o.vazio) avisos.push(rot + ": sem golpes registrados.");
        if (ok(o.pen) && (o.pen <= 0 || o.pen > 15)) avisos.push(rot + ": penetração do 3º trecho deve estar entre 0 e 15 cm.");
        if (ok(o.LL) && ok(o.LP) && o.LP > o.LL) avisos.push(rot + ": LP maior que LL — confira.");
        var c = camadaDe(cs, o.prof + 0.15);
        o.classe = c ? classe(o.N, c.tipo, P) : "";
        o.camada = c;
        if (c && !c.tipo && String(c.desc).trim() && !c.avisado) { c.avisado = true; avisos.push("Camada \"" + String(c.desc).slice(0, 30) + "\": indique A (argila/silte argiloso) ou S (areia/silte arenoso) para classificar a consistência/compacidade."); }
        if (!c && ok(o.N)) avisos.push(rot + ": fora das camadas descritas.");
      });
      var antC = NaN;
      cs.forEach(function (c, i) {
        var rot = "Camada " + (i + 1);
        if (ok(c.esp) && c.esp <= 0) avisos.push(rot + ": profundidade final menor ou igual à inicial.");
        if (ok(c.de) && ok(antC) && Math.abs(c.de - antC) > 0.005) avisos.push(rot + ": começa em " + fmt(c.de, 2) + " m e a anterior termina em " + fmt(antC, 2) + " m — o perfil deve ser contínuo.");
        if (ok(c.ate)) { antC = c.ate; prof = Math.max(ok(prof) ? prof : 0, c.ate); }
        if (!String(c.desc).trim()) avisos.push(rot + ": falta a classificação do material.");
        if (ok(c.somaG) && Math.abs(c.somaG - 100) > 1) avisos.push(rot + ": frações granulométricas somam " + fmt(c.somaG, 0) + " % (≠ 100 %).");
      });
      var rq = { mp: 0, tb: 0, q: 0, cq: 0 }, antM = NaN;
      ms.forEach(function (o, i) {
        var rot = "Manobra " + (i + 1);
        if (!ok(o.mp)) return;
        if (o.mp <= 0) avisos.push(rot + ": profundidade final menor ou igual à inicial.");
        if (ok(antM) && Math.abs(o.de - antM) > 0.005) avisos.push(rot + ": começa em " + fmt(o.de, 2) + " m e a anterior termina em " + fmt(antM, 2) + " m.");
        antM = o.ate; prof = Math.max(ok(prof) ? prof : 0, o.ate);
        if (ok(o.IR) && o.IR > 100.5) avisos.push(rot + ": IR = " + fmt(o.IR, 0) + " % > 100 % — testemunho de manobra anterior? (Anexo C)");
        if (ok(o.q) && ok(o.tb) && o.q > o.tb + 0.005) avisos.push(rot + ": soma dos pedaços ≥ 10 cm maior que o testemunho recuperado.");
        if (ok(o.tb)) { rq.mp += o.mp; rq.tb += o.tb; }
        if (ok(o.q)) { rq.cq += o.mp; rq.q += o.q; }
      });
      if (mista(P) && !ms.some(function (o) { return ok(o.mp); })) avisos.push("Sondagem mista sem manobras do trecho rotativo (Anexo B).");
      if (mista(P) && ms.length && nAm) {
        var fimP = Math.max.apply(null, am.filter(function (o) { return ok(o.prof); }).map(function (o) { return o.prof + 0.45; }));
        var iniR = Math.min.apply(null, ms.filter(function (o) { return ok(o.de); }).map(function (o) { return o.de; }));
        if (ok(fimP) && ok(iniR) && iniR < fimP - 0.46) avisos.push("Trecho rotativo começa (" + fmt(iniR, 2) + " m) antes do fim do trecho a percussão (" + fmt(fimP, 2) + " m) — confira.");
      }
      if (!String(P.naIni || "").trim() && !String(P.naFin || "").trim()) avisos.push("Registre o nível d'água (ou \"seco\") na coluna N.A. (Anexo C).");
      if (!String(P.furo || "").trim()) avisos.push("Informe o número do furo.");
      if (!String(P.cota || "").trim()) avisos.push("Informe a cota da boca do furo (coluna de cotas).");
      if (!cs.some(function (c) { return ok(c.de); })) avisos.push("Descreva as camadas atravessadas (classificação do material).");
      var n44 = am.filter(function (o) { return ok(o.N) && o.N > 44; }).length, nv = am.filter(function (o) { return o.vazio; }).length;
      var r = { prof: prof, nAm: nAm, Nmax: Nmax, n44: n44, nVazio: nv, nCam: cs.filter(function (c) { return ok(c.de); }).length,
        IRg: rq.mp > 0 ? rq.tb / rq.mp * 100 : NaN, RQDg: rq.cq > 0 ? rq.q / rq.cq * 100 : NaN, mRot: rq.mp, nAvisos: avisos.length };
      return { tab: { am: am, cam: cs, man: ms }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " aviso(s)</span>" : '<span class="fe-ok">sem avisos</span>';
      var h = '<div class="fe-res">' + cx(fmt(r.prof, 2) + " <small>m</small>", "Profundidade do perfil · " + st) +
        cx(r.nAm + "", "Amostras · N máx. " + (ok(r.Nmax) ? fmt(r.Nmax, 0) : "—") + (r.n44 ? " · " + r.n44 + " com N > 44 (ξ)" : "") + (r.nVazio ? " · " + r.nVazio + " vazia(s) ⊗" : ""));
      if (mista(P)) h += cx(fmt(r.IRg, 0) + " <small>%</small>", "IR do trecho rotativo (" + fmt(r.mRot, 2) + " m) · RQD " + fmt(r.RQDg, 0) + " %");
      return h + "</div>" + tabelaAmostras(calc) ;
    },
    graficos: function (calc, d, opt) { return [perfil(calc, d, opt || {})]; },
    relatorio: {
      notas: "Ficha conforme a DNER-PAD 111/97 (Anexos A e B; notas do Anexo C). 1ª série = golpes nos 30 cm iniciais e 2ª série = golpes nos 30 cm finais do amostrador (Ø 5,08 cm); índice de resistência = 2ª série. Convenções: ξ = N > 44; ⊗ = amostrador vazio; ▼ LL, ▽ LP, | umidade; na sondagem rotativa, IR = Tb/Mp × 100 por manobra, RQD com pedaços de rocha dura, não alterada, ≥ 10 cm; IF = fendas naturais e IFr = pedaços artificiais por manobra; fora de escala: fr > 10, IR < 5 %, f > 20. A PAD não fixa os limites de consistência/compacidade: a ficha usa os da ABNT NBR 6484:2020 (editáveis).",
      extraHtml: function (calc) { return tabelaAmostras(calc, true); },
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Furo", (P.furo || "—") + (P.cota ? " · cota da boca " + P.cota + " m" : "")], ["Profundidade do perfil", fmt(r.prof, 2) + " m"],
          ["Amostras / camadas", r.nAm + " / " + r.nCam], ["N (2ª série) máximo", ok(r.Nmax) ? fmt(r.Nmax, 0) + " golpes/30 cm" : "—"]];
        if (P.naIni || P.naFin) rows.push(["Nível d'água", "inicial " + (P.naIni || "—") + " · final " + (P.naFin || "—") + (P.naVar ? " · variações: " + P.naVar : "")]);
        if (mista(P)) rows.push(["Trecho rotativo", fmt(r.mRot, 2) + " m · IR " + fmt(r.IRg, 0) + " % · RQD " + fmt(r.RQDg, 0) + " %"]);
        rows.push(["Avisos", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "SP-01 — argila mole sobre areia e solo residual (Anexo A)", dados: function () {
        return { ident: { registro: "SP-01", data: "2026-03-10", obra: "Obra A — aterro de encontro", local: "Est. 120, eixo", laboratorista: "Sondador A", responsavel: "Engenheiro A" },
          params: { tipo: "percussao", furo: "SP-01", diam: "5,08 cm", rodovia: "BR-000 km 12", estaca: "120 — eixo", cota: "8,40", escala: "1:100", numero: "01/03", pnv: "000BR0000",
            naIni: "1,20", naFin: "1,05", naVar: "1,20 em 10/03 (início); 1,05 em 11/03 (24 h)" },
          am: [
            ["1,00", "1", "1", "1", "1", "", "", "68", "32", "72"], ["2,00", "2", "0", "1", "1", "", "", "85", "35", "96"], ["3,00", "3", "0", "0", "1", "", "", "92", "38", "118"],
            ["4,00", "4", "1", "1", "1", "", "", "78", "33", "88"], ["5,00", "5", "3", "5", "6", "", "", "", "", "24"], ["6,00", "6", "5", "8", "10", "", "", "", "", "21"],
            ["7,00", "7", "7", "11", "14", "", "", "", "", "19"], ["8,00", "8", "12", "17", "22", "", "", "", "", "17"], ["9,00", "9", "20", "27", "30", "", "", "", "", "15"],
            ["10,00", "10", "28", "32", "18", "8", "", "", "", "14"]].map(function (x) {
            return { prof: x[0], nAm: x[1], g1: x[2], g2: x[3], g3: x[4], pen: x[5], vazio: x[6], LL: x[7], LP: x[8], w: x[9] };
          }),
          cam: [
            { de: "0,00", ate: "0,60", desc: "Aterro de silte arenoso, marrom", tipo: "S", arg: "10", sil: "40", are: "45", ped: "5" },
            { de: "0,60", ate: "4,70", desc: "Argila orgânica muito mole, cinza-escura", tipo: "A", arg: "58", sil: "35", are: "7", ped: "0" },
            { de: "4,70", ate: "7,60", desc: "Areia fina a média, pouco argilosa, cinza", tipo: "S", arg: "8", sil: "10", are: "80", ped: "2" },
            { de: "7,60", ate: "10,45", desc: "Silte arenoso (solo residual), variegado", tipo: "S", arg: "12", sil: "55", are: "30", ped: "3" }] };
      } },
      { nome: "SR-02 — sondagem mista com trecho rotativo importado (Anexo B) e avisos", dados: function () {
        var d = { ident: { registro: "SR-02", data: "2026-04-22", obra: "Obra B — ponte", local: "Est. 85, apoio P2" },
          params: { tipo: "mista", furo: "", diam: "5,08 cm", diamInt: "NX 54 mm / 76 mm", rodovia: "BR-000 km 30", cota: "", escala: "1:100",
            naIni: "", naFin: "" },
          am: [
            ["1,00", "1", "2", "3", "3", "", "", "45", "28", "31"], ["2,00", "2", "3", "4", "5", "", "", "48", "27", "29"], ["3,00", "3", "", "", "", "", "sim", "", "", ""],
            ["4,00", "4", "8", "12", "15", "", "", "", "", "22"], ["5,00", "5", "22", "30", "25", "5", "", "", "", "18"]].map(function (x) {
            return { prof: x[0], nAm: x[1], g1: x[2], g2: x[3], g3: x[4], pen: x[5], vazio: x[6], LL: x[7], LP: x[8], w: x[9] };
          }),
          cam: [
            { de: "0,00", ate: "2,50", desc: "Argila siltosa, rija, vermelha", arg: "50", sil: "35", are: "10", ped: "0" },
            { de: "2,60", ate: "6,20", desc: "Silte arenoso (saprolito de gnaisse)", tipo: "S" },
            { de: "6,20", ate: "12,90", desc: "Gnaisse (ver manobras)" }] };
        d.params.impRot = ["ex:dner-pro-102-97:0"];
        FE.FICHAS["dner-pad-111-97"].params.filter(function (p) { return p.k === "impRot"; })[0].aplicar([exemplo102()], d.params, d);
        d.params.cota = ""; d.params.naIni = ""; d.params.naFin = ""; d.params.furo = "";
        return d;
      } },
    ],
  };

  // exemplo 0 da DNER-PRO 102/97 no formato entregue pelo motor ao "aplicar" (ou vazio, se a ficha não estiver carregada)
  function exemplo102() {
    var O = FE.FICHAS["dner-pro-102-97"];
    if (!O || !O.exemplos || !O.exemplos[0]) return { ficha: "dner-pro-102-97", dados: { man: [] }, resultados: {} };
    var dd = O.exemplos[0].dados();
    return { ficha: "dner-pro-102-97", dados: dd, resultados: {} };
  }

  function tabelaAmostras(calc, imp) {
    var am = calc.tab.am.filter(function (o) { return ok(o.prof); });
    if (!am.length) return "";
    var th = imp ? ' style="background:#f2f2f2"' : "";
    return '<table class="' + (imp ? "gr" : "fe-resumo") + '"><thead><tr><th' + th + ">Amostra</th><th" + th + ">Prof. (m)</th><th" + th + ">1ª série</th><th" + th + ">2ª série (N)</th><th" + th +
      ">Camada</th><th" + th + ">Consistência / compacidade</th></tr></thead><tbody>" + am.map(function (o, i) {
        var n = o.vazio && !ok(o.N) ? "⊗ vazio" : ok(o.N) && o.N > 44 ? "ξ (" + o.txtN + ")" : o.txtN || "—";
        return "<tr><td>" + esc(o.nAm || i + 1) + "</td><td>" + fmt(o.prof, 2) + "</td><td>" + (ok(o.s1) ? fmt(o.s1, 0) : "—") + "</td><td>" + esc(n) + "</td><td>" +
          esc(o.camada ? String(o.camada.desc).slice(0, 40) : "—") + "</td><td>" + esc(o.classe || "—") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  // perfil individual no padrão das fichas dos Anexos A e B
  function perfil(calc, d, opt) {
    var P = d.params || {}, r = calc.resultados, am = calc.tab.am.filter(function (o) { return ok(o.prof); });
    var cs = calc.tab.cam.filter(function (c) { return ok(c.de) && ok(c.ate) && c.ate > c.de; });
    var ms = (calc.tab.man || []).filter(function (o) { return ok(o.de) && ok(o.ate) && o.ate > o.de; });
    if (!am.length && !cs.length && !ms.length) return '<div class="fe-graf-vazio">O perfil aparece com as amostras e as camadas.</div>';
    var imp = opt.imprimir, rot = mista(P);
    var txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#bbb" : "var(--border)", forte = imp ? "#111" : "var(--text)";
    var z1 = Math.ceil(Math.max(1, r.prof || 0)), top = 74, ez = Math.max(16, Math.min(42, 620 / z1)), H = top + z1 * ez + 34;
    // colunas
    var x0 = 4, xC = [x0, 48], xL = [52, 150], xP = [154, 314], xI = rot ? [318, 418] : null, b = rot ? 422 : 318;
    var xA = [b, b + 36], xK = [b + 40, b + 92], xD = [b + 96, b + 330], W = xD[1] + 4;
    var cota = num(P.cota);
    function Y(z) { return top + z * ez; }
    function XL(v) { return xL[0] + Math.max(0, Math.min(100, v)) / 100 * (xL[1] - xL[0]); }
    function XP(n) { return xP[0] + Math.max(0, Math.min(40, n)) / 40 * (xP[1] - xP[0]); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="9.5">';
    s += '<defs><pattern id="pSil" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="' + txt + '" stroke-width="1.2"/></pattern>' +
      '<pattern id="pAre" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.7" fill="' + txt + '"/></pattern>' +
      '<pattern id="pPed" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.8" fill="' + txt + '"/></pattern></defs>';
    s += '<text x="' + (W / 2) + '" y="12" text-anchor="middle" font-size="11" font-weight="bold" fill="' + forte + '">' +
      (rot ? "PERFIL INDIVIDUAL DE SONDAGEM ROTATIVA OU MISTA" : "PERFIL INDIVIDUAL DE SONDAGEM A PERCUSSÃO") + " — " + esc(P.furo || "furo") + "</text>";
    function cab(x, t, t2) {
      s += '<text x="' + ((x[0] + x[1]) / 2) + '" y="30" text-anchor="middle" fill="' + txt + '" font-weight="bold">' + t + "</text>";
      if (t2) s += '<text x="' + ((x[0] + x[1]) / 2) + '" y="42" text-anchor="middle" fill="' + txt + '" font-size="8.5">' + t2 + "</text>";
      s += '<rect x="' + x[0] + '" y="20" width="' + (x[1] - x[0]) + '" height="' + (H - 48) + '" fill="none" stroke="' + grade + '"/>';
    }
    cab(xC, ok(cota) ? "COTAS" : "PROF.", "(m)"); cab(xL, "LL ▼ LP ▽ w |", "(%)"); cab(xP, "PENETRAÇÃO", "nº golpes / 30 cm");
    if (xI) cab(xI, "ÍNDICES", "IR (%) · f · fr"); cab(xA, "Nº", "amostra"); cab(xK, "CAMADA", "(m) · N.A."); cab(xD, "CLASSIFICAÇÃO DO MATERIAL", "");
    // escalas
    [0, 20, 40, 60, 80, 100].forEach(function (v) {
      var x = XL(v); s += '<line x1="' + x + '" y1="' + top + '" x2="' + x + '" y2="' + Y(z1) + '" stroke="' + grade + '" stroke-width="0.5"/>';
      if (v % 20 === 0 && v < 100) s += '<text x="' + x + '" y="' + (top - 6) + '" text-anchor="middle" fill="' + txt + '" font-size="8">' + v + "</text>";
    });
    for (var n = 0; n <= 40; n += 4) {
      var xp = XP(n); s += '<line x1="' + xp + '" y1="' + top + '" x2="' + xp + '" y2="' + Y(z1) + '" stroke="' + grade + '" stroke-width="' + (n % 8 ? 0.4 : 0.7) + '"/>';
      if (n % 8 === 0 && n) s += '<text x="' + xp + '" y="' + (top - 6) + '" text-anchor="middle" fill="' + txt + '" font-size="8">' + n + "</text>";
    }
    if (xI) [0, 50, 100].forEach(function (v) {
      var x = xI[0] + v / 100 * (xI[1] - xI[0]); s += '<line x1="' + x + '" y1="' + top + '" x2="' + x + '" y2="' + Y(z1) + '" stroke="' + grade + '" stroke-width="0.5"/>';
      s += '<text x="' + x + '" y="' + (top - 6) + '" text-anchor="middle" fill="' + txt + '" font-size="8">' + v + "</text>";
    });
    for (var z = 0; z <= z1; z++) {
      s += '<line x1="' + (xC[1] - 5) + '" y1="' + Y(z) + '" x2="' + xC[1] + '" y2="' + Y(z) + '" stroke="' + txt + '"/>';
      if (ez >= 18 || z % 2 === 0) s += '<text x="' + (xC[1] - 7) + '" y="' + (Y(z) + 3) + '" text-anchor="end" fill="' + txt + '" font-size="8.5">' + (ok(cota) ? fmt(cota - z, 2) : fmt(z, 0)) + "</text>";
    }
    // camadas: limites, descrição e granulometria
    cs.forEach(function (c) {
      var y0 = Y(c.de), y1 = Y(c.ate);
      s += '<line x1="' + xL[0] + '" y1="' + y1 + '" x2="' + xD[1] + '" y2="' + y1 + '" stroke="' + txt + '" stroke-width="0.8"/>';
      s += '<text x="' + (xK[0] + 3) + '" y="' + (y1 - 2) + '" fill="' + txt + '" font-size="8.5">' + fmt(c.ate, 2) + "</text>";
      var fr = [[c.arg, imp ? "#111" : "var(--text)"], [c.sil, "url(#pSil)"], [c.are, "url(#pAre)"], [c.ped, "url(#pPed)"]], gx = xD[0] + 3, gw = 40;
      if (fr.some(function (f) { return ok(f[0]); })) {
        var tot = fr.reduce(function (a, f) { return a + (ok(f[0]) ? f[0] : 0); }, 0) || 100, acc = 0;
        fr.forEach(function (f) { if (!ok(f[0]) || f[0] <= 0) return; var w = f[0] / tot * gw; s += '<rect x="' + (gx + acc) + '" y="' + (y0 + 3) + '" width="' + w + '" height="8" fill="' + f[1] + '" stroke="' + txt + '" stroke-width="0.4"/>'; acc += w; });
      }
      var linhasD = quebra(c.desc, 40), maxL = Math.max(1, Math.floor((y1 - y0 - 4) / 10));
      linhasD.slice(0, maxL).forEach(function (t, k) { s += '<text x="' + (xD[0] + 48) + '" y="' + (y0 + 11 + k * 10) + '" fill="' + forte + '">' + esc(t) + "</text>"; });
    });
    // limites e umidade
    am.forEach(function (o) {
      var y = Y(o.prof + 0.3);
      if (ok(o.LL)) s += '<polygon points="' + (XL(o.LL) - 4) + "," + (y - 3) + " " + (XL(o.LL) + 4) + "," + (y - 3) + " " + XL(o.LL) + "," + (y + 4) + '" fill="' + forte + '"><title>LL ' + fmt(o.LL, 0) + " %</title></polygon>";
      if (ok(o.LP)) s += '<polygon points="' + (XL(o.LP) - 4) + "," + (y - 3) + " " + (XL(o.LP) + 4) + "," + (y - 3) + " " + XL(o.LP) + "," + (y + 4) + '" fill="none" stroke="' + forte + '"><title>LP ' + fmt(o.LP, 0) + " %</title></polygon>";
      if (ok(o.w)) s += '<line x1="' + XL(o.w) + '" y1="' + (y - 5) + '" x2="' + XL(o.w) + '" y2="' + (y + 5) + '" stroke="#4f8cff" stroke-width="2.2"><title>w ' + fmt(o.w, 0) + " %</title></line>";
      if (ok(o.w) && o.w > 100) s += '<text x="' + (xL[1] - 2) + '" y="' + (y + 3) + '" text-anchor="end" fill="#4f8cff" font-size="8">' + fmt(o.w, 0) + "</text>";
    });
    // penetração: 1ª série (círculos vazados, tracejado) e 2ª série (cheios, contínuo)
    function serie(campo, cheio) {
      var pts = am.filter(function (o) { return ok(o[campo]); }).map(function (o) { return [XP(o[campo]), Y(o.prof + 0.3), o]; });
      if (pts.length > 1) s += '<polyline points="' + pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ") + '" fill="none" stroke="' + forte + '" stroke-width="1"' + (cheio ? "" : ' stroke-dasharray="4 3"') + "/>";
      pts.forEach(function (p) {
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="' + (cheio ? forte : imp ? "#fff" : "var(--bg, #fff)") + '" stroke="' + forte + '"><title>' + (cheio ? "2ª série " : "1ª série ") + fmt(p[2][campo], 0) + "</title></circle>";
        if (cheio && p[2][campo] > 40) s +='<text x="' + (xP[1] - 3) + '" y="' + (p[1] + (cheio ? 10 : -4)) + '" text-anchor="end" fill="' + forte + '" font-size="9">' + (p[2][campo] > 44 ? "ξ" : fmt(p[2][campo], 0)) + "</text>";
      });
    }
    serie("s1", false); serie("N", true);
    am.forEach(function (o) {
      var y = Y(o.prof + 0.3);
      s += '<text x="' + ((xA[0] + xA[1]) / 2) + '" y="' + (y + 3) + '" text-anchor="middle" fill="' + forte + '">' + (o.vazio ? "⊗" : esc(o.nAm)) + "</text>";
      if (o.parcial || (ok(o.g1) && !ok(o.g2))) s += '<text x="' + (xP[0] + 3) + '" y="' + (y + 3) + '" fill="' + forte + '" font-size="8">' + esc(o.txtN) + "</text>";
    });
    // índices da sondagem rotativa
    if (xI) ms.forEach(function (o) {
      var y0 = Y(o.de), y1 = Y(o.ate), wI = xI[1] - xI[0];
      s += '<line x1="' + xI[0] + '" y1="' + y1 + '" x2="' + xI[1] + '" y2="' + y1 + '" stroke="' + txt + '" stroke-dasharray="2 2"/>';
      if (ok(o.IR)) s += '<rect x="' + xI[0] + '" y="' + (y0 + 1) + '" width="' + Math.max(o.IR < 5 ? 2 : 0, Math.min(100, o.IR) / 100 * wI) + '" height="' + Math.max(1, (y1 - y0) / 2 - 1) + '" fill="#4f8cff" opacity="0.8"><title>IR ' + fmt(o.IR, 0) + " %</title></rect>";
      if (ok(o.RQD)) s += '<rect x="' + xI[0] + '" y="' + ((y0 + y1) / 2) + '" width="' + Math.min(100, o.RQD) / 100 * wI + '" height="' + Math.max(1, (y1 - y0) / 2 - 1) + '" fill="#34c38f" opacity="0.8"><title>RQD ' + fmt(o.RQD, 0) + " %</title></rect>";
      var tt = (ok(o.f) ? "f " + (o.f > 20 ? ">20" : fmt(o.f, 0)) : "") + (ok(o.fr) ? " fr " + (o.fr > 10 ? ">10" : fmt(o.fr, 0)) : "");
      s += '<text x="' + (xI[1] - 2) + '" y="' + ((y0 + y1) / 2 + 3) + '" text-anchor="end" fill="' + forte + '" font-size="8">' + tt + "</text>";
      if (!cs.some(function (c) { return c.de <= o.de + 1e-6 && c.ate >= o.ate - 1e-6 && String(c.desc).trim(); }) && o.desc)
        s += '<text x="' + (xD[0] + 48) + '" y="' + ((y0 + y1) / 2 + 3) + '" fill="' + forte + '">' + esc(String(o.desc).slice(0, 40)) + "</text>";
    });
    // nível d'água
    [[num(P.naIni), false], [num(P.naFin), true]].forEach(function (x) {
      if (!ok(x[0]) || x[0] > z1) return;
      var xm = xK[1] - 12, y = Y(x[0]);
      s += '<polygon points="' + (xm - 6) + "," + (y - 8) + " " + (xm + 6) + "," + (y - 8) + " " + xm + "," + y + '" fill="' + (x[1] ? "#4fc3d9" : "none") + '" stroke="#2a9bb0"><title>NA ' + (x[1] ? "final " : "inicial ") + fmt(x[0], 2) + " m</title></polygon>";
      s += '<line x1="' + (xm - 10) + '" y1="' + y + '" x2="' + (xm + 10) + '" y2="' + y + '" stroke="#2a9bb0" stroke-width="1.5"/>';
    });
    // legenda / convenções
    var yl = H - 12;
    s += '<text x="' + x0 + '" y="' + yl + '" fill="' + txt + '" font-size="8.5">Convenções: ○ - - 1ª série · ● — 2ª série · ξ N > 44 · ⊗ amostrador vazio · ▽ NA inicial ▼ NA final' +
      (rot ? " · IR (azul) / RQD (verde); fora de escala: fr > 10, IR < 5 %, f > 20" : "") + " · escala " + esc(P.escala || "—") + "</text>";
    return s + "</svg>";
  }
  function quebra(t, n) {
    var out = [], l = "";
    String(t || "").split(/\s+/).forEach(function (w) { if ((l + " " + w).trim().length > n) { if (l) out.push(l); l = w; } else l = (l + " " + w).trim(); });
    if (l) out.push(l);
    return out;
  }
})();
