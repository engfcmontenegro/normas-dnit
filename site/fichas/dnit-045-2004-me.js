/*
 * Ficha: DNIT 045/2004-ME — Pavimento rígido — Selante de juntas — Envelhecimento acelerado por intemperismo.
 * Montada por window.FE.selantes.fichaEnvelhecimento (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, S = FE.selantes;

  S.fichaEnvelhecimento({
    id: "dnit-045-2004-me",
    titulo: "Selante de juntas — envelhecimento acelerado por intemperismo",
    resumo: "Ciclos de 48 h (12 h de calor, frio, molhagem e ultravioleta), recomendados quatro ciclos (192 h); variação de cada resultado V = (ve − va) / va × 100 (seção 6).",
    secRes: "6",
    alongTracaoRetracao: true,  // 5.1 b: alongamento após o envelhecimento por intemperismo
    notaCond: "Ciclos de calor, frio, molhagem e ultravioleta, 12 h em cada condição (48 h por ciclo); recomendados quatro ciclos, 192 h (5 c–e). Variação de temperatura acima de 2 °C obriga a repetir o ensaio (3.3).",
    params: [
      { k: "ciclos", r: "Número de ciclos completos", ph: "4", dica: "recomendados quatro ciclos — 192 h (5 e)" },
      { k: "hCond", r: "Horas em cada condição do ciclo (h)", ph: "12", dica: "12 h em cada condição, 48 h por ciclo (5 d)" },
      { k: "tEst", r: "Temperatura da estufa — calor (°C)", dica: "estufa de 50 °C a 100 °C (3.1)" },
      { k: "tFrio", r: "Temperatura do refrigerador — frio (°C)", dica: "0 °C a 20 °C (3.2)" },
      { k: "dT", r: "Maior variação de temperatura registrada (°C)", dica: "acima de 2 °C: desconsiderar e repetir o ensaio (3.3)" },
      { k: "tAgua", r: "Temperatura da água de aspersão (°C)", ph: "23", dica: "(23 ± 2) °C (3.6)" },
      { k: "uv", r: "Potência da lâmpada ultravioleta (W)", ph: "275", dica: "mínimo de 275 W (3.5)" },
      { k: "dUv", r: "Distância da lâmpada aos CPs (cm)", ph: "40", dica: "aproximadamente 40 cm (3.5)" },
    ],
    avisos: function (P, avisos) {
      var c = num(P.ciclos), hc = num(P.hCond), te = num(P.tEst), tf = num(P.tFrio), dT = num(P.dT), ta = num(P.tAgua), uv = num(P.uv), du = num(P.dUv);
      if (ok(c) && c < 4) avisos.push(fmt(c, 0) + " ciclo(s) completo(s): recomenda-se considerar os CPs envelhecidos após quatro ciclos — 192 h (5 e).");
      if (ok(hc) && hc !== 12) avisos.push(fmt(hc, 1) + " h em cada condição; a norma fixa 12 horas (5 d).");
      if (ok(te) && (te < 50 || te > 100)) avisos.push("Estufa a " + fmt(te, 0) + " °C, fora da faixa de 50 °C a 100 °C do equipamento (3.1).");
      if (ok(tf) && (tf < 0 || tf > 20)) avisos.push("Refrigerador a " + fmt(tf, 0) + " °C, fora da faixa de 0 °C a 20 °C do equipamento (3.2).");
      if (ok(dT) && dT > 2) avisos.push("Variação de temperatura de " + fmt(dT, 1) + " °C durante o ensaio: desconsiderar e repetir (3.3).");
      if (S.faixa(ta, 23, 2)) avisos.push("Água de aspersão a " + fmt(ta, 1) + " °C, fora de (23 ± 2) °C (3.6).");
      if (ok(uv) && uv < 275) avisos.push("Lâmpada ultravioleta de " + fmt(uv, 0) + " W; mínimo de 275 W (3.5).");
      if (ok(du) && Math.abs(du - 40) > 5) avisos.push("Lâmpada a " + fmt(du, 0) + " cm dos CPs; a norma indica aproximadamente 40 cm (3.5).");
    },
    exemplos: [
      { nome: "Poliuretano — junta de retração, 4 ciclos, atende", dados: function () {
        return { ident: { registro: "EX-SEL-EI-01", obra: "Obra A", origem: "Fornecedor A", camada: "Selante — juntas transversais" },
          params: { material: "Selante de poliuretano monocomponente", junta: "retracao", ciclos: "4", hCond: "12", tEst: "60", tFrio: "5", dT: "1,5", tAgua: "23", uv: "300", dUv: "40" },
          pr: S.exProps({ trT: ["1,50", "1,59"], arT: ["459", "373"], trA: ["0,619", "0,570"], arA: ["258", "225"], abs: ["1,20", "2,39"], dpc: ["19,4", "22,5"] }) };
      } },
      { nome: "Selante betuminoso — descolamento e alongamento abaixo de 100 %", dados: function () {
        return { ident: { registro: "EX-SEL-EI-02", obra: "Obra B", origem: "Fornecedor B", camada: "Selante — juntas longitudinais" },
          params: { material: "Selante betuminoso elastomérico", junta: "articulacao", ciclos: "3", hCond: "12", tEst: "70", tFrio: "5", dT: "1,0", tAgua: "23", uv: "250", dUv: "40" },
          pr: S.exProps({ trT: ["0,85", "1,05"], arT: ["320", "92"], trA: ["0,500", "0,391"], arA: ["317", "148"], abs: ["2,10", "4,20"] }) };
      } },
    ],
  });
})();
