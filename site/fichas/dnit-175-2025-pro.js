/*
 * Ficha: DNIT 175/2025-PRO — Aferição de viga Benkelman.
 * Registra-se em window.FE (usa FE.aceitacao para linhas de critério e parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   3 b   extensômetro com sensibilidade mínima de 0,01 mm.
 *   4     aferição pelo menos uma vez ao mês; braço sem empenamento/danos; prato elevado a ~0,5 mm/min; leituras
 *         no extensômetro da prensa a cada 0,1 mm até 0,8 mm e a cada 0,2 mm até 2,2 mm (15 leituras), com as
 *         leituras correspondentes da viga; em duplicata (30 leituras).
 *   5     Xi = Xpi / Xvi (eq. 1); X̄ (eq. 2, N ≥ 30); σ com N − 1 (eq. 3); σ(X̄) = σ/√N (eq. 4);
 *         ε0 = 2,045·σ(X̄) (eq. 5); Li = X̄ − ε0, Ls = X̄ + ε0 (eq. 6).
 *   6.1   Tabela 1 (αi–βi por relação de braços: 2:1 → 1,9–2,10; 3:1 → 2,85–3,15; 4:1 → 3,8–4,20) e Tabela 2 (casos I a IV).
 *   6.2   Tabela 3: caso I → K = αi + (βi − αi)/2; caso III → K = X̄.
 * Interpretação da Tabela 2 (a tabela usa > e < estritos e deixa as igualdades sem caso): "dentro" = Li ≥ αi e
 * Ls ≤ βi. Dois limites dentro → caso I; nenhum → caso II; só um → caso III (ε0 < (βi − αi)/2) ou IV.
 * O caso III, lido ao pé da letra, aceita também intervalo de confiança todo fora de αi–βi (ex.: Li > βi); a ficha
 * segue a letra, mas marca ressalva quando o intervalo não intercepta αi–βi (os exemplos do Anexo A só mostram
 * interseção parcial).
 * A constante K sai com 2 casas (como no Anexo A) e pode ser importada na ficha da DNIT 133-ME.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ID = "dnit-175-2025-pro";
  var TAB1 = { "2": [1.9, 2.1], "3": [2.85, 3.15], "4": [3.8, 4.2] };
  var T_EST = 2.045;                                    // eq. 5
  var XP_PADRAO = [10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 140, 160, 180, 200, 220];  // 0,01 mm (seção 4)
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];

  function desvio(v) {
    var m = media(v);
    return v.length > 1 ? Math.sqrt(v.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN;
  }
  function r2(x) { return ok(x) ? Math.round(x * 100 + 1e-9) / 100 : NaN; }

  function linhaSN(id, grupo, crit, secao, v, exig) {
    var l = A.linha({ id: id, grupo: grupo, criterio: crit, secao: secao, exigido: exig, resultado: v === "sim" ? "sim" : v === "nao" ? "não" : "—", n: v ? 1 : 0 });
    if (v === "nao") A.marcar(l, "nao_conforme", "não atende");
    else if (v !== "sim") A.marcar(l, "pendente", "não informado");
    return l;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [];
    var rel = P.relacao || "2", ab = TAB1[rel], alfa = ab[0], beta = ab[1], meio = (beta - alfa) / 2;
    var cols = d.lt || [];
    var tab = [], xs = [], nPares = 0, passoFora = [];
    cols.forEach(function (c, i) {
      var xp = num(c.xp), v1 = num(c.xv1), v2 = num(c.xv2), o = {};
      o.x1 = ok(xp) && ok(v1) && v1 > 0 ? xp / v1 : NaN;
      o.x2 = ok(xp) && ok(v2) && v2 > 0 ? xp / v2 : NaN;
      if (ok(o.x1)) xs.push(o.x1);
      if (ok(o.x2)) xs.push(o.x2);
      if (ok(xp)) nPares++;
      if (ok(xp) && i < XP_PADRAO.length && Math.abs(xp - XP_PADRAO[i]) > 1e-6) passoFora.push("leitura " + (i + 1) + ": " + fmt(xp, 0) + " (esperado " + XP_PADRAO[i] + ")");
      if ((ok(v1) && v1 <= 0) || (ok(v2) && v2 <= 0)) avisos.push("Leitura " + (i + 1) + ": leitura da viga nula ou negativa — relação não calculada.");
      tab.push(o);
    });
    var N = xs.length, X = media(xs), s = desvio(xs), sm = ok(s) ? s / Math.sqrt(N) : NaN, e0 = ok(sm) ? T_EST * sm : NaN;
    var Li = X - e0, Ls = X + e0;
    var caso = "", aceita = null, K = NaN;
    if (ok(Li) && ok(Ls)) {
      var dInf = Li >= alfa - 1e-12, dSup = Ls <= beta + 1e-12;
      if (dInf && dSup) { caso = "I"; aceita = true; K = alfa + meio; }
      else if (!dInf && !dSup) { caso = "II"; aceita = false; }
      else if (e0 < meio - 1e-12) { caso = "III"; aceita = true; K = r2(X); }
      else { caso = "IV"; aceita = false; }
    }
    var semInter = ok(Li) && (Li > beta || Ls < alfa);

    // ---- critérios
    var G1 = "Aparelhagem e condições (3 e 4)", G2 = "Leituras (4 e 5.2)", G3 = "Aceitação e constante (6)";
    var sens = num(P.sensib);
    var ls = A.linha({ id: "sens", grupo: G1, criterio: "Sensibilidade do extensômetro", secao: "3 b", exigido: "≤ 0,01 mm", resultado: ok(sens) ? fmt(sens, 3) + " mm" : "—", n: ok(sens) ? 1 : 0 });
    if (!ok(sens)) A.marcar(ls, "pendente", "não informada"); else if (sens > 0.01 + 1e-9) A.marcar(ls, "nao_conforme", "sensibilidade pior que 0,01 mm");
    linhas.push(ls);
    linhas.push(linhaSN("braco", G1, "Braço e dispositivos sem empenamento ou danos (corrigidos ou viga substituída)", "4", P.braco, "sem danos"));
    var vel = num(P.velocidade);
    var lv = A.linha({ id: "vel", grupo: G1, criterio: "Velocidade de elevação do prato", secao: "4", exigido: "aproximadamente 0,5 mm/min", resultado: ok(vel) ? fmt(vel, 2) + " mm/min" : "—", n: ok(vel) ? 1 : 0 });
    if (!ok(vel)) A.marcar(lv, "pendente", "não informada"); else if (Math.abs(vel - 0.5) > 0.1 + 1e-9) A.marcar(lv, "ressalva", "afastada de 0,5 mm/min (critério da ficha: ± 0,1 mm/min)");
    linhas.push(lv);
    var dAnt = P.anterior, dAt = (d.ident || {}).data, dias = NaN;
    if (dAnt && dAt) dias = (new Date(dAt) - new Date(dAnt)) / 864e5;
    var lf = A.linha({ id: "freq", grupo: G1, criterio: "Intervalo desde a aferição anterior", secao: "4", exigido: "pelo menos uma aferição por mês", resultado: ok(dias) ? fmt(dias, 0) + " dias" : "—", n: ok(dias) ? 1 : 0, situacao: "informativo" });
    if (ok(dias) && dias > 31) { lf.situacao = "conforme"; A.marcar(lf, "ressalva", "mais de um mês sem aferição: a viga não deveria ter sido usada nesse intervalo"); }
    linhas.push(lf);

    var ln = A.linha({ id: "n", grupo: G2, criterio: "Número de relações Xi (duplicata de 15 leituras)", secao: "4 / 5.2", exigido: "N ≥ 30", resultado: N ? "N = " + N : "—", n: N });
    if (!N) A.marcar(ln, "sem_dados", "sem leituras");
    else if (N < 30) A.marcar(ln, "nao_conforme", "N = " + N + " < 30 (eq. 2)");
    linhas.push(ln);
    var lp = A.linha({ id: "passos", grupo: G2, criterio: "Leituras da prensa: 0,1 mm até 0,8 mm e 0,2 mm até 2,2 mm", secao: "4", exigido: "10 … 80, 100 … 220 (0,01 mm)", resultado: nPares ? nPares + " leituras" : "—", n: nPares });
    if (passoFora.length) A.marcar(lp, "ressalva", passoFora.slice(0, 4).join("; ") + (passoFora.length > 4 ? " …" : ""));
    if (nPares && nPares !== 15) A.marcar(lp, "ressalva", nPares + " leituras da prensa (a seção 4 prevê 15)");
    linhas.push(lp);

    var lc = A.linha({ id: "caso", grupo: G3, criterio: "Intervalo de confiança Li–Ls × Tabela 1 (" + rel + ":1 → " + fmt(alfa, 2) + " – " + fmt(beta, 2) + ")", secao: "6.1 (Tabelas 1 e 2)",
      exigido: "casos I ou III", resultado: ok(Li) ? "Li = " + fmt(Li, 3) + " · Ls = " + fmt(Ls, 3) + " · ε0 = " + fmt(e0, 3) + " → caso " + caso : "—", n: N });
    if (!ok(Li)) A.marcar(lc, "sem_dados", "sem resultado");
    else if (!aceita) A.marcar(lc, "nao_conforme", caso === "II" ? "Li < αi e Ls > βi: viga rejeitada (caso II)" : "ε0 = " + fmt(e0, 3) + " ≥ (βi − αi)/2 = " + fmt(meio, 2) + ": viga rejeitada (caso IV)");
    else if (semInter) A.marcar(lc, "ressalva", "caso III pela letra da Tabela 2, mas o intervalo Li–Ls não intercepta " + fmt(alfa, 2) + " – " + fmt(beta, 2) + ": confira a relação de braços e a viga");
    linhas.push(lc);
    var lk = A.linha({ id: "k", grupo: G3, criterio: "Constante K para o cálculo das deflexões", secao: "6.2 (Tabela 3)", situacao: "informativo",
      exigido: "caso I: αi + (βi − αi)/2 · caso III: X̄", resultado: ok(K) ? "K = " + fmt(K, 2) : aceita === false ? "viga rejeitada — sem constante" : "—", n: ok(K) ? 1 : 0 });
    linhas.push(lk);
    if (N && N < 30) avisos.push("A PRO exige N ≥ 30 relações (eq. 2): ε0 usa t = 2,045 (N − 1 = 29).");

    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "VIGA ACEITA — caso " + caso + " — K = " + fmt(K, 2), texto: "Aferição conforme a DNIT 175/2025-PRO; usar K = " + fmt(K, 2) + " no cálculo das deflexões (DNIT 133-ME, eq. 1)." },
      RESSALVA: { titulo: "VIGA ACEITA COM RESSALVA — caso " + caso + " — K = " + fmt(K, 2), texto: "Constante definida pela Tabela 3; há pontos a documentar." },
      PENDENTE: { titulo: "AFERIÇÃO INCOMPLETA", texto: "Faltam leituras ou informações para concluir a aferição." },
      REJEITADO: { titulo: aceita === false ? "VIGA REJEITADA — caso " + caso : "AFERIÇÃO NÃO CONFORME", texto: aceita === false ? "A viga não pode ser usada: corrigir (empenamento, articulação, extensômetro) e aferir de novo, ou substituir o equipamento (4)." : "Há exigência da PRO não atendida: refazer a aferição." },
    } });
    return { tab: { lt: tab }, resultados: { linhas: linhas, parecer: par, N: N, X: X, s: s, sm: sm, e0: e0, Li: Li, Ls: Ls, alfa: alfa, beta: beta,
      caso: caso, aceita: aceita, K: K, relacao: rel, dias: dias }, avisos: avisos };
  }

  function cartoes(r) {
    return '<div class="fe-res">' + A.cartao(ok(r.K) ? fmt(r.K, 2) : "—", "Constante K (Tabela 3)") +
      A.cartao(r.caso ? "Caso " + r.caso : "—", "Tabela 2 — " + (r.aceita === true ? '<span class="fe-ok">aceita</span>' : r.aceita === false ? '<span class="fe-nok">rejeitada</span>' : "—")) +
      A.cartao(ok(r.X) ? fmt(r.X, 4) : "—", "X̄ (eq. 2), N = " + (r.N || 0)) +
      A.cartao(ok(r.Li) ? fmt(r.Li, 3) + " – " + fmt(r.Ls, 3) : "—", "Li – Ls (eq. 6) × " + fmt(r.alfa, 2) + " – " + fmt(r.beta, 2)) + "</div>";
  }
  function tabEst(r, relat) {
    var rows = [["X̄ — média das relações (eq. 2)", fmt(r.X, 4)], ["σ — desvio padrão, N − 1 (eq. 3)", fmt(r.s, 4)], ["σ(X̄) = σ / √N (eq. 4)", fmt(r.sm, 4)],
      ["ε0 = 2,045 · σ(X̄) (eq. 5)", fmt(r.e0, 3)], ["Li = X̄ − ε0 · Ls = X̄ + ε0 (eq. 6)", fmt(r.Li, 3) + " · " + fmt(r.Ls, 3)],
      ["(βi − αi)/2", fmt((r.beta - r.alfa) / 2, 2)]];
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><tbody>' + rows.map(function (x) { return '<tr><td style="text-align:left">' + x[0] + "</td><td>" + x[1] + "</td></tr>"; }).join("") + "</tbody></table>";
  }
  // gráfico: leitura da prensa × leitura da viga, com as retas nominais αi e βi
  function graficos(calc, d, opt) {
    opt = opt || {};
    var pts = [];
    (d.lt || []).forEach(function (c) {
      var xp = num(c.xp);
      [num(c.xv1), num(c.xv2)].forEach(function (v, j) { if (ok(xp) && ok(v)) pts.push([v, xp, j]); });
    });
    if (pts.length < 2) return ['<div class="fe-graf-vazio">O gráfico aparece com as leituras.</div>'];
    var r = calc.resultados, imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cores = imp ? ["#1f5fbf", "#c0392b", "#2e8b57"] : ["#4f8cff", "#e5534b", "#34c38f"];
    var W = 560, H = 260, m = { l: 50, r: 14, t: 22, b: 36 };
    var x1 = Math.max.apply(null, pts.map(function (p) { return p[0]; })) * 1.05, y1 = Math.max.apply(null, pts.map(function (p) { return p[1]; })) * 1.05;
    function X(v) { return m.l + v / x1 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / y1 * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">Prensa Xp × viga Xv (0,01 mm) — retas Xp = αi·Xv e Xp = βi·Xv</text>';
    for (var g = 0; g <= 5; g++) {
      var gy = y1 * g / 5, gx = x1 * g / 5;
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 4) + '" y="' + (Y(gy) + 3) + '" text-anchor="end" fill="' + txt + '">' + Math.round(gy) + "</text>";
      s += '<text x="' + X(gx) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + Math.round(gx) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
    [r.alfa, r.beta].forEach(function (c) {
      var xe = Math.min(x1, y1 / c);
      s += '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(xe) + '" y2="' + Y(c * xe) + '" stroke="' + cores[2] + '" stroke-dasharray="4 3" stroke-width="1"/>' +
        '<text x="' + (X(xe) - 4) + '" y="' + (Y(c * xe) + 12) + '" text-anchor="end" fill="' + cores[2] + '">' + fmt(c, 2) + "</text>";
    });
    pts.forEach(function (p) { s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="2.6" fill="' + cores[p[2]] + '"/>'; });
    s += '<text x="' + (W - m.r - 4) + '" y="' + (m.t + 12) + '" text-anchor="end" fill="' + cores[0] + '">1ª determinação</text><text x="' + (W - m.r - 4) + '" y="' + (m.t + 24) + '" text-anchor="end" fill="' + cores[1] + '">2ª determinação</text>';
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">Leitura da viga Xv (0,01 mm)</text>';
    return [s + "</svg>"];
  }

  function colunas(v1, v2) {
    return XP_PADRAO.map(function (xp, i) { return { xp: String(xp), xv1: String(v1[i]), xv2: String(v2[i]) }; });
  }

  FE.FICHAS[ID] = {
    titulo: "Aferição da viga Benkelman",
    lote: true,
    resumo: "Relações Xi = Xp/Xv das 30 leituras (duplicata de 15), X̄, σ, σ(X̄), ε0 = 2,045·σ(X̄) e intervalo Li–Ls (seção 5); aceitação pelos casos I a IV (Tabelas 1 e 2) e constante K da viga (Tabela 3), usada na DNIT 133-ME.",
    rotuloImportar: function (r) {
      return (r.relacao ? r.relacao + ":1 · " : "") + (r.caso ? "caso " + r.caso + " · " : "") + (r.aceita === false ? "REJEITADA" : ok(r.K) ? "K = " + fmt(r.K, 2) : "—");
    },
    blocos: [],
    params: [
      { k: "viga", r: "Identificação da viga (nº de série / patrimônio)", ph: "ex.: Viga B-03" },
      { k: "relacao", r: "Relação entre braços a/b (Tabela 1)", tipo: "select", opcoes: [["2", "2:1 — 1,9 a 2,10"], ["3", "3:1 — 2,85 a 3,15"], ["4", "4:1 — 3,8 a 4,20"]] },
      { k: "extensometro", r: "Extensômetros (prensa e viga)", ph: "ex.: analógicos, 0,01 mm" },
      { k: "sensib", r: "Sensibilidade do extensômetro (mm) (3 b)", ph: "0,01" },
      { k: "prensa", r: "Prensa (3 a)", ph: "ex.: prensa de ISC manual" },
      { k: "velocidade", r: "Velocidade de elevação do prato (mm/min) (4)", ph: "0,5" },
      { k: "braco", r: "Braço e dispositivos sem empenamento/danos (4)?", tipo: "select", opcoes: SN },
      { k: "anterior", r: "Data da aferição anterior — opcional", tipo: "date", dica: "4: aferição pelo menos uma vez ao mês" },
    ],
    padrao: { relacao: "2", sensib: "0,01" },
    tabelas: function () {
      return [{ chave: "lt", titulo: "Leituras (seção 4) e relações Xi = Xp / Xv (eq. 1)", rotulo: "Leitura", iniciais: 15, min: 1,
        dica: "Xp: extensômetro da prensa; Xv: extensômetro da viga — mesma unidade (0,01 mm); 15 leituras em duplicata",
        linhas: [
          { k: "xp", r: "Xp — leitura da prensa", u: "0,01 mm" },
          { k: "xv1", r: "Xv — viga, 1ª determinação", u: "0,01 mm" },
          { k: "xv2", r: "Xv — viga, 2ª determinação", u: "0,01 mm" },
          { calc: "x1", r: "Xi — 1ª determinação", u: "", casas: 2 },
          { calc: "x2", r: "Xi — 2ª determinação", u: "", casas: 2 },
        ] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + cartoes(r) + '<h4 style="margin:12px 0 4px">Estatística (seção 5)</h4>' + tabEst(r) +
        '<h4 style="margin:12px 0 4px">Verificações</h4>' + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: graficos,
    relatorio: {
      notas: "DNIT 175/2025-PRO: Xi = Xp/Xv (eq. 1); X̄ (eq. 2, N ≥ 30); σ com N − 1 (eq. 3); σ(X̄) = σ/√N (eq. 4); ε0 = 2,045·σ(X̄) (eq. 5); Li, Ls = X̄ ∓ ε0 (eq. 6). " +
        "Tabela 2: caso I (Li ≥ αi e Ls ≤ βi) aceita, K = αi + (βi − αi)/2; caso II (Li < αi e Ls > βi) rejeita; um só limite fora: caso III (ε0 < (βi − αi)/2) aceita com K = X̄, ou caso IV rejeita. " +
        "Igualdades aos limites contadas como dentro (a Tabela 2 não as define). K com 2 casas, como no Anexo A. Relações calculadas sem arredondar.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        return [["Parecer", r.parecer.titulo], ["Viga", (P.viga || "—") + " · relação " + r.relacao + ":1"], ["N · X̄ · σ", (r.N || 0) + " · " + fmt(r.X, 4) + " · " + fmt(r.s, 4)],
          ["ε0 · Li – Ls", fmt(r.e0, 3) + " · " + fmt(r.Li, 3) + " – " + fmt(r.Ls, 3)], ["Intervalo aceito (Tabela 1)", fmt(r.alfa, 2) + " – " + fmt(r.beta, 2)],
          ["Constante K (Tabela 3)", ok(r.K) ? fmt(r.K, 2) : "—"]];
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Estatística (seção 5)</h2>" + tabEst(r, true) + "<h2>Verificações</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Viga 2:1 — Anexo A, Tabela A1 (caso I, K = 2,00)", dados: function () {
        return { ident: { registro: "AF-VB-A1", data: "2026-03-02", responsavel: "Laboratório A" },
          params: { viga: "Viga A", relacao: "2", extensometro: "analógicos, 0,01 mm", sensib: "0,01", prensa: "prensa de ISC manual", velocidade: "0,5", braco: "sim", anterior: "2026-02-03" },
          lt: colunas([6, 10, 15, 20, 25, 30, 35, 39, 49, 59, 68, 78, 88, 99, 107], [5, 10, 14, 19, 25, 30, 35, 39, 48, 58, 68, 78, 87, 97, 108]) };
      } },
      { nome: "Viga 2:1 — Anexo A, Tabela A3 (caso III, K = X̄ = 2,11)", dados: function () {
        return { ident: { registro: "AF-VB-A3", data: "2026-03-02" },
          params: { viga: "Viga C", relacao: "2", sensib: "0,01", velocidade: "0,5", braco: "sim" },
          lt: colunas([4, 9, 14, 18, 22, 27, 34, 38, 48, 58, 68, 78, 87, 99, 109], [5, 9, 15, 20, 24, 29, 34, 38, 49, 57, 66, 77, 87, 98, 107]) };
      } },
      { nome: "Viga 2:1 — Anexo A, Tabela A4 (caso IV, rejeitada)", dados: function () {
        return { ident: { registro: "AF-VB-A4", data: "2026-03-02" },
          params: { viga: "Viga D", relacao: "2", sensib: "0,01", velocidade: "0,5", braco: "sim", anterior: "2025-12-10" },
          lt: colunas([6, 12, 14, 20, 23, 25, 29, 35, 49, 51, 66, 74, 82, 99, 104], [8, 14, 17, 24, 25, 27, 31, 34, 38, 55, 70, 75, 81, 104, 108]) };
      } },
    ],
  };
})();
