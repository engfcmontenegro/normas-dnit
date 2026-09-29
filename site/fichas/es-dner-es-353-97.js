/*
 * Ficha de aceitação — DNER-ES 353/97 Edificações — Esquadrias.
 *
 * Este arquivo também define FE.aceitacaoG10b (G), código comum às fichas das ES de edificações do DNER de 1997
 * (DNER-ES 353 a 360/97), carregado antes delas no index.html:
 *   G.sel(k, r, opcoes?, dica?)       parâmetro select (padrão Sim/Não) que recarrega as tabelas;
 *   G.se(k, v="sim")                 function (P) → P[k] === v (item "se aplica");
 *   G.alvo(valor, kTol, casas)       {min, max} = valor ∓ tolerância (parâmetro kTol, em cm; valor em m ou cm conforme "fator");
 *   G.todas(k, "todas as peças")      frequência "todas as peças/pontos" (quantidade no parâmetro k; vazio = 1);
 *   G.ficha(cfg)                     A.fichaSimples + "medicoes": tabelas de várias colunas por determinação
 *                                    (provas de pressão, vãos com flecha, valas...) conferidas coluna a coluna por
 *                                    checar(c, P) → {falta: "texto"} | {falhas: [{sit?, txt}]}; "apos" posiciona a
 *                                    linha/tabela depois do item de mesmo id;
 *   G.prova({...})                   medição pronta de prova de pressão/estanqueidade (pressão mínima, duração
 *                                    mínima, queda/vazamento);
 *   G.verif(F, {id: {...}}, P)       verificações de exemplo por id do item (omitidos = "S"; os que não se aplicam = vazio);
 *   G.dados(F, obj)                  dados de exemplo com os parâmetros padrão da ficha (obj.verif → verificacoes).
 * As ES de edificações não têm controle estatístico nem amostragem: a aceitação é o atendimento a cada exigência
 * (inspeção visual, medições e provas), e são rejeitados os trabalhos que não a satisfaçam (ex.: 6.3 da 353).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // =====================================================================================
  // G — biblioteca do grupo (DNER-ES 353 a 360/97)
  // =====================================================================================
  var G = {};
  G.SN = [["sim", "Sim"], ["nao", "Não"]];
  G.sel = function (k, r, opcoes, dica) {
    var p = { k: k, r: r, tipo: "select", recarrega: true, opcoes: opcoes || G.SN };
    if (dica) p.dica = dica;
    return p;
  };
  G.se = function (k, v) { v = v === undefined ? "sim" : v; return function (P) { return (P || {})[k] === v; }; };
  // valor nominal ± tolerância (parâmetro em cm); fator: cm → unidade do valor (0,01 para m; 1 para cm)
  G.alvo = function (valor, kTol, fator) {
    fator = fator === undefined ? 0.01 : fator;
    function tol(P) { var t = num((P || {})[kTol]); return ok(t) ? Math.abs(t) * fator : 0; }
    return { min: function (P) { return valor - tol(P); }, max: function (P) { return valor + tol(P); } };
  };
  // frequência "todas as peças": quantidade no parâmetro k (vazio = 1)
  G.todas = function (k, rotulo) {
    return { por: "contagem", a_cada: 1, qtd: function (P) { var q = num((P || {})[k]); return ok(q) && q > 0 ? Math.round(q) : 1; },
      regra: (rotulo || "todas as peças") + " (quantidade informada)" };
  };
  function vazio(x) { return x === undefined || x === null || String(x).trim() === ""; }
  function valorDe(v, P) { return typeof v === "function" ? v(P) : v; }

  // --- avaliação de uma medição de várias colunas
  function avaliarMedicao(m, ctx) {
    var P = ctx.P, d = ctx.d, ap = !m.se || m.se(P);
    var l = A.linha({ id: m.id, grupo: m.grupo || "", criterio: m.texto, secao: m.secao || "", metodo: m.metodo,
      exigido: valorDe(m.exigido, P) || "conforme a ES" });
    var fr = { ensaio: m.texto, metodo: m.metodo || "—", por: "lote", minimo: m.minimo || 1, regra: m.regra || "todos os trechos/peças (mín. " + (m.minimo || 1) + ")" };
    if (!ap) {
      l.situacao = "nao_exigido"; l.motivo = m.naoAplicaPor || "não se aplica";
      return { l: l, f: A.frequencia(Object.assign(fr, { aplica: false, realizado: 0 })) };
    }
    var cols = m.colunas.filter(function (c) { return !c.texto; });
    var cheias = (d[m.id] || []).map(function (c, i) { return { c: c, i: i }; })
      .filter(function (x) { return cols.some(function (col) { return !vazio(x.c[col.k]); }); });
    var nOk = 0;
    cheias.forEach(function (x) {
      var nome = (x.c.local && String(x.c.local).trim()) || "det. " + (x.i + 1);
      var r = m.checar(x.c, P) || {};
      if (r.falta) { A.marcar(l, "pendente", nome + ": " + r.falta); return; }
      var fal = r.falhas || [];
      fal.forEach(function (f) { A.marcar(l, f.sit || m.falha || "nao_conforme", nome + ": " + f.txt); });
      if (!fal.length) nOk++;
    });
    l.n = cheias.length;
    if (m.todas) (m.todas(cheias.map(function (x) { return x.c; }), P) || []).forEach(function (f) { A.marcar(l, f.sit || "nao_conforme", f.txt); });
    if (!l.n) { A.marcar(l, "sem_dados", "sem determinações"); l.resultado = "—"; }
    else l.resultado = nOk + " de " + l.n + " conforme(s)";
    if (l.situacao === "conforme") l.motivo = "todas as determinações atendem";
    return { l: l, f: A.frequencia(Object.assign(fr, { realizado: l.n })) };
  }
  function inserir(arr, obj, apos) {
    var i = -1;
    if (apos) arr.forEach(function (x, j) { if (x.id === apos || x.chave === apos) i = j; });
    if (i < 0) arr.push(obj); else arr.splice(i + 1, 0, obj);
  }
  G.ficha = function (cfg) {
    var med = cfg.medicoes || [], extraUser = cfg.extra;
    var c2 = Object.assign({}, cfg, {
      extra: function (ctx) {
        med.forEach(function (m) {
          var r = avaliarMedicao(m, ctx);
          inserir(ctx.linhas, r.l, m.apos);
          // frequência logo após a do item "apos" (as frequências da fichaSimples levam o texto do item em "ensaio")
          var ref = m.apos && ctx.item[m.apos], j = -1;
          if (ref) ctx.freqs.forEach(function (f, i) { if (f.ensaio === ref.criterio) j = i; });
          if (j < 0) ctx.freqs.push(r.f); else ctx.freqs.splice(j + 1, 0, r.f);
          ctx.item[m.id] = r.l;
        });
        if (extraUser) extraUser(ctx);
      },
    });
    delete c2.medicoes;
    var F = A.fichaSimples(c2);
    var tab0 = F.tabelas;
    F.tabelas = function (d) {
      var T = tab0(d), P = d.params || {};
      med.forEach(function (m) {
        if (m.se && !m.se(P)) return;
        inserir(T, { chave: m.id, titulo: m.texto + " (" + m.secao + ")", rotulo: m.rotulo || "Det.", iniciais: 1, min: 1,
          dica: (m.metodo ? m.metodo + "; " : "") + "exigido: " + (valorDe(m.exigido, P) || "conforme a ES"),
          linhas: [{ k: "local", r: m.rotuloLocal || "Trecho / local", texto: true }].concat(m.colunas) }, m.apos);
      });
      return T;
    };
    F.medicoes = med;
    return F;
  };

  // --- prova de pressão / estanqueidade: pressão ≥ (ou >) mínimo, duração ≥ mínimo, sem queda/vazamento
  // cfg: {id, texto, secao, unid ("m c.a." | "kgf/cm²"), pMin: n | fn(P), estrito, durMin, durUnid ("min" | "h"),
  //       colunas extras antes da pressão (ex.: pressão mínima no ponto mais alto), checarExtra(c, P, falhas)}
  G.prova = function (cfg) {
    var u = cfg.unid, du = cfg.durUnid || "min", cas = cfg.casas === undefined ? 1 : cfg.casas;
    function pMin(P) { return valorDe(cfg.pMin, P); }
    var cols = [{ k: "p", r: "Pressão de prova aplicada", u: u }].concat(cfg.colunas || []).concat([
      { k: "t", r: "Duração sob pressão", u: du },
      { k: "queda", r: cfg.rotuloQueda || "Queda de pressão observada", u: u },
      { k: "vaz", r: "Vazamento / falha? (S / N)", texto: true }]);
    return {
      id: cfg.id, texto: cfg.texto, secao: cfg.secao, grupo: cfg.grupo, se: cfg.se, apos: cfg.apos, metodo: cfg.metodo || "manômetro",
      minimo: cfg.minimo, regra: cfg.regra || "todos os trechos, antes do fechamento / da instalação dos aparelhos",
      exigido: function (P) {
        var p = pMin(P);
        return (ok(p) ? "pressão " + (cfg.estrito ? "> " : "≥ ") + fmt(p, cas) + " " + u + " · " : "") + "duração ≥ " + fmt(cfg.durMin, 0) + " " + du +
          (cfg.semQueda === false ? "" : " · sem queda de pressão") + " · sem vazamento" + (cfg.exigidoExtra ? " · " + cfg.exigidoExtra : "");
      },
      colunas: cols,
      checar: function (c, P) {
        var p = num(c.p), t = num(c.t), q = num(c.queda), vz = String(c.vaz || "").trim().toLowerCase(), pm = pMin(P), f = [];
        if (!ok(p) || !ok(t)) return { falta: "informe a pressão aplicada e a duração" };
        if (ok(pm) && (cfg.estrito ? p <= pm + 1e-9 : p < pm - 1e-9))
          f.push({ txt: "pressão " + fmt(p, cas) + " " + u + (cfg.estrito ? " ≤ " : " < ") + fmt(pm, cas) + " " + u });
        if (t < cfg.durMin - 1e-9) f.push({ txt: "duração " + fmt(t, du === "h" ? 1 : 0) + " " + du + " < " + fmt(cfg.durMin, 0) + " " + du });
        if (cfg.semQueda !== false && ok(q) && q > 1e-9) f.push({ txt: "queda de pressão de " + fmt(q, cas + 1) + " " + u });
        if (/^(s|sim|x|1)$/.test(vz)) f.push({ txt: "vazamento / falha observada" });
        if (cfg.checarExtra) cfg.checarExtra(c, P, f);
        return { falhas: f };
      },
    };
  };
  // verificações de exemplo na ordem dos itens sim_nao: {id: {atende, real, nc, obs}}; itens omitidos = {atende: "S"}
  // (itens que não se aplicam com os parâmetros P ficam vazios)
  G.verif = function (F, mapa, P) {
    mapa = mapa || {};
    return F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; })
      .map(function (it) { return Object.assign({}, mapa[it.id] || (P && it.se && !it.se(P) ? {} : { atende: "S" })); });
  };
  // obj.verif = {id: {...}} → obj.verificacoes (G.verif)
  G.dados = function (F, obj) {
    obj.params = Object.assign({}, F.padrao, obj.params || {});
    if (obj.verif) { obj.verificacoes = G.verif(F, obj.verif, obj.params); delete obj.verif; }
    return obj;
  };
  // texto comum das providências (ex.: 6.3.3 da 353)
  G.providencias = function (sec) {
    return function (par) {
      return par.parecer === "REJEITADO" ? ["O executante deve demolir/substituir e refazer, por sua conta, os trabalhos impugnados, logo após a Ordem de Serviço (" + sec + ")."] : [];
    };
  };
  FE.aceitacaoG10b = G;

  // =====================================================================================
  // DNER-ES 353/97 — Esquadrias
  // =====================================================================================
  var madeira = function (P) { return P.material === "madeira" || P.material === "ambos"; };
  var aluminio = function (P) { return P.material === "aluminio" || P.material === "ambos"; };
  // 5.2.3.6: espessura mínima do filme de anodização (µm)
  function anodMin(P) {
    var forte = P.atmosfera !== "leve", cor = P.anodCor === "colorida";
    return forte ? (cor ? 25 : 20) : (cor ? 20 : 12);
  }
  var F353 = G.ficha({
    id: "dner-es-353-97",
    titulo: "Esquadrias (DNER-ES 353/97) — aceitação do serviço",
    resumo: "Inspeção das esquadrias de madeira e de alumínio (seções 4, 5 e 6): execução conforme o projeto, marcos, núcleos, " +
      "serralharias, espessura dos perfis (≥ 1,6 mm), anodização (5.2.3.6 e tolerância de 10 % do 6.2.5), peças sem defeitos (6.2.1), " +
      "prova de estanqueidade dos vãos expostos (6.2.2/6.2.3) e flecha < 1:250 (6.2.4).",
    lote: false,
    params: [
      { k: "qtd", r: "Área de esquadrias do lote (m²)", dica: "medição em m² (seção 7)" },
      { k: "nPecas", r: "Nº de peças (esquadrias) do lote", dica: "6.2.1: todas as peças são inspecionadas" },
      { k: "nVaos", r: "Nº de vãos envidraçados expostos às intempéries", dica: "6.2.2: todos passam pela prova de estanqueidade" },
      G.sel("material", "Material das esquadrias", [["ambos", "Madeira e alumínio"], ["madeira", "Madeira"], ["aluminio", "Alumínio"]]),
      G.sel("atmosfera", "Agressividade da atmosfera (5.2.3.6)", [["forte", "Forte (umidade, poluição, cloretos — orla)"], ["leve", "Leve ou nula"]]),
      G.sel("anodCor", "Anodização", [["natural", "Cor natural"], ["colorida", "Colorida"]]),
    ],
    padrao: { material: "ambos", atmosfera: "forte", anodCor: "natural" },
    refs: { regra: "6.3" },
    providencias: G.providencias("6.3.3"),
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto e desenhos; esquadrias com todos os acessórios", secao: "4.1/4.2", tipo: "sim_nao",
        exigido: "conforme o projeto, com acessórios completos" },
      { id: "material", grupo: "Condições gerais", texto: "Materiais conforme os catálogos dos fabricantes", secao: "6.1", tipo: "sim_nao", exigido: "exigências dos catálogos" },
      { id: "marcos", grupo: "Esquadrias de madeira", texto: "Marcos fixados aos tacos com parafusos; juntas marco–alvenaria calafetadas (plasticidade permanente)", secao: "5.2.1",
        tipo: "sim_nao", se: madeira, exigido: "parafusos EC latão 6 × 2 1/4\"; calafetação das juntas" },
      { id: "nucleo", grupo: "Esquadrias de madeira", texto: "Núcleo das portas compatível com o local (à prova d'água onde sujeito a molhaduras)", secao: "5.2.2",
        tipo: "sim_nao", se: madeira, exigido: "tipos 5.2.2.1 a 5.2.2.3 só em locais secos; 5.2.2.4 nos molhados" },
      { id: "serralh", grupo: "Esquadrias de alumínio", texto: "Serralharias não forçadas em rasgos, no esquadro e em vãos de dimensões adequadas", secao: "5.2.3.1",
        tipo: "sim_nao", se: aluminio, exigido: "sem peças forçadas ou fora do esquadro" },
      { id: "pingad", grupo: "Esquadrias de alumínio", texto: "Partes móveis com pingadeiras (horizontal e vertical); sem caixilho de \"rebaixo aberto\"", secao: "5.2.3.2",
        tipo: "sim_nao", se: aluminio, exigido: "pingadeiras; rebaixo aberto não aceito" },
      { id: "cobre", grupo: "Esquadrias de alumínio", texto: "Sem contato direto de cobre, metais pesados ou suas ligas com o alumínio", secao: "5.2.3.4",
        tipo: "sim_nao", se: aluminio, exigido: "contato rigorosamente proibido" },
      { id: "ligac", grupo: "Esquadrias de alumínio", texto: "Ligações por encaixe ou auto-rebitagem (parafusos só se inevitáveis; alumínio–aço com parafuso de aço cadmiado cromado)",
        secao: "5.2.3.5", tipo: "sim_nao", se: aluminio, exigido: "encaixe / auto-rebitagem" },
      { id: "silic", grupo: "Esquadrias de alumínio", texto: "Superfícies anodizadas com proteção à base de silicone", secao: "5.2.3.7", tipo: "sim_nao", se: aluminio,
        exigido: "proteção de silicone aplicada" },
      { id: "perfil", grupo: "Esquadrias de alumínio", texto: "Espessura dos perfis estruturais e contramarcos", secao: "5.2.3.3", tipo: "valor", unid: "mm", casas: 2,
        min: 1.6, se: aluminio, metodo: "paquímetro / micrômetro", exigido: "≥ 1,60 mm (e compatível com o vão)" },
      { id: "anod", grupo: "Esquadrias de alumínio", texto: "Espessura da camada de anodização (valor individual)", secao: "5.2.3.6/6.2.5", tipo: "valor", unid: "µm", casas: 1,
        min: function (P) { return 0.9 * anodMin(P); }, se: aluminio, metodo: "medidor de camada (correntes parasitas)", freq: { por: "lote", minimo: 3, regra: "mín. 3 por lote (adotado)" } },
      { id: "vidros", grupo: "Assentamento de vidros", texto: "Vidros assentados com baguetes + calafetador elastomérico ou gaxetas de compressão", secao: "5.3",
        tipo: "sim_nao", exigido: "baguete + calafetador (silicone) ou gaxeta (neoprene) com tira de enchimento" },
      { id: "defeitos", grupo: "Verificação final", texto: "Peças sem empenamento, deslocamento, rachaduras, lascas, desigualdades de madeira ou outros defeitos visíveis",
        secao: "6.2.1", tipo: "sim_nao", exigido: "todas as peças sem defeitos (as defeituosas são recusadas)", freq: G.todas("nPecas", "todas as peças") },
      { id: "estanq", grupo: "Verificação final", texto: "Prova de estanqueidade por jato d'água (sem vazamento — critério AAMA do 6.2.3)", secao: "6.2.2/6.2.3",
        tipo: "sim_nao", exigido: "nenhum vazamento em 15 min", freq: G.todas("nVaos", "todos os vãos expostos") },
    ],
    medicoes: [
      { id: "flecha", grupo: "Verificação final", texto: "Flecha das peças estruturais dos caixilhos sob as cargas da NBR 6123", secao: "6.2.4",
        metodo: "ensaio de carga / cálculo", exigido: "f < L/250",
        colunas: [{ k: "vao", r: "Comprimento da peça L", u: "mm" }, { k: "f", r: "Flecha medida f", u: "mm" }],
        checar: function (c) {
          var L = num(c.vao), f = num(c.f);
          if (!ok(L) || !ok(f)) return { falta: "informe L e f" };
          return { falhas: f >= L / 250 - 1e-9 ? [{ txt: "f = " + fmt(f, 1) + " mm ≥ L/250 = " + fmt(L / 250, 1) + " mm" }] : [] };
        } },
    ],
    extra: function (ctx) {
      // 5.2.3.6: a média das leituras atinge a espessura mínima; 6.2.5: leituras individuais até 10 % abaixo
      var la = ctx.item.anod;
      if (!la || la.situacao === "nao_exigido") return;
      var mn = anodMin(ctx.P);
      la.exigido = "individual ≥ " + fmt(0.9 * mn, 1) + " µm (mín. − 10 %)";
      var l = A.linha({ id: "anodMed", grupo: la.grupo, criterio: "Espessura média da camada de anodização", secao: "5.2.3.6", unid: "µm", casas: 1,
        exigido: "≥ " + fmt(mn, 0) + " µm (" + (ctx.P.atmosfera === "leve" ? "atmosfera leve" : "atmosfera agressiva") + ", " + (ctx.P.anodCor === "colorida" ? "colorida" : "cor natural") + ")", n: la.n });
      if (!la.n) { A.marcar(l, "sem_dados", "sem leituras"); }
      else {
        l.media = la.media; l.resultado = "média " + fmt(la.media, 1) + " µm (n = " + la.n + ")";
        if (la.media < mn - 1e-9) A.marcar(l, "nao_conforme", "média " + fmt(la.media, 1) + " µm < " + fmt(mn, 0) + " µm");
        else l.motivo = "média atende";
      }
      ctx.linhas.splice(ctx.linhas.indexOf(la) + 1, 0, l);
    },
    notas: "DNER-ES 353/97: esquadrias aceitas quando atendem a todas as exigências da ES (6.3.1); trabalhos em desacordo são rejeitados e refeitos (6.3.2/6.3.3). " +
      "Anodização: espessura mínima de 20 µm (natural) / 25 µm (colorida) em atmosfera agressiva e 12 / 20 µm em atmosfera leve (5.2.3.6); a variação de 10 % do 6.2.5 foi " +
      "aplicada às leituras individuais (≥ 90 % do mínimo), exigindo-se a média ≥ mínimo. A ES não fixa o número de leituras de anodização: adotadas no mínimo 3 por lote.",
    exemplos: [],
  });

  F353.exemplos = [
    { nome: "Lote aceito — 12 esquadrias de alumínio e madeira (Obra A)", dados: function () {
      return G.dados(F353, { ident: { registro: "ESQ-01", data: "2026-08-20", obra: "Obra A — edifício administrativo", local: "Bloco 1 — pavimento térreo",
          camada: "Esquadrias de alumínio anodizado (natural) e portas de madeira" },
        params: { qtd: "38,4", nPecas: "12", nVaos: "6", material: "ambos", atmosfera: "forte", anodCor: "natural" },
        verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S", real: "6" }, { atende: "S", real: "6" }, { atende: "S", real: "6" }, { atende: "S", real: "6" },
          { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "12", nc: "0" }, { real: "6", nc: "0", obs: "jato de mangueira, 15 min por vão" }],
        perfil: [{ est: "J1", pos: "montante", v: "1,72" }, { est: "J3", pos: "travessa", v: "1,65" }, { est: "J5", pos: "contramarco", v: "1,80" }],
        anod: [{ est: "J1", v: "21,5" }, { est: "J2", v: "19,2" }, { est: "J4", v: "22,0" }, { est: "J6", v: "20,4" }],
        flecha: [{ local: "J1 — montante central", vao: "1500", f: "4,1" }, { local: "J5 — travessa", vao: "2000", f: "6,3" }] });
    } },
    { nome: "Lote rejeitado — anodização fina, porta empenada e vazamento (Obra B)", dados: function () {
      return G.dados(F353, { ident: { registro: "ESQ-02", data: "2026-09-02", obra: "Obra B — posto de pesagem", local: "Fachada norte",
          camada: "Janelas de alumínio anodizado colorido" },
        params: { qtd: "22,0", nPecas: "8", nVaos: "5", material: "aluminio", atmosfera: "forte", anodCor: "colorida" },
        verificacoes: [{ atende: "S" }, { atende: "S" }, {}, {}, { atende: "S", real: "8" }, { atende: "S", real: "8" }, { atende: "S" }, { atende: "S" }, { atende: "S" },
          { atende: "S" }, { real: "8", nc: "1", obs: "J7 com folha empenada" }, { real: "4", nc: "1", obs: "vazamento no peitoril da J2" }],
        perfil: [{ est: "J2", pos: "montante", v: "1,62" }, { est: "J7", pos: "contramarco", v: "1,66" }],
        anod: [{ est: "J1", v: "24,0" }, { est: "J2", v: "21,8" }, { est: "J7", v: "23,5" }],
        flecha: [{ local: "J2 — travessa", vao: "1800", f: "6,8" }] });
    } },
  ];
})();
