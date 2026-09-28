/*
 * Ficha: DNER-ME 404/00 — Concreto — Determinação da consistência pelo abatimento do tronco de cone.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // campo de anomalia vazio ou negativo ("não", "-") = sem desmoronamento/deslizamento
  function temAnomalia(s) {
    s = String(s || "").trim().toLowerCase();
    return !!s && !/^(n|nao|não|-|—|0|sem|nenhum|nenhuma)\.?$/.test(s);
  }

  FE.FICHAS["dner-me-404-00"] = {
    titulo: "Concreto — Consistência pelo abatimento do tronco de cone",
    resumo: "Abatimento = altura do molde (300 mm) − altura do eixo do corpo de prova desmoldado, aproximado aos 5 mm (5.10 e 6). Aplicável a concretos plásticos e coesos com abatimento ≥ 10 mm e agregado graúdo de dimensão máxima ≤ 37,5 mm.",
    blocos: [],
    params: [
      { k: "concreto", r: "Concreto", ph: "ex.: C25, brita 1, bombeável" },
      { k: "local", r: "Local do ensaio", tipo: "select", opcoes: [["obra", "Obra (recebimento / controle)"], ["lab", "Laboratório (dosagem)"]] },
      { k: "dmax", r: "Dimensão máxima do agregado graúdo (mm)", ph: "19", dica: "o método não se aplica acima de 37,5 mm (0)" },
      { k: "molde", r: "Altura do molde (mm)", ph: "300", dica: "300 ± 2 mm (4.1.1)" },
      { k: "especificado", r: "Abatimento especificado (mm) — opcional", ph: "100" },
      { k: "tolerancia", r: "Tolerância (± mm)", ph: "20", dica: "da especificação da obra (ex.: NBR 7212: ± 10 mm até 90 mm; ± 20 mm de 100 a 150 mm; ± 30 mm acima de 160 mm)",
        se: function (d) { return ok(num((d.params || {}).especificado)); } },
    ],
    padrao: { local: "obra", molde: "300" },
    tabelas: function () {
      return [{
        chave: "ens", titulo: "Determinações", rotulo: "Ensaio", iniciais: 1, min: 1,
        dica: "uma coluna por determinação (betonada, caminhão ou nova porção da amostra); informe a altura do CP desmoldado ou o abatimento lido na régua",
        linhas: [
          { k: "id", r: "Identificação (caminhão, nota fiscal, betonada)", texto: true },
          { grupo: "Medida (5.10)" },
          { k: "hcp", r: "Altura do eixo do CP desmoldado", u: "mm" },
          { k: "ab", r: "— ou abatimento lido diretamente", u: "mm" },
          { calc: "abat", r: "Abatimento medido", u: "mm", casas: 0 },
          { calc: "abr", r: "Abatimento — aproximação de 5 mm (6)", u: "mm", casas: 0, destaque: true },
          { k: "anom", r: "Desmoronamento / deslizamento (5.11) — descreva", texto: true, ph: "não" },
          { grupo: "Tempos (5.8, 5.9 e Nota 6)" },
          { k: "tenc", r: "Do início do enchimento à retirada do molde", u: "s" },
          { k: "tret", r: "Retirada do molde (levantamento)", u: "s" },
          { k: "ttot", r: "Da coleta da amostra ao desmolde", u: "min" },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var H = ok(num(P.molde)) ? num(P.molde) : 300, esp = num(P.especificado), tol = num(P.tolerancia);
      if (ok(num(P.molde)) && Math.abs(H - 300) > 2) avisos.push("Altura do molde de " + fmt(H, 0) + " mm fora de 300 ± 2 mm (4.1.1).");
      if (ok(num(P.dmax)) && num(P.dmax) > 37.5) avisos.push("Agregado graúdo com dimensão máxima de " + fmt(num(P.dmax), 1) + " mm: o método não se aplica acima de 37,5 mm (0).");
      if (ok(esp) && !ok(tol)) avisos.push("Informe a tolerância para verificar o abatimento especificado.");
      var anomAnt = false;
      var ens = (d.ens || []).map(function (x, i) {
        var rot = "Ensaio " + (x.id ? x.id : i + 1), o = {};
        var hcp = num(x.hcp), ab = num(x.ab);
        o.abat = ok(hcp) ? H - hcp : ab;
        o.anom = temAnomalia(x.anom);
        o.abr = ok(o.abat) && !o.anom ? Math.round(o.abat / 5) * 5 : NaN;
        if (ok(hcp) && ok(ab) && Math.abs(H - hcp - ab) > 2.5) avisos.push(rot + ": altura do CP e abatimento lido não conferem (" + fmt(H - hcp, 0) + " × " + fmt(ab, 0) + " mm); vale a altura do CP.");
        if (ok(o.abat) && o.abat < 0) avisos.push(rot + ": altura do CP maior que a do molde — confira.");
        if (o.anom) {
          avisos.push(rot + ": houve desmoronamento/deslizamento — a determinação é desconsiderada; faça nova determinação com outra porção da amostra (5.11).");
          if (anomAnt) avisos.push(rot + ": segundo desmoronamento/deslizamento consecutivo — o concreto não é necessariamente plástico e coeso para o ensaio de abatimento (5.12).");
        }
        anomAnt = o.anom;
        if (ok(o.abr) && o.abr < 10) avisos.push(rot + ": abatimento de " + fmt(o.abr, 0) + " mm, abaixo de 10 mm — o método é aplicável a concretos com abatimento ≥ 10 mm (0).");
        var tenc = num(x.tenc), tret = num(x.tret), ttot = num(x.ttot);
        if (ok(tenc) && tenc > 150) avisos.push(rot + ": enchimento, adensamento e retirada do molde em " + fmt(tenc, 0) + " s — máximo de 150 s, sem interrupções (5.9).");
        if (ok(tret) && (tret < 5 || tret > 10)) avisos.push(rot + ": retirada do molde em " + fmt(tret, 0) + " s — deve levar de 5 s a 10 s (5.8).");
        if (ok(ttot) && ttot > 5) avisos.push(rot + ": " + fmt(ttot, 1) + " min da coleta ao desmolde — máximo de 5 min (Nota 6).");
        if (ok(o.abr) && ok(esp) && ok(tol)) {
          o.atende = Math.abs(o.abr - esp) <= tol + 1e-9;
          if (!o.atende) avisos.push(rot + ": abatimento de " + fmt(o.abr, 0) + " mm fora de " + fmt(esp, 0) + " ± " + fmt(tol, 0) + " mm (" + fmt(esp - tol, 0) + " a " + fmt(esp + tol, 0) + " mm).");
        }
        o.nome = x.id ? String(x.id) : String(i + 1);
        return o;
      });
      var validos = ens.filter(function (o) { return ok(o.abr); });
      var conforme = ok(esp) && ok(tol) && validos.length ? validos.every(function (o) { return o.atende; }) : null;
      return { tab: { ens: ens }, resultados: { ens: ens, esp: esp, tol: tol, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, temEsp = ok(r.esp) && ok(r.tol);
      if (!r.ens.length) return "";
      return '<div class="fe-res">' + r.ens.map(function (o) {
        var v = o.anom ? "desconsiderado" : ok(o.abr) ? fmt(o.abr, 0) + " <small>mm</small>" : "—";
        return '<div class="fe-res-item"><div class="fe-res-v' + (o.anom ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">Abatimento — ensaio ' + esc(o.nome) +
          (ok(o.abr) ? " (" + fmt(o.abr / 10, 1) + " cm)" : "") +
          (o.atende === undefined ? "" : o.atende ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>";
      }).join("") + (temEsp ? '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.esp, 0) + " ± " + fmt(r.tol, 0) + ' mm</div><div class="fe-res-r">Abatimento especificado (' +
        fmt(r.esp - r.tol, 0) + " a " + fmt(r.esp + r.tol, 0) + " mm)</div></div>" : "") + "</div>";
    },
    relatorio: {
      notas: "Abatimento = altura do molde − altura do eixo do corpo de prova desmoldado (altura média), aproximado aos 5 mm mais próximos (5.10 e seção 6). Determinação com desmoronamento ou deslizamento é desconsiderada e refeita com outra porção da amostra (5.11); dois consecutivos indicam concreto não plástico e coeso (5.12). Enchimento à retirada do molde em até 150 s (5.9); retirada do molde em 5 s a 10 s (5.8); duração total de até 5 min desde a coleta (Nota 6). A tolerância em torno do abatimento especificado vem da especificação da obra.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.concreto) rows.push(["Concreto", P.concreto]);
        r.ens.forEach(function (o) {
          rows.push(["Abatimento — ensaio " + o.nome, o.anom ? "desconsiderado (desmoronamento/deslizamento, 5.11)" : ok(o.abr) ? fmt(o.abr, 0) + " mm" +
            (o.atende === undefined ? "" : o.atende ? " — atende" : " — NÃO ATENDE") : "—"]);
        });
        if (ok(r.esp) && ok(r.tol)) rows.push(["Abatimento especificado", fmt(r.esp, 0) + " ± " + fmt(r.tol, 0) + " mm"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "BGTC — abatimento de 0,7 cm (planilha do laboratório)", dados: function () {
        // MATRIX RUPTURA DE CP'S CONCRETO 25-09-23.xlsx, aba "ROMP. CPs (FX B)" (Unidade B): "SLUMP MEDIDO" 0,7 cm em 12/10/2021.
        // Mistura seca (BGTC): abatimento abaixo do limite de aplicação do método.
        return { ident: { registro: "EX-AB-001", obra: "Obra B", trecho: "BR-000", camada: "BGTC faixa B — teste de dosagem", data: "2021-10-12" },
          params: { concreto: "BGTC — 3 % de cimento", local: "lab", dmax: "25", molde: "300" },
          ens: [{ id: "Lote 1", ab: "7", anom: "não" }] };
      } },
      { nome: "Concreto C25 — três caminhões, 100 ± 20 mm, um fora da tolerância", dados: function () {
        return { ident: { registro: "EX-AB-002", obra: "Ponte sobre o rio A", camada: "Concreto C25 — laje", data: "2025-02-20" },
          params: { concreto: "C25, brita 1", local: "obra", dmax: "19", molde: "300", especificado: "100", tolerancia: "20" },
          ens: [{ id: "NF 1021", hcp: "204", anom: "não", tenc: "120", tret: "7", ttot: "4" },
            { id: "NF 1022", hcp: "182", anom: "não", tenc: "135", tret: "6", ttot: "4,5" },
            { id: "NF 1023", hcp: "163", anom: "não", tenc: "110", tret: "8", ttot: "3,5" }] };
      } },
      { nome: "Concreto fluido — desmoronamento em duas determinações consecutivas", dados: function () {
        return { ident: { registro: "EX-AB-003", camada: "Concreto de enchimento", data: "2025-06-02" },
          params: { concreto: "Concreto com aditivo superplastificante", local: "obra", dmax: "12,5", molde: "300", especificado: "180", tolerancia: "30" },
          ens: [{ id: "1", hcp: "85", anom: "desmoronou para um lado", tenc: "160", tret: "12", ttot: "6" },
            { id: "2", hcp: "90", anom: "deslizamento lateral", tenc: "140", tret: "8", ttot: "5" }] };
      } },
    ],
  };
})();
