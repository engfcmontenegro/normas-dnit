/*
 * Ficha: DNER-ME 184/94 — Tinta para demarcação viária — determinação da estabilidade na diluição.
 * Usa FE.sinalizacao.fichaQualitativa (definida em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  FE.FICHAS["dner-me-184-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — estabilidade na diluição",
    nomeResultado: "Estabilidade na diluição",
    resumo: "Tinta diluída em proveta com o solvente do fabricante, na quantidade permitida para aplicação; 4 h em repouso a 25 ± 1 °C; sem coágulos, precipitação ou separação = satisfatório (seção 6).",
    chave: "diluicao",
    rotulo: "Proveta",
    tabTitulo: "Provetas ensaiadas",
    dica: "uma coluna por proveta; S = sim, N = não",
    condicoes: [
      { k: "solv", r: "Solvente especificado pelo fabricante (5.2)", texto: true, ph: "ex.: diluente do fabricante" },
      { k: "vt", r: "Volume de tinta na proveta", u: "ml", cs: 1 },
      { k: "vs", r: "Volume de solvente adicionado (5.2)", u: "ml", cs: 1 },
      C.temp("temp", "Temperatura do ensaio", 25, 1, "5.4"),
      C.duracao("hrep", "Repouso", 4, "5.3"),
    ],
    observacoes: [
      { k: "coag", r: "Coágulos (5.3)", curto: "coágulos" },
      { k: "prec", r: "Precipitação (5.3)", curto: "precipitação" },
      { k: "sep", r: "Separação de fases (5.3)", curto: "separação" },
      { k: "placa", r: "Fluida em placa de vidro para tirar dúvida (5.3) — informativo", curto: "prova em placa de vidro", defeito: false },
    ],
    linhasExtra: [{ calc: "dil", r: "Diluição = solvente / tinta × 100", u: "% vol.", casas: 1 }],
    params: [{ k: "dilMax", r: "Diluição máxima permitida para aplicação (% em volume) — opcional",
      dica: "as EM 276, 368 e 371 admitem no máximo 5 % em volume (4.5)", ph: "5" }],
    calc: function (p, o, rot, avisos, defeitos, P) {
      var vt = num(p.vt), vs = num(p.vs);
      o.dil = ok(vt) && ok(vs) && vt > 0 ? vs / vt * 100 : NaN;
      var mx = num(P.dilMax);
      if (!ok(mx) && P.espec) mx = 5;
      if (ok(o.dil) && ok(mx) && o.dil > mx + 1e-9) avisos.push(rot + ": diluição de " + fmt(o.dil, 1) + " % em volume acima da permitida para aplicação (" + fmt(mx, 1) + " %) — o ensaio deve usar a quantidade permissível (5.2).");
    },
    notas: "A quantidade de solvente é a especificada pelo fabricante e deve ser a mesma permissível para aplicação (5.2); as especificações DNER-EM 276/00, 368/00 e 371/00 admitem até 5 % em volume (4.5). Em caso de dúvida, fluir sem agitação o material em placa de vidro (5.3). Aspecto uniforme e homogêneo, sem separações ou precipitações → satisfatório (seção 6).",
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — 5 % de diluente, satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-184-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ solv: "Diluente do fabricante", vt: "80", vs: "4", temp: "25", hrep: "4", coag: "N", prec: "N", sep: "N", placa: "N" }] };
      } },
      { nome: "Tinta amarela — separação e coágulos após 4 h, não satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-184-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ solv: "Diluente do fabricante", vt: "80", vs: "4", temp: "25,5", hrep: "4", coag: "S", prec: "N", sep: "S", placa: "S" }] };
      } },
    ],
  });
})();
