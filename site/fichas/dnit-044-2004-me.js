/*
 * Ficha: DNIT 044/2004-ME — Pavimento rígido — Selante de juntas — Envelhecimento acelerado em estufa.
 * Montada por window.FE.selantes.fichaEnvelhecimento (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, S = FE.selantes;

  S.fichaEnvelhecimento({
    id: "dnit-044-2004-me",
    titulo: "Selante de juntas — envelhecimento acelerado em estufa",
    resumo: "CPs dos ensaios de tração, aderência, rasgamento, absorção e compressão mantidos 72 h em estufa ventilada a (60 ± 2) °C; variação de cada resultado V = (ve − va) / va × 100 (seção 6).",
    secRes: "6",
    alongTracaoRetracao: false,  // 5.1 b refere-se só ao intemperismo (DNIT 045)
    notaCond: "Estufa ventilada a (60 ± 2) °C por 72 h, CPs suspensos sem contato entre si nem com as paredes (5 c–e); variação de temperatura acima de 2 °C invalida o ensaio (NOTA).",
    params: [
      { k: "tEst", r: "Temperatura da estufa (°C)", ph: "60", dica: "(60 ± 2) °C (5 c, 5 e)" },
      { k: "dT", r: "Maior variação de temperatura registrada (°C)", dica: "acima de 2 °C: paralisar o ensaio e desprezar os resultados (NOTA)" },
      { k: "horas", r: "Tempo de exposição (h)", ph: "72", dica: "72 horas (5 e)" },
      { k: "suspensos", r: "CPs suspensos, sem contato mútuo nem com as paredes (5 d)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "cura", r: "Cura total do selante antes do ensaio (fabricante)", ph: "ex.: 7 dias", dica: "5 a" },
    ],
    avisos: function (P, avisos) {
      var t = num(P.tEst), dT = num(P.dT), h = num(P.horas);
      if (S.faixa(t, 60, 2)) avisos.push("Estufa a " + fmt(t, 1) + " °C, fora de (60 ± 2) °C (5 c).");
      if (ok(dT) && dT > 2) avisos.push("Variação de " + fmt(dT, 1) + " °C no interior da estufa: paralisar o ensaio e desprezar os resultados (NOTA da seção 5).");
      if (ok(h) && h !== 72) avisos.push("Exposição de " + fmt(h, 0) + " h; a norma fixa 72 horas (5 e).");
      if (P.suspensos === "nao") avisos.push("Os CPs devem ficar suspensos e livres de contato mútuo ou com as paredes da estufa (5 d).");
    },
    exemplos: [
      { nome: "Poliuretano — junta de articulação, variações pequenas", dados: function () {
        return { ident: { registro: "EX-SEL-EE-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas longitudinais" },
          params: { material: "Selante de poliuretano monocomponente", junta: "articulacao", tEst: "60", dT: "1,2", horas: "72", suspensos: "sim", cura: "7 dias" },
          pr: S.exProps({ trT: ["1,50", "1,67"], arT: ["459", "410"], trA: ["0,619", "0,583"], arA: ["258", "239"], rg: ["9,3", "8,8"], abs: ["1,20", "1,81"], dpc: ["19,4", "21,2"] }) };
      } },
      { nome: "Selante betuminoso — perda de aderência e estufa instável", dados: function () {
        return { ident: { registro: "EX-SEL-EE-02", obra: "Obra B", origem: "Fornecedor B", camada: "Selante — juntas transversais" },
          params: { material: "Selante betuminoso elastomérico", junta: "retracao", tEst: "63", dT: "3,0", horas: "72", suspensos: "sim", cura: "3 dias" },
          pr: S.exProps({ trT: ["0,85", "0,98"], arT: ["320", "240"], trA: ["0,500", "0,436"], arA: ["317", "250"], abs: ["2,10", "3,40"] }) };
      } },
    ],
  });
})();
