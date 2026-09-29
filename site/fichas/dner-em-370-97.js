/*
 * Ficha: DNER-EM 370/97 — Defensas metálicas de perfis zincados — recebimento do lote de peças.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dner-em-370-97.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9;

  var PECA = { guia: "Guia de deslizamento (lâmina)", poste: "Poste", espacador: "Espaçador", calco: "Calço", cinta: "Cinta", fix: "Parafusos, porcas e arruelas" };
  function perfil(P) { return P.peca !== "fix"; }
  function guia(P) { return (P.peca || "guia") === "guia"; }
  var GD = "Documentação e inspeção (4)", GM = "Dimensões e propriedades mecânicas (5.1; 6.1.1; 6.1.2; 6.2.1; 6.2.2)", GZ = "Revestimento de zinco (5.3; 5.4; 6.1.3 a 6.1.9; 6.2.3)";

  var CRIT = [
    { id: "cert", grupo: GD, texto: "Certificado do fabricante: propriedades mecânicas, dimensões, identificação do fabricante e nº do lote de entrega", secao: "4.5", tipo: "sim_nao" },
    { id: "aspecto", grupo: GD, texto: "Zinco uniforme, sem áreas não revestidas, manchas, bolhas ou rugosidades", secao: "4.3", tipo: "sim_nao", falha: "ressalva" },
    { id: "transp", grupo: GD, texto: "Transporte e armazenamento sem danos ao revestimento", secao: "4.2", tipo: "sim_nao", falha: "ressalva" },
    { id: "fixcls", grupo: GD, texto: "Parafusos NBR 8855 classe 4.6, porcas NBR 10062 classe 5 e arruelas NBR 5871 (certificado)", secao: "5.2", tipo: "sim_nao",
      se: function (P) { return P.peca === "fix"; }, naoAplicaPor: "lote de perfis" },
  ];

  function tabelasExtra(d) {
    var P = d.params || {}, T = [];
    if (perfil(P)) {
      T.push({ chave: "dim", titulo: "Controle dimensional — 6 peças por lote de 300 (6.1.1)", rotulo: "Peça", iniciais: 6, min: 1,
        dica: "por processos convencionais ou gabarito passa-não-passa; \"Amostra\" em branco", linhas: [{ k: "id", r: "Identificação", texto: true },
          { k: "ok", r: "Dimensões conformes (NBR 6971)? (S / N)", texto: true }, { k: "obs", r: "Observação", texto: true }] });
      T.push({ chave: "mec", titulo: "Tração e dobramento — 1 peça por 300 do mesmo tipo (6.1.2; NBR 6152; NBR 6153)", rotulo: "CP", iniciais: 1, min: 1,
        dica: "prova: \"Amostra\" em branco; contraprova (dois novos CP por CP insatisfatório — 6.2.2.2): C",
        linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
          { k: "lr", r: "Limite de resistência à tração LR", u: "MPa" }, { k: "le", r: "Limite de escoamento LE", u: "MPa" },
          { k: "al", r: "Alongamento após ruptura (Lo = 50 mm)", u: "%" }, { k: "dob", r: "Dobramento 180° (calço 1,5 e) sem trincas? (S / N)", texto: true }] });
    }
    T.push({ chave: "rev", titulo: "Revestimento de zinco — massa, espessura, Preece e aderência (Tabela 2; 6.1.3 a 6.1.9)", rotulo: "Peça", iniciais: 2, min: 1,
      dica: guia(P) ? "guias: massa em 3 CP por peça (centro e dois cantos opostos — Figura 1); espessura por medição não destrutiva (NBR 7399); contraprova: C (2 amostras por requisito que falhou)"
        : "demais peças: 1 determinação de massa por peça (parte central); parafusos, porcas e arruelas: só Preece; contraprova: C",
      linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (I / C)", texto: true },
        { k: "m1", r: "Massa de zinco — CP 1 (NBR 7397)", u: "g/m²" }, { k: "m2", r: "Massa de zinco — CP 2", u: "g/m²" }, { k: "m3", r: "Massa de zinco — CP 3", u: "g/m²" },
        { k: "esp", r: "Espessura do revestimento — menor média (NBR 7399)", u: "µm" }, { k: "preece", r: "Preece — imersões sem depósito de cobre", u: "nº" },
        { k: "ader", r: "Aderência — dobramento sem desprendimento (NBR 7398)? (S / N)", texto: true }] });
    return T;
  }

  function extra(ctx) {
    var P = ctx.P, d = ctx.d, N = num(P.nPecas), g300 = ok(N) ? Math.max(1, Math.ceil(N / 300 - EPS)) : NaN, e = num(P.espessura);
    var alMin = ok(e) ? (e < 3 - EPS ? 20 : 23) : NaN, l;
    if (perfil(P)) {
      // dimensional — NBR 5425, inspeção atenuada, NQA 1 % (Ac/Re informados)
      var dim = R.cols(d, "dim", ["ok", "obs"]).map(function (c, i) { var u = R.unidade(c, i, "peça"); u.seg = false; u.contra = false; R.confSN(u, c.ok, "dimensões" + (c.obs ? " (" + c.obs + ")" : "")); return u; });
      var nDim = ok(g300) ? 6 * g300 : NaN, ac = num(P.ac), re = num(P.re);
      l = R.dupla({ id: "dim", grupo: GM, criterio: "Controle dimensional (NBR 5425, NQA 1 %, inspeção " + (P.regime === "normal" ? "normal — lote reapresentado" : "atenuada") + ")", secao: "6.1.1; 6.2.1",
        plano: ok(nDim) && ok(ac) && ok(re) ? { de: 1, ate: N, n1: nDim, n2: 0, ac1: ac, re1: re } : null, unidades: dim, rotU: "peça(s)", tituloUni: "Controle dimensional",
        semPlano: "informe o nº de peças do lote e os números de aceitação/rejeição", refs: { rejeita: "6.2.1.1; reapresentação após correção, em inspeção normal — 6.2.1.2" } });
      ctx.linhas.push(l);
      ctx.freqs.push(A.frequencia({ ensaio: "Peças — controle dimensional", metodo: "gabarito / NBR 5425", exigido: nDim, regra: "6 por lote de 300 peças (6.1.1)", realizado: dim.length }));
      // tração e dobramento (Tabela 1) — contraprova: 2 novos CP (6.2.2.2)
      var mec = R.cols(d, "mec", ["lr", "le", "al", "dob"]).map(function (c, i) {
        var u = R.unidade(c, i, "CP"), o = !u.contra;
        R.conf(u, c.lr, { rot: "LR", min: 370, casas: 0, un: "MPa", obrig: o });
        R.conf(u, c.le, { rot: "LE", min: 240, casas: 0, un: "MPa", obrig: o });
        if (ok(alMin)) R.conf(u, c.al, { rot: "alongamento", min: alMin, casas: 1, un: "%", obrig: o }); else if (!R.vazio(c.al)) u.faltas.push("espessura da chapa (parâmetro)");
        R.confSN(u, c.dob, "dobramento 180°", o);
        return u;
      });
      var fiM = mec.filter(function (u) { return !u.contra && u.falhas.length; }).length;
      l = R.prova({ id: "mec", grupo: GM, criterio: "Tração e dobramento dos perfis (" + (PECA[P.peca] || PECA.guia).toLowerCase() + ")", secao: "5.1, Tabela 1; 6.2.2", unidades: mec,
        nContra: 2 * Math.max(1, fiM), exigido: "LR ≥ 370 MPa; LE ≥ 240 MPa; alongamento ≥ " + (ok(alMin) ? alMin : "20 (e < 3,0 mm) / 23 (e > 3,0 mm)") + " %; dobramento 180° sem trincas",
        txtPend: "retirar dois novos CP por CP insatisfatório (6.2.2.2)", txtNc: "lote rejeitado (6.2.2.2)", tituloUni: "Tração e dobramento" });
      ctx.linhas.push(l);
      ctx.freqs.push(A.frequencia({ ensaio: "Tração e dobramento", metodo: "NBR 6152; NBR 6153", exigido: g300, regra: "1 peça por 300 do mesmo tipo (6.1.2)", realizado: mec.filter(function (u) { return !u.contra; }).length }));
      if (!ok(e)) ctx.avisos.push("Informe a espessura da chapa: o alongamento mínimo é 20 % (e < 3,0 mm) ou 23 % (e > 3,0 mm) — Tabela 1.");
      else if (Math.abs(e - 3) < EPS) ctx.avisos.push("Espessura de 3,0 mm: a Tabela 1 só define e < 3,0 e e > 3,0 mm; adotado o alongamento de 23 % (a favor da segurança).");
    }
    // revestimento — massa ≥ 350 g/m², espessura ≥ 50 µm, Preece ≥ 6 (perfis) / 4 (fixação), aderência
    var nPre = perfil(P) ? 6 : 4, nMassa = guia(P) ? 3 : 1;
    var rev = R.cols(d, "rev", ["m1", "m2", "m3", "esp", "preece", "ader"]).map(function (c, i) {
      var u = R.unidade(c, i, "peça"), o = !u.contra;
      if (perfil(P)) {
        var ms = ["m1", "m2", "m3"].filter(function (k) { return ok(num(c[k])); });
        ms.forEach(function (k, j) { R.conf(u, c[k], { rot: "massa de zinco CP " + (j + 1), min: 350, casas: 0, un: "g/m²" }); });
        R.conf(u, c.esp, { rot: "espessura", min: 50, casas: 0, un: "µm", obrig: false });
        if (o && !ms.length && !ok(num(c.esp))) u.faltas.push("massa (NBR 7397) ou espessura (NBR 7399)");
        if (o && ms.length && ms.length < nMassa) u.faltas.push("massa: " + ms.length + " de " + nMassa + " CP (6.1.4)");
        R.confSN(u, c.ader, "aderência", false);
      }
      R.conf(u, c.preece, { rot: "Preece", min: nPre, casas: 0, un: "imersões", obrig: o && !perfil(P) });
      return u;
    });
    var fiR = rev.filter(function (u) { return !u.contra && u.falhas.length; }).length;
    l = R.prova({ id: "rev", grupo: GZ, criterio: "Revestimento de zinco", secao: "5.4; 6.2.3", unidades: rev, nContra: 2 * Math.max(1, fiR), rotU: "amostra(s)",
      exigido: perfil(P) ? "massa ≥ 350 g/m² e espessura ≥ 50 µm por face; Preece ≥ 6 imersões; aderência sem desprendimento" : "Preece ≥ 4 imersões sem depósito de cobre",
      txtPend: "tomar duas amostras do mesmo lote para novos ensaios (6.2.3.1 a 6.2.3.3)", txtNc: "lote rejeitado; pode ser reapresentado após nova zincagem (6.2.3.4)", tituloUni: "Revestimento de zinco" });
    ctx.linhas.push(l);
    var iniR = rev.filter(function (u) { return !u.contra; });
    if (perfil(P)) {
      var nEsp = ok(N) ? 2 * Math.max(1, Math.ceil(N / 50 - EPS)) : NaN;
      ctx.freqs.push(A.frequencia({ ensaio: "Massa do revestimento", metodo: "NBR 7397", exigido: g300, regra: "1 elemento por grupo de 300 peças; " + nMassa + " determinação(ões) por peça (Tabela 2)",
        realizado: iniR.filter(function (u) { return ["m1", "m2", "m3"].some(function (k) { return ok(num(u.c[k])); }); }).length }));
      ctx.freqs.push(A.frequencia({ ensaio: "Espessura da camada", metodo: "NBR 7399", exigido: nEsp, regra: "2 elementos por grupo de 50 peças (Tabela 2)",
        realizado: iniR.filter(function (u) { return ok(num(u.c.esp)); }).length }));
      ctx.freqs.push(A.frequencia({ ensaio: "Uniformidade (Preece)", metodo: "Preece", exigido: g300, regra: "1 peça por lote de 300 (6.1.8)",
        realizado: iniR.filter(function (u) { return ok(num(u.c.preece)); }).length }));
      ctx.freqs.push(A.frequencia({ ensaio: "Aderência do revestimento", metodo: "NBR 7398", exigido: g300, regra: "1 peça por lote de 300 (6.1.8)",
        realizado: iniR.filter(function (u) { return R.sn(u.c.ader) !== null; }).length }));
    } else {
      ctx.freqs.push(A.frequencia({ ensaio: "Preece — parafusos, porcas e arruelas", metodo: "NBR 5426, nível II, simples atenuado", exigido: num(P.nFix),
        regra: "amostra da NBR 5426 (6.1.9) — informe o tamanho", realizado: iniR.filter(function (u) { return ok(num(u.c.preece)); }).length }));
    }
    if (ok(num(P.metros))) ctx.avisos.push("Fornecimento de " + fmt(num(P.metros), 0) + " m de defensa (" + fmt(num(P.metros) / 4, 0) + " módulos de 4,00 m — 3.8; 6.1.10).");
  }

  R.criar({
    id: "dner-em-370-97",
    titulo: "Defensas metálicas zincadas — recebimento do lote de peças",
    resumo: "Recebimento de peças de defensa metálica (DNER-EM 370/97) por tipo (guias, postes, espaçadores, calços, cintas; parafusos, porcas e arruelas): certificado (4.5), aspecto e transporte (4.2; 4.3), controle dimensional de 6 peças por 300 com o critério da NBR 5425 (NQA 1 %, 6.2.1), tração e dobramento de 1 peça por 300 — LR ≥ 370 MPa, LE ≥ 240 MPa, alongamento ≥ 20/23 % (Tabela 1) — com contraprova de 2 CP (6.2.2), e revestimento: massa ≥ 350 g/m², espessura ≥ 50 µm, Preece ≥ 6 imersões (perfis) ou 4 (fixação) e aderência, com contraprova de 2 amostras (6.2.3).",
    params: R.paramsLote({ phLote: "ex.: guias — lote 2" }).concat([
      { k: "peca", r: "Tipo de peça do lote", tipo: "select", recarrega: true, opcoes: Object.keys(PECA).map(function (k) { return [k, PECA[k]]; }) },
      { k: "nPecas", r: "Peças no lote (nº)" },
      { k: "espessura", r: "Espessura da chapa e (mm)", se: function (d) { return perfil(d.params || {}); } },
      { k: "regime", r: "Regime de inspeção dimensional (6.2.1)", tipo: "select", opcoes: [["atenuada", "Atenuada (6.2.1.1)"], ["normal", "Normal — lote reapresentado (6.2.1.2)"]],
        se: function (d) { return perfil(d.params || {}); } },
      { k: "ac", r: "Nº de aceitação Ac (peças defeituosas) — NBR 5425/5426", se: function (d) { return perfil(d.params || {}); },
        dica: "o plano da NBR 5426 (fora do acervo) para NQA 1 %; padrão Ac = 0 / Re = 1" },
      { k: "re", r: "Nº de rejeição Re", se: function (d) { return perfil(d.params || {}); } },
      { k: "nFix", r: "Tamanho da amostra de parafusos, porcas e arruelas (NBR 5426, nível II)", se: function (d) { return (d.params || {}).peca === "fix"; } },
      { k: "metros", r: "Extensão de defensa fornecida (m) — informativo (6.1.10)" },
    ]),
    padrao: { peca: "guia", regime: "atenuada", ac: "0", re: "1" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { REJEITADO: { texto: "Requisito não atendido pelo critério da seção 6.2: lote rejeitado. Dimensões — reapresentação após corrigir as deficiências, em inspeção normal (6.2.1.2); revestimento — reapresentação após nova zincagem (6.2.3.4); material que não atender deve ser separado, o fornecedor notificado e o material substituído (6.2.2.3)." } },
    notas: "Critérios da DNER-EM 370/97. Tabela 1 (NBR 6650): LR ≥ 370 MPa, LE ≥ 240 MPa, alongamento (Lo = 50 mm) ≥ 20 % para e < 3,0 mm e ≥ 23 % para e > 3,0 mm, dobramento 180° com calço de 1,5 e sem trincas. Revestimento (5.4): ≥ 350 g/m² e ≥ 50 µm por face; Preece ≥ 6 imersões (perfis) e ≥ 4 (parafusos, porcas e arruelas) sem depósito de cobre (6.2.3.2); aderência pelo dobramento (NBR 7398). Amostragem: 6 peças por 300 (dimensional), 1 por 300 (tração/dobramento, massa de zinco, Preece e aderência), 2 por 50 (espessura) — Tabela 2. Contraprova: 2 novos CP por CP insatisfatório, todos devem atender (6.2.2.2); revestimento: 2 amostras do mesmo lote, uma falha rejeita o lote (6.2.3.4). Resultado insatisfatório por falha técnica ou defeito do CP: abandonar e repetir o ensaio (6.2.2.1). O plano dimensional (NBR 5425/5426, NQA 1 %, atenuada) não está no acervo: Ac e Re são parâmetros.",
    exemplos: [
      { nome: "Guias de deslizamento, lote de 300 peças (e = 2,7 mm) — aceito", dados: function () {
        return { ident: { registro: "DEF-01", obra: "Obra A — defensas da BR-000", data: "2026-07-08", origem: "Fornecedor A", camada: "Guias de deslizamento" },
          params: { lote: "Guias — lote 1", fornecedor: "Fornecedor A", nf: "045120", certificado: "CQ-7781", dataEntrega: "08/07/2026", peca: "guia", nPecas: "300",
            espessura: "2,7", regime: "atenuada", ac: "0", re: "1", metros: "1200" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}],
          dim: [{ id: "G-012", ok: "S" }, { id: "G-058", ok: "S" }, { id: "G-101", ok: "S" }, { id: "G-166", ok: "S" }, { id: "G-230", ok: "S" }, { id: "G-297", ok: "S" }],
          mec: [{ id: "G-101", lr: "412", le: "287", al: "27", dob: "S" }],
          rev: [{ id: "G-101", m1: "402", m2: "388", m3: "395", esp: "58", preece: "7", ader: "S" }, { id: "G-020", esp: "61" }, { id: "G-044", esp: "55" },
            { id: "G-071", esp: "57" }, { id: "G-093", esp: "63" }, { id: "G-118", esp: "54" }, { id: "G-140", esp: "59" }, { id: "G-161", esp: "56" }, { id: "G-189", esp: "60" },
            { id: "G-205", esp: "58" }, { id: "G-227", esp: "62" }, { id: "G-251", esp: "57" }, { id: "G-270", esp: "55" }] };
      } },
      { nome: "Postes, lote de 300 — alongamento falha na contraprova e Preece aguardando contraprova (rejeitado)", dados: function () {
        return { ident: { registro: "DEF-02", obra: "Obra B — defensas", data: "2026-08-19", origem: "Fornecedor B", camada: "Postes" },
          params: { lote: "Postes — lote 3", fornecedor: "Fornecedor B", nf: "7730", dataEntrega: "19/08/2026", peca: "poste", nPecas: "300", espessura: "4,5", regime: "atenuada", ac: "0", re: "1" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}],
          dim: [{ id: "P-005", ok: "S" }, { id: "P-061", ok: "S" }, { id: "P-122", ok: "S" }, { id: "P-180", ok: "S" }, { id: "P-240", ok: "S" }, { id: "P-299", ok: "S" }],
          mec: [{ id: "P-122", lr: "398", le: "262", al: "21", dob: "S" }, { id: "P-122a", am: "C", lr: "401", le: "259", al: "24", dob: "S" }, { id: "P-122b", am: "C", lr: "395", le: "255", al: "22", dob: "S" }],
          rev: [{ id: "P-122", m1: "371", esp: "53", preece: "5", ader: "S" }, { id: "P-015", esp: "52" }, { id: "P-037", esp: "55" }, { id: "P-066", esp: "51" },
            { id: "P-089", esp: "54" }, { id: "P-110", esp: "53" }, { id: "P-133", esp: "52" }, { id: "P-157", esp: "56" }, { id: "P-178", esp: "51" },
            { id: "P-203", esp: "53" }, { id: "P-229", esp: "55" }, { id: "P-254", esp: "52" }, { id: "P-281", esp: "54" }] };
      } },
    ],
  });
})();
