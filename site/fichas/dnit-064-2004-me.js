/*
 * Ficha: DNIT 064/2004-ME — Pavimento rígido — Consistência do concreto pelo consistômetro VeBe.
 * Grau VeBe = tempo de vibração (s) até o tronco de cone se remoldar em cilindro sob o disco transparente;
 * resultado ≤ 3 s não é significativo (6). Registra também o abatimento inicial lido na haste.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  function meio(x) { return ok(x) ? Math.round(x * 2) / 2 : NaN; }  // cronômetro com aproximação de 0,5 s (4.3)

  FE.FICHAS["dnit-064-2004-me"] = {
    titulo: "Concreto — Consistência pelo consistômetro VeBe",
    resumo: "Tronco de cone moldado (NBR NM 67) dentro do recipiente de Ø 24 cm fixado na mesa vibratória; disco transparente (haste + disco = 2,75 kg) sobre o concreto; grau VeBe = tempo de vibração, em segundos (0,5 s), até a pasta preencher todo o espaço sob o disco. Para concretos muito secos (CCR); ≤ 3 s não é significativo.",
    blocos: [],
    params: [
      { k: "concreto", r: "Concreto", ph: "ex.: CCR para sub-base" },
      { k: "traco", r: "Traço (6 a)", ph: "ex.: 1 : 6,5 : 8,0 (cimento : areia : brita)" },
      { k: "ac", r: "Relação água/cimento (6 b)", ph: "ex.: 0,65" },
      { k: "dmax", r: "Dimensão máxima característica do agregado (mm)", ph: "25", dica: "acima de 38 mm, peneirar a amostra na peneira de 38 mm (1)" },
      { k: "peneirado", r: "Amostra peneirada na peneira de 38 mm", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "amostragem", r: "Amostragem (5 a, b)", tipo: "select",
        opcoes: [["estac", "Betoneira estacionária — NBR NM 33"], ["central", "Concreto dosado em central — NBR 7212"], ["outro", "Outro"]] },
      { k: "freq", r: "Mesa vibratória — frequência aferida (Hz) — opcional", ph: "50", dica: "a norma diz \"3.000 hertz\" (4.1 a): equivale a 3 000 vibrações/min = 50 Hz" },
      { k: "amp", r: "Mesa vibratória — amplitude (mm) — opcional", ph: "0,45", dica: "entre 0,4 e 0,5 mm (4.1 a)" },
      { k: "massa", r: "Massa do conjunto haste + disco (kg) — opcional", ph: "2,75", dica: "2,75 kg (4.1 e)" },
      { k: "esp", r: "Faixa de VeBe especificada (s) — opcional", ph: "ex.: 10 a 20", dica: "da especificação da obra (não da DNIT 064)" },
    ],
    padrao: { peneirado: "nao", amostragem: "estac" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações (5)", rotulo: "Det.", iniciais: 1, min: 1,
        dica: "uma coluna por determinação (betonada, caminhão ou nova porção)",
        linhas: [
          { k: "id", r: "Identificação (betonada, caminhão)", texto: true },
          { k: "hora", r: "Hora do ensaio", texto: true, ph: "hh:mm" },
          { k: "ab", r: "Abatimento inicial lido na escala da haste (5 h)", u: "mm" },
          { k: "t", r: "Tempo de vibração até o disco ficar totalmente em contato (5 i, j)", u: "s" },
          { calc: "vebe", r: "Grau VeBe — aproximação de 0,5 s (3; 4.3)", u: "s", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], esp = String(P.esp || "").match(/([\d.,]+)\s*(?:a|-|–|até)\s*([\d.,]+)/);
      var eMin = esp ? num(esp[1]) : NaN, eMax = esp ? num(esp[2]) : NaN;
      var det = (d.det || []).map(function (x, i) {
        var o = { nome: String(x.id || i + 1), ab: num(x.ab) }, t = num(x.t);
        o.vebe = meio(t);
        o.signif = ok(o.vebe) ? o.vebe > 3 : null;
        if (o.signif === false) avisos.push("Determinação " + o.nome + ": " + fmt(o.vebe, 1) + " s — tempo ≤ 3 s não é significativo; determine a consistência por outro método (ex.: abatimento, NBR NM 67) (6).");
        if (ok(o.vebe) && o.signif && ok(eMin) && ok(eMax)) {
          o.atende = o.vebe >= eMin && o.vebe <= eMax;
          if (!o.atende) avisos.push("Determinação " + o.nome + ": grau VeBe de " + fmt(o.vebe, 1) + " s fora da faixa especificada (" + fmt(eMin, 0) + " a " + fmt(eMax, 0) + " s).");
        }
        if (ok(o.ab) && o.ab > 50) avisos.push("Determinação " + o.nome + ": abatimento inicial de " + fmt(o.ab, 0) + " mm — o VeBe destina-se a concretos muito secos (\"no slump\"); para concreto plástico use o abatimento do tronco de cone (1).");
        return o;
      });
      var dmax = num(P.dmax);
      if (ok(dmax) && dmax > 38 && P.peneirado !== "sim") avisos.push("Dmáx de " + fmt(dmax, 1) + " mm > 38 mm: o método não se aplica sem peneirar a amostra na peneira de 38 mm (1).");
      var fr = num(P.freq), amp = num(P.amp), ms = num(P.massa);
      if (ok(fr) && Math.abs(fr - 50) > 2.5) avisos.push("Mesa vibratória a " + fmt(fr, 1) + " Hz — a norma fixa 3 000 (vibrações/min), isto é, 50 Hz (4.1 a).");
      if (ok(amp) && (amp < 0.4 || amp > 0.5)) avisos.push("Amplitude de " + fmt(amp, 2) + " mm fora de 0,4 a 0,5 mm (4.1 a).");
      if (ok(ms) && Math.abs(ms - 2.75) > 0.05) avisos.push("Conjunto haste + disco com " + fmt(ms, 2) + " kg — deve ter 2,75 kg (4.1 e).");
      var sig = det.filter(function (o) { return o.signif; }).map(function (o) { return o.vebe; });
      return { tab: { det: det }, resultados: { det: det, med: sig.length > 1 ? media(sig) : NaN, eMin: eMin, eMax: eMax }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + r.det.map(function (o) {
        var v = o.signif === false ? "≤ 3 s" : ok(o.vebe) ? fmt(o.vebe, 1) + " <small>s</small>" : "—";
        return '<div class="fe-res-item"><div class="fe-res-v' + (o.signif === false ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">Grau VeBe — ' + esc(o.nome) +
          (o.signif === false ? ' · <span class="fe-nok">não significativo</span>' : "") +
          (o.atende === undefined ? "" : o.atende ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') +
          (ok(o.ab) ? " · abatimento inicial " + fmt(o.ab, 0) + " mm" : "") + "</div></div>";
      }).join("") + (ok(r.med) ? '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.med, 1) + ' s</div><div class="fe-res-r">Média das determinações significativas (informativa)</div></div>' : "") +
        (ok(r.eMin) ? '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.eMin, 0) + " a " + fmt(r.eMax, 0) + ' s</div><div class="fe-res-r">Faixa especificada</div></div>' : "") + "</div>";
    },
    relatorio: {
      notas: "Grau VeBe = tempo de vibração, em segundos, até o concreto passar da forma troncocônica à cilíndrica — pasta preenchendo todo o espaço sob o disco transparente (3; 5 i, j); cronômetro com aproximação de 0,5 s (4.3). Mesa vibratória de 38 × 26 × 30,5 cm, amplitude de 0,4 a 0,5 mm; a norma escreve \"freqüência de 3.000 hertz\" (4.1 a, p. 2), o que só é coerente como 3 000 vibrações por minuto (50 Hz). Recipiente de Ø 24 × 20 cm; haste + disco de Ø 23 cm com 2,75 kg; molde e haste de socamento da NBR NM 67. Tempo ≤ 3 s: resultado não significativo, usar outro método (6). Agregado > 38 mm: peneirar a amostra (1). Certificado: traço, relação a/c, abatimento inicial e grau VeBe (6).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.concreto) rows.push(["Concreto", P.concreto]);
        if (P.traco) rows.push(["Traço", P.traco]);
        if (P.ac) rows.push(["Relação água/cimento", P.ac]);
        r.det.forEach(function (o) {
          rows.push(["Determinação " + o.nome, (ok(o.ab) ? "abatimento inicial " + fmt(o.ab, 0) + " mm; " : "") + "grau VeBe " +
            (o.signif === false ? fmt(o.vebe, 1) + " s — NÃO SIGNIFICATIVO (≤ 3 s)" : fmt(o.vebe, 1) + " s") +
            (o.atende === undefined ? "" : o.atende ? " — atende" : " — NÃO ATENDE")]);
        });
        if (ok(r.med)) rows.push(["Média (informativa)", fmt(r.med, 1) + " s"]);
        if (ok(r.eMin)) rows.push(["Faixa especificada", fmt(r.eMin, 0) + " a " + fmt(r.eMax, 0) + " s"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CCR para sub-base — duas betonadas, VeBe 14,5 e 16 s (faixa 10 a 20 s)", dados: function () {
        return { ident: { registro: "EX-VB-001", obra: "Obra A", trecho: "BR-000", local: "Central de concreto da Obra A", camada: "Sub-base de concreto compactado com rolo", data: "2025-05-20" },
          params: { concreto: "CCR — consumo de 120 kg/m³ de cimento", traco: "1 : 7,4 : 9,1 (cimento : areia : brita)", ac: "0,72", dmax: "25", peneirado: "nao", amostragem: "estac",
            freq: "50", amp: "0,45", massa: "2,75", esp: "10 a 20" },
          det: [{ id: "Betonada 1", hora: "08:40", ab: "0", t: "14,3" }, { id: "Betonada 2", hora: "09:25", ab: "5", t: "16,2" }] };
      } },
      { nome: "Concreto úmido demais (≤ 3 s) e betonada seca fora da faixa; mesa com amplitude baixa", dados: function () {
        return { ident: { registro: "EX-VB-002", obra: "Obra C", camada: "CCR — ajuste de umidade", data: "2025-09-09" },
          params: { concreto: "CCR — teste de umidade", traco: "1 : 7,4 : 9,1", ac: "0,85", dmax: "50", peneirado: "nao", amostragem: "central", freq: "50", amp: "0,35", massa: "2,75", esp: "10 a 20" },
          det: [{ id: "Caminhão 1", hora: "10:10", ab: "60", t: "2,6" }, { id: "Caminhão 2", hora: "11:05", ab: "0", t: "27,4" }] };
      } },
    ],
  };
})();
