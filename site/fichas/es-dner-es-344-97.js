/*
 * Ficha de ES: DNER-ES 344/97 — Edificações — Serviços preliminares (aceitação por inspeção, seção 7).
 *
 * Este arquivo também define FE.aceitacaoG10a, código comum às fichas das ES de EDIFICAÇÕES do DNER (344 a 352/97),
 * carregado antes delas (ordem das tags no index.html). Usa a biblioteca FE.aceitacao (site/fichas/es-comum.js).
 *
 *   var G = FE.aceitacaoG10a;
 *   G.sn(id, secao, texto, exigido, extra)                     item "sim_nao" (inspeção)
 *   G.v(id, secao, texto, unid, casas, min, max, extra)        item "valor" (medida com limite; min/max podem ser function (P))
 *   G.ficha(cfg)                                               A.fichaSimples com os padrões das ES de edificações
 *   G.verif(fid, mapa, P)                                      d.verificacoes de um exemplo a partir de {id: "S" | "N" | {..} | null}
 *   G.fc(extra), G.abat(extra), G.fckEst(ctx, cfg)             resistência do concreto (import. DNER-ME 091) e abatimento (DNER-ME 404)
 *   G.tabelaExtra(F, tab, ...)                                 acrescenta uma tabela própria à ficha gerada
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // =====================================================================================
  // código comum às ES de edificações (DNER-ES 344 a 352/97)
  // =====================================================================================
  function copia(o, extra) { Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; }); return o; }
  function sn(id, secao, texto, exigido, extra) {
    return copia({ id: id, secao: secao, texto: texto, tipo: "sim_nao", exigido: exigido }, extra);
  }
  function v(id, secao, texto, unid, casas, min, max, extra) {
    return copia({ id: id, secao: secao, texto: texto, tipo: "valor", unid: unid, casas: casas, min: min, max: max }, extra);
  }
  function selecionado(k, vals) { return function (P) { return vals.indexOf((P || {})[k]) >= 0; }; }
  function sim(k) { return function (P) { return /^s/i.test(String((P || {})[k] || "")); }; }
  function nao(k) { return function (P) { return !/^s/i.test(String((P || {})[k] || "")); }; }
  var SN = [["N", "Não"], ["S", "Sim"]];

  // cfg: { id, es ("DNER-ES 344/97"), titulo, resumo, secAceit ("7.2"), secRejeita ("7.2.2"), secRefazer ("7.2.3"),
  //        notas, criterios, params, padrao, extra, exemplos, area (true = parâmetro de área), semAceitacao (ES sem seção de aceitação) }
  function ficha(cfg) {
    var params = [{ k: "servico", r: "Serviço / elemento inspecionado", ph: "ex.: bloco A — pavimento térreo" }];
    if (cfg.area) params.push({ k: "area", r: cfg.rotArea || "Área do serviço no lote (m²)", dica: "informativo (unidade de medição da ES)" });
    params = params.concat(cfg.params || []);
    var rej = cfg.secRejeita || cfg.secAceit, ref = cfg.secRefazer || cfg.secAceit;
    var notas = "Critérios da " + cfg.es + (cfg.semAceitacao ? " (a ES não tem seção de aceitação e rejeição: a ficha aplica a condição geral 4 — execução rigorosa conforme o projeto — e a verificação final da qualidade da seção " + cfg.secAceit + ")" :
      ", seção " + cfg.secAceit + ": a aceitação fica condicionada ao atendimento de todas as exigências da especificação e são rejeitados os trabalhos que não as satisfaçam (" + rej + ")") +
      ". A ES não fixa frequência de inspeção: a ficha exige ao menos uma verificação de cada item aplicável no lote (serviço, elemento ou ambiente inspecionado); itens que não se aplicam ao tipo de serviço escolhido ficam \"não exigido\". " +
      "Itens medidos: cada valor individual deve atender ao limite da ES (não há controle estatístico nestas especificações)." + (cfg.notas ? " " + cfg.notas : "");
    var F = A.fichaSimples({
      id: cfg.id, titulo: cfg.titulo, resumo: cfg.resumo, lote: false, params: params, padrao: cfg.padrao || {},
      criterios: cfg.criterios, estilo: "resultado", registrar: false,
      // a coluna "Estaca / local" guarda o local (sala, pilar, estaca de fundação E1...): nos motivos, sem o prefixo "est."
      extra: function (ctx) {
        if (cfg.extra) cfg.extra(ctx);
        ctx.linhas.forEach(function (l) {
          if (l.motivo) l.motivo = l.motivo.replace(/\(est\. /g, "(");
          (l.motivos || []).forEach(function (m) { m.texto = m.texto.replace(/\(est\. /g, "("); });
        });
      },
      refs: { reprova: rej, atende: cfg.secAceit, corrige: ref, regra: cfg.secAceit },
      textos: {
        REJEITADO: { titulo: "SERVIÇO REJEITADO", texto: "Há exigência da especificação não atendida: " + (cfg.semAceitacao ? "o serviço deve ser corrigido até atender ao projeto e à " + cfg.es + "." :
          "os trabalhos impugnados devem ser demolidos e refeitos por conta da executante (" + ref + ") e só são aceitos quando atenderem à " + cfg.es + ".") },
        ACEITO: { titulo: "SERVIÇO ACEITO", texto: "Todas as exigências verificadas da " + cfg.es + " foram atendidas." },
        RESSALVA: { titulo: "SERVIÇO ACEITO COM RESSALVA", texto: "Nenhuma exigência reprovada, mas há pontos a corrigir ou a documentar (ressalvas abaixo)." },
        PENDENTE: { titulo: "SERVIÇO PENDENTE — INSPEÇÃO INCOMPLETA", texto: "Nenhuma exigência reprovada, mas faltam verificações ou medidas: complete a inspeção antes de aceitar o serviço." },
      },
      notas: notas, exemplos: cfg.exemplos || [],
    });
    // gráficos por determinação (o local não é estaca de 20 m, mesmo quando contém número)
    F.graficos = function (calc, d, opt) {
      var out = calc.resultados.linhas.filter(function (l) { return l.est && l.n; }).map(function (l) {
        var l2 = copia({}, l);
        l2.est = copia({}, l.est);
        l2.est.vals = l.est.vals.map(function (p, i) { return { v: p.v, rot: p.est || p.rot || "det. " + (i + 1) }; });
        return A.graficoLinha(l2, opt);
      }).filter(Boolean);
      return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com os valores medidos.</div>'];
    };
    if (cfg.tabelaExtra) tabelaExtra(F, cfg.tabelaExtra);
    FE.FICHAS[cfg.id] = F;
    return F;
  }
  // tabela própria (além das geradas): tab = {chave, titulo, rotulo, linhas, iniciais, min, dica, se: function (P)}
  function tabelaExtra(F, tab) {
    var orig = F.tabelas;
    F.tabelas = function (d) {
      var T = orig(d);
      if (!tab.se || tab.se(d.params || {})) T.push({ chave: tab.chave, titulo: tab.titulo, rotulo: tab.rotulo || "Det.", linhas: tab.linhas,
        iniciais: tab.iniciais || 1, min: tab.min || 1, dica: tab.dica });
      return T;
    };
  }
  // verificações de um exemplo: mapa {id: "S" | "N" | {atende, real, nc, obs} | null}; itens ausentes recebem "S";
  // itens que não se aplicam com os parâmetros P ficam vazios
  function verif(fid, mapa, P) {
    var F = FE.FICHAS[fid];
    return F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).map(function (it) {
      if (P && it.se && !it.se(P)) return {};
      var x = mapa && mapa[it.id] !== undefined ? mapa[it.id] : "S";
      if (x === null) return {};
      return typeof x === "string" ? { atende: x } : x;
    });
  }

  // ---------- concreto: resistência (exemplares, DNER-ME 091) e abatimento (DNER-ME 404) ----------
  // idade de controle 28 d; do ensaio importado entram os resultados dessa idade (exemplares ou CPs)
  function fc(extra) {
    return v("fc", extra.secao, "Resistência à compressão aos 28 dias (exemplares)", "MPa", 1, undefined, undefined, copia({
      exigido: "fck,est ≥ fck de projeto", metodo: "DNER-ME 091",
      importar: { de: "dner-me-091-98", valores: function (e) {
        var r = e.resultados || {};
        return (r.lista || []).filter(function (x) { return ok(x.fc) && (!ok(x.idade) || Math.abs(x.idade - 28) < 0.5); }).map(function (x) {
          return { v: x.fc, rot: (x.nome || "") + (r.exemplar && x.n >= 2 ? "" : " (1 CP)") };
        });
      } },
    }, extra));
  }
  function abat(extra) {
    return v("abat", extra.secao, "Abatimento do tronco de cone (slump)", "mm", 0,
      function (P) { var e = num(P.slump), t = num(P.slumpTol); return ok(e) ? e - (ok(t) ? t : 0) : undefined; },
      function (P) { var e = num(P.slump), t = num(P.slumpTol); return ok(e) ? e + (ok(t) ? t : 0) : undefined; },
      copia({ metodo: "DNER-ME 404", importar: { de: "dner-me-404-00", valores: function (e) {
        return ((e.resultados || {}).ens || []).filter(function (x) { return (ok(x.abr) || ok(x.abat)) && !x.anom; }).map(function (x) { return { v: ok(x.abr) ? x.abr : x.abat, rot: x.nome }; });
      } } }, extra));
  }
  var PARAMS_CONCRETO = [
    { k: "fck", r: "fck de projeto (MPa)" },
    { k: "psi6", r: "ψ6 da NBR 6118/80, 15.1.1 (opcional)", dica: "coeficiente da tabela da NBR 6118/80 para o nº de exemplares; só é usado quando o estimador 2·(f1+…+fm−1)/(m−1) − fm fica abaixo do fck" },
    { k: "slump", r: "Abatimento de projeto (mm)" },
    { k: "slumpTol", r: "Tolerância do abatimento (± mm)" },
  ];
  // fck estimado (NBR 6118/80, 15.1.1): exemplares em ordem crescente, m = n/2 (desprezado o maior se n ímpar),
  // fck,est = 2·(f1 + … + fm−1)/(m − 1) − fm; limite inferior ψ6·f1 (ψ6 informado pelo usuário).
  function fckEst(ctx, cfg) {
    var l = ctx.item.fc, P = ctx.P, fck = num(P.fck), psi = num(P.psi6);
    if (!l || l.situacao === "nao_exigido") return;
    var vals = (ctx.d.fc || []).map(function (c) { return num(c.v); }).filter(ok).sort(function (a, b) { return a - b; });
    var umCP = (ctx.d.fc || []).filter(function (c) { return /\(1 CP\)/.test(c.reg || ""); }).length;
    if (umCP) ctx.avisos.push("Resistência: " + umCP + " resultado(s) de CP isolado — a " + cfg.es + " (" + cfg.secExemplar + ") pede exemplares de dois corpos de prova (vale o maior dos dois).");
    if (!vals.length) return;
    if (!ok(fck)) { A.marcar(l, "pendente", "informe o fck de projeto"); return; }
    var n = vals.length;
    if (n < 6) {
      l.resultado = n + " exemplar(es): " + fmt(vals[0], 1) + " a " + fmt(vals[n - 1], 1) + " MPa";
      A.marcar(l, "pendente", "n = " + n + " < 6 exemplares: o estimador do 15.1.1 da NBR 6118/80 não se aplica — complete a amostragem (" + cfg.secFreq + ") ou avalie pela NBR 6118/80");
      return;
    }
    var m = Math.floor(n / 2), soma = 0;
    for (var i = 0; i < m - 1; i++) soma += vals[i];
    var est = 2 * soma / (m - 1) - vals[m - 1], est2 = ok(psi) ? Math.max(est, psi * vals[0]) : est;
    l.fckEst = est2;
    l.resultado = "n = " + n + " · f1 = " + fmt(vals[0], 1) + " · fck,est = " + fmt(est2, 1) + " MPa" + (ok(psi) && est2 > est ? " (ψ6·f1)" : "");
    l.exigido = "fck,est ≥ " + fmt(fck, 1) + " MPa";
    if (est2 >= fck - 1e-9) { l.situacao = "conforme"; l.motivo = "fck,est = " + fmt(est2, 1) + " ≥ fck = " + fmt(fck, 1) + " MPa (NBR 6118/80, 15.1.1)"; l.motivos = []; }
    else if (!ok(psi)) A.marcar(l, "pendente", "2·(f1+…+fm−1)/(m−1) − fm = " + fmt(est, 1) + " < fck: informe ψ6 (NBR 6118/80, 15.1.1) para concluir");
    else A.marcar(l, "nao_conforme", "fck,est = " + fmt(est2, 1) + " < fck = " + fmt(fck, 1) + " MPa (" + cfg.secControle + "; NBR 6118/80, 15.1.1)");
  }

  FE.aceitacaoG10a = { sn: sn, v: v, ficha: ficha, verif: verif, tabelaExtra: tabelaExtra, selecionado: selecionado, sim: sim, nao: nao, SN: SN,
    fc: fc, abat: abat, fckEst: fckEst, PARAMS_CONCRETO: PARAMS_CONCRETO, copia: copia };

  // =====================================================================================
  // DNER-ES 344/97 — Serviços preliminares
  // =====================================================================================
  var ID = "dner-es-344-97";
  var tipoI = function (P) { return P.tapume === "I"; }, tipoII = function (P) { return P.tapume === "II"; };
  ficha({
    id: ID, es: "DNER-ES 344/97", secAceit: "7.2", secRejeita: "7.2.2", secRefazer: "7.2.3", area: true,
    titulo: "Edificações — serviços preliminares — aceitação",
    resumo: "Inspeção visual (7.1) da preparação da área: caracterização do subsolo, projetos, instalações provisórias, tapumes, barracão, demolições e limpeza do terreno, manejo ambiental do canteiro; parecer pela 7.2.",
    params: [
      { k: "tapume", r: "Tapume executado (5.3.3)", tipo: "select", recarrega: true,
        opcoes: [["I", "Tipo I — chapas de madeira prensada"], ["II", "Tipo II — tábuas de pinho"], ["nao", "Sem tapume no lote"]] },
      { k: "alturaProj", r: "Altura do tapume Tipo II especificada (m)", ph: "2,50", se: function (d) { return (d.params || {}).tapume === "II"; },
        dica: "vazio = 2,50 m (quando não especificado de modo diverso, 5.3.3 b)" },
      { k: "desmob", r: "Canteiro já desmobilizado?", tipo: "select", recarrega: true, opcoes: SN },
    ],
    padrao: { tapume: "I", desmob: "N" },
    criterios: [
      sn("subsolo", "5.1", "Caracterização do subsolo (sondagens/ensaios)", "resultados fornecidos e complementados quando necessário; NBR 8036 e NBR 6122"),
      sn("projetos", "5.2", "Projetos e desenhos de detalhe", "execução conforme o projeto; detalhes da executante examinados/autenticados pelo DNER"),
      sn("provis", "5.3.1", "Instalações provisórias", "tapumes, barracão, escritório, sanitários, redes de água e energia e demais necessárias"),
      sn("ferram", "5.3.2", "Ferramental, maquinaria e aparelhamento", "adequados à execução dos serviços"),
      sn("tapI", "5.3.3 a", "Tapume Tipo I — materiais", "chapas de madeira prensada; montantes intermediários e travessas 7,5 × 7,5 cm em pinho", { se: tipoI }),
      sn("tapPint", "5.3.3 a", "Pintura protetora do tapume (inclusive rodapés e chapins)", "todo o tapume pintado", { se: tipoI }),
      sn("tapII", "5.3.3 b", "Tapume Tipo II — materiais e caimento", "tábuas de pinho; montantes em pinho 75 × 75 mm; acompanha o caimento natural do terreno", { se: tipoII }),
      sn("barracao", "5.3.4", "Barracão/escritório para a supervisão", "banheiro com vaso, lavatório e chuveiro; claro e arejado; área compatível; mesa e escaninhos para plantas"),
      sn("demol", "5.4.1", "Demolições e limpeza sem danos a terceiros", "executadas com a devida técnica e cuidados"),
      sn("limpeza", "5.4.2", "Limpeza do terreno", "área livre de raízes, tocos, pedras e outros resíduos (capina, roçado, destocamento, remoção)"),
      sn("entulho", "5.4.3", "Remoção periódica de entulho e detritos", "sem acúmulo de entulho no terreno"),
      sn("arvores", "6.1", "Corte de árvores", "conforme a legislação ambiental vigente"),
      sn("agua", "6.2", "Água potável e esgoto do canteiro", "água potável disponível; fossas sépticas a distância segura de poços e talvegues"),
      sn("efluentes", "6.3", "Efluentes das oficinas (graxas e óleos)", "controlados por dispositivos de filtragem e contenção"),
      sn("empoc", "6.4", "Represamento e empoçamento de água", "sem áreas insalubres (vetores)"),
      sn("solo", "6.5", "Solo vegetal removido", "estocado em local não sujeito à erosão, para reincorporação"),
      sn("recup", "6.6", "Recuperação da área na desmobilização", "área das instalações recuperada", { se: sim("desmob"), naoAplicaPor: "canteiro ainda não desmobilizado" }),
      v("chapa", "5.3.3 a", "Espessura das chapas de madeira prensada", "mm", 1, 6, undefined, { se: tipoI, falha: "ressalva", exigido: "6 mm" }),
      v("montante", "5.3.3 a", "Seção dos montantes principais (menor lado)", "cm", 1, 16, undefined, { se: tipoI, exigido: "16 × 16 cm" }),
      v("espac", "5.3.3 a", "Espaçamento dos montantes principais (eixo a eixo)", "m", 2, undefined, 2.20, { se: tipoI, exigido: "2,20 m" }),
      v("altura", "5.3.3 b", "Altura do tapume Tipo II", "m", 2, function (P) { var h = num(P.alturaProj); return ok(h) ? h : 2.5; }, undefined,
        { se: tipoII, exigido: "2,50 m ou a especificada" }),
    ],
    notas: "Seção 7.1: o controle de qualidade é visual. As dimensões nominais dos tapumes (5.3.3) foram tomadas como limites: chapa ≥ 6 mm (falta = ressalva), montantes ≥ 16 cm, espaçamento ≤ 2,20 m, altura do Tipo II ≥ 2,50 m (ou a especificada).",
    exemplos: [
      { nome: "Canteiro com tapume Tipo I — aceito", dados: function () {
        var P = { servico: "Canteiro e limpeza do terreno", area: "1200", tapume: "I", desmob: "N" };
        return { ident: { registro: "ED-PRE-01", obra: "Obra A", local: "Canteiro — terreno da edificação", data: "2026-03-10" },
          params: P, verificacoes: verif(ID, {}, P),
          chapa: [{ est: "Frente", v: "6,0" }, { est: "Lateral", v: "6,0" }],
          montante: [{ est: "Frente", v: "16" }, { est: "Lateral", v: "16" }],
          espac: [{ est: "Frente", pos: "vão 1", v: "2,20" }, { est: "Frente", pos: "vão 5", v: "2,18" }, { est: "Lateral", pos: "vão 3", v: "2,15" }] };
      } },
      { nome: "Tapume Tipo II baixo e entulho acumulado — rejeitado", dados: function () {
        var P = { servico: "Canteiro", area: "800", tapume: "II", desmob: "N" };
        return { ident: { registro: "ED-PRE-02", obra: "Obra B", local: "Canteiro — lote 2", data: "2026-04-02" },
          params: P, verificacoes: verif(ID, { entulho: { atende: "N", real: "3", nc: "1", obs: "entulho acumulado junto à divisa" }, efluentes: null }, P),
          altura: [{ est: "Frente", v: "2,50" }, { est: "Fundos", v: "2,20" }] };
      } },
    ],
  });
})();
