/*
 * Ficha: DNER-ME 122/94 — Solos — Limite de liquidez (método de referência e método expedito).
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * Campos de calcular(d).resultados (gravados com o ensaio salvo; a ficha DNER-ME 082/94 importa o LL):
 *   resultados.LL       limite de liquidez aproximado ao inteiro (7.2.4) — NaN se não determinado
 *   resultados.LLexato  valor antes do arredondamento
 *   resultados.np       true quando a amostra não apresenta LL (7.2.5)
 *   resultados.metodo   "ref" ou "exp"
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var U = FE.BLOCOS.umidade;

  var EXPOENTE = 0.156;  // 8.2: LL = h × (N/25)^0,156
  function kN(N) { return ok(N) && N > 0 ? Math.pow(N / 25, EXPOENTE) : NaN; }
  // 7.1.7: pelo menos uma determinação em cada intervalo de golpes
  var INTERVALOS = [[25, 35], [20, 30], [15, 25]];

  // reta da curva de fluidez: log N (ordenada) × h (abscissa), mínimos quadrados (7.2.1 e 7.2.2)
  function retaFluidez(pts) {
    var n = pts.length;
    if (n < 2) return null;
    var xm = media(pts.map(function (p) { return p.h; })), ym = media(pts.map(function (p) { return Math.log10(p.N); }));
    var sxy = 0, sxx = 0;
    pts.forEach(function (p) { sxy += (p.h - xm) * (Math.log10(p.N) - ym); sxx += (p.h - xm) * (p.h - xm); });
    if (!sxx) return null;
    var b = sxy / sxx;
    return { b: b, a: ym - b * xm };  // log N = a + b·h
  }

  FE.FICHAS["dner-me-122-94"] = {
    titulo: "Solos — Limite de liquidez (método de referência e expedito)",
    rotuloImportar: function (r) { return r.np ? "LL: NP (não apresenta)" : "LL " + (ok(r.LL) ? fmt(r.LL, 0) : "—") + " %"; },
    resumo: "Aparelho de Casagrande. Referência: reta log N × umidade por no mínimo três pontos e LL na ordenada de 25 golpes (7.2). Expedito: LL = h × (N/25)^0,156 em duas determinações com 20 a 30 golpes (8). Resultado ao inteiro.",
    blocos: ["umidade"],
    params: [
      { k: "metodo", r: "Método", tipo: "select", recarrega: true,
        opcoes: [["ref", "Método de referência — curva de fluidez (7)"], ["exp", "Método expedito — duas determinações (8)"]],
        dica: "o de referência é obrigatório quando o LL passa de 150 % ou em caso de controvérsia (1)" },
      { k: "apresenta", r: "A amostra apresenta limite de liquidez? (7.2.5)", tipo: "select",
        opcoes: [["sim", "Sim"], ["nao", "Não — impossível abrir a canelura ou fechá-la com mais de 25 golpes (NP)"]] },
      { k: "preparo", r: "Preparação da amostra (DNER-ME 041/94, 4.d)", ph: "ex.: passada na peneira de 0,42 mm, seca ao ar" },
      { k: "aparelho", r: "Aparelho de Casagrande nº / calibração (5)", ph: "ex.: nº 2 — queda de 1 cm conferida em 03/06" },
    ],
    padrao: { metodo: "ref", apresenta: "sim" },
    tabelas: function (d) {
      var exp = (d.params || {}).metodo === "exp";
      if (Array.isArray(d.pontos)) {
        if (exp) { while (d.pontos.length < 2) d.pontos.push({ usar: true }); if (d.pontos.length > 2) d.pontos.length = 2; }
        else while (d.pontos.length < 4) d.pontos.push({ usar: true });
      }
      var linhas = [{ k: "N", r: "Número de golpes para fechar a canelura em 1 cm (N) — 7.1.4", u: "golpes" },
        { grupo: "Umidade do solo da canelura — bloco Teor de umidade, DNIT 456-ME (= 7.1.5)" }]
        .concat(U.linhas("u", "", "lab"));
      if (exp) linhas = linhas.concat([{ grupo: "Resultado da determinação (8.2)" },
        { calc: "K", r: "K(N) = (N/25)^0,156 (Tabela)", u: "", casas: 3 },
        { calc: "LLi", r: "LL = h × K(N)", u: "%", casas: 1, destaque: true }]);
      return [exp ? {
        chave: "pontos", titulo: "Determinações — método expedito", rotulo: "Det.", iniciais: 2, min: 2, fixo: true, nomes: ["1", "2"],
        dica: "duas determinações distintas com N entre 20 e 30 golpes e umidade até 150 % (8.1)", linhas: linhas,
      } : {
        chave: "pontos", titulo: "Pontos da curva de fluidez", rotulo: "Ponto", iniciais: 5, min: 4, usar: true,
        dica: "uma coluna por ponto, com água crescente; no mínimo quatro (7.1.7). Desmarque \"usar\" para tirar um ponto da reta.",
        linhas: linhas,
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, exp = P.metodo === "exp", avisos = [];
      var pts = (d.pontos || []).map(function (p, i) {
        var N = num(p.N), h = U.calcular(p, "u", "lab").w;
        var o = { N: N, h: h, uW: h, usar: exp || p.usar !== false };
        if (ok(N) && (N <= 0 || Math.round(N) !== N)) avisos.push((exp ? "Determinação " : "Ponto ") + (i + 1) + ": número de golpes deve ser inteiro positivo.");
        if (exp) { o.K = kN(N); o.LLi = ok(h) && ok(o.K) ? h * o.K : NaN; }
        return o;
      });
      var validos = pts.filter(function (p) { return ok(p.N) && p.N > 0 && ok(p.h); });
      var res = { metodo: exp ? "exp" : "ref", np: P.apresenta === "nao", LL: NaN, LLexato: NaN, reta: null, dif: NaN };

      if (res.np) {
        avisos.push("Amostra sem limite de liquidez (7.2.5): registrar LL como NP; o índice de plasticidade também é NP (DNER-ME 082/94, 6, nota 2).");
      } else if (exp) {
        pts.forEach(function (p, i) {
          var rot = "Determinação " + (i + 1);
          if (ok(p.N) && (p.N < 20 || p.N > 30)) avisos.push(rot + ": N = " + p.N + " golpes, fora do intervalo de 20 a 30 do método expedito (8.1).");
          if (ok(p.h) && p.h > 150) avisos.push(rot + ": umidade de " + fmt(p.h, 1) + " %, acima de 150 % — use o método de referência (1 e 8.1).");
        });
        var ll = pts.map(function (p) { return p.LLi; }).filter(ok);
        if (ll.length === 2) {
          res.dif = Math.abs(ll[0] - ll[1]);
          if (res.dif > 1) avisos.push("Os valores das duas determinações diferem " + fmt(res.dif, 1) + " % (mais de 1 %): o ensaio deve ser repetido (8.2).");
        } else if (ll.length) avisos.push("O método expedito usa a média de duas determinações (8.2); há " + ll.length + ".");
        res.LLexato = media(ll);
      } else {
        var usados = validos.filter(function (p) { return p.usar; });
        if (validos.length < 4) avisos.push("Faça ao menos quatro determinações (7.1.7: repetir 7.1.1 a 7.1.6 pelo menos mais três vezes); há " + validos.length + ".");
        INTERVALOS.forEach(function (iv) {
          if (validos.length && !validos.some(function (p) { return p.N >= iv[0] && p.N <= iv[1]; }))
            avisos.push("Nenhuma determinação no intervalo de " + iv[0] + " a " + iv[1] + " golpes (7.1.7).");
        });
        if (usados.length < 3 && validos.length) avisos.push("A reta deve passar o mais próximo possível de pelo menos três pontos (7.2.2); marque ao menos três.");
        var r = usados.length >= 2 ? retaFluidez(usados) : null;
        if (r && r.b < 0) {
          res.reta = r;
          res.LLexato = (Math.log10(25) - r.a) / r.b;  // abscissa da reta na ordenada de 25 golpes (7.2.3)
          if (!validos.some(function (p) { return p.N > 25; }))
            avisos.push("Nenhum ponto fechou com mais de 25 golpes: se não for possível, a amostra não apresenta LL (7.2.5).");
        } else if (r) {
          avisos.push("Os pontos não formam uma reta com o número de golpes decrescendo com a umidade: revise as determinações.");
        }
      }
      if (!res.np && exp && ok(res.LLexato) && res.LLexato > 150) avisos.push("LL acima de 150 %: o método de referência deve ser usado (1).");
      res.LL = ok(res.LLexato) ? Math.round(res.LLexato) : NaN;  // 7.2.4: inteiro mais próximo
      return { tab: { pontos: pts }, pontos: pts, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var v = r.np ? "NP" : ok(r.LL) ? r.LL + " <small>%</small>" : "—";
      var base = r.np ? "não apresenta limite de liquidez (7.2.5)" : r.metodo === "exp"
        ? "média das duas determinações (8.2)" + (ok(r.dif) ? " · diferença " + fmt(r.dif, 1) + " %" : "")
        : "reta log N × h na ordenada de 25 golpes (7.2.3)";
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">Limite de liquidez (LL) — ' +
        esc(base) + (ok(r.LLexato) && !r.np ? " (" + fmt(r.LLexato, 2) + " %)" : "") + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (r.metodo === "exp" ? "Expedito" : "Referência") +
        '</div><div class="fe-res-r">Método' + (r.reta ? " · reta: log N = " + fmt(r.reta.a, 4) + " " + (r.reta.b < 0 ? "− " : "+ ") + fmt(Math.abs(r.reta.b), 5) + " × h" : "") + "</div></div></div>";
    },
    graficos: function (calc, d, opt) { return [graficoFluidez(calc, opt)]; },
    relatorio: {
      notas: "Umidade: h = (Ph − Ps) / Ps × 100 (7.1.5, igual à eq. 1 da DNIT 456-ME). Referência: reta por mínimos quadrados de log N (ordenada, escala logarítmica) sobre h (abscissa, escala aritmética) com os pontos considerados; LL na ordenada de 25 golpes (7.2). Expedito: LL = h × (N/25)^0,156 em cada determinação e média das duas; diferença acima de 1 % obriga a repetir (8.2). Resultado aproximado ao inteiro mais próximo (7.2.4).",
      resultados: function (calc) {
        var r = calc.resultados;
        var rows = [["Limite de liquidez (LL)", r.np ? "NP — não apresenta limite de liquidez" : ok(r.LL) ? r.LL + " %" : "—"]];
        rows.push(["Método", r.metodo === "exp" ? "Expedito (8)" + (ok(r.dif) ? " — diferença entre as determinações " + fmt(r.dif, 1) + " %" : "")
          : "Referência (7) — " + calc.pontos.filter(function (p) { return p.usar && ok(p.N) && ok(p.h); }).length + " pontos na reta"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Rua A — referência, 5 pontos (planilha PROCTOR INTERMEDIÁRIO, Unidade A)", dados: function () {
        return { ident: { registro: "12", data: "2024-12-09", obra: "Obra A", trecho: "Rua A (estaca 11 a 14)", origem: "Unidade A" },
          params: { metodo: "ref", apresenta: "sim" },
          pontos: [["50", "11,97", "15,31", "14,72", "46"], ["43", "6,81", "10,42", "9,72", "34"], ["42", "11,72", "16,62", "15,62", "26"],
            ["41", "7,28", "11,36", "10,48", "18"], ["40", "6,45", "9,07", "8,47", "8"]].map(function (x) {
            return { usar: true, un: x[0], ut: x[1], uu: x[2], us: x[3], N: x[4] };
          }) };
      } },
      { nome: "Obra C — referência, 5 pontos (matriz de solos do Unidade B, registro 1)", dados: function () {
        return { ident: { registro: "1", data: "2026-06-05", obra: "Obra C", trecho: "RO-000", camada: "Sub-base — argila/areia", origem: "Unidade B" },
          params: { metodo: "ref", apresenta: "sim" },
          pontos: [["4", "8,7", "13,1", "11,9", "50"], ["107", "6,4", "12,1", "10,5", "40"], ["203", "7,5", "11,6", "10,4", "30"],
            ["208", "6,0", "11,7", "9,9", "20"], ["29", "8,4", "13,2", "11,6", "10"]].map(function (x) {
            return { usar: true, un: x[0], ut: x[1], uu: x[2], us: x[3], N: x[4] };
          }) };
      } },
      { nome: "Argila siltosa — método expedito, determinações discordantes (repetir)", dados: function () {
        // alvos: LL 58 e 60 (diferença de 2 %), N = 22 e 31 (31 fora de 20–30)
        function det(n, t, ms, N, ll) {
          var h = ll / Math.pow(N / 25, EXPOENTE), s = t + ms;
          return { un: n, ut: fmt(t, 2), uu: fmt(s + ms * h / 100, 2), us: fmt(s, 2), N: String(N) };
        }
        return { ident: { registro: "EX-LL-003", camada: "Subleito — argila siltosa", origem: "Corte km 12" },
          params: { metodo: "exp", apresenta: "sim" },
          pontos: [det("21", 14.12, 18.4, 22, 58), det("22", 13.87, 17.9, 31, 60)] };
      } },
    ],
  };

  // curva de fluidez: umidade (abscissa aritmética) × número de golpes (ordenada logarítmica)
  function graficoFluidez(calc, opt) {
    opt = opt || {};
    var r = calc.resultados;
    var pts = calc.pontos.filter(function (p) { return ok(p.N) && p.N > 0 && ok(p.h); });
    if (!pts.length) return '<div class="fe-graf-vazio">A curva de fluidez aparece com os golpes e as umidades.</div>';
    var W = opt.w || 560, H = opt.h || 320, m = { l: 48, r: 16, t: 14, b: 42 };
    var hs = pts.map(function (p) { return p.h; }).concat(ok(r.LLexato) ? [r.LLexato] : []);
    var x0 = Math.floor(Math.min.apply(null, hs) - 2), x1 = Math.ceil(Math.max.apply(null, hs) + 2);
    var ny0 = 5, ny1 = 100;
    pts.forEach(function (p) { if (p.N < ny0) ny0 = Math.max(1, Math.floor(p.N)); if (p.N > ny1) ny1 = Math.ceil(p.N); });
    var ly0 = Math.log10(ny0), ly1 = Math.log10(ny1);
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(n) { return H - m.b - (Math.log10(n) - ly0) / (ly1 - ly0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cor = imp ? "#1f5fbf" : "#4f8cff", corLL = imp ? "#c0392b" : "#e0a13a";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var passoX = (x1 - x0) > 40 ? 10 : (x1 - x0) > 20 ? 5 : (x1 - x0) > 10 ? 2 : 1;
    for (var gx = Math.ceil(x0 / passoX) * passoX; gx <= x1; gx += passoX) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + gx + "</text>";
    }
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200].forEach(function (n) {
      if (n < ny0 || n > ny1) return;
      var rot = [5, 10, 15, 20, 25, 30, 40, 50, 100, 200].indexOf(n) !== -1 || n === ny0;
      s += '<line x1="' + m.l + '" y1="' + Y(n) + '" x2="' + (W - m.r) + '" y2="' + Y(n) + '" stroke="' + grade + '" stroke-width="' + (n === 25 ? 1.2 : 0.6) + '"/>';
      if (rot) s += '<text x="' + (m.l - 6) + '" y="' + (Y(n) + 4) + '" text-anchor="end" fill="' + txt + '">' + n + "</text>";
    });
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Teor de umidade h (%) — escala aritmética</text>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Número de golpes (escala log)</text>';
    if (r.reta) {
      var a = r.reta.a, b = r.reta.b;
      var xa = x0, xb = x1, na = Math.pow(10, a + b * xa), nb = Math.pow(10, a + b * xb);
      // recorta a reta ao retângulo do gráfico
      if (na > ny1) { xa = (Math.log10(ny1) - a) / b; na = ny1; }
      if (nb < ny0) { xb = (Math.log10(ny0) - a) / b; nb = ny0; }
      s += '<line x1="' + X(xa).toFixed(1) + '" y1="' + Y(na).toFixed(1) + '" x2="' + X(xb).toFixed(1) + '" y2="' + Y(nb).toFixed(1) + '" stroke="' + cor + '" stroke-width="2"/>';
    }
    if (ok(r.LLexato) && !r.np) {
      s += '<line x1="' + X(r.LLexato) + '" y1="' + Y(25) + '" x2="' + X(r.LLexato) + '" y2="' + (H - m.b) + '" stroke="' + corLL + '" stroke-dasharray="4 3" stroke-width="1.4"/>';
      s += '<line x1="' + m.l + '" y1="' + Y(25) + '" x2="' + X(r.LLexato) + '" y2="' + Y(25) + '" stroke="' + corLL + '" stroke-dasharray="4 3" stroke-width="1.4"/>';
      s += '<text x="' + (X(r.LLexato) + 5) + '" y="' + (H - m.b - 6) + '" fill="' + corLL + '" font-weight="bold">LL = ' + r.LL + " %</text>";
    }
    calc.pontos.forEach(function (p, i) {
      if (!(ok(p.N) && p.N > 0 && ok(p.h))) return;
      s += '<circle cx="' + X(p.h) + '" cy="' + Y(p.N) + '" r="4.5" fill="' + (p.usar ? cor : "none") + '" stroke="' + cor + '" stroke-width="1.5"/>';
      s += '<text x="' + (X(p.h) + 7) + '" y="' + (Y(p.N) + 13) + '" fill="' + txt + '" font-size="10">' + (i + 1) + "</text>";
    });
    return s + "</svg>";
  }
})();
