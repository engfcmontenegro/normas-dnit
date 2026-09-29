/*
 * Ficha de ES: DNIT 116/2009-ES — Pontes e viadutos rodoviários — Serviços preliminares (aceitação).
 * Também define FE.aceitacaoG9b: funções comuns às fichas das ES de pontes e viadutos DNIT 116 a 124/2009
 * (resistência característica estimada do concreto da DNIT 117 — Tabelas 4 e 5 —, importação de ensaios de
 * concreto e de água, calda de injeção e tabelas próprias acrescentadas a uma fichaSimples).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // =====================================================================================
  // FE.aceitacaoG9b — biblioteca do grupo (pontes e viadutos, DNIT 116 a 124/2009-ES)
  // =====================================================================================
  var G = {};
  function r1(x) { return ok(x) ? Math.round(x * 10) / 10 : NaN; }
  G.r1 = r1;

  // DNIT 117/2009-ES, Tabela 5 — valores de ψ6 (condição de preparo A ou B; n = nº de exemplares)
  G.PSI6 = { n: [2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16],
    A: [0.82, 0.86, 0.89, 0.91, 0.92, 0.94, 0.95, 0.97, 0.99, 1.00, 1.02],
    B: [0.75, 0.80, 0.84, 0.87, 0.89, 0.91, 0.93, 0.96, 0.98, 1.00, 1.02] };
  // n não tabelado (9, 11, 13, 15): ψ6 do n tabelado imediatamente inferior (menor ψ6, a favor da segurança)
  G.psi6 = function (n, cond) {
    var arr = G.PSI6[cond === "B" ? "B" : "A"], v = NaN, nTab = NaN;
    G.PSI6.n.forEach(function (k, i) { if (n >= k) { v = arr[i]; nTab = k; } });
    return { v: v, nTab: nTab, exato: nTab === n || (n > 16 && nTab === 16) };
  };
  // DNIT 117/2009-ES, 7.3.1, Tabela 4 — resistência característica estimada fck,est
  //   o: {amostragem: "parcial" | "total", cond: "A" | "B"}
  G.fckEst = function (vals, o) {
    o = o || {};
    var f = (vals || []).filter(ok).slice().sort(function (a, b) { return a - b; }), n = f.length;
    var r = { n: n, f: f, cond: o.cond === "B" ? "B" : "A", amostragem: o.amostragem === "total" ? "total" : "parcial", fckest: NaN, formula: "" };
    if (!n) return r;
    if (r.amostragem === "total") {
      if (n <= 20) { r.fckest = f[0]; r.formula = "amostragem total, n ≤ 20: fck,est = f1 (Tabela 4)"; }
      else { r.i = Math.ceil(0.05 * n - 1e-9); r.fckest = f[r.i - 1]; r.formula = "amostragem total, n > 20: fck,est = fi, i = 0,05·n arredondado para cima = " + r.i + " (Tabela 4)"; }
      return r;
    }
    var P = G.psi6(n, r.cond);
    r.psi = P.v; r.psiN = P.nTab; r.psiExato = P.exato;
    if (n < 2) { r.formula = "1 exemplar: sem estimativa (mínimo de 2 exemplares nos lotes excepcionais e 6 nos demais)"; return r; }
    if (n <= 5) {
      r.excepcional = true; r.fckest = r.psi * f[0];
      r.formula = "lote excepcional (≤ 10 m³, 2 a 5 exemplares): fck,est = ψ6·f1 = " + fmt(r.psi, 2) + " × " + fmt(f[0], 1) + " (7.3.1, Tabela 5)";
      return r;
    }
    if (n < 20) {
      var m = Math.floor(n / 2), s = 0;
      for (var i = 0; i < m - 1; i++) s += f[i];
      r.m = m; r.bruto = 2 * s / (m - 1) - f[m - 1]; r.piso = r.psi * f[0];
      r.fckest = Math.max(r.bruto, r.piso);
      r.formula = "amostragem parcial, 6 ≤ n < 20: fck,est = 2·(f1 + … + f" + (m - 1) + ")/" + (m - 1) + " − f" + m + " = " + fmt(r.bruto, 1) +
        " MPa, não menor que ψ6·f1 = " + fmt(r.psi, 2) + " × " + fmt(f[0], 1) + " = " + fmt(r.piso, 1) + " MPa (Tabelas 4 e 5" + (n % 2 ? "; n ímpar: desprezado o maior valor" : "") + ")";
      return r;
    }
    r.fcm = FE.media(f);
    r.sd = Math.sqrt(f.reduce(function (a, x) { return a + (x - r.fcm) * (x - r.fcm); }, 0) / (n - 1));
    r.fckest = r.fcm - 1.65 * r.sd;
    r.formula = "amostragem parcial, n ≥ 20: fck,est = fcm − 1,65·Sd = " + fmt(r.fcm, 1) + " − 1,65 × " + fmt(r.sd, 2) + " (Tabela 4)";
    return r;
  };
  // reescreve a situação de uma linha (A.marcar só piora)
  G.redefinir = function (l, sit, texto) {
    l.situacao = sit; l.motivo = texto || ""; l.motivos = sit === "conforme" || sit === "nao_exigido" ? [] : [{ situacao: sit, texto: texto }];
    return l;
  };
  // avalia a linha de resistência (item "valor" com os exemplares) pelo fck,est da DNIT 117 (7.3.1)
  //   o: {fck, cond, amostragem, volume, nMin, secao, fonte}
  G.avaliarFck = function (l, o) {
    o = o || {};
    if (l.situacao === "nao_exigido") return null;
    var vals = (l.pontos || []).map(function (p) { return p.v; }).filter(ok);
    var e = G.fckEst(vals, o), fck = o.fck;
    l.fckEst = e;
    l.exigido = "fck,est ≥ fck" + (ok(fck) ? " = " + fmt(fck, 1) + " MPa" : "") + (o.fonte ? " (" + o.fonte + ")" : "");
    if (!e.n) { l.resultado = "—"; return G.redefinir(l, "sem_dados", "sem exemplares") && e; }
    l.resultado = "n = " + e.n + " · f1 = " + fmt(e.f[0], 1) + (ok(e.fckest) ? " · fck,est = " + fmt(r1(e.fckest), 1) + " MPa" : "");
    if (!ok(fck)) { G.redefinir(l, "pendente", "informe o fck de projeto"); return e; }
    if (!ok(e.fckest)) { G.redefinir(l, "pendente", e.formula); return e; }
    if (r1(e.fckest) >= fck - 1e-9) G.redefinir(l, "conforme", "fck,est = " + fmt(r1(e.fckest), 1) + " ≥ " + fmt(fck, 1) + " MPa — lote aceito automaticamente (DNIT 117, 7.3.1); " + e.formula);
    else G.redefinir(l, "nao_conforme", "fck,est = " + fmt(r1(e.fckest), 1) + " < fck = " + fmt(fck, 1) + " MPa — lote não aceito automaticamente; tratamento da não conformidade pela Fiscalização (DNIT 117, 7.3.1 e 7.4); " + e.formula);
    if (e.excepcional && ok(o.volume) && o.volume > 10 + 1e-9)
      A.marcar(l, "pendente", "com 2 a 5 exemplares o lote deve ter no máximo 10 m³ (DNIT 117, 7.3.1) — o lote tem " + fmt(o.volume, 1) + " m³: complete a amostragem (mínimo de " + (o.nMin || 6) + " exemplares)");
    if (e.psi !== undefined && !e.psiExato && e.n >= 2) l.motivo += " — n = " + e.n + " não tabelado na Tabela 5: ψ6 de n = " + e.psiN;
    return e;
  };
  // DNIT 117, 7.2.1: 6 exemplares por lote até C50, 12 acima de C50
  G.nExemplares = function (fck) { return ok(fck) && fck > 50 ? 12 : 6; };
  // DNIT 117, Tabela 2: volume máximo do lote (m³)
  G.volMaxLote = function (solic) { return solic === "flexao" ? 100 : 50; };

  // importação dos ensaios de concreto
  // DNER-ME 091/98 — exemplares (ou CPs) na idade de controle (idadeFck da ficha de origem; 28 dias se vazia)
  G.imp091 = { de: "dner-me-091-98", valores: function (e) {
    var r = e.resultados || {}, idade = ok(r.idadeFck) ? r.idadeFck : 28;
    return (r.lista || []).filter(function (x) { return ok(x.fc) && (x.idade === idade || !ok(x.idade)); })
      .map(function (x) { return { v: r1(x.fc), rot: x.nome + (ok(x.idade) ? " (" + x.idade + " d)" : "") }; });
  } };
  // DNER-ME 404/00 — abatimento de cada determinação válida (mm)
  G.imp404 = { de: "dner-me-404-00", valores: function (e) {
    return ((e.resultados || {}).ens || []).filter(function (x) { return ok(x.abr); }).map(function (x) { return { v: x.abr, rot: "det. " + x.nome }; });
  } };

  // água de amassamento: DNIT 117/2009-ES, 7.1.3 — limites e ensaios comparativos
  G.AGUA117 = { phMin: 5.8, phMax: 8.0, mo: 3, res: 5000, so4: 300, cl: 500, acucar: 500 };
  function avaliaAgua(e) {
    var r = e.resultados || {}, L = G.AGUA117, out = [];
    if (e.ficha === "dnit-036-2004-me") {
      (r.am || []).forEach(function (o) {
        var f = [], tem = false;
        if (ok(o.ph)) { tem = true; if (o.ph < L.phMin || o.ph > L.phMax) f.push("pH " + fmt(o.ph, 1)); }
        [["moR", "mo", "matéria orgânica", 1], ["resR", "res", "resíduo sólido", 0], ["so4R", "so4", "sulfatos", 0], ["clR", "cl", "cloretos", 0], ["acucar", "acucar", "açúcar", 0]].forEach(function (q) {
          if (!ok(o[q[0]])) return;
          tem = true;
          if (o[q[0]] > L[q[1]]) f.push(q[2] + " " + fmt(o[q[0]], q[3]) + " mg/l > " + fmt(L[q[1]], 0));
        });
        if (tem) out.push({ nc: f.length > 0, txt: "amostra " + o.nome + (f.length ? ": " + f.join(", ") : ": atende") });
      });
    } else if (e.ficha === "dnit-037-2004-me") {
      var f = [], tem = false;
      if (ok(r.dIni)) { tem = true; if (r.dIni < -30) f.push("início de pega " + r.dIni + " min"); }
      if (ok(r.dFim)) { tem = true; if (r.dFim > 30) f.push("fim de pega +" + r.dFim + " min"); }
      (r.rc || []).forEach(function (o) { if (ok(o.rel)) { tem = true; if (r1(o.rel) < 90) f.push("resistência aos " + o.idade + " d = " + fmt(o.rel, 1) + " % (redução > 10 %)"); } });
      if (tem) out.push({ nc: f.length > 0, txt: "comparativo" + (f.length ? ": " + f.join(", ") : ": atende") });
    }
    return out;
  }
  // parâmetro "importarVarios" que preenche a coluna de verificação da água (item sim_nao "itemId")
  G.paramAgua = function (criterios, itemId, secao) {
    var idx = criterios.filter(function (it) { return it.tipo === "sim_nao"; }).map(function (it) { return it.id; }).indexOf(itemId);
    return { k: "imp_agua", r: "Água de amassamento — importar análises (DNIT 036-ME) e ensaios comparativos (DNIT 037-ME)", tipo: "importarVarios",
      de: ["dnit-036-2004-me", "dnit-037-2004-me"],
      dica: "preenche a verificação da água com os limites da DNIT 117-ES, " + (secao || "7.1.3") + " (pH 5,8 a 8,0; MO ≤ 3; resíduo ≤ 5000; SO4 ≤ 300; Cl ≤ 500; açúcar ≤ 500 mg/l; pega ± 30 min; redução de resistência ≤ 10 %)",
      aplicar: function (lista, P, d) {
        if (idx < 0) return;
        d.verificacoes = d.verificacoes || [];
        while (d.verificacoes.length <= idx) d.verificacoes.push({});
        var tot = 0, nc = 0, txt = [];
        lista.forEach(function (e) {
          avaliaAgua(e).forEach(function (x) { tot++; if (x.nc) nc++; txt.push(A.importacao.rotulo(e) + " — " + x.txt); });
        });
        d.verificacoes[idx] = tot ? { atende: nc ? "N" : "S", real: String(tot), nc: String(nc), obs: txt.join("; ") } : {};
      } };
  };

  // calda de cimento para injeção — DNIT 117/2009-ES, 5.3.4 e Tabela 3 (7.2.4)
  G.criteriosCalda = function (se, grupo) {
    return [
      { id: "calda_ac", grupo: grupo, texto: "Calda — fator água/cimento (em massa)", secao: "117: 5.3.4", tipo: "valor", casas: 2, max: 0.45, se: se },
      { id: "calda_flu_e", grupo: grupo, texto: "Calda — índice de fluidez imediatamente antes da injeção", secao: "117: 7.2.4, Tabela 3", tipo: "valor", unid: "s", casas: 0, max: 18,
        metodo: "NBR 7682", se: se, freq: { por: "contagem", qtd: "cabos", a_cada: 1, unidade: "cabo(s)", regra: "1 na entrada de cada cabo" } },
      { id: "calda_flu_s", grupo: grupo, texto: "Calda — índice de fluidez na saída da bainha", secao: "117: 7.2.4, Tabela 3", tipo: "valor", unid: "s", casas: 0, min: 8,
        metodo: "NBR 7682", se: se, freq: { por: "contagem", qtd: "cabos", a_cada: 1, unidade: "cabo(s)", regra: "na saída de cada cabo, quantas forem necessárias" } },
      { id: "calda_vida", grupo: grupo, texto: "Calda — vida útil: fluidez mantida por 30 min após a mistura", secao: "117: 7.2.4, Tabela 3", tipo: "sim_nao", metodo: "NBR 7685",
        exigido: "índice de fluidez dentro do limite durante 30 min após a mistura (ver nota: a Tabela 3 diz \"maior que 18 s\")", se: se,
        freq: { por: "lote", minimo: 1, regra: "1 por composição e condição de mistura" } },
      { id: "calda_exs", grupo: grupo, texto: "Calda — água exsudada 3 h após a mistura", secao: "117: 7.2.4, Tabela 3", tipo: "valor", unid: "% do vol.", casas: 1, max: 2,
        metodo: "NBR 7683", se: se, freq: { por: "contagem", qtd: "sacos", a_cada: 100, minimo: 1, unidade: "sacos", regra: "no início do 1º dia e a cada 100 sacos por frente e/ou 2 semanas" } },
      { id: "calda_exp", grupo: grupo, texto: "Calda — expansão total livre 3 h após a mistura (com expansor)", secao: "117: 7.2.4, Tabela 3", tipo: "valor", unid: "% do vol.", casas: 1, max: 7,
        metodo: "NBR 7683", exigido: "≤ 7 %; ≥ 70 % da expansão dentro da bainha",
        se: function (P) { return (!se || se(P)) && P.expansor === "sim"; }, naoAplicaPor: "sem aditivo expansor",
        freq: { por: "contagem", qtd: "sacos", a_cada: 100, minimo: 1, unidade: "sacos", regra: "como a exsudação" } },
      { id: "calda_fc", grupo: grupo, texto: "Calda — resistência à compressão aos 28 dias", secao: "117: 7.2.4, Tabela 3; 7.3.2", tipo: "valor", unid: "MPa", casas: 1, min: 25,
        metodo: "NBR 7684", exigido: "fck,28 ≥ 25 MPa (cada resultado)", se: se, importar: G.imp091 },
    ];
  };

  // acrescenta tabelas próprias a uma ficha feita com A.fichaSimples (registrar: false) e registra
  G.registrar = function (F, id, tabelasExtra) {
    var t0 = F.tabelas;
    if (tabelasExtra) F.tabelas = function (d) { return t0(d).concat(tabelasExtra(d) || []); };
    FE.FICHAS[id] = F;
    return F;
  };
  // pontos de uma tabela própria: [{v, est, x, rot}] a partir de uma função por coluna
  G.pontos = function (lista, fv, frot) {
    return (lista || []).map(function (c, i) {
      var v = fv(c, i);
      return { v: v, est: c.est || "", x: NaN, rot: frot ? frot(c, i) : (c.id || "det. " + (i + 1)) };
    }).filter(function (p) { return ok(p.v); });
  };
  G.simNao = function (t) {
    t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
    if (!t) return null;
    if (/^(s|sim|ok|c|x|1)$/.test(t)) return true;
    if (/^(n|n[aã]o|nc|0)$/.test(t)) return false;
    return null;
  };
  // linha de contagem exigido × realizado (ex.: provas de carga) — pendente se faltar
  G.linhaContagem = function (o) {
    var l = A.linha({ id: o.id, grupo: o.grupo || "", criterio: o.criterio, secao: o.secao, n: o.real, exigido: o.exigido,
      resultado: (ok(o.real) ? o.real : "—") + " de " + (ok(o.exig) ? o.exig : "?") });
    if (!ok(o.exig)) G.redefinir(l, "pendente", o.semExig || "informe os dados para calcular o exigido");
    else if (!ok(o.real)) G.redefinir(l, o.exig ? "sem_dados" : "conforme", o.exig ? "não informado" : "nenhum exigido");
    else if (o.real < o.exig) G.redefinir(l, o.falha || "pendente", "realizado(s) " + o.real + " de " + o.exig + " exigido(s)");
    else l.motivo = "realizado(s) " + o.real + " ≥ " + o.exig;
    return l;
  };
  FE.aceitacaoG9b = G;

  // =====================================================================================
  // DNIT 116/2009-ES — Serviços preliminares
  // =====================================================================================
  var CRIT = [
    { id: "visita", grupo: "Condições gerais (4)", texto: "Visita ao local (clima, acessos, enchentes, mão de obra) registrada", secao: "4", tipo: "sim_nao",
      exigido: "dados do local confirmados antes do início das obras" },
    { id: "revisao", grupo: "Condições gerais (4)", texto: "Revisão do projeto e das especificações; levantamento dos equipamentos", secao: "4", tipo: "sim_nao",
      exigido: "projeto e especificações revisados; equipamentos necessários, disponíveis e a adquirir/locar relacionados" },
    { id: "planej", grupo: "Dados gerais (5.1)", texto: "Planejamento: atividades e precedências, prazos, pessoal, canteiro e desembolsos", secao: "5.1", tipo: "sim_nao",
      exigido: "itens mínimos de 5.1 definidos" },
    { id: "local", grupo: "Canteiro de obra (5.2)", texto: "Terreno do canteiro livre de enchentes, drenado e com boa capacidade de suporte", secao: "5.2.1", tipo: "sim_nao",
      exigido: "local escolhido conforme 5.2.1" },
    { id: "preparo", grupo: "Canteiro de obra (5.2)", texto: "Preparo do terreno: desmatamento, limpeza, sem poças, nivelado; cercas e portões", secao: "5.2.1", tipo: "sim_nao",
      exigido: "área preparada e delimitada" },
    { id: "instal", grupo: "Canteiro de obra (5.2)", texto: "Instalações em compartimentos independentes; alojamentos com energia, água corrente e esgoto", secao: "5.2.2", tipo: "sim_nao",
      exigido: "almoxarifado, alojamento, refeitório, oficinas, depósitos, fôrmas/armação, concreto e atendimento médico de urgência" },
    { id: "arranjo", grupo: "Canteiro de obra (5.2)", texto: "Arranjo: menor deslocamento estoque–obra; materiais similares próximos", secao: "5.2.2", tipo: "sim_nao", falha: "ressalva",
      exigido: "disposições de 5.2.2 adotadas" },
    { id: "obst", grupo: "Remoção de obstáculos (5.3)", texto: "Obstáculos removidos e material levado a locais previamente determinados", secao: "5.3", tipo: "sim_nao",
      exigido: "remoção sem danos evitáveis, destino aprovado" },
    { id: "locacao", grupo: "Locação (5.4)", texto: "Locação materializada: eixo longitudinal e referências de nível do projeto", secao: "5.4", tipo: "sim_nao",
      exigido: "eixo e RN materializados e complementados pelo executante" },
    { id: "loc_desvio", grupo: "Locação (5.4)", texto: "Desvio da locação em relação ao projeto", secao: "5.4; 7.1", tipo: "valor", unid: "mm", casas: 0,
      max: function (P) { return num(P.tolLoc); }, se: function (P) { return ok(num(P.tolLoc)); }, naoAplicaPor: "tolerância não informada (7.1 remete ao Manual de Projeto de OAE)",
      freq: { por: "contagem", qtd: "pontosLoc", a_cada: 1, minimo: 1, regra: "todos os pontos de locação a conferir" } },
    { id: "app", grupo: "Condicionantes ambientais (6)", texto: "Sem serviços em Área de Preservação Permanente", secao: "6", tipo: "sim_nao" },
    { id: "queima", grupo: "Condicionantes ambientais (6)", texto: "Área do canteiro preparada sem queimadas e sem obstruir cursos d'água", secao: "6", tipo: "sim_nao" },
    { id: "esgoto", grupo: "Condicionantes ambientais (6)", texto: "Esgoto não lançado in natura (fossa séptica ou tratamento primário)", secao: "6", tipo: "sim_nao" },
    { id: "final", grupo: "Condicionantes ambientais (6)", texto: "Após a obra: área limpa e vegetação primitiva recomposta", secao: "6", tipo: "sim_nao",
      se: function (P) { return P.fase === "final"; }, naoAplicaPor: "obra em andamento" },
    { id: "pgq", grupo: "Inspeções (7)", texto: "Controle conforme o PGQ e relatórios periódicos (DNIT 011/2004-PRO)", secao: "7.2", tipo: "sim_nao",
      exigido: "ensaios e verificações do PGQ realizados e registrados" },
  ];
  A.fichaSimples({
    id: "dnit-116-2009-es",
    titulo: "Pontes e viadutos — serviços preliminares — aceitação",
    resumo: "Verificações da DNIT 116/2009-ES antes do início da construção da OAE: condições gerais (4), planejamento (5.1), canteiro (5.2), remoção de obstáculos (5.3), locação (5.4), condicionantes ambientais (6) e controle pelo PGQ (7). A ES não fixa tolerâncias numéricas (7.1 remete ao Manual de Projeto de OAE): a tolerância de locação, se informada, é verificada.",
    lote: false,
    params: [
      { k: "obra", r: "Obra de arte / etapa", ph: "ex.: ponte sobre o rio A — mobilização" },
      { k: "fase", r: "Fase", tipo: "select", opcoes: [["inicio", "Início / andamento da obra"], ["final", "Conclusão (desmobilização do canteiro)"]] },
      { k: "tolLoc", r: "Tolerância de locação adotada (mm) — opcional", dica: "a ES remete as tolerâncias ao Manual de Projeto de OAE (IPR 698) — 7.1" },
      { k: "pontosLoc", r: "Pontos de locação a conferir (nº)", se: function (d) { return ok(num((d.params || {}).tolLoc)); } },
    ],
    padrao: { fase: "inicio" },
    criterios: CRIT,
    refs: { reprova: "7.2", atende: "7.2", regra: "7.2" },
    notas: "Critérios da DNIT 116/2009-ES: conformidade quando atendidas as condições das seções 4 e 5, com ensaios e verificações conforme o PGQ e a DNIT 011/2004-PRO (7.2); não conformidades tratadas conforme a DNIT 011/2004-PRO. Condicionantes ambientais conforme a DNIT 070/2006-PRO (6).",
    exemplos: [
      { nome: "Canteiro e locação conferidos — aceito", dados: function () {
        return { ident: { registro: "OAE-SP-01", obra: "Obra A — ponte sobre o rio A", trecho: "BR-000", data: "2026-03-02" },
          params: { obra: "Ponte sobre o rio A — mobilização", fase: "inicio", tolLoc: "10", pontosLoc: "4" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", obs: "área acima da cheia máxima" }, { atende: "S" },
            { atende: "S", real: "7", nc: "0" }, { atende: "S" }, { atende: "S" }, { atende: "S", obs: "eixo e 2 RN" }, { atende: "S" }, { atende: "S" },
            { atende: "S", obs: "fossa séptica" }, {}, { atende: "S" }],
          loc_desvio: [{ est: "encontro E1", v: "4" }, { est: "pilar P1", v: "6" }, { est: "pilar P2", v: "3" }, { est: "encontro E2", v: "5" }] };
      } },
      { nome: "Canteiro sem cerca, esgoto in natura e locação fora da tolerância — rejeitado", dados: function () {
        return { ident: { registro: "OAE-SP-02", obra: "Obra B — viaduto", data: "2026-04-15" },
          params: { obra: "Viaduto B — canteiro", fase: "inicio", tolLoc: "10", pontosLoc: "4" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "N", obs: "canteiro sem cercas e portões" },
            { real: "6", nc: "1", obs: "alojamento sem água corrente" }, { atende: "N", obs: "depósito de aço distante da frente" }, { atende: "S" }, { atende: "S" },
            { atende: "S" }, { atende: "S" }, { atende: "N", obs: "esgoto lançado no córrego" }, {}, { atende: "S" }],
          loc_desvio: [{ est: "encontro E1", v: "7" }, { est: "pilar P1", v: "14" }, { est: "encontro E2", v: "5" }] };
      } },
    ],
  });
})();
