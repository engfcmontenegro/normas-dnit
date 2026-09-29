/*
 * Ficha de ES: DNIT 121/2009-ES — Pontes e viadutos rodoviários — Fundações (aceitação de um apoio / grupo de estacas
 * ou tubulões). Usa FE.aceitacao e FE.aceitacaoG9b (es-dnit-116-2009-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-121-2009-es";

  var TIPOS = [["premoldada", "Estaca pré-moldada de concreto (cravada)"], ["aco", "Estaca de aço (cravada)"], ["madeira", "Estaca de madeira (cravada)"],
    ["moldada", "Estaca moldada no local (tubo cravado)"], ["franki", "Estaca moldada no local de base alargada (tipo Franki)"],
    ["escavada", "Estaca escavada"], ["raiz", "Estaca injetada de pequeno diâmetro (raiz / microestaca)"], ["tubulao", "Tubulão"]];
  function cravada(P) { return P.tipo === "premoldada" || P.tipo === "aco" || P.tipo === "madeira"; }
  function tubo(P) { return P.tipo === "moldada" || P.tipo === "franki"; }
  function eh(t) { return function (P) { return P.tipo === t; }; }
  // fck mínimo (5.3.4 b, d; 5.3.5 b)
  function fckMin(P) {
    if (P.tipo === "moldada" || P.tipo === "franki") return 16;
    if (P.tipo === "tubulao") return 16;
    if (P.tipo === "aco" && P.tubular === "sim") return 12;
    return NaN;
  }

  var GI = "Materiais (5.1; 7.1)", GX = "Execução (5.3)", GC = "Controle da execução (7.2)";
  var CRIT = [
    { id: "insumos", grupo: GI, texto: "Insumos conforme DNER-EM 034, 036, 037 e 038; concreto (DNIT 117) e aço (DNIT 118)", secao: "5.1; 7.1", tipo: "sim_nao" },
    { id: "escav", grupo: GX, texto: "Escavação no alinhamento e cotas do projeto; ≤ 1 m além das faces; excesso regularizado com concreto (sem reaterro)", secao: "5.3.1", tipo: "sim_nao" },
    { id: "lastro", grupo: GX, texto: "Blocos/sapatas sobre lastro de concreto C10 ≥ 5 cm; concretagem a seco (ou pela DNIT 117, 5.3.1 e); reaterro compactado", secao: "5.3.3", tipo: "sim_nao" },
    { id: "premold", grupo: GX, texto: "Estacas pré-moldadas: lote identificado (nº e data); cobrimento ≥ 3 cm; apoio contínuo ≥ 7 dias; sem fraturas no transporte", secao: "5.3.4 c", tipo: "sim_nao",
      se: eh("premoldada"), naoAplicaPor: "outro tipo de fundação" },
    { id: "equip", grupo: GX, texto: "Cravação: guias, capacete com coxim; elementos (carga, comprimento, martelo, altura de queda, nega) definidos antes", secao: "5.3.4 g", tipo: "sim_nao",
      se: function (P) { return cravada(P) || tubo(P); }, naoAplicaPor: "fundação não cravada" },
    { id: "pilao", grupo: GX, texto: "Relação peso do pilão / peso da estaca (martelo de queda livre, carga ≤ 1 MN)", secao: "5.3.4 g", tipo: "valor", casas: 2,
      min: function (P) { return P.tipo === "premoldada" ? 0.5 : 1.0; }, se: function (P) { return cravada(P) && P.martelo === "queda"; }, naoAplicaPor: "martelo automático/vibratório ou fundação não cravada" },
    { id: "tubado", grupo: GX, texto: "Tubo seco e limpo; ponta ≥ 30 cm no concreto; camadas ≤ 50 cm; 4,50 m / 7 dias entre estacas tubadas", secao: "5.3.4 d", tipo: "sim_nao",
      se: tubo, naoAplicaPor: "sem tubo cravado" },
    { id: "franki", grupo: GX, texto: "Base alargada — energia nos últimos 150 l de concreto", secao: "5.3.4 g", tipo: "valor", unid: "MN·m", casas: 1,
      min: function (P) { return num(P.diam) > 45 ? 5 : 2.5; }, se: eh("franki"), naoAplicaPor: "sem base tipo Franki",
      exigido: "≥ 2,5 MN·m (φ ≤ 45 cm) ou ≥ 5 MN·m (φ > 45 cm), proporcional ao volume" },
    { id: "raiz", grupo: GX, texto: "Estaca injetada — consumo de cimento do material injetado", secao: "5.3.4 e", tipo: "valor", unid: "kg/m³", casas: 0, min: 350,
      se: eh("raiz"), naoAplicaPor: "outro tipo de estaca" },
    { id: "base24", grupo: GX, texto: "Tubulão — intervalo entre o fim do alargamento da base e a concretagem", secao: "5.3.5 b", tipo: "valor", unid: "h", casas: 1, max: 24,
      se: eh("tubulao"), naoAplicaPor: "sem tubulão", exigido: "≤ 24 h (ultrapassado: nova inspeção e limpeza do fundo)" },
    { id: "registro", grupo: GC, texto: "Registro completo de cada estaca/tubulão (2 vias; Relatório de Cravação do Anexo A)", secao: "7.2.1; 7.2.2; Anexo A", tipo: "sim_nao",
      freq: { por: "contagem", qtd: "nEstacas", a_cada: 1, minimo: 1, regra: "todas as estacas/tubulões, inclusive as de prova" } },
    { id: "defeito", grupo: GC, texto: "Estacas sem fissuras em todo o perímetro ou defeitos; danificadas/deslocadas corrigidas", secao: "5.3.4 g", tipo: "sim_nao" },
    { id: "fc", grupo: GC, texto: "Resistência do concreto das estacas pré-moldadas / tubulões — exemplares", secao: "7.2.1; 5.1.1 (DNIT 117)", tipo: "valor", unid: "MPa", casas: 1,
      min: function (P) { return num(P.fck); }, importar: G.imp091, metodo: "ABNT NBR 5739 (DNER-ME 091)",
      se: function (P) { return ok(num(P.fck)); }, naoAplicaPor: "fck não informado", exigido: "fck,est ≥ fck (DNIT 117, 7.3.1)" },
  ];

  function tabelasExtra() {
    return [{ chave: "est", titulo: "Estacas / tubulões — cravação, locação e arrasamento (5.3.4 g; 7.2)", rotulo: "Estaca", iniciais: 3, min: 1,
      dica: "uma coluna por estaca ou tubulão; deixe vazio o que não se aplica",
      linhas: [{ k: "id", r: "Identificação", texto: true }, { k: "diam", r: "Diâmetro / lado (fuste)", u: "cm" },
        { k: "nega", r: "Penetração nos 10 últimos golpes (nega)", u: "mm" }, { k: "desv", r: "Desvio de locação (excentricidade)", u: "cm" },
        { k: "incl", r: "Desvio de inclinação", u: "mm/m" }, { k: "emb", r: "Embutimento no bloco", u: "cm" }, { k: "supl", r: "Suplemento usado", u: "m" }] }];
  }

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — fundações (estacas e tubulões) — aceitação",
    resumo: "Aceitação das fundações de um apoio pela DNIT 121/2009-ES: escavação e blocos (5.3.1 a 5.3.3), execução por tipo de estaca/tubulão (5.3.4; 5.3.5), nega ≤ 30 mm nos 10 últimos golpes, excentricidade ≤ 10 % do diâmetro, desvio angular ≤ 1:100, embutimento ≥ 20 cm, suplemento ≤ 2,5 m (5.3.4 g; 7.2), resistência do concreto (1 série de 4 CPs a cada 25 estacas ou dia; fck,est da DNIT 117), fck mínimo por tipo e provas de carga (7.2.1).",
    lote: false,
    params: [
      { k: "apoio", r: "Apoio / bloco", ph: "ex.: pilar P2 — bloco B2" },
      { k: "tipo", r: "Tipo de fundação", tipo: "select", opcoes: TIPOS },
      { k: "tubular", r: "Estaca de aço tubular preenchida com concreto?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim (fck ≥ 12 MPa)"]],
        se: function (d) { return (d.params || {}).tipo === "aco"; } },
      { k: "martelo", r: "Martelo", tipo: "select", opcoes: [["queda", "Queda livre"], ["auto", "Automático / vibratório"]] },
      { k: "diam", r: "Diâmetro da estaca Franki (cm)", se: function (d) { return (d.params || {}).tipo === "franki"; } },
      { k: "nEstacas", r: "Estacas/tubulões deste apoio (nº)" },
      { k: "nObra", r: "Estacas da obra inteira (nº) — para as provas de carga" },
      { k: "especial", r: "Obra (7.2.1)", tipo: "select", opcoes: [["normal", "Normal (1 prova a cada 500 estacas cravadas)"], ["especial", "Especial (1 a cada 200)"]] },
      { k: "provasProj", r: "Provas de carga indicadas no projeto (nº)" },
      { k: "provas", r: "Provas de carga realizadas na obra (nº)" },
      { k: "fck", r: "fck de projeto do concreto das estacas/tubulão (MPa)" },
      { k: "cond", r: "Condição de preparo (DNIT 117, Tabela 5)", tipo: "select", opcoes: [["A", "A"], ["B", "B"]] },
      { k: "dias", r: "Dias de concretagem das estacas pré-moldadas", se: function (d) { return (d.params || {}).tipo === "premoldada"; } },
    ],
    padrao: { tipo: "premoldada", tubular: "nao", martelo: "queda", especial: "normal", cond: "A" },
    criterios: CRIT,
    refs: { reprova: "7.3.2", atende: "7.3.1", regra: "7.2" },
    extra: function (ctx) {
      var P = ctx.P, fck = num(P.fck), l, n = num(P.nEstacas);
      var est = (ctx.d.est || []).filter(function (c) { return ["diam", "nega", "desv", "incl", "emb", "supl"].some(function (k) { return String(c[k] || "").trim(); }); });
      function pts(f) { return G.pontos(est, f, function (c, i) { return c.id || "estaca " + (i + 1); }); }
      var GE = "Estacas / tubulões (5.3.4 g; 7.2)";
      if (cravada(P) || tubo(P)) {
        ctx.linhas.push(A.avaliar({ id: "nega", grupo: GE, criterio: "Nega — penetração nos 10 últimos golpes", secao: "5.3.4 g", unid: "mm", casas: 0, max: 30, individual: true,
          exigido: "≤ 30 mm (não aceita em qualquer caso)", pontos: pts(function (c) { return num(c.nega); }) }));
        ctx.freqs.push(A.frequencia({ ensaio: "Nega", metodo: "registro de cravação", por: "contagem", a_cada: 1, qtd: n, minimo: 1, unidade: "estaca(s)", realizado: pts(function (c) { return num(c.nega); }).length }));
      }
      l = A.avaliar({ id: "exc", grupo: GE, criterio: "Excentricidade — desvio de locação / diâmetro", secao: P.tipo === "tubulao" ? "7.2.2" : "7.2.1", unid: "%", casas: 1, max: 10, individual: true, falha: "pendente",
        exigido: "≤ 10 % do diâmetro (acima: verificação estrutural)", pontos: pts(function (c) { var dv = num(c.desv), dm = num(c.diam); return ok(dv) && ok(dm) && dm > 0 ? Math.abs(dv) / dm * 100 : NaN; }) });
      if (l.situacao === "pendente") l.motivos[0].texto = l.motivo = l.motivo + " — exige verificação estrutural (flambagem, redimensionamento; acréscimo de carga ≤ 15 %) (7.2.1; 7.2.2)";
      ctx.linhas.push(l);
      ctx.linhas.push(A.avaliar({ id: "incl", grupo: GE, criterio: "Desvio de inclinação", secao: "7.2.1", unid: "mm/m", casas: 0, max: 10, individual: true,
        exigido: "≤ 1:100 (10 mm/m) sem correção", pontos: pts(function (c) { return num(c.incl); }) }));
      if (P.tipo !== "tubulao") ctx.linhas.push(A.avaliar({ id: "emb", grupo: GE, criterio: "Embutimento da estaca no bloco", secao: "5.3.4 g", unid: "cm", casas: 0, min: 20, individual: true,
        pontos: pts(function (c) { return num(c.emb); }) }));
      var sp = pts(function (c) { return num(c.supl); });
      if (sp.length) ctx.linhas.push(A.avaliar({ id: "supl", grupo: GE, criterio: "Comprimento do suplemento", secao: "5.3.4 g", unid: "m", casas: 1, max: 2.5, individual: true, pontos: sp }));
      ctx.linhas.forEach(function (x) { if (x.grupo === GE && x.situacao === "sem_dados") G.redefinir(x, "sem_dados", "sem medições na tabela de estacas"); });
      // fck mínimo por tipo
      var fm = fckMin(P);
      if (ok(fm)) {
        l = A.linha({ id: "fckmin", grupo: GI, criterio: "fck de projeto × mínimo da ES", secao: P.tipo === "tubulao" ? "5.3.5 b" : "5.3.4 b, d", exigido: "≥ " + fm + " MPa" + (P.tipo === "tubulao" ? " no fuste (núcleo ≥ 12 MPa)" : ""),
          resultado: ok(fck) ? fmt(fck, 1) + " MPa" : "—" });
        if (!ok(fck)) G.redefinir(l, "pendente", "informe o fck de projeto");
        else if (fck < fm) G.redefinir(l, "nao_conforme", "fck abaixo do mínimo da ES");
        else l.motivo = "fck ≥ " + fm + " MPa";
        ctx.linhas.push(l);
      }
      // resistência: fck,est (DNIT 117) e frequência de CPs das pré-moldadas
      var lf = ctx.item.fc;
      if (lf.situacao !== "nao_exigido") G.avaliarFck(lf, { fck: fck, cond: P.cond, amostragem: "parcial", fonte: "DNIT 117, 7.3.1" });
      var fr = ctx.freqs.filter(function (f) { return f.ensaio === lf.criterio; })[0];
      if (fr && P.tipo === "premoldada") {
        var series = Math.max(ok(n) ? Math.ceil(n / 25) : 1, ok(num(P.dias)) ? num(P.dias) : 1);
        fr.exigido = series; fr.regra = "1 série de 4 CPs (2 por idade) a cada 25 estacas ou a cada dia de concretagem — o maior; exemplares ≈ séries";
        fr.situacao = fr.realizado >= fr.exigido ? "atende" : fr.realizado ? "insuficiente" : "sem_dados";
      }
      // provas de carga (7.2.1)
      var N = num(P.nObra), proj = ok(num(P.provasProj)) ? num(P.provasProj) : 0, exig = NaN;
      if (ok(N)) {
        if (P.tipo === "escavada") exig = proj + (N > 100 ? 1 : 0);
        else if (cravada(P) || tubo(P)) exig = proj + Math.floor(N / (P.especial === "especial" ? 200 : 500));
        else exig = proj;
      }
      if (P.tipo !== "tubulao") ctx.linhas.push(G.linhaContagem({ id: "provas", grupo: GC, criterio: "Provas de carga", secao: "7.2.1",
        exigido: "as do projeto + " + (P.tipo === "escavada" ? "1 em obra com mais de 100 estacas escavadas" : "1 a cada " + (P.especial === "especial" ? 200 : 500) + " estacas cravadas"),
        exig: exig, real: num(P.provas), semExig: "informe o nº de estacas da obra" }));
    },
    notas: "Critérios da DNIT 121/2009-ES. Conformes as fundações que atendam a 5.1, 5.3, 7.1 e 7.2 (7.3.1); não conformes corrigidas, complementadas ou refeitas, inclusive com provas de carga (7.3.2). Nega: não se aceita penetração > 3 cm nos 10 últimos golpes (5.3.4 g). Excentricidade até 10 % do diâmetro da estaca/fuste; acima, verificação estrutural (flambagem do pilar e da estaca; acréscimo de carga ≤ 15 % em estacas alinhadas) — tratada como pendência (7.2.1; 7.2.2). Desvio angular até 1:100 sem correção. Embutimento ≥ 20 cm no bloco; suplemento ≤ 2,5 m; relação pilão/estaca ≥ 0,5 (pré-moldada) ou ≥ 1,0 (aço/madeira). fck mínimo: moldada no local 16 MPa; tubular de aço 12 MPa; tubulão fuste 16 / núcleo 12 MPa. Concreto das pré-moldadas: 1 série de 4 CPs a cada 25 estacas ou dia (adotado o maior dos dois), avaliada pelo fck,est da DNIT 117 (5.1.1). Provas de carga: as do projeto + 1/500 (normais) ou 1/200 (especiais) cravadas; escavadas: 1 em obras com mais de 100 estacas.",
    exemplos: [
      { nome: "Bloco com 4 estacas pré-moldadas cravadas — aceito", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "FUND-01", obra: "Obra A — ponte sobre o rio A", camada: "Pilar P2 — bloco B2, estacas pré-moldadas 35 × 35", data: "2025-01-22" },
          params: { apoio: "Pilar P2 — bloco B2", tipo: "premoldada", martelo: "queda", nEstacas: "4", nObra: "48", especial: "normal", provasProj: "1", provas: "1", fck: "25", cond: "A", dias: "1" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", obs: "lote 3 — 12/12/2024" }, { atende: "S" }, {}, { atende: "S", real: "4" }, { atende: "S", real: "4" }],
          pilao: [{ est: "bate-estacas 1", v: "0,65" }],
          est: [{ id: "E1", diam: "35", nega: "18", desv: "2", incl: "4", emb: "25" }, { id: "E2", diam: "35", nega: "22", desv: "3", incl: "6", emb: "22" },
            { id: "E3", diam: "35", nega: "15", desv: "1", incl: "3", emb: "24" }, { id: "E4", diam: "35", nega: "25", desv: "3,5", incl: "8", emb: "21" }],
          fc: [["S1", "29,5"], ["S2", "31,0"], ["S3", "30,2"], ["S4", "28,8"], ["S5", "32,1"], ["S6", "30,6"]].map(function (x) {
            return { est: "lote de fabricação 3", pos: x[0] + " — 28 d", reg: "digitado", v: x[1] }; }) };
        return d;
      } },
      { nome: "Estacas moldadas no local: nega de 42 mm, excentricidade de 14 % e sem prova de carga — rejeitado", dados: function () {
        var d = { ident: { registro: "FUND-02", obra: "Obra B — viaduto", camada: "Encontro E1 — estacas moldadas no local φ 40", data: "2025-02-17" },
          params: { apoio: "Encontro E1", tipo: "moldada", martelo: "queda", nEstacas: "3", nObra: "620", especial: "normal", provasProj: "0", provas: "0", fck: "15", cond: "A" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }, { real: "3", nc: "1", obs: "estaca E1-3 sem registro de cravação" }, { atende: "S" }],
          est: [{ id: "E1-1", diam: "40", nega: "25", desv: "3", incl: "5", emb: "22" }, { id: "E1-2", diam: "40", nega: "42", desv: "5,6", incl: "12", emb: "20" },
            { id: "E1-3", diam: "40", nega: "28", desv: "2", incl: "7", emb: "18" }] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "imp_fc", [["dner-me-091-98", 2]]);
        return d;
      } },
    ],
  });
  G.registrar(F, ID, tabelasExtra);
})();
