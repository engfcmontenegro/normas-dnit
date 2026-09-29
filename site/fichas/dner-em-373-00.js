/*
 * Ficha: DNER-EM 373/00 — Microesferas de vidro retrorrefletivas para sinalização horizontal rodoviária
 * — recebimento do lote.
 *
 * Também define FE.recebimentoMaterial.microesferas(cfg), usado por site/fichas/dner-em-379-98.js (esferas de vidro).
 * Motor: FE.recebimentoMaterial (site/fichas/dner-em-276-00.js). Ensaios de origem: DNER-ME 011, 013, 014, 015,
 * 022, 023, 057, 058 e 110/94 (FE.sinalizacao2). Inspeção visual: DNER-PRO 132/94; amostra: DNER-PRO 251/94.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebimentoMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function nstr(x, c) { return ok(x) ? x.toFixed(c).replace(".", ",") : ""; }
  // resultado de uma ficha qualitativa de FE.sinalizacao2 → {q, txt}
  function qualS2(r) {
    if (r.satisf !== true && r.satisf !== false) return null;
    var o = (r.obs || [])[0];
    return { q: r.satisf, txt: o && o.rot ? o.rot.toLowerCase() : r.satisf ? "satisfatório" : "não satisfatório" };
  }

  // cfg: {id, em ("373" | "379"), codigo, titulo, resumo, secoes {...}, faixas(P) -> {nome, ref, p: [[nº, abertura, mín, máx]]},
  //       massaEsp {min, max}, umidade (bool), chumbo: "num" | "qual", params, padrao, secInsp..., dispensa, notas, exemplos}
  R.microesferas = function (o) {
    var s = o.secoes, G4 = "Condições gerais (seção 4)", G5 = "Condições específicas (seção 5)";
    var reqs = [];
    if (o.chumbo === "num") reqs.push({ id: "chumbo", grupo: G4, tipo: "num", r: "Chumbo (impureza), em massa", secao: "4.3", metodo: "método não citado na EM",
      u: "%", casas: 3, casasLim: 2, lim: { min: null, max: 0.01 } });
    else reqs.push({ id: "chumbo", grupo: G4, tipo: "qual", r: "Vidro soda-cal sem chumbo", secao: "4.3", metodo: "certificado / análise", exig: "não devem conter chumbo",
      bom: "isento de chumbo", mau: "contém chumbo", ph: "isento de chumbo / contém chumbo" });
    function qual(id, r, secao, fid, exig, bom, mau) {
      return { id: id, grupo: G5, tipo: "qual", r: r, secao: secao, metodo: FE.aceitacao.codigoCurto(fid).replace("DNER-ME ", "DNER-ME ") + "/94", exig: exig, bom: bom, mau: mau,
        imp: { de: [fid], valor: qualS2 } };
    }
    reqs.push(qual("cacl2", "Resistência à solução de cloreto de cálcio", s.cacl2, "dner-me-011-94", "superfície não embaçada", "não embaçada", "embaçada"));
    reqs.push(qual("hcl", "Resistência ao ácido clorídrico", s.hcl, "dner-me-014-94", "superfície não embaçada", "não embaçada", "embaçada"));
    if (o.umidade) reqs.push(qual("umidade", "Resistência à umidade", s.umidade, "dner-me-015-94", "fluir livremente, sem interrupção, no funil", "fluiu livremente", "retida no funil"));
    reqs.push({ id: "aguaSup", grupo: G5, tipo: "qual", r: "Resistência à água — superfície", secao: s.agua, metodo: "DNER-ME 023/94", exig: "superfície não embaçada",
      bom: "não embaçada", mau: "embaçada",
      imp: { de: ["dner-me-023-94"], valor: function (r) {
        var ob = (r.obs || [])[0];
        return ob && (ob.bom === true || ob.bom === false) ? { q: ob.bom, txt: String(ob.rot || "").toLowerCase() } : null;
      } } });
    reqs.push({ id: "aguaHCl", grupo: G5, tipo: "num", r: "Resistência à água — HCl 0,10 N gasto na neutralização", secao: s.agua, metodo: "DNER-ME 023/94", u: "ml",
      casas: 1, lim: { min: null, max: 4.5 }, imp: { de: ["dner-me-023-94"], valor: function (r) { return ok(r.vHCl) ? r.vHCl : null; } } });
    reqs.push(qual("na2s", "Resistência à solução de sulfeto de sódio", s.na2s, "dner-me-022-94", "superfície não embaçada", "não embaçada", "embaçada"));
    reqs.push({ id: "silica", grupo: G5, tipo: "num", r: "Teor de sílica", secao: s.silica, metodo: "DNER-ME 057/94", u: "%", casas: 1, casasLim: 0,
      lim: { min: 65, max: null }, imp: { de: ["dner-me-057-94"], valor: function (r) { return ok(r.pct) ? r.pct : null; } } });
    reqs.push({ id: "aparencia", grupo: G5, tipo: "qual", r: "Aparência — limpas, claras, redondas, incolores, sem defeitos e matérias estranhas", secao: s.aparencia,
      metodo: "exame visual", exig: "atende", bom: "atende", mau: "não atende", ph: "atende / não atende" });
    reqs.push({ id: "quebradas", grupo: G5, tipo: "num", r: "Quebradas, com vidro não fundido ou elementos estranhos", secao: s.aparencia, metodo: "exame / contagem",
      u: "% em massa", casas: 1, casasLim: 0, lim: { min: null, max: 3 } });
    reqs.push({ id: "ovoides", grupo: G5, tipo: "num", r: "Ovóides, deformadas, geminadas ou com bolhas gasosas", secao: s.aparencia, metodo: "exame / contagem",
      u: "% em massa", casas: 1, casasLim: 0, lim: { min: null, max: 30 } });
    reqs.push({ id: "ir", grupo: G5, tipo: "num", r: "Índice de refração", secao: s.ir, metodo: "DNER-ME 110/94", u: "", casas: 2, lim: { min: 1.5, max: null },
      imp: { de: ["dner-me-110-94"], valor: function (r) {
        if (ok(r.ir)) return r.ir;
        return r.satisf === false ? { q: false, txt: "não atende — visíveis em todas as soluções ensaiadas (DNER-ME 110)" } : null;
      } } });
    reqs.push({ id: "me", grupo: G5, tipo: "num", r: "Massa específica", secao: s.me, metodo: "DNER-ME 013/94", u: "g/cm³", casas: 2, casasLim: 1,
      lim: o.massaEsp, imp: { de: ["dner-me-013-94"], valor: function (r) { return ok(r.me) ? r.me : null; } } });
    // granulometria: tabela própria (% passando por peneira da faixa)
    reqs.push({ id: "gran", grupo: G5, tipo: "externo", r: "Granulometria", secao: s.gran, metodo: "DNER-ME 058/94",
      avaliar: function (d, P) {
        var fx = o.faixas(P), c = (d.gran || [])[0] || {}, imp = d.impGran || null;
        if (!fx) return { situacao: "pendente", resultado: "—", motivo: "escolha o tipo de microesfera", exigido: "faixa da Tabela 1" };
        var exig = fx.ref, falta = [], fora = [], txt = [], alterado = false;
        fx.p.forEach(function (p) {
          var v = num(c["p" + p[0]]);
          if (imp && String(c["p" + p[0]] || "") !== String((imp.vals || {})["p" + p[0]] || "")) alterado = true;
          if (!ok(v)) { falta.push("nº " + p[0]); return; }
          txt.push("nº " + p[0] + ": " + fmt(v, 1));
          if (v < p[2] - 1e-9 || v > p[3] + 1e-9) fora.push("nº " + p[0] + " (" + p[1] + ") " + fmt(v, 1) + " % fora de " + (p[2] === p[3] ? p[2] : p[2] + "–" + p[3]) + " %");
        });
        var origem = !txt.length ? "" : imp && !alterado ? imp.reg : "digitado";
        if (fora.length) return { situacao: "nao_conforme", resultado: "fora da faixa", motivo: fora.join("; "), exigido: exig, origem: origem };
        if (falta.length === fx.p.length) return { situacao: "pendente", resultado: "—", motivo: "sem resultado (DNER-ME 058/94)", exigido: exig };
        if (falta.length) return { situacao: "pendente", resultado: txt.join("; "), motivo: "falta % passando nas peneiras " + falta.join(", "), exigido: exig, origem: origem };
        return { situacao: "conforme", resultado: "dentro da faixa", exigido: exig, origem: origem };
      },
      imp: { de: ["dner-me-058-94"], aplicar: function (lista, P, d, notas) {
        var fx = o.faixas(P), es = lista.filter(function (e) { return e.ficha === "dner-me-058-94"; });
        var cAnt = (d.gran || [])[0] || {}, impAnt = d.impGran;
        if (impAnt) Object.keys(impAnt.vals || {}).forEach(function (k) { if (String(cAnt[k] || "") === String(impAnt.vals[k])) delete cAnt[k]; });
        d.impGran = null;
        if (!es.length || !fx) { d.gran = [cAnt]; return; }
        if (es.length > 1) notas.push("Granulometria: " + es.length + " ensaios da DNER-ME 058 selecionados; importado o primeiro (" + A.importacao.rotulo(es[0]) + ").");
        var e = es[0], r = e.resultados || {}, vals = {}, sem = [];
        if (r.faixa && r.faixa.ref && r.faixa.ref.indexOf(o.codigo.replace(/\/.*/, "")) === -1 && o.em === "379") notas.push(A.importacao.rotulo(e) + ": ensaio avaliado na faixa \"" + r.faixa.ref + "\"; aqui vale a " + fx.ref + ".");
        if (r.faixa && r.faixa.ref && o.em === "373" && r.faixa.ref !== fx.ref) notas.push(A.importacao.rotulo(e) + ": ensaio avaliado na faixa \"" + r.faixa.ref + "\"; aqui vale a " + fx.ref + ".");
        fx.p.forEach(function (p) {
          var m = (r.media || []).filter(function (x) { return x.n === p[0]; })[0];
          if (m && ok(m.pass)) vals["p" + p[0]] = nstr(m.pass, 1); else sem.push("nº " + p[0]);
        });
        if (sem.length) notas.push(A.importacao.rotulo(e) + ": sem % passando nas peneiras " + sem.join(", ") + " da " + fx.ref + ".");
        Object.keys(vals).forEach(function (k) { if (String(cAnt[k] || "").trim() === "") cAnt[k] = vals[k]; else notas.push("Granulometria " + k.replace("p", "nº ") + ": mantido o valor digitado."); });
        d.gran = [cAnt];
        d.impGran = { reg: A.importacao.rotulo(e), vals: vals };
      } } });

    return R.criar({
      codigo: o.codigo, titulo: o.titulo, resumo: o.resumo, notas: o.notas, exemplos: o.exemplos,
      nomeMaterial: o.nomeMaterial,
      unidCompra: "kg", dicaQtd: "a unidade de compra é o quilograma; sacos de 25 kg",
      rotuloValidade: "Revestimento químico (se houver)", phValidade: "ex.: silano",
      params: o.params || [], padrao: o.padrao || {},
      inspecao: { plano: "pro132", secao: o.secInspecao, lote: "sacos de 25 kg com a mesma data de fabricação (PRO 132, 3.1)" },
      secRejInsp: o.secRejInsp, secAceita: o.secAceita, secRejeita: o.secRejeita, dispensa: o.dispensa, secInsp: "6",
      paramsAmostra: [
        { k: "sacosAm", r: "Sacos retirados para a amostra de laboratório", ph: "ex.: 4", dica: "DNER-PRO 251/94, 4.2: 2 (lote de 2 a 90), 4 (91 a 275), 8 (276 a 610), 10 (611 a 1 160)" },
        { k: "massaAm", r: "Massa da amostra enviada ao laboratório (g)", ph: "ex.: 2500", dica: "quarteamento ou repartidor até ≈ 2 500 g (DNER-PRO 251/94, 4.3)" },
      ],
      amostra: function (P, d, avisos, grupo) {
        var N = num(P.nRec), ns = num(P.sacosAm), m = num(P.massaAm);
        var f = ok(N) ? R.PRO251.filter(function (x) { return N >= x[0] && N <= x[1]; })[0] : null;
        var l = A.linha({ id: "amostra", grupo: grupo, criterio: "Amostra para ensaios de laboratório", secao: o.secAmostra, metodo: "DNER-PRO 251/94",
          exigido: (f ? f[2] + " sacos (lote de " + f[0] + " a " + f[1] + ")" : "sacos conforme a tabela de 4.2") + "; ≈ 2 500 g após quarteamento",
          resultado: (ok(ns) ? ns + " saco(s)" : "—") + (ok(m) ? " · " + fmt(m, 0) + " g" : "") });
        if (!ok(ns) || !ok(m)) { A.marcar(l, "pendente", "registre os sacos retirados e a massa da amostra"); return l; }
        if (ok(N) && !f) A.marcar(l, "pendente", "lote de " + N + " sacos fora da tabela da DNER-PRO 251/94 (2 a 1 160)");
        else if (f && ns < f[2]) { A.marcar(l, "ressalva", ns + " saco(s) retirados; a DNER-PRO 251/94 (4.2) pede " + f[2]); l.prov = "Formar a amostra com o número de sacos da DNER-PRO 251/94."; }
        if (m < 2250 || m > 2750) avisos.push("Amostra de " + fmt(m, 0) + " g; a DNER-PRO 251/94 (4.3) reduz a amostra a aproximadamente 2 500 g.");
        return l;
      },
      tabelasDepois: function (d, P) {
        var fx = o.faixas(P);
        if (!fx) return [];
        if (d && Array.isArray(d.gran)) { if (!d.gran.length) d.gran.push({}); if (d.gran.length > 1) d.gran.length = 1; }
        return [{ chave: "gran", titulo: "Granulometria — " + fx.ref + " (DNER-ME 058/94)", rotulo: "Peneira", iniciais: 1, min: 1, fixo: true, nomes: ["% passando"],
          dica: "porcentagem em massa passando em cada peneira da faixa; importável da ficha DNER-ME 058/94",
          linhas: fx.p.map(function (p) { return { k: "p" + p[0], r: "Peneira nº " + p[0] + " (" + p[1] + ") — " + (p[2] === p[3] ? p[2] : p[2] + " a " + p[3]) + " %", u: "%" }; }) }];
      },
      conferirOrigem: o.conferirOrigem,
      requisitos: reqs,
    });
  };

  // =====================================================================================
  // DNER-EM 373/00 — Tabela 1 (faixas granulométricas por tipo), conferida no PDF
  // =====================================================================================
  var FX373 = {
    IA: { nome: "\"Innermix\" (tipo I A)", p: [[20, "840 µm", 100, 100], [30, "600 µm", 90, 100], [50, "300 µm", 18, 35], [100, "150 µm", 0, 10], [200, "75 µm", 0, 2]] },
    IB: { nome: "\"Premix\" (tipo I B)", p: [[50, "300 µm", 100, 100], [70, "210 µm", 85, 100], [100, "150 µm", 15, 55], [230, "63 µm", 0, 10]] },
    F: { nome: "\"Drop-on\" (tipo F)", p: [[18, "1000 µm", 100, 100], [20, "840 µm", 98, 100], [30, "600 µm", 75, 95], [50, "300 µm", 9, 35], [80, "180 µm", 0, 5]] },
    G: { nome: "\"Drop-on\" (tipo G)", p: [[18, "1000 µm", 100, 100], [20, "840 µm", 90, 100], [30, "600 µm", 10, 30], [50, "300 µm", 0, 5]] },
  };
  var REF058 = { IA: "DNER-EM 373/2000, Tabela 1 — tipo I A", IB: "DNER-EM 373/2000, Tabela 1 — tipo I B", F: "DNER-EM 373/2000, Tabela 1 — tipo F", G: "DNER-EM 373/2000, Tabela 1 — tipo G" };

  var F = FE.FICHAS["dner-em-373-00"] = R.microesferas({
    em: "373", codigo: "DNER-EM 373/00",
    titulo: "Recebimento de microesferas de vidro retrorrefletivas para sinalização horizontal",
    resumo: "Recebimento do lote (sacos de 25 kg): inspeção visual (DNER-PRO 132/94), amostra (DNER-PRO 251/94) e requisitos 4.3 e 5.1 a 5.10 — resistências químicas e à umidade, sílica, aparência e defeitos, índice de refração, massa específica e granulometria do tipo (Tabela 1), com importação das fichas DNER-ME e parecer (seção 7).",
    secoes: { cacl2: "5.1", hcl: "5.2", umidade: "5.3", agua: "5.4", na2s: "5.5", silica: "5.6", aparencia: "5.7", ir: "5.8", me: "5.9", gran: "5.10 · Tabela 1" },
    umidade: true, chumbo: "num", massaEsp: { min: 2.3, max: 2.6 },
    faixas: function (P) { var f = FX373[P.tipo]; return f ? { nome: f.nome, ref: REF058[P.tipo], p: f.p } : null; },
    nomeMaterial: function (P) { var f = FX373[P.tipo]; return "Microesferas de vidro " + (f ? f.nome : ""); },
    params: [{ k: "tipo", r: "Tipo de microesfera (4.1)", tipo: "select", recarrega: true,
      opcoes: [["IA", "\"Innermix\" — tipo I A (termoplástico)"], ["IB", "\"Premix\" — tipo I B (tinta)"], ["F", "\"Drop-on\" — tipo F"], ["G", "\"Drop-on\" — tipo G (com revestimento)"]],
      dica: "define a faixa granulométrica da Tabela 1" }],
    padrao: { tipo: "IB" },
    secInspecao: "6.1 · 7.1", secAmostra: "4.2 · 6.2", secRejInsp: "7.1", secAceita: "7.2", secRejeita: "7.2", dispensa: "6.3.1",
    conferirOrigem: function (e, P, notas) {
      if (e.ficha === "dner-me-058-94") {
        var t = ((e.dados || {}).params || {}).tipo;
        if (t && t !== P.tipo) notas.push(A.importacao.rotulo(e) + ": granulometria ensaiada como tipo " + t + "; este lote é do tipo " + P.tipo + ".");
      }
    },
    notas: "Critérios da DNER-EM 373/00: vidro soda-cal com chumbo limitado a 0,01 % da massa (4.3) e requisitos 5.1 a 5.10 (resistências ao CaCl₂, HCl, umidade, água — sem embaçar e ≤ 4,5 ml de HCl 0,10 N —, Na₂S; sílica ≥ 65 %; até 3 % quebradas/não fundidas e 30 % ovóides/deformadas; índice de refração ≥ 1,50; massa específica 2,3 a 2,6 g/cm³; faixa granulométrica da Tabela 1 para o tipo). " +
      "Inspeção visual dos sacos pela DNER-PRO 132/94 (Tabela 1 normal / Tabela 2 rigorosa); amostra pela DNER-PRO 251/94 (sacos da tabela de 4.2, reduzidos a ≈ 2 500 g). " +
      "O órgão pode rejeitar total ou parcialmente à vista da inspeção (7.1); as partidas que satisfazem as seções 4 e 5 são aceitas, caso contrário rejeitadas (7.2). Ensaios podem ser dispensados a critério do órgão (6.3.1). " +
      "Aberturas das peneiras nº 20 e 70: 840 µm e 210 µm na EM (0,850 e 0,212 mm na DNER-ME 058/94); a comparação é feita pelo número da peneira.",
    exemplos: [
      { nome: "Microesferas tipo I B — lote aceito (ensaios importados das fichas DNER-ME)", dados: function () {
        var d = { ident: { registro: "REC-MV-2026-01", data: "2026-03-12", obra: "Obra A — sinalização horizontal", origem: "Fornecedor A", camada: "Microesferas tipo I B (premix)" },
          params: { tipo: "IB", fabricante: "Fornecedor A", produto: "Microesferas I B", partida: "MV-2602", dataFab: "10/02/2026", nf: "009921", quantidade: "5000",
            nRec: "200", inspTipo: "normal", sacosAm: "4", massaAm: "2480" },
          insp: [{ n: "4", def: "0" }, {}] };
        return R.exemplo(F, d, [["dner-me-011-94", 0], ["dner-me-014-94", 0], ["dner-me-015-94", 0], ["dner-me-023-94", 0], ["dner-me-022-94", 0],
          ["dner-me-057-94", 0], ["dner-me-110-94", 0], ["dner-me-013-94", 0], ["dner-me-058-94", 0]],
          { chumbo: "0,004", aparencia: "atende", quebradas: "1,2", ovoides: "14" });
      } },
      { nome: "Microesferas tipo F — lote rejeitado (inspeção visual, embaçamento, retenção no funil, IR e granulometria)", dados: function () {
        var d = { ident: { registro: "REC-MV-2026-02", data: "2026-04-22", obra: "Obra B — sinalização horizontal", origem: "Fornecedor B", camada: "Microesferas tipo F (drop-on)" },
          params: { tipo: "F", fabricante: "Fornecedor B", produto: "Microesferas F", partida: "MV-0331", dataFab: "31/03/2026", nf: "045120", quantidade: "10000",
            nRec: "400", inspTipo: "normal", sacosAm: "8", massaAm: "2510" },
          insp: [{ n: "4", def: "2", tipos: "2 sacos rasgados, com vazamento" }, {}] };
        return R.exemplo(F, d, [["dner-me-011-94", 1], ["dner-me-015-94", 1], ["dner-me-022-94", 1], ["dner-me-110-94", 1], ["dner-me-057-94", 0], ["dner-me-058-94", 1]],
          { aparencia: "atende", quebradas: "2,5", ovoides: "18" });
      } },
    ],
  });
})();
