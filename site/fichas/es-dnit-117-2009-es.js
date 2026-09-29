/*
 * Ficha de ES: DNIT 117/2009-ES — Pontes e viadutos rodoviários — Concretos, argamassas e calda de cimento para
 * injeção (aceitação do lote de concreto). Usa FE.aceitacao (fichaSimples) e FE.aceitacaoG9b (es-dnit-116-2009-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-117-2009-es";
  function sim(k) { return function (P) { return P[k] === "sim"; }; }

  var GI = "Insumos (5.1 e 7.1)", GP = "Produção e execução (5.3 e 7.2)", GC = "Concreto — produto (7.3.1)", GA = "Argamassa (5.3.3)", GK = "Calda de cimento (5.3.4 e 7.2.4)";
  var CRIT = [
    { id: "cimento", grupo: GI, texto: "Cimento com certificado de qualidade, armazenado em local seco e abrigado", secao: "5.1.1; 7.1.1", tipo: "sim_nao",
      exigido: "certificado; DNER-EM 036/95; sulfeto ≤ 0,2 % quando em contato com armadura de protensão" },
    { id: "saco", grupo: GI, texto: "Peso do saco de cimento — desvio em relação a 50 kg", secao: "7.1.1", tipo: "valor", unid: "%", casas: 1, min: -2, max: 2,
      exigido: "± 2 %", se: sim("sacos"), naoAplicaPor: "cimento a granel",
      freq: { por: "contagem", qtd: "nSacos", a_cada: 50, minimo: 1, unidade: "sacos fornecidos" } },
    { id: "agreg", grupo: GI, texto: "Agregados conforme ABNT NBR 7211 (DNER-EM 037 e 038), armazenados separados do terreno", secao: "5.1.2; 7.1.2", tipo: "sim_nao" },
    { id: "agua", grupo: GI, texto: "Água de amassamento e de cura (quando de aspecto ou procedência duvidosa)", secao: "5.1.4; 7.1.3", tipo: "sim_nao",
      exigido: "pH 5,8 a 8,0; MO ≤ 3; resíduo ≤ 5000; SO4 ≤ 300; Cl ≤ 500; açúcar ≤ 500 mg/l; comparativos (DNIT 037-ME): pega ± 30 min, redução de resistência ≤ 10 % aos 7 e 28 d" },
    { id: "aditivo", grupo: GI, texto: "Aditivos previstos no projeto/dosagem, sem cloreto de cálcio ou halogenetos", secao: "5.1.5", tipo: "sim_nao" },
    { id: "dosagem", grupo: GP, texto: "Dosagem racional e experimental aprovada (refeita a cada mudança de materiais)", secao: "5.3.1 b", tipo: "sim_nao",
      exigido: "traço empírico só na classe C10 com consumo ≥ 300 kg/m³" },
    { id: "preparo", grupo: GP, texto: "Preparo mecânico; tempo de mistura ≥ 60 s + 15 s/m³; sem acréscimo de água nem remistura", secao: "5.3.1 c", tipo: "sim_nao" },
    { id: "transp", grupo: GP, texto: "Transporte: tambor 2 a 6 rpm; intervalo entre entregas ≤ 30 min; sem segregação", secao: "5.3.1 d", tipo: "sim_nao" },
    { id: "temp", grupo: GP, texto: "Temperatura do concreto no transporte", secao: "5.3.1 d", tipo: "valor", unid: "°C", casas: 0, min: 5, max: 30,
      se: function (P) { return P.forn === "terceiros"; }, naoAplicaPor: "concreto preparado na obra",
      freq: { por: "contagem", qtd: "caminhoes", a_cada: 1, minimo: 1, regra: "1 por caminhão" } },
    { id: "lanc", grupo: GP, texto: "Lançamento: armadura e fôrmas conferidas; altura de queda ≤ 2 m; sem deslocamento ao longo das fôrmas", secao: "5.3.1 e", tipo: "sim_nao" },
    { id: "submerso", grupo: GP, texto: "Concreto submerso — consumo de cimento", secao: "5.3.1 e", tipo: "valor", unid: "kg/m³", casas: 0, min: 350,
      exigido: "≥ 350 kg/m³ e excesso de 20 % de cimento; tremonha > 25 cm ou caçamba > 0,50 m³", se: sim("submerso"), naoAplicaPor: "concretagem a seco" },
    { id: "adens", grupo: GP, texto: "Adensamento mecânico (≥ 3000 impulsos/min; pontos de imersão ≥ 30 cm)", secao: "5.3.1 f", tipo: "sim_nao" },
    { id: "cura", grupo: GP, texto: "Período de cura", secao: "5.3.1 g", tipo: "valor", unid: "dias", casas: 0, min: 7, falha: "ressalva",
      exigido: "≥ 7 dias (salvo indicação em contrário ou cimento ARI); protendido: até protender todos os cabos" },
    { id: "juntas", grupo: GP, texto: "Juntas de concretagem conforme o Plano de Concretagem", secao: "5.3.1 h", tipo: "sim_nao" },
    { id: "ciclop", grupo: GP, texto: "Concreto ciclópico: pedra de mão ≤ 30 % do volume, envolvida por ≥ 5 cm de concreto; 30 cm ≤ dimensão ≤ 1/4 da menor dimensão", secao: "5.1.3; 5.3.2", tipo: "sim_nao",
      se: sim("ciclopico"), naoAplicaPor: "sem concreto ciclópico" },
    { id: "abat", grupo: GP, texto: "Consistência — abatimento", secao: "7.2.1 a", tipo: "valor", unid: "mm", casas: 0, falha: "ressalva", metodo: "ABNT NBR NM 67 (DNER-ME 404)",
      min: function (P) { return num(P.abatEsp) - num(P.abatTol); }, max: function (P) { return num(P.abatEsp) + num(P.abatTol); },
      importar: G.imp404,
      freq: { por: "contagem", qtd: function (P) { return P.forn === "terceiros" ? num(P.caminhoes) : num(P.dias); }, a_cada: 1, minimo: 1,
        regra: "terceiros: 1 por caminhão; obra: 1ª amassada do dia, mudança de umidade, reinício após ≥ 2 h, troca de operador e a cada moldagem" } },
    { id: "fc", grupo: GC, texto: "Resistência à compressão — exemplares na idade de controle", secao: "7.2.1 b; 7.3.1", tipo: "valor", unid: "MPa", casas: 1,
      min: function (P) { return num(P.fck); }, metodo: "ABNT NBR 5739 (DNER-ME 091)", importar: G.imp091,
      exigido: "fck,est ≥ fck (Tabelas 4 e 5)" },
    { id: "arg_fc", grupo: GA, texto: "Argamassa de nivelamento de pilares e berço de aparelhos de apoio — resistência", secao: "5.3.3", tipo: "valor", unid: "MPa", casas: 1, min: 25,
      exigido: "resistência característica ≥ 25 MPa (cada resultado)", se: sim("argamassa"), naoAplicaPor: "sem argamassa de berço/nivelamento", importar: G.imp091 },
    { id: "arg_tempo", grupo: GA, texto: "Argamassa usada em até 45 min, sem readição de cimento; preparo em betoneira", secao: "5.3.3", tipo: "sim_nao",
      se: sim("argamassa"), naoAplicaPor: "sem argamassa" },
  ].concat(G.criteriosCalda(sim("calda"), GK));

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — concreto, argamassa e calda de injeção — aceitação do lote",
    resumo: "Aceitação de um lote de concreto (elemento estrutural limitado pela Tabela 2: 50 m³ ou 100 m³ e 3 dias de concretagem) pela DNIT 117/2009-ES: insumos (7.1), produção e consistência (7.2.1), resistência característica estimada fck,est pelas Tabelas 4 e 5 (7.3.1 — aceitação automática se fck,est ≥ fck), argamassa (5.3.3) e calda de injeção (Tabela 3). Exemplares importados da DNER-ME 091, abatimentos da DNER-ME 404 e água das DNIT 036/037-ME.",
    lote: false,
    params: [
      { k: "elemento", r: "Lote / elemento estrutural", ph: "ex.: laje do vão 2" },
      { k: "solic", r: "Solicitação principal do elemento (Tabela 2)", tipo: "select", opcoes: [["compressao", "Compressão ou compressão e flexão — até 50 m³"], ["flexao", "Flexão simples — até 100 m³"]] },
      { k: "volume", r: "Volume de concreto do lote (m³)" },
      { k: "dias", r: "Dias de concretagem do lote", dica: "no máximo 3 dias, dentro de um prazo total de 7 dias (Tabela 2)" },
      { k: "prazo", r: "Prazo total do lote, com interrupções (dias) — opcional" },
      { k: "fck", r: "fck de projeto (MPa)" },
      { k: "cond", r: "Condição de preparo (Tabela 1; NBR 12655)", tipo: "select", opcoes: [["A", "A — cimento e agregados em massa (C10 a C80)"], ["B", "B — agregados em volume (C10 a C25)"]] },
      { k: "amostragem", r: "Controle da resistência (7.3.1)", tipo: "select", opcoes: [["parcial", "Amostragem parcial (exemplares de algumas betonadas)"], ["total", "Amostragem total (todas as amassadas)"]] },
      { k: "forn", r: "Preparo do concreto", tipo: "select", opcoes: [["terceiros", "Central / empresa de concretagem (caminhão betoneira)"], ["obra", "Na obra (betoneira estacionária)"]] },
      { k: "caminhoes", r: "Caminhões betoneira no lote (nº)", se: function (d) { return (d.params || {}).forn === "terceiros"; } },
      { k: "abatEsp", r: "Abatimento especificado (mm)" },
      { k: "abatTol", r: "Tolerância do abatimento (± mm)" },
      { k: "sacos", r: "Cimento em sacos?", tipo: "select", opcoes: [["nao", "Não (granel)"], ["sim", "Sim"]] },
      { k: "nSacos", r: "Sacos de cimento fornecidos (nº)", se: function (d) { return (d.params || {}).sacos === "sim"; } },
      { k: "submerso", r: "Concreto lançado sob água?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "ciclopico", r: "Concreto ciclópico?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim (fck ≥ 12 MPa)"]] },
      { k: "argamassa", r: "Argamassa de nivelamento / berço de aparelho de apoio?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "calda", r: "Calda de cimento para injeção?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "expansor", r: "Calda com aditivo expansor?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]], se: function (d) { return (d.params || {}).calda === "sim"; } },
      { k: "cabos", r: "Cabos injetados (nº)", se: function (d) { return (d.params || {}).calda === "sim"; } },
      { k: "sacosCalda", r: "Sacos de cimento consumidos na calda (nº)", se: function (d) { return (d.params || {}).calda === "sim"; } },      G.paramAgua(CRIT, "agua"),
    ],
    padrao: { solic: "compressao", cond: "A", amostragem: "parcial", forn: "terceiros", sacos: "nao", submerso: "nao", ciclopico: "nao", argamassa: "nao", calda: "nao", expansor: "nao" },
    criterios: CRIT,
    refs: { reprova: "7.3.1", atende: "7.3.1", regra: "7.3.1" },
    extra: function (ctx) {
      var P = ctx.P, fck = num(P.fck), vol = num(P.volume), dias = num(P.dias), prazo = num(P.prazo), l;
      // calda: a frequência da exsudação usa os sacos da calda
      ctx.freqs.forEach(function (f) {
        if (/^Calda — (água exsudada|expansão)/.test(f.ensaio)) {
          f.exigido = A.nMin(num(P.sacosCalda), 100, 1);
          if (!ok(num(P.sacosCalda))) f.exigido = 1;
          f.situacao = f.situacao === "nao_exigido" ? f.situacao : f.realizado >= f.exigido ? "atende" : "insuficiente";
        }
      });
      // resistência: fck,est
      var lf = ctx.item.fc, nEx = G.nExemplares(fck);
      var e = G.avaliarFck(lf, { fck: fck, cond: P.cond, amostragem: P.amostragem, volume: vol, nMin: nEx });
      var fr = ctx.freqs.filter(function (f) { return f.ensaio === lf.criterio; })[0];
      if (fr) {
        var exc = e && e.excepcional && ok(vol) && vol <= 10;
        fr.exigido = exc ? 2 : nEx;
        fr.regra = exc ? "lote excepcional ≤ 10 m³: 2 a 5 exemplares" : nEx + " exemplares por lote (" + (nEx === 12 ? "classe > C50" : "até C50") + "); exemplar = 2 CPs, vale o maior";
        fr.situacao = fr.realizado >= fr.exigido ? "atende" : fr.realizado ? "insuficiente" : "sem_dados";
      }
      // consistência na obra: também a cada moldagem de exemplares
      if (P.forn !== "terceiros") {
        var fa = ctx.freqs.filter(function (f) { return f.ensaio === ctx.item.abat.criterio; })[0];
        if (fa) { fa.exigido = Math.max(ok(dias) ? dias : 1, lf.n || 0); fa.situacao = fa.realizado >= fa.exigido ? "atende" : "insuficiente"; }
      }
      // tamanho do lote (Tabela 2)
      var vmax = G.volMaxLote(P.solic);
      l = A.linha({ id: "lote", grupo: GC, criterio: "Tamanho do lote de amostragem", secao: "7.2.1, Tabela 2",
        exigido: "≤ " + vmax + " m³; ≤ 3 dias de concretagem dentro de 7 dias", resultado: (ok(vol) ? fmt(vol, 1) + " m³" : "—") + " · " + (ok(dias) ? dias + " dia(s)" : "—") + (ok(prazo) ? " em " + prazo + " dia(s)" : "") });
      if (!ok(vol) || !ok(dias)) G.redefinir(l, "pendente", "informe o volume e os dias de concretagem do lote");
      else {
        if (vol > vmax + 1e-9) A.marcar(l, "pendente", "volume acima de " + vmax + " m³: divida em lotes e complete a amostragem (Tabela 2)");
        if (dias > 3) A.marcar(l, "pendente", "mais de 3 dias de concretagem: divida em lotes (Tabela 2)");
        if (ok(prazo) && prazo > 7) A.marcar(l, "pendente", "prazo total acima de 7 dias (Tabela 2, nota 1)");
        if (l.situacao === "conforme") l.motivo = "lote dentro dos limites da Tabela 2";
      }
      ctx.linhas.push(l);
      // fck mínimo do concreto ciclópico
      if (P.ciclopico === "sim") {
        l = A.linha({ id: "fck_cic", grupo: GP, criterio: "fck do concreto do ciclópico", secao: "5.3.2", exigido: "≥ 12 MPa", resultado: ok(fck) ? fmt(fck, 1) + " MPa" : "—" });
        if (!ok(fck)) G.redefinir(l, "pendente", "informe o fck");
        else if (fck < 12) G.redefinir(l, "nao_conforme", "fck de " + fmt(fck, 1) + " MPa < 12 MPa");
        else l.motivo = "fck ≥ 12 MPa";
        ctx.linhas.push(l);
      }
      if (P.cond === "B" && ok(fck) && fck > 25) ctx.avisos.push("Condição de preparo B só se aplica às classes C10 a C25 (Tabela 1) — fck de " + fmt(fck, 0) + " MPa exige a condição A.");
      if (e && e.n && ok(e.fckest)) ctx.avisos.push("Resistência característica estimada: fck,est = " + fmt(G.r1(e.fckest), 1) + " MPa — " + e.formula + ".");
    },
    notas: "Critérios da DNIT 117/2009-ES. Lote = elemento estrutural limitado pela Tabela 2 (50 m³ compressão/flexocompressão; 100 m³ flexão simples; 3 dias de concretagem em até 7 dias); amostra de 6 exemplares até C50 e 12 acima de C50; exemplar = 2 CPs da mesma amassada, vale o maior (7.2.1). fck,est pela Tabela 4: parcial 6 ≤ n < 20: 2·(f1 + … + fm−1)/(m − 1) − fm, m = n/2 (n ímpar: despreza-se o maior), adotado não menor que ψ6·f1 (Tabela 5; n não tabelado: ψ6 do n inferior); n ≥ 20: fcm − 1,65·Sd; total: f1 (n ≤ 20) ou fi, i = 0,05·n (n > 20); lotes excepcionais ≤ 10 m³ com 2 a 5 exemplares: ψ6·f1. Aceitação automática: fck,est ≥ fck (7.3.1); caso contrário, tratamento da não conformidade pela Fiscalização (7.4). Abatimento fora da tolerância: repetir e corrigir antes do uso (7.2.1) — tratado como ressalva. Calda conforme a Tabela 3 (NBR 7681 a 7685); a Tabela 3 diz, para a vida útil, índice de fluidez \"maior que 18 segundos\" durante 30 min, o que contradiz o limite de 18 s antes da injeção: a vida útil é verificada como sim/não.",
    exemplos: [
      { nome: "Laje C25, 42 m³, 6 exemplares (2 importados da DNER-ME 091) — aceito", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-C-01", obra: "Obra A — ponte sobre o rio A", camada: "Laje do vão 2 — concreto C25", data: "2025-03-20" },
          params: { elemento: "Laje do vão 2", solic: "flexao", volume: "42", dias: "1", prazo: "1", fck: "25", cond: "A", amostragem: "parcial", forn: "terceiros", caminhoes: "6",
            abatEsp: "100", abatTol: "20", sacos: "nao", submerso: "nao", ciclopico: "nao", argamassa: "nao", calda: "nao", expansor: "nao" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "6" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, {}, {}, {}],
          temp: [{ est: "caminhão 1", v: "24" }, { est: "caminhão 2", v: "25" }, { est: "caminhão 3", v: "26" }, { est: "caminhão 4", v: "26" }, { est: "caminhão 5", v: "27" }, { est: "caminhão 6", v: "27" }],
          cura: [{ est: "laje do vão 2", v: "7" }],
          abat: [{ est: "caminhão 1", v: "95" }, { est: "caminhão 2", v: "110" }, { est: "caminhão 3", v: "105" }, { est: "caminhão 4", v: "100" }, { est: "caminhão 5", v: "115" }, { est: "caminhão 6", v: "90" }],
          fc: [{ est: "caminhão 3", pos: "E3", reg: "digitado", v: "27,5" }, { est: "caminhão 4", pos: "E4", reg: "digitado", v: "29,0" },
            { est: "caminhão 5", pos: "E5", reg: "digitado", v: "26,8" }, { est: "caminhão 6", pos: "E6", reg: "digitado", v: "30,2" }] };
        A.exemplos.importar(F.params, d, "imp_fc", [["dner-me-091-98", 1]]);
        A.exemplos.importar(F.params, d, "imp_agua", [["dnit-036-2004-me", 0], ["dnit-037-2004-me", 0]]);
        return d;
      } },
      { nome: "Pilares C30, 55 m³ em 4 dias, fck,est abaixo do fck, água e exsudação da calda fora — rejeitado", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-C-02", obra: "Obra B — viaduto", camada: "Pilares P1 a P4 — concreto C30", data: "2025-05-14" },
          params: { elemento: "Pilares P1 a P4", solic: "compressao", volume: "55", dias: "4", prazo: "6", fck: "30", cond: "A", amostragem: "parcial", forn: "terceiros", caminhoes: "8",
            abatEsp: "100", abatTol: "20", sacos: "nao", submerso: "nao", ciclopico: "nao", argamassa: "nao", calda: "sim", expansor: "nao", cabos: "2", sacosCalda: "60" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" },
            { atende: "N", obs: "junta fora do plano no P3" }, {}, {}, { atende: "S", obs: "fluidez mantida 30 min" }],
          temp: [{ est: "caminhão 1", v: "28" }, { est: "caminhão 2", v: "31" }, { est: "caminhão 3", v: "29" }],
          cura: [{ est: "P1 a P4", v: "7" }],
          fc: [{ est: "P1", pos: "E1", reg: "digitado", v: "28,4" }, { est: "P2", pos: "E2", reg: "digitado", v: "30,5" },
            { est: "P3", pos: "E3", reg: "digitado", v: "27,9" }, { est: "P4", pos: "E4", reg: "digitado", v: "32,0" }],
          calda_ac: [{ est: "mistura 1", v: "0,42" }],
          calda_flu_e: [{ est: "cabo 1", v: "15" }, { est: "cabo 2", v: "16" }],
          calda_flu_s: [{ est: "cabo 1", v: "11" }, { est: "cabo 2", v: "10" }],
          calda_exs: [{ est: "início do dia", v: "2,6" }],
          calda_fc: [{ est: "mistura 1", pos: "28 d", v: "31,2" }, { est: "mistura 1", pos: "28 d", v: "29,8" }] };
        A.exemplos.importar(F.params, d, "imp_fc", [["dner-me-091-98", 2]]);
        A.exemplos.importar(F.params, d, "imp_abat", [["dner-me-404-00", 1]]);
        A.exemplos.importar(F.params, d, "imp_agua", [["dnit-036-2004-me", 1]]);
        return d;
      } },
    ],
  });
  G.registrar(F, ID);
})();
