/*
 * Ficha de ES: DNER-ES 350/97 — Edificações — Revestimento de pisos (aceitação: controle geométrico 6.2.1 —
 * alinhamentos e cotas, espessuras, caimento ≥ 0,5 % — e aceitação "7.3" (numeração da ES); execução pela seção 5).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10a, num = FE.num, ok = FE.ok, fmt = FE.fmt, media = FE.media;
  var sn = G.sn, v = G.v, ID = "dner-es-350-97";
  var tipo = function (l) { return G.selecionado("tipo", l); };
  var sobreTerreno = G.sim("terreno");
  var ESP_AR = { leve: 8, media: 12, pesada: 15 };

  G.ficha({
    id: ID, es: "DNER-ES 350/97", secAceit: "7.3 (numeração da ES; na seção 6)", secRejeita: "7.3.2", secRefazer: "7.3.3", area: true,
    titulo: "Edificações — revestimento de pisos — aceitação",
    resumo: "Base sobre o terreno (sub-base ≥ 95 % do Proctor normal, concreto ≥ 8/12 cm), revestimento por tipo (cerâmica: juntas ≤ 2,0/1,2 mm e percussão; argamassa de alta resistência ≥ 8/12/15 mm; cimentado 20 mm, nenhum ponto < 10 mm; marmorite; tacos; laminado; pedra portuguesa) e controle geométrico 6.2.1 (cotas, espessuras, caimento ≥ 0,5 %).",
    params: [
      { k: "tipo", r: "Revestimento de piso (seção 5)", tipo: "select", recarrega: true, opcoes: [
        ["ceramica", "Ladrilhos cerâmicos (5.4)"], ["ar", "Argamassa de alta resistência (5.5)"], ["cimentado", "Cimentado (5.9–5.10)"],
        ["marmorite", "Marmorite (5.15)"], ["tacos", "Tacos de madeira (5.14)"], ["laminado", "Laminado fenólico-melamínico (5.13)"],
        ["pedra", "Pedra portuguesa (5.16)"], ["outro", "Borracha, tapete, vinil (5.11, 5.12, 5.17)"]] },
      { k: "grande", r: "Ladrilhos > 200 × 300 mm ou > 400 cm²? (5.4.3)", tipo: "select", opcoes: G.SN, se: function (d) { return (d.params || {}).tipo === "ceramica"; },
        dica: "sim: juntas ≤ 2,0 mm; não: ≤ 1,2 mm" },
      { k: "solic", r: "Solicitação / trânsito (5.5.5; 5.8)", tipo: "select", opcoes: [["leve", "Leve — trânsito \"rolando\""], ["media", "Média — \"deslizando\""], ["pesada", "Pesada — golpes e choques"]] },
      { k: "terreno", r: "Piso sobre o terreno (base de concreto simples)? (5.6–5.8)", tipo: "select", recarrega: true, opcoes: G.SN },
      { k: "espProj", r: "Espessura de projeto do revestimento (mm) (6.2.1.2)", dica: "vazio = só os mínimos da seção 5" },
    ],
    padrao: { tipo: "ceramica", grande: "N", solic: "leve", terreno: "N" },
    criterios: [
      sn("receb", "6.1", "Materiais conforme as exigências dos fabricantes", "atendidas"),
      sn("canal", "5.1", "Pavimentação após o assentamento das canalizações", "canalizações assentadas antes"),
      sn("cotas", "6.2.1.1", "Alinhamentos e cotas", "conforme o projeto"),
      sn("semCal", "5.2; 5.4.1", "Argamassa de assentamento dos ladrilhos", "sem cal; 1:2:3 (cimento, areia, saibro) ou 1:5, ou argamassa de alta adesividade", { se: tipo(["ceramica"]) }),
      sn("percussao", "5.4.2", "Percussão dos ladrilhos após a pega", "peças sem completa segurança substituídas", { se: tipo(["ceramica"]) }),
      sn("juntaAR", "5.5.6", "Juntas da argamassa de alta resistência", "coincidentes com as da sub-base; junta de contorno a 20 mm das paredes; metal ≥ 1,6 mm ou plástico ≥ 3,0 mm; sem madeira", { se: tipo(["ar"]) }),
      sn("baseAR", "5.5.2–5.5.4", "Sub-base e base da argamassa de alta resistência", "laje ≥ 10 cm com ≥ 300 kg/m³ de cimento; chapisco 1:2 de 3 a 4 mm; contrapiso 1:3 (cimento não de alto-forno)", { se: tipo(["ar"]) }),
      sn("curaCim", "5.10", "Cura úmida do cimentado por 7 dias", "mantido úmido durante 7 dias", { se: tipo(["cimentado"]) }),
      sn("marmExec", "5.15.1–5.15.5", "Marmorite: juntas salientes 15 mm, grânulos > 70 %, cura ≥ 6 dias, polimento após ≥ 8 dias", "conforme 5.15", { se: tipo(["marmorite"]) }),
      sn("tacoExec", "5.14", "Tacos: NBR 6451 (cauda de andorinha), junta de 10 mm nas paredes, sem trânsito por 24 h", "conforme 5.14", { se: tipo(["tacos"]) }),
      sn("lamExec", "5.13", "Laminado: base cimentada nivelada; características do 5.13.4; sem trânsito por 48 h", "conforme 5.13", { se: tipo(["laminado"]) }),
      sn("pedraExec", "5.16", "Pedra portuguesa: assentamento 1:2:3, compactação, superfície unida e desempenada", "sem saliência entre as pedras", { se: tipo(["pedra"]) }),
      sn("outroExec", "5.11; 5.12; 5.17", "Borracha, tapete ou vinil: base cimentada lisa e seca; adesivo recomendado", "conforme a seção 5 e o fabricante", { se: tipo(["outro"]) }),
      v("gc", "5.7", "Grau de compactação da sub-base (Proctor normal)", "%", 1, 95, undefined, { se: sobreTerreno, naoAplicaPor: "piso não apoiado no terreno", metodo: "DNIT 458 / NBR 7182",
        importar: { de: "dnit-458-2025-me", valores: function (e) {
          return ((e.resultados || {}).furos || []).filter(function (f) { return ok(f.GC); }).map(function (f, i) { return { v: f.GC, est: f.estaca || "", pos: f.posicao || "", rot: "furo " + (i + 1) }; });
        } } }),
      v("espBase", "5.8", "Espessura da base de concreto simples", "cm", 1, function (P) { return P.solic === "pesada" ? 12 : 8; }, undefined,
        { se: sobreTerreno, naoAplicaPor: "piso não apoiado no terreno", exigido: "≥ 8 cm (leve/rolando/deslizando); ≥ 12 cm (golpes e choques, pesada)" }),
      v("juntaCer", "5.4.3", "Largura das juntas dos ladrilhos", "mm", 1, undefined, function (P) { return P.grande === "S" ? 2.0 : 1.2; },
        { se: tipo(["ceramica"]), exigido: "≤ 2,0 mm (ladrilhos grandes) / ≤ 1,2 mm" }),
      v("espAR", "5.5.5", "Espessura da argamassa de alta resistência", "mm", 1, function (P) { return ESP_AR[P.solic] || 8; }, undefined,
        { se: tipo(["ar"]), exigido: "≥ 8 mm (leve) / 12 mm (média) / 15 mm (pesada)" }),
      v("chapisco", "5.5.3", "Espessura do chapisco", "mm", 1, 3, 4, { se: tipo(["ar"]) }),
      v("espCim", "5.10", "Espessura do cimentado", "mm", 1, 10, undefined, { se: tipo(["cimentado"]), exigido: "20 mm, nenhum ponto < 10 mm" }),
      v("painel", "5.15", "Área dos painéis de marmorite", "m²", 2, undefined, 0.80, { se: tipo(["marmorite"]), exigido: "< 0,80 m²" }),
      v("juntaLam", "5.13.2", "Juntas entre placas de laminado", "mm", 1, 1.0, undefined, { se: tipo(["laminado"]) }),
      v("pedra", "5.16", "Dimensão dos fragmentos de pedra", "mm", 0, 30, 70, { se: tipo(["pedra"]) }),
      v("esp", "6.2.1.2", "Espessura do revestimento (projeto)", "mm", 1, function (P) { var e = num(P.espProj); return ok(e) ? e : undefined; }, undefined,
        { se: function (P) { return ok(num(P.espProj)); }, naoAplicaPor: "espessura de projeto não informada" }),
      v("caimento", "5.3; 6.2.1.3", "Caimento para ralos / bocas de lobo", "%", 2, 0.5, undefined),
    ],
    extra: function (ctx) {
      var P = ctx.P, l = ctx.item.espCim, A = FE.aceitacao;
      if (l && l.n && l.situacao !== "nao_exigido") {
        var m = media(l.est.vals.map(function (p) { return p.v; }));
        l.resultado += " · média " + fmt(m, 1) + " mm";
        if (m < 20 - 1e-9) A.marcar(l, "ressalva", "espessura média " + fmt(m, 1) + " mm < 20 mm especificados (5.10)");
      }
      if ((l = ctx.item.espBase) && l.situacao !== "nao_exigido") l.exigido = "≥ " + (P.solic === "pesada" ? 12 : 8) + " cm (solicitação " + (P.solic || "leve") + ")";
      if ((l = ctx.item.espAR) && l.situacao !== "nao_exigido") l.exigido = "≥ " + (ESP_AR[P.solic] || 8) + " mm (solicitação " + (P.solic || "leve") + ")";
      if ((l = ctx.item.juntaCer) && l.situacao !== "nao_exigido") l.exigido = "≤ " + (P.grande === "S" ? "2,0 mm (ladrilhos grandes)" : "1,2 mm (ladrilhos pequenos)");
    },
    notas: "Controle geométrico (6.2.1): alinhamentos e cotas, espessuras e caimento mínimo de 0,5 % (ralos, bocas de lobo ou bueiros). Cimentado (5.10): nenhum ponto abaixo de 10 mm (reprova) e espessura de 20 mm (média abaixo = ressalva). Base de concreto: 8 cm (trânsito rolando ou deslizando, solicitação leve) ou 12 cm (golpes e choques, pesada); a ES não fixa o valor para solicitação \"média\": adotados 8 cm. Juntas da cerâmica (5.4.3): o limite de 2,0 mm vale para ladrilhos > 200 × 300 mm ou área > 400 cm² (critérios não equivalentes na ES; basta um). GC da sub-base (5.7) pode ser importado da ficha DNIT 458.",
    exemplos: [
      { nome: "Piso cerâmico sobre o terreno — aceito", dados: function () {
        var P = { servico: "Bloco A — piso do térreo (salas 1 a 4)", area: "180", tipo: "ceramica", grande: "S", solic: "leve", terreno: "S" };
        var d = { ident: { registro: "ED-PIS-01", obra: "Obra A", local: "Bloco A — térreo", data: "2026-09-10" }, params: P, verificacoes: G.verif(ID, {}, P),
          espBase: [{ est: "Sala 1", v: "8,5" }, { est: "Sala 3", v: "9,0" }],
          juntaCer: [{ est: "Sala 1", v: "1,5" }, { est: "Sala 2", v: "2,0" }, { est: "Sala 4", v: "1,8" }],
          caimento: [{ est: "Sala 1 → ralo", v: "0,8" }, { est: "Sala 4 → ralo", v: "0,6" }], gc: [] };
        FE.aceitacao.exemplos.importar(FE.FICHAS[ID].params, d, "imp_gc", [["dnit-458-2025-me", 0]]);
        return d;
      } },
      { nome: "Cimentado externo fino e sem caimento — rejeitado", dados: function () {
        var P = { servico: "Pátio de serviço — cimentado", area: "240", tipo: "cimentado", solic: "leve", terreno: "S" };
        return { ident: { registro: "ED-PIS-02", obra: "Obra B", local: "Pátio de serviço", data: "2026-09-18" }, params: P, verificacoes: G.verif(ID, {}, P),
          gc: [{ est: "Faixa 1", reg: "FUR-01", v: "96,2" }, { est: "Faixa 2", reg: "FUR-02", v: "93,4" }],
          espBase: [{ est: "Faixa 1", v: "8,0" }, { est: "Faixa 2", v: "8,5" }],
          espCim: [{ est: "Faixa 1", v: "18" }, { est: "Faixa 2", v: "15" }, { est: "Faixa 3", v: "9" }],
          caimento: [{ est: "Faixa 1", v: "0,6" }, { est: "Faixa 3", v: "0,3" }] };
      } },
    ],
  });
})();
