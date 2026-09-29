/*
 * Ficha de ES: DNIT 079/2006-ES — Plataformas de trabalho (obras-de-arte especiais).
 * Também define FE.aceitacaoG9a: funções comuns às fichas das ES de recuperação de pontes DNIT 079 a 092/2006
 * (itens de verificação repetidos, bloco de concreto com fck estimado e abatimento importados das fichas ME,
 * textos do parecer por serviço). Usa FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // =====================================================================================
  // FE.aceitacaoG9a — comum às ES 079–092/2006 (recuperação de pontes)
  // =====================================================================================
  var G = {};

  // Parecer por serviço/etapa (as ES de recuperação não definem lote)
  G.textos = function (rej) {
    return {
      ACEITO: { titulo: "SERVIÇO ACEITO", texto: "Todas as verificações e critérios da especificação atendidos." },
      RESSALVA: { titulo: "SERVIÇO ACEITO COM RESSALVA", texto: "Nenhum critério reprovado, mas há pontos a corrigir ou a documentar (ressalvas abaixo)." },
      PENDENTE: { titulo: "SERVIÇO PENDENTE — CONTROLE INCOMPLETO", texto: "Nenhum critério reprovado, mas faltam verificações, ensaios ou informações exigidos pela especificação." },
      REJEITADO: { titulo: "SERVIÇO NÃO CONFORME", texto: rej || "Há etapa ou critério não conforme: o serviço deve ser refeito ou complementado até atender à especificação." },
    };
  };
  G.SIMNAO = [["nao", "Não"], ["sim", "Sim"]];
  // frequência "1 por lote" → "1 por serviço" (as ES de recuperação não definem lote)
  G.ajustarFreq = function (ctx, unidade) {
    ctx.freqs.forEach(function (f) { if (/ por lote$/.test(f.regra)) f.regra = f.regra.replace(/ por lote$/, " por " + (unidade || "serviço")); });
  };
  G.sim = function (v) { return v === "sim"; };

  // itens de verificação que se repetem nas ES do grupo
  G.itPlataforma = function (secao, grupo) {
    return { id: "plataforma", grupo: grupo || "Acesso e segurança", texto: "Plataformas de acesso conforme a DNIT 079/2006-ES", secao: secao, tipo: "sim_nao",
      exigido: "plataforma segura, conforme projeto esquemático (quando necessária)" };
  };
  G.itSinalizacao = function (secao, grupo) {
    return { id: "sinalizacao", grupo: grupo || "Acesso e segurança", texto: "Sinalização e desvio/limitação de tráfego", secao: secao, tipo: "sim_nao",
      exigido: "instalada e mantida durante os serviços (quando necessária)" };
  };
  G.itManejo = function (secao, texto, grupo) {
    return { id: "manejo", grupo: grupo || "Manejo ambiental", texto: texto || "Manejo ambiental e remoção de detritos e excedentes", secao: secao, tipo: "sim_nao",
      exigido: "detritos coletados; excedentes removidos para locais previamente determinados" };
  };
  G.itEngenheiro = function (secao, grupo) {
    return { id: "engenheiro", grupo: grupo || "Execução", texto: "Acompanhamento constante por engenheiro capacitado", secao: secao, tipo: "sim_nao",
      exigido: "presença e acompanhamento do engenheiro durante os serviços" };
  };

  // ---------------------------------------------------------------------------------
  // Concreto: fc por exemplar (importado da DNER-ME 091) → fck estimado (NBR 12655) e abatimento (DNER-ME 404)
  // As ES do grupo fixam o fck, mas não o critério de aceitação do concreto: aplica-se o controle da NBR 12655
  // (amostragem parcial ou total; casos excepcionais com 2 a 5 exemplares para volumes ≤ 10 m³).
  // ---------------------------------------------------------------------------------
  // ψ6 da NBR 12655 (amostragem parcial): n → [condição A, condições B e C]
  var PSI6 = [[2, 0.82, 0.75], [3, 0.86, 0.80], [4, 0.89, 0.84], [5, 0.91, 0.87], [6, 0.92, 0.89], [7, 0.94, 0.91], [8, 0.95, 0.93],
    [10, 0.97, 0.96], [12, 0.99, 0.98], [14, 1.00, 1.00], [16, 1.02, 1.02]];
  G.PSI6 = PSI6;
  function psi6(n, cond) {
    var sel = null;
    PSI6.forEach(function (x) { if (x[0] <= n) sel = x; });
    return sel ? (cond === "B" ? sel[2] : sel[1]) : NaN;
  }
  // vals: fc por exemplar (MPa). cond: "A" | "B" (B ou C); amostragem: "parcial" | "total"
  G.fckEst = function (vals, cond, amostragem) {
    var v = (vals || []).filter(ok).slice().sort(function (a, b) { return a - b; }), n = v.length;
    if (n < 2) return null;
    var r = { n: n, f1: v[0] };
    if (amostragem === "total") {
      if (n <= 20) { r.v = v[0]; r.regra = "amostragem total, n ≤ 20: fck,est = f1 (menor valor)"; }
      else { var i = Math.ceil(0.05 * n - 1e-9); r.v = v[i - 1]; r.regra = "amostragem total, n > 20: fck,est = f" + i + " (i = 0,05·n)"; }
      return r;
    }
    if (n >= 20) {
      var m0 = FE.media(v), sd = Math.sqrt(v.reduce(function (s, x) { return s + (x - m0) * (x - m0); }, 0) / (n - 1));
      r.v = m0 - 1.65 * sd; r.fcm = m0; r.sd = sd;
      r.regra = "amostragem parcial, n ≥ 20: fck,est = fcm − 1,65·sd = " + fmt(m0, 1) + " − 1,65 × " + fmt(sd, 2);
      return r;
    }
    var p = psi6(n, cond);
    r.psi = p;
    if (n < 6) {
      r.v = p * v[0]; r.excepcional = true;
      r.regra = "caso excepcional (n = " + n + " < 6): fck,est = ψ6·f1 = " + fmt(p, 2) + " × " + fmt(v[0], 1);
      return r;
    }
    var m = Math.floor(n / 2), soma = 0;
    for (var j = 0; j < m - 1; j++) soma += v[j];
    var est = 2 * soma / (m - 1) - v[m - 1];
    r.v = Math.max(est, p * v[0]); r.m = m;
    r.regra = "amostragem parcial, 6 ≤ n < 20: fck,est = 2(f1 + … + f" + (m - 1) + ")/" + (m - 1) + " − f" + m + " = " + fmt(est, 1) +
      (est < p * v[0] ? ", menor que ψ6·f1 = " + fmt(p * v[0], 1) + " (vale ψ6·f1)" : " (≥ ψ6·f1 = " + fmt(p * v[0], 1) + ")");
    return r;
  };

  // parâmetros do concreto (fck: se fckPadrao for função, o campo é opcional e o padrão vem dela)
  G.paramsConcreto = function (o) {
    o = o || {};
    var se = o.se;
    function s(extra) { return se ? function (d) { return se(d.params || {}) && (!extra || extra(d.params || {})); } : extra ? function (d) { return extra(d.params || {}); } : undefined; }
    var p = [
      { k: "fck", r: o.rotuloFck || "fck de projeto do concreto (MPa)", dica: o.dicaFck || "resistência característica especificada", se: s() },
      { k: "condPreparo", r: "Condição de preparo do concreto (NBR 12655)", tipo: "select", opcoes: [["A", "A — materiais medidos em massa (usinado)"], ["B", "B ou C — medição parcial em volume"]], se: s() },
      { k: "amostragem", r: "Controle do concreto (NBR 12655)", tipo: "select", opcoes: [["parcial", "Amostragem parcial (exemplares de algumas betonadas)"], ["total", "Amostragem total (todas as betonadas)"]], se: s() },
      { k: "volConc", r: "Volume de concreto do lote/etapa (m³)", dica: "até 10 m³: admite-se 2 a 5 exemplares (caso excepcional, fck,est = ψ6·f1); acima: mínimo de 6", se: s() },
      { k: "abatEsp", r: "Abatimento especificado no traço (mm) — opcional", ph: "ex.: 100", se: s() },
      { k: "abatTol", r: "Tolerância do abatimento (± mm)", ph: "20", se: s(function (P) { return ok(num(P.abatEsp)); }) },
    ];
    return p;
  };
  G.padraoConcreto = { condPreparo: "A", amostragem: "parcial" };

  // itens: fc por exemplar (id "fc") e abatimento (id "abat")
  G.itensConcreto = function (o) {
    o = o || {};
    var grupo = o.grupo || "Concreto", se = o.se;
    return [
      { id: "fc", grupo: grupo, texto: o.textoFc || "Resistência à compressão por exemplar (fc aos 28 dias)", secao: o.secao, tipo: "valor", unid: "MPa", casas: 1,
        exigido: "fck,est ≥ fck (NBR 12655)", metodo: "DNER-ME 091 (moldagem DNER-ME 046)", se: se,
        freq: { por: "lote", minimo: 6 },
        importar: { de: "dner-me-091-98", valores: function (e) {
          var r = e.resultados || {}, id = (e.dados || {}).ident || {}, idade = ok(r.idadeFck) ? r.idadeFck : 28;
          return (r.lista || []).filter(function (x) { return x.idade === idade; })
            .map(function (x) { return { v: x.fc, est: id.local || id.camada || "", pos: idade + " d", rot: x.nome }; });
        } } },
      { id: "abat", grupo: grupo, texto: "Abatimento do concreto fresco", secao: o.secaoAbat || "traço / projeto", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return num(P.abatEsp) - num(P.abatTol); }, max: function (P) { return num(P.abatEsp) + num(P.abatTol); },
        metodo: "DNER-ME 404", se: function (P) { return (!se || se(P)) && ok(num(P.abatEsp)) && ok(num(P.abatTol)); }, naoAplicaPor: "abatimento não especificado",
        freq: { por: "lote", minimo: 1 },
        importar: { de: "dner-me-404-00", valores: function (e) {
          var r = e.resultados || {};
          return (r.ens || []).filter(function (x) { return ok(x.abr); }).map(function (x) { return { v: x.abr, rot: "ensaio " + x.nome }; });
        } } },
    ];
  };

  // extra: substitui a avaliação individual do fc pelo fck estimado e ajusta a frequência (NBR 12655)
  // o: { fck: function (P) -> número, secao }
  G.extraConcreto = function (ctx, o) {
    o = o || {};
    var l = ctx.item.fc, P = ctx.P;
    if (!l || l.situacao === "nao_exigido") return null;
    var fck = o.fck ? o.fck(P) : num(P.fck), vol = num(P.volConc);
    l.lim = { min: fck };
    l.est = A.estatistica(l.pontos, fck, undefined, { individual: true });
    // frequência (NBR 12655): ≥ 6 exemplares; 2 nos casos excepcionais (volume ≤ 10 m³)
    var exig = ok(vol) && vol <= 10 ? 2 : 6;
    ctx.freqs.forEach(function (f, i) {
      if (f.ensaio !== l.criterio) return;
      ctx.freqs[i] = A.frequencia({ ensaio: f.ensaio, metodo: f.metodo, exigido: exig, realizado: l.n || 0,
        regra: exig === 2 ? "volume ≤ 10 m³: mín. 2 exemplares (NBR 12655)" : "mín. 6 exemplares por lote (NBR 12655)" });
    });
    if (!ok(fck)) { A.marcar(l, "pendente", "informe o fck de projeto"); return null; }
    l.exigido = "fck,est ≥ " + fmt(fck, 1) + " MPa" + (o.secao ? " (" + o.secao + ")" : "");
    if (!l.n) return null;
    var r = G.fckEst(l.pontos.map(function (p) { return p.v; }), P.condPreparo, P.amostragem);
    l.situacao = "conforme"; l.motivos = []; l.motivo = "";
    if (!r) { A.marcar(l, "pendente", "só 1 exemplar: o fck estimado exige ao menos 2 (NBR 12655)"); l.resultado = "fc = " + fmt(l.pontos[0].v, 1) + " MPa (1 exemplar)"; return null; }
    l.fckEst = r.v; l.fckRegra = r.regra;
    l.resultado = "fck,est = " + fmt(r.v, 1) + " MPa (n = " + r.n + "; fc de " + fmt(l.est.vMin, 1) + " a " + fmt(l.est.vMax, 1) + " MPa)";
    if (r.v < fck - 1e-9) A.marcar(l, "nao_conforme", "fck,est = " + fmt(r.v, 1) + " MPa < fck = " + fmt(fck, 1) + " MPa — " + r.regra);
    else l.motivo = "fck,est = " + fmt(r.v, 1) + " ≥ " + fmt(fck, 1) + " MPa — " + r.regra;
    if (r.excepcional && !(ok(vol) && vol <= 10)) A.marcar(l, "ressalva", "n = " + r.n + " < 6 só é admitido em casos excepcionais, com volume ≤ 10 m³ (informe o volume)");
    var baixos = l.est.fora.length;
    if (baixos) ctx.avisos.push("Concreto: " + baixos + " exemplar(es) com fc abaixo do fck (" + l.est.fora.map(function (p) { return fmt(p.v, 1); }).join("; ") + " MPa) — a aceitação é pelo fck estimado.");
    return r;
  };
  G.notaConcreto = " Concreto: as ES do grupo fixam o fck mas não o critério de aceitação; aplica-se o fck estimado da NBR 12655 " +
    "(amostragem parcial: 6 ≤ n < 20 → fck,est = 2(f1 + … + fm−1)/(m − 1) − fm, m = n/2, não menor que ψ6·f1; n ≥ 20 → fcm − 1,65·sd; " +
    "2 a 5 exemplares só em casos excepcionais, volume ≤ 10 m³ → ψ6·f1; amostragem total: n ≤ 20 → f1, n > 20 → fi, i = 0,05·n). " +
    "fc por exemplar = DNER-ME 091 (maior dos CPs da mesma amassada); abatimento = DNER-ME 404, só quando especificado no traço.";

  // exemplos: preenche a tabela de fc com valores digitados
  G.fcTabela = function (vals, local) {
    return vals.map(function (v, i) { return { est: local || "", pos: "28 d", reg: "Exemplar " + (i + 1), v: String(v).replace(".", ",") }; });
  };

  FE.aceitacaoG9a = G;

  // =====================================================================================
  // DNIT 079/2006-ES — Plataformas de trabalho
  // =====================================================================================
  function apoiada(P) { return P.tipo !== "suspensa"; }
  function suspensa(P) { return P.tipo !== "apoiada"; }
  A.fichaSimples({
    id: "dnit-079-2006-es",
    titulo: "Plataformas de trabalho — verificações da Fiscalização",
    resumo: "Verificações mínimas da seção 7.1 (projeto esquemático, manejo ambiental, segurança e rigidez, apoios e ligações das plataformas apoiadas, " +
      "tirantes e ancoragens das suspensas), dimensionamento para 500 kg/m² (5.1/5.2) e diâmetro mínimo de 12 cm dos montantes de madeira roliça (5.1). " +
      "Serviço não conforme é refeito ou complementado (7.2).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "tipo", r: "Tipo de plataforma (4)", tipo: "select", recarrega: true,
        opcoes: [["suspensa", "Suspensa na própria obra (tirantes metálicos)"], ["apoiada", "Apoiada no terreno"], ["ambas", "Apoiada e suspensa"]] },
      { k: "mobilidade", r: "Plataforma (4)", tipo: "select", opcoes: [["fixa", "Fixa (toda a área)"], ["movel", "Móvel (desloca-se horizontalmente)"]] },
      { k: "rolica", r: "Montantes de madeira roliça? (5.1)", tipo: "select", recarrega: true, opcoes: G.SIMNAO,
        se: function (d) { return apoiada(d.params || {}); }, dica: "só tolerados com abundância de madeira no local e falta de montantes tubulares" },
      { k: "area", r: "Área de plataforma montada (m²)", dica: "critério de medição (8)" },
    ],
    padrao: { tipo: "suspensa", mobilidade: "fixa", rolica: "nao" },
    textos: G.textos("Há verificação não conforme: a plataforma deve ser refeita ou complementada até atender à DNIT 079/2006-ES (7.2) antes do uso."),
    criterios: [
      { id: "projeto", grupo: "Projeto", texto: "Montagem em estrita obediência ao projeto esquemático apreciado pela Fiscalização", secao: "4; 7.1 a", tipo: "sim_nao",
        exigido: "projeto esquemático submetido à Fiscalização e seguido" },
      { id: "sobrecarga", grupo: "Projeto", texto: "Sobrecarga de dimensionamento das peças", secao: "5.1; 5.2", tipo: "valor", unid: "kg/m²", casas: 0, min: 500,
        exigido: "≥ 500 kg/m² (5000 N/m²)", metodo: "memória de cálculo" },
      { id: "apoios", grupo: "Plataforma apoiada no terreno", texto: "Montantes fixados em terreno firme; vigamentos, contraventamentos e amarrações que minimizem vibrações e deslocamentos",
        secao: "5.1; 7.1 d", tipo: "sim_nao", se: apoiada, naoAplicaPor: "plataforma suspensa" },
      { id: "ligacoes", grupo: "Plataforma apoiada no terreno", texto: "Ligações das peças de madeira com talas e, preferencialmente, parafusos", secao: "5.1; 7.1 d", tipo: "sim_nao",
        se: apoiada, naoAplicaPor: "plataforma suspensa", falha: "ressalva", exigido: "talas; parafusos em lugar de pregos (preferencial)" },
      { id: "diam", grupo: "Plataforma apoiada no terreno", texto: "Diâmetro dos montantes de madeira roliça", secao: "5.1", tipo: "valor", unid: "cm", casas: 1, min: 12,
        exigido: "≥ 12 cm, peças retilíneas", metodo: "medição com trena/suta", se: function (P) { return apoiada(P) && P.rolica === "sim"; }, naoAplicaPor: "sem montantes roliços" },
      { id: "retilineas", grupo: "Plataforma apoiada no terreno", texto: "Montantes roliços retilíneos", secao: "5.1", tipo: "sim_nao",
        se: function (P) { return apoiada(P) && P.rolica === "sim"; }, naoAplicaPor: "sem montantes roliços" },
      { id: "tirantes", grupo: "Plataforma suspensa", texto: "Tirantes metálicos dimensionados com folga, dispositivos de ancoragem e ligações confiáveis", secao: "4; 5.2; 7.1 e", tipo: "sim_nao",
        se: suspensa, naoAplicaPor: "plataforma apoiada", exigido: "tirantes metálicos obrigatórios, seguramente ancorados" },
      { id: "seguranca", grupo: "Segurança", texto: "Flexibilidade e segurança da plataforma e da estrutura de suporte", secao: "5; 7.1 c", tipo: "sim_nao",
        exigido: "sem vibrações ou deslocamentos excessivos" },
      { id: "protecao", grupo: "Segurança", texto: "Plataforma totalmente protegida por dispositivos laterais; acesso e movimentação seguros", secao: "4", tipo: "sim_nao" },
      G.itManejo("6; 7.1 b", "Manejo ambiental (clareiras e tráfego mínimos; preferência por materiais reaproveitáveis; excedentes removidos)"),
      { id: "remocao", grupo: "Desmobilização", texto: "Estruturas, plataformas, tirantes e dispositivos de fixação totalmente removidos após os serviços", secao: "4", tipo: "sim_nao",
        exigido: "remoção total ao fim dos serviços" },
    ],
    extra: function (ctx) { G.ajustarFreq(ctx, "plataforma"); },
    notas: "Critérios da DNIT 079/2006-ES. A ES não prevê ensaios: o controle são as verificações mínimas da Fiscalização (7.1), uma vez por plataforma montada (e a cada deslocamento de plataforma móvel). " +
      "Os serviços estão conformes quando atendem à ES; caso contrário, são refeitos ou complementados (7.2).",
    exemplos: [
      { nome: "Plataforma suspensa — todas as verificações atendidas", dados: function () {
        return { ident: { registro: "PLAT-01", obra: "Obra A", local: "Ponte sobre o rio A — vão 2", data: "2025-08-04", responsavel: "Fiscal A" },
          params: { tipo: "suspensa", mobilidade: "movel", rolica: "nao", area: "48" },
          verificacoes: [{ atende: "S", obs: "projeto esquemático nº 01 aprovado" }, { atende: "", obs: "" }, { atende: "", obs: "" }, { atende: "", obs: "" },
            { atende: "S", real: "3", obs: "tirantes pelos furos dos drenos" }, { atende: "S", real: "3" }, { atende: "S", real: "3" }, { atende: "S" }, { atende: "S", obs: "tudo removido em 22/08" }],
          sobrecarga: [{ est: "memória de cálculo", reg: "MC-01", v: "500" }] };
      } },
      { nome: "Plataforma apoiada com montantes roliços finos e sem guarda-corpo — não conforme", dados: function () {
        return { ident: { registro: "PLAT-02", obra: "Obra B", local: "Viaduto B — pilares P1 a P3", data: "2025-09-10" },
          params: { tipo: "apoiada", mobilidade: "fixa", rolica: "sim", area: "60" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { real: "4", nc: "1", obs: "ligação do montante 3 só com pregos" }, { atende: "S" }, {},
            { atende: "S", real: "2" }, { real: "2", nc: "1", obs: "lado jusante sem proteção lateral" }, { atende: "S" }, { atende: "" }],
          sobrecarga: [{ est: "memória de cálculo", reg: "MC-02", v: "500" }],
          diam: [{ est: "P1", pos: "montante 1", v: "13,0" }, { est: "P1", pos: "montante 2", v: "12,5" }, { est: "P2", pos: "montante 3", v: "10,5" }, { est: "P3", pos: "montante 4", v: "12,0" }] };
      } },
    ],
  });
})();
