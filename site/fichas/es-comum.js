/*
 * FE.aceitacao — BIBLIOTECA COMUM DAS FICHAS DE ES (aceitação de lote / segmento)
 * =================================================================================
 * Carregada depois de fichas.js e antes das fichas de ES (site/fichas/es-*.js). Não registra ficha nenhuma:
 * só expõe window.FE.aceitacao (abreviado aqui como A). Leia também o GUIA_FICHAS_ES.md.
 *
 *   var FE = window.FE, A = FE.aceitacao;
 *
 * ---------------------------------------------------------------------------------
 * 1. MODELO: LINHA DE CRITÉRIO, SITUAÇÕES E PARECER
 * ---------------------------------------------------------------------------------
 * Linha de critério (uma por requisito da ES; é o que as tabelas, o parecer e o relatório consomem):
 *   { id, grupo, criterio, secao, unid, casas, n, media, s, k, inf, sup, lim: {min, max, minEstrito},
 *     exigido (texto), resultado (texto curto), situacao, motivo (texto), motivos: [{situacao, texto}],
 *     pontos, fora, regra, est (objeto de A.estatistica), exig/real (frequência embutida, opcional) }
 *   situacao: "conforme" | "ressalva" | "nao_conforme" | "pendente"
 *             e ainda "sem_dados" (= pendente por falta de determinações), "nao_exigido", "informativo".
 *   A.linha({...})                     linha com os padrões (situacao "conforme", motivos [] ...).
 *   A.marcar(l, situacao, texto)       piora a situação da linha (nunca melhora) e acrescenta o motivo.
 *   A.pior(a, b)                       situação mais grave (nao_conforme > pendente/sem_dados > ressalva > conforme).
 *   A.avaliar(cfg) -> linha            avaliação de um requisito numérico (ver 3).
 *   A.aplicarFrequencia(l, exig, real, unid)   frequência embutida na linha: 0 realizada → pendente;
 *                                              abaixo do mínimo → ressalva (estilo da DNIT 385).
 * Frequência (tabela "exigido × realizado", separada dos critérios — estilo da DNIT 141):
 *   A.frequencia({ ensaio, metodo, regra?, exigido?, realizado, aplica?,
 *                  por: "extensao"|"area"|"volume"|"tempo"|"contagem"|"lote", a_cada, qtd, minimo, unidade, pontos })
 *     -> { ensaio, metodo, regra, exigido, realizado, situacao: "atende"|"insuficiente"|"sem_dados"|"nao_exigido" }
 *     Com "por" + "a_cada" + "qtd" o exigido e o texto da regra saem sozinhos ("1 a cada 100 m; mín. 5").
 *   A.nMin(qtd, passo, minimo=1)    = máx(minimo, ⌈qtd/passo⌉)        (1 a cada 100 m, 1 a cada 4 h ...)
 *   A.nPontos(ext, passo, minimo=1) = máx(minimo, ⌊ext/passo⌋ + 1)    (seções a cada 20 m, incluindo as pontas)
 * Parecer do lote:
 *   A.parecer(linhas, freqs, {textos, providencias, nota}) -> { parecer: "ACEITO"|"RESSALVA"|"PENDENTE"|"REJEITADO",
 *     titulo, texto, itens: [[tipo, texto]], nc, pend, falta, res, prov, nota }
 *     REJEITADO: alguma linha nao_conforme · PENDENTE: linha pendente/sem_dados ou frequência insuficiente/sem dados ·
 *     RESSALVA ("ACEITO COM RESSALVA"): alguma linha com ressalva · ACEITO: o resto.
 *     textos: {ACEITO: {titulo, texto}, ...} substitui os textos padrão (A.PARECER); providencias: [..] ou fn(par, linhas).
 *
 * ---------------------------------------------------------------------------------
 * 2. HTML (tela e relatório) — classes do site: fe-resumo, fe-ok, fe-nok, fe-res...; no relatório: tabela "gr".
 *    Ressalva/pendência sempre em âmbar (A.COR.ambar = #c77d12).
 * ---------------------------------------------------------------------------------
 *   A.htmlParecer(par, {relat})                       quadro do parecer com a lista de motivos (e providências).
 *   A.htmlCriterios(linhas, {relat, estilo})          estilo "estatistico": Critério | Seção | n | X̄ | s | k | X̄ ∓ k·s |
 *                                                     Exigido | Situação;  estilo "resultado": Critério | Seção |
 *                                                     Determ. | Resultado | Exigido | Situação. Linhas com "grupo" ganham
 *                                                     cabeçalho de grupo. l.txtEstat / l.semMedia ajustam a coluna estatística.
 *   A.htmlFrequencia(freqs, relat)                    Ensaio | Método | Frequência | Exigido | Realizado | Situação.
 *   A.situacaoHtml(situacao, relat)                   selo colorido (tela) ou rótulo em maiúsculas (relatório).
 *   A.cartao(valor, rotulo)                           cartão de resultado (fe-res-item) — envolva em <div class="fe-res">.
 *
 * ---------------------------------------------------------------------------------
 * 3. ESTATÍSTICA (controle por amostragem variável)
 * ---------------------------------------------------------------------------------
 *   A.K_DNIT = [[n, k, α], ...] — tabela das ES do DNIT (ex.: DNIT 141/2022 Tabela B1, DNIT 385/2026 Tabela A1):
 *     n = 5…17, 19, 21 → k = 1,55; 1,41; 1,36; 1,31; 1,25; 1,21; 1,19; 1,16; 1,13; 1,11; 1,10; 1,08; 1,06; 1,04; 1,01.
 *   A.coefK(n, {tabelaK, nMin, k}) -> {k, nTab, exato, alfa?} ou null (n < nMin: sem estatística).
 *     n não tabelado (18, 20): k do maior n tabelado abaixo (mais exigente); n > último: k do último.
 *     tabelaK: tabela própria da ES ([[n, k]] ou [[n, k, α]]) — ES antigas do DNER; k: k fixo (ignora a tabela).
 *   A.estatistica(valores, min, max, {tabelaK, nMin, k, minEstrito}) -> { n, vals, min, max, X, s, vMin, vMax, fora,
 *     modo: "estatistico"|"individual", k, kInfo, inf = X̄ − k·s, sup = X̄ + k·s, okMin, okMax, conforme }
 *     valores: números ou pontos {v, est, x, rot}. s com n − 1. n < nMin (5): modo "individual" (cada valor atende).
 *     Critério: X̄ − k·s ≥ mín. (unilateral inferior), X̄ + k·s ≤ máx. (superior), os dois (bilateral).
 *   A.avaliar(cfg) -> linha. cfg: { id, grupo, criterio, secao, unid, casas=1, pontos, min, max, minEstrito,
 *       exigido (texto; padrão = limites), aplica=true, naoAplicaPor, individual (true = só valores individuais,
 *       sem estatística), falha ("nao_conforme" | "ressalva": situação da falha individual), obrigMin/obrigMax
 *       (valor individual fora reprova mesmo com a estatística atendida — "não se tolerando falta"),
 *       tabelaK, nMin, k, refs: {reprova, atende, corrige, regra, tabela} (seções citadas nos motivos) }
 *     Regras: sem pontos → sem_dados; n ≥ nMin: estatística falha → nao_conforme; estatística atende mas há valor
 *     individual fora → ressalva (corrigir o local) ou nao_conforme (obrigMin/obrigMax); n < nMin → valores individuais.
 *
 * ---------------------------------------------------------------------------------
 * 4. LOTE, ESTACAS E UTILIDADES
 * ---------------------------------------------------------------------------------
 *   A.estacaM("40+10,5") = 810,5 m (estaca de 20 m; aceita "40", "40 + 10,00", "Est. 42"); {estrito: true} só aceita
 *     "40" e "40+10,5"; {passo: 50} para estaca de 50 m.
 *   A.fmtEstaca(810.5) = "40+10,50"; A.fmtEstaca(800) = "40+00"; {simples: true} → "40 + 10,50" / "40".
 *   A.lote(P, {crescente}) -> {ini, fim, ext, larg, area} a partir de P.estIni, P.estFim, P.ext (opcional), P.largura.
 *     Padrão: estacas em qualquer ordem (ext = |fim − ini|); crescente: exige fim > ini.
 *   A.paramsLote({largura, volume, dias}) -> params padrão do lote (estacas, extensão, largura, volume, dias).
 *   A.cobertura(pontos, lote, passo, nome) -> {avisos, vazios, motivo}: pontos fora do lote e trechos de "passo" m sem
 *     determinação ("no mínimo uma a cada 100 m").
 *   A.nstr(x, casas) número para célula de tabela ("1234,5", sem milhar); A.fmtR (fmt sem "−0"); A.dataBR("2026-09-10");
 *   A.numOuNP("NP") -> {np: true, v: NaN}; A.txtLimites(min, max, casas, unid, minEstrito) ("3,0 a 5,0 %", "≥ 97 %");
 *   A.codigoCurto("dnit-458-2025-me") = "DNIT 458"; A.planoControle("<id da ES>") = plano da aba "Controle de serviços".
 *
 * ---------------------------------------------------------------------------------
 * 5. IMPORTAÇÃO (parâmetros tipo "importarVarios") E EXEMPLOS
 * ---------------------------------------------------------------------------------
 *   A.importacao.substituir(d, chave, novas, {chave}) — põe as colunas importadas na tabela d[chave]:
 *     as colunas DIGITADAS (sem "imp") são mantidas; as importadas antes são trocadas pelas novas, e o que foi digitado
 *     à mão numa coluna importada (campo que a importação deixa vazio, ex.: espessura) é mantido quando a nova coluna
 *     tem a mesma chave (padrão: campos "reg" + "pos"; pode ser lista de campos ou função). Marca as novas com imp:"1"
 *     e guarda os valores importados em impOrig (para distinguir depois o que foi digitado).
 *   A.importacao.juntarPorRegistro([{chave, cod, col}]) — ensaios do mesmo registro na mesma coluna (LL + IP + EA).
 *   A.importacao.rotulo(e, extra) = "REG-01 · DNIT 172 · extra";  A.importacao.ident(e) = e.dados.ident.
 *   A.exemplos.ensaio(fid, i)  — exemplo i da ficha ME fid como o motor entrega ao "aplicar" ({ficha, dados, resultados}).
 *   A.exemplos.importar(params, d, k, [[fid, i], ...]) — nos exemplos da ES: faz o que o botão "Importar selecionados"
 *     faria (grava d.params[k] = ["ex:fid:i", ...] e chama o aplicar do parâmetro k).
 *
 * ---------------------------------------------------------------------------------
 * 6. GRÁFICO
 * ---------------------------------------------------------------------------------
 *   A.grafico(titulo, [{x, y, fora}], linhas, opt, eixoX) — valores × estaca (x em metros; eixoX "idx" = nº da amostra),
 *     linhas: [{y, tipo: "lim"|"ks"|"med", txt}]; opt.imprimir (relatório), opt.w/h.
 *   A.linhasEst(est, casas, " %") — linhas de limite, média e X̄ ± ks de um objeto de A.estatistica.
 *   A.graficoLinha(linha, opt, titulo) — gráfico pronto de uma linha de A.avaliar (estacas quando houver).
 *
 * ---------------------------------------------------------------------------------
 * 7. A.fichaSimples(cfg) — ficha inteira a partir da LISTA DE CRITÉRIOS da ES (drenagem, OAE, sinalização, meio
 *    ambiente, obras complementares: controle por verificações/inspeções, com alguns valores medidos).
 * ---------------------------------------------------------------------------------
 *   cfg: { id (chave em FE.FICHAS), norma? (se a chave for própria), titulo, resumo, rotuloLink?,
 *          lote: {largura: true, volume: false, dias: false} | false, params: [...], padrao: {...},
 *          criterios: [item...], refs, tabelaK, nMin, textos, providencias, notas, estilo ("resultado"|"estatistico"),
 *          extra: function (ctx) {...}, exemplos: [{nome, dados: function () {...}}] }
 *   item: { id, texto, secao, grupo?, tipo: "sim_nao" | "valor" | "estatistico", exigido? (texto),
 *           unid, casas, min, max (número ou function (P, L)), minEstrito, obrigMin, obrigMax, falha ("nao_conforme"|
 *           "ressalva"), metodo (ex.: "DNIT 458-ME"), se: function (P) (aplica-se?),
 *           freq: {por, a_cada, minimo, qtd, unidade, regra, pontos} (sem freq: 1 por lote),
 *           importar: {de: fid | [fids], valores: function (e) -> número | [{v, est, pos, rot}]} (valor/estatistico) }
 *   Gera: params do lote (+ os seus + "importarVarios" dos itens com importar), tabelas (uma de verificações com uma
 *   coluna por item sim_nao — linhas "Atende? (S/N)", "Verificações realizadas", "Não conformes", "Observação" — e
 *   uma tabela por item de valor/estatístico — Estaca, Posição, Registro, valor), cálculo (linhas + frequências +
 *   parecer), resultadosHtml, graficos e relatório. Dados: d.verificacoes = [{atende, real, nc, obs}, ...] na ordem
 *   dos itens sim_nao; d[<id do item>] = [{est, pos, reg, v}, ...].
 *   ctx do extra: {d, P, L, linhas, freqs, avisos, item: {id: linha}} — acrescente linhas/avisos próprios da ES.
 *
 * =================================================================================
 * EXEMPLO MÍNIMO 1 — ficha de verificações (fichaSimples)
 * =================================================================================
 *   (function () {
 *     "use strict";
 *     var A = window.FE.aceitacao;
 *     A.fichaSimples({
 *       id: "dnit-000-2020-es", titulo: "Sarjetas e valetas — aceitação", resumo: "Verificações da seção 7 da ES.",
 *       lote: { largura: false },
 *       refs: { reprova: "7.4 b", atende: "7.4 a", regra: "7.4", tabela: "Tabela 1" },
 *       criterios: [
 *         { id: "forma", texto: "Acabamento e alinhamento (inspeção visual)", secao: "7.2", tipo: "sim_nao",
 *           exigido: "sem falhas, trincas ou desalinhamentos", freq: { por: "extensao", a_cada: 50 } },
 *         { id: "fck", texto: "Resistência do concreto (fck)", secao: "7.3", tipo: "estatistico", unid: "MPa",
 *           casas: 1, min: function (P) { return FE.num(P.fck); }, metodo: "ABNT NBR 5739",
 *           freq: { por: "volume", a_cada: 50, minimo: 2 } },
 *         { id: "esp", texto: "Espessura da parede", secao: "7.3", tipo: "valor", unid: "cm", casas: 1,
 *           min: 8, falha: "ressalva", freq: { por: "extensao", a_cada: 100 } },
 *       ],
 *       params: [{ k: "fck", r: "fck de projeto (MPa)" }], padrao: { fck: "15" },
 *       notas: "Critérios da DNIT 000/2020-ES, seção 7.",
 *       exemplos: [{ nome: "Lote aceito", dados: function () {
 *         return { ident: { registro: "LOTE-01" }, params: { estIni: "0", estFim: "10", volume: "60", fck: "15" },
 *           verificacoes: [{ atende: "S", real: "4" }],
 *           fck: [{ est: "2", v: "17,2" }, { est: "8", v: "16,8" }], esp: [{ est: "5", v: "8,5" }, { est: "9", v: "8,2" }] };
 *       } }],
 *     });
 *   })();
 *
 * =================================================================================
 * EXEMPLO MÍNIMO 2 — ficha própria com os helpers estatísticos
 * =================================================================================
 *   var A = FE.aceitacao, num = FE.num;
 *   function calcular(d) {
 *     var P = d.params || {}, L = A.lote(P), avisos = [];
 *     var pts = (d.gc || []).map(function (c, i) { return { v: num(c.gc), est: c.est, x: A.estacaM(c.est), rot: "furo " + (i + 1) }; });
 *     var linhas = [
 *       A.avaliar({ id: "gc", criterio: "Grau de compactação", secao: "7.3", unid: "%", casas: 1, min: 100, pontos: pts,
 *                   refs: { reprova: "7.5 b", atende: "7.5 a", regra: "7.5", tabela: "Tabela B1" } }),
 *     ];
 *     var freqs = [A.frequencia({ ensaio: "Grau de compactação", metodo: "DNIT 458", por: "extensao", a_cada: 100,
 *                                 qtd: L.ext, minimo: 5, realizado: linhas[0].n })];
 *     var par = A.parecer(linhas, freqs);
 *     return { resultados: { lote: L, linhas: linhas, freqs: freqs, parecer: par }, avisos: avisos };
 *   }
 *   function resultadosHtml(calc) {
 *     var r = calc.resultados;
 *     return A.htmlParecer(r.parecer) + A.htmlCriterios(r.linhas, { estilo: "estatistico" }) + A.htmlFrequencia(r.freqs);
 *   }
 *   // graficos: [A.graficoLinha(linha, opt)];  relatorio.extraHtml: A.htmlParecer(par, {relat: true}) + ... (relat: true)
 *   // importação: { k: "impGC", r: "...", tipo: "importarVarios", de: "dnit-458-2025-me",
 *   //   aplicar: function (lista, P, d) { A.importacao.substituir(d, "gc", lista.map(function (e) { ... return {reg:, est:, gc:}; })); } }
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var EPS = 1e-9;
  var A = {};

  // =====================================================================================
  // utilidades
  // =====================================================================================
  var COR = { ok: "#1e7d4f", verde: "#2e8b57", nok: "#c0392b", ambar: "#c77d12" };
  var AMBAR = "color:#c77d12;font-weight:600";
  // número como texto para células de tabela (vírgula decimal, sem separador de milhar — "1.568" seria lido como 1,568)
  function nstr(x, casas) { return ok(x) ? x.toFixed(casas).replace(".", ",") : ""; }
  // fmt sem "-0,0"
  function fmtR(x, casas) { return ok(x) && Math.abs(x) < 0.5 * Math.pow(10, -casas) ? fmt(0, casas) : fmt(x, casas); }
  function dataBR(s) { return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : (s || ""); }
  function numOuNP(v) {
    var t = String(v === undefined || v === null ? "" : v).trim();
    if (/^n\.?\s*p\.?$/i.test(t)) return { np: true, v: NaN };
    return { np: false, v: num(t) };
  }
  function txtLimites(min, max, casas, unid, minEstrito) {
    var u = unid ? " " + unid : "";
    if (ok(min) && ok(max)) return fmt(min, casas) + " a " + fmt(max, casas) + u;
    if (ok(min)) return (minEstrito ? "> " : "≥ ") + fmt(min, casas) + u;
    if (ok(max)) return "≤ " + fmt(max, casas) + u;
    return "—";
  }
  // "dnit-458-2025-me" → "DNIT 458"; "dner-me-036-94" → "DNER-ME 036"; outros: o próprio id
  function codigoCurto(fid) {
    var m = /^dnit-(\d+)-\d{4}-[a-z]+$/.exec(fid || "");
    if (m) return "DNIT " + m[1];
    m = /^dner-([a-z]+)-(\d+)-\d+$/.exec(fid || "");
    if (m) return "DNER-" + m[1].toUpperCase() + " " + m[2];
    return fid;
  }
  function vazio(x) { return x === undefined || x === null || String(x).trim() === ""; }
  // plano de controle da ES (aba "Controle de serviços"; data/controle/<stem>.json) — ponto de partida, confira na ES
  function planoControle(es) {
    var c = window.CONTROLE_DATA;
    if (!c) return null;
    var arr = Array.isArray(c) ? c : Object.keys(c).map(function (k) { return c[k]; });
    return arr.filter(function (p) { return p && p.es === es; })[0] || null;
  }

  // =====================================================================================
  // estacas e lote
  // =====================================================================================
  // estaca → metros. Padrão: aceita "40", "40+10", "40 + 10,00", "Est. 42", "E-42"; estrito: só "40" e "40+10,5".
  function estacaM(s, opt) {
    opt = opt || {};
    var passo = opt.passo || 20, t = String(s || "").trim();
    var m = opt.estrito ? /^(\d+)\s*(?:\+\s*([\d.,]+))?$/.exec(t) : /(\d+)(?:\s*\+\s*([\d.,]+))?/.exec(t);
    if (!m) return NaN;
    return Number(m[1]) * passo + (m[2] ? num(m[2]) : 0);
  }
  // metros → estaca: "40+00", "40+10,50"; {simples: true}: "40", "40 + 10,50"
  function fmtEstaca(x, opt) {
    opt = opt || {};
    if (!ok(x)) return "—";
    var passo = opt.passo || 20, e = Math.floor(x / passo + EPS), r = x - e * passo;
    if (opt.simples) return String(e) + (r > 0.005 ? " + " + fmt(r, 2) : "");
    return e + "+" + (r < 10 ? "0" : "") + fmt(r, Math.abs(r - Math.round(r)) < 1e-6 ? 0 : 2);
  }
  // parâmetros comuns do lote → {ini, fim, ext, larg, area} (m, m, m, m, m²)
  function lote(P, opt) {
    P = P || {}; opt = opt || {};
    var a = estacaM(P.estIni, opt), b = estacaM(P.estFim, opt), ext = num(P.ext), larg = num(P.largura);
    if (opt.crescente) {
      if (!ok(ext)) ext = ok(a) && ok(b) && b > a ? b - a : NaN;
      return { ini: a, fim: b, ext: ext, larg: larg, area: ok(ext) && ok(larg) ? ext * larg : NaN };
    }
    if (!ok(ext) && ok(a) && ok(b)) ext = Math.abs(b - a);
    return { ini: ok(a) && ok(b) ? Math.min(a, b) : a, fim: ok(a) && ok(b) ? Math.max(a, b) : NaN, ext: ext, larg: larg,
      area: ok(ext) && ok(larg) ? ext * larg : NaN };
  }
  function paramsLote(o) {
    o = o || {};
    var p = [
      { k: "estIni", r: "Estaca inicial do lote", ph: "ex.: 20+00", dica: "estaca de 20 m: 20+10,5 = 410,5 m" },
      { k: "estFim", r: "Estaca final do lote", ph: "ex.: 45+00" },
      { k: "ext", r: "Extensão do lote (m) — opcional", ph: "pelas estacas", dica: "vazio = diferença entre as estacas" },
    ];
    if (o.largura !== false) p.push({ k: "largura", r: "Largura executada (m)", dica: "com a extensão, dá a área do lote" });
    if (o.volume) p.push({ k: "volume", r: "Volume executado no lote (m³)" });
    if (o.dias) p.push({ k: "dias", r: "Dias de trabalho no lote" });
    return p;
  }
  // cada trecho de "passo" m do lote deve ter ao menos uma determinação; pontos {v, x, rot}
  function cobertura(vals, L, passo, nome) {
    var r = { avisos: [], vazios: [], motivo: "" };
    if (!vals.length || !ok(L.ini) || !ok(L.fim) || L.fim <= L.ini) return r;
    var semX = vals.filter(function (v) { return !ok(v.x); }).length;
    if (semX) r.avisos.push(nome + ": " + semX + " determinação(ões) sem estaca — não entram na verificação da distribuição a cada " + passo + " m.");
    var fora = vals.filter(function (v) { return ok(v.x) && (v.x < L.ini - 1e-6 || v.x > L.fim + 1e-6); });
    if (fora.length) r.avisos.push(nome + ": " + fora.length + " determinação(ões) fora das estacas do lote (" + fora.map(function (v) { return v.rot; }).join("; ") + ").");
    for (var a = L.ini; a < L.fim - 1e-6; a += passo) {
      var b = Math.min(a + passo, L.fim);
      if (!vals.some(function (v) { return ok(v.x) && v.x >= a - 1e-6 && (v.x < b - 1e-6 || (b >= L.fim - 1e-6 && v.x <= b + 1e-6)); })) r.vazios.push(fmtEstaca(a) + " a " + fmtEstaca(b));
    }
    if (r.vazios.length && vals.some(function (v) { return ok(v.x); })) r.motivo = "trecho(s) de " + passo + " m sem determinação: " + r.vazios.join("; ");
    return r;
  }

  // =====================================================================================
  // frequência
  // =====================================================================================
  function nMin(qtd, passo, minimo) {
    if (!ok(qtd)) return NaN;
    return Math.max(minimo === undefined ? 1 : minimo, Math.ceil(qtd / (passo || 1) - EPS));
  }
  function nPontos(ext, passo, minimo) {
    if (!ok(ext)) return NaN;
    return Math.max(minimo === undefined ? 1 : minimo, Math.floor(ext / passo + EPS) + 1);
  }
  var UNID_FREQ = { extensao: "m", area: "m²", volume: "m³", tempo: "dia(s)", contagem: "unid." };
  function fmtN(x) { return ok(x) ? fmt(x, Math.abs(x - Math.round(x)) < 1e-9 ? 0 : 2) : "?"; }
  // regra/exigido automáticos a partir de {por, a_cada, qtd, minimo, unidade, pontos}
  function regraFreq(o) {
    var min = o.minimo === undefined ? 1 : o.minimo;
    if (o.por === "lote" || !o.a_cada) return { exigido: min, regra: min + " por lote" };
    var un = o.unidade || UNID_FREQ[o.por] || "";
    return { exigido: o.pontos ? nPontos(o.qtd, o.a_cada, min) : nMin(o.qtd, o.a_cada, min),
      regra: (o.pontos ? "a cada " : "1 a cada ") + fmtN(o.a_cada) + (un ? " " + un : "") + (min > 1 ? "; mín. " + min : "") };
  }
  function frequencia(o) {
    var auto = o.por || o.a_cada ? regraFreq(o) : null;
    var f = { ensaio: o.ensaio || "", metodo: o.metodo || "—", regra: o.regra || (auto ? auto.regra : "—"),
      exigido: o.exigido !== undefined ? o.exigido : auto ? auto.exigido : NaN, realizado: o.realizado || 0 };
    f.situacao = o.aplica === false ? "nao_exigido" : !ok(f.exigido) ? "sem_dados" : f.realizado >= f.exigido ? "atende" : "insuficiente";
    return f;
  }

  // =====================================================================================
  // estatística
  // =====================================================================================
  // Tabela de amostragem variável das ES do DNIT: [n, k, α]
  var K_DNIT = [[5, 1.55, 0.45], [6, 1.41, 0.35], [7, 1.36, 0.30], [8, 1.31, 0.25], [9, 1.25, 0.19], [10, 1.21, 0.15],
    [11, 1.19, 0.13], [12, 1.16, 0.10], [13, 1.13, 0.08], [14, 1.11, 0.06], [15, 1.10, 0.05], [16, 1.08, 0.04],
    [17, 1.06, 0.03], [19, 1.04, 0.02], [21, 1.01, 0.01]];
  function tabelaDe(opt) { return (opt && opt.tabelaK) || K_DNIT; }
  function nMinDe(opt) { return (opt && opt.nMin) || tabelaDe(opt)[0][0]; }
  function coefK(n, opt) {
    opt = opt || {};
    if (!(n >= nMinDe(opt))) return null;
    if (ok(opt.k)) return { k: opt.k, nTab: n, exato: true };
    var sel = null;
    tabelaDe(opt).forEach(function (x) { if (x[0] <= n) sel = x; });
    if (!sel) return null;
    var o = { k: sel[1], nTab: sel[0], exato: sel[0] === n };
    if (sel[2] !== undefined) o.alfa = sel[2];
    return o;
  }
  function ponto(x) { return typeof x === "number" ? { v: x } : x; }
  function estatistica(vals, min, max, opt) {
    opt = opt || {};
    var v = (vals || []).map(ponto).filter(function (x) { return x && ok(x.v); }), n = v.length;
    var o = { n: n, vals: v, min: min, max: max };
    if (!n) return o;
    function abaixo(x) { return ok(min) && (opt.minEstrito ? x <= min + EPS : x < min - EPS); }
    var xs = v.map(function (x) { return x.v; });
    o.X = media(xs);
    o.s = n > 1 ? Math.sqrt(xs.reduce(function (s, x) { return s + (x - o.X) * (x - o.X); }, 0) / (n - 1)) : NaN;
    o.vMin = Math.min.apply(null, xs); o.vMax = Math.max.apply(null, xs);
    o.fora = v.filter(function (x) { return abaixo(x.v) || (ok(max) && x.v > max + EPS); });
    var K = opt.individual ? null : coefK(n, opt);
    if (K) {
      var sv = ok(o.s) ? o.s : 0;
      o.modo = "estatistico"; o.k = K.k; o.kInfo = { k: K.k, nTab: K.nTab, exato: K.exato };
      o.inf = o.X - K.k * sv; o.sup = o.X + K.k * sv;
      o.okMin = ok(min) ? !abaixo(o.inf) : null;
      o.okMax = ok(max) ? o.sup <= max + EPS : null;
      o.conforme = o.okMin !== false && o.okMax !== false;
    } else {
      o.modo = "individual";
      o.conforme = !o.fora.length;
    }
    return o;
  }

  // =====================================================================================
  // linhas de critério e situações
  // =====================================================================================
  // [rótulo na tela, classe ("ambar" = estilo âmbar), rótulo no relatório, peso]
  var SITUACAO = {
    conforme: ["conforme", "fe-ok", "CONFORME", 1], ressalva: ["conforme com ressalva", "ambar", "CONFORME COM RESSALVA", 2],
    pendente: ["pendente", "ambar", "PENDENTE", 3], sem_dados: ["sem dados", "fe-nok", "SEM DADOS", 3],
    nao_conforme: ["não conforme", "fe-nok", "NÃO CONFORME", 4], nao_exigido: ["não exigido", "", "não exigido", -1],
    informativo: ["informativo", "", "informativo", 0],
    atende: ["atende", "fe-ok", "atende", 1], insuficiente: ["insuficiente", "fe-nok", "INSUFICIENTE", 3],
  };
  function peso(s) { return (SITUACAO[s] || [0, 0, 0, 0])[3]; }
  function pior(a, b) { return peso(a) >= peso(b) ? a : b; }
  function linha(o) {
    var l = { id: "", grupo: "", criterio: "", secao: "", unid: "", casas: 1, n: 0, media: NaN, s: NaN, k: NaN, lim: {},
      exigido: "—", resultado: "—", situacao: "conforme", motivo: "", motivos: [] };
    Object.keys(o || {}).forEach(function (k) { l[k] = o[k]; });
    return l;
  }
  function marcar(l, sit, texto) {
    l.situacao = pior(l.situacao, sit);
    if (texto) {
      l.motivos = l.motivos || [];
      l.motivos.push({ situacao: sit, texto: texto });
      l.motivo = l.motivos.map(function (m) { return m.texto; }).join("; ");
    }
    return l;
  }
  function aplicarFrequencia(l, exig, real, unid) {
    l.exig = exig; l.real = real;
    if (!ok(exig)) return l;
    if (real === 0 && exig > 0) marcar(l, "pendente", "nenhuma determinação (mínimo " + exig + " " + unid + ")");
    else if (real < exig) marcar(l, "ressalva", "frequência abaixo da mínima: " + real + " de " + exig + " " + unid);
    return l;
  }
  function rp(x) { return x ? " (" + x + ")" : ""; }
  function txtResultado(e, casas, unid) {
    var u = unid ? " " + unid : "";
    if (!e.n) return "—";
    if (e.modo === "estatistico") return "n = " + e.n + " · X̄ = " + fmtR(e.X, casas) + " · s = " + fmt(e.s, casas + 1) + " · k = " + fmt(e.k, 2) +
      (ok(e.min) ? " · X̄ − ks = " + fmtR(e.inf, casas) : "") + (ok(e.max) ? " · X̄ + ks = " + fmtR(e.sup, casas) : "");
    return (e.n > 1 ? fmt(e.vMin, casas) + " a " + fmt(e.vMax, casas) + u + " (n = " + e.n + ")" : fmt(e.vMin, casas) + u);
  }
  // avaliação de um requisito numérico (valores individuais e/ou controle estatístico)
  function avaliar(cfg) {
    var R = cfg.refs || {}, casas = cfg.casas === undefined ? 1 : cfg.casas, unid = cfg.unid || "";
    var min = cfg.min, max = cfg.max, estr = !!cfg.minEstrito;
    var l = linha({ id: cfg.id || "", grupo: cfg.grupo || "", criterio: cfg.criterio || cfg.nome || "", secao: cfg.secao || "", unid: unid,
      casas: casas, lim: { min: min, max: max, minEstrito: estr }, pontos: (cfg.pontos || []).map(ponto), metodo: cfg.metodo });
    var e = estatistica(l.pontos, min, max, { tabelaK: cfg.tabelaK, nMin: cfg.nMin, k: cfg.k, minEstrito: estr, individual: cfg.individual });
    l.est = e; l.n = e.n; l.media = e.n ? e.X : NaN; l.s = e.n ? e.s : NaN;
    l.exigido = cfg.exigido || txtLimites(min, max, casas, unid, estr);
    l.resultado = txtResultado(e, casas, unid);
    if (cfg.aplica === false) { l.situacao = "nao_exigido"; l.motivo = cfg.naoAplicaPor || "não exigido"; return l; }
    if (!e.n) { l.situacao = "sem_dados"; l.motivo = "sem determinações"; return l; }
    function abaixo(v) { return ok(min) && (estr ? v <= min + EPS : v < min - EPS); }
    function acima(v) { return ok(max) && v > max + EPS; }
    l.fora = e.fora;
    var foraObrig = e.vals.filter(function (p) { return (cfg.obrigMin && abaixo(p.v)) || (cfg.obrigMax && acima(p.v)); });
    var lista = l.fora.map(function (p) { return fmt(p.v, casas) + (p.est ? " (est. " + p.est + ")" : p.rot ? " (" + p.rot + ")" : ""); }).join("; ");
    var nm = nMinDe(cfg);
    if (e.modo === "estatistico") {
      var K = coefK(e.n, cfg);
      l.k = K.k; if (K.alfa !== undefined) l.alfa = K.alfa; l.kExato = K.exato; l.nTab = K.nTab;
      l.inf = e.inf; l.sup = e.sup;
      l.regra = "estatística" + rp(R.regra);
      var falhas = [];
      if (ok(min) && abaixo(l.inf)) falhas.push("X̄ − k·s = " + fmt(l.inf, casas + 1) + (estr ? " ≤ " : " < ") + fmt(min, casas) + " " + unid);
      if (ok(max) && acima(l.sup)) falhas.push("X̄ + k·s = " + fmt(l.sup, casas + 1) + " > " + fmt(max, casas) + " " + unid);
      if (falhas.length) { l.situacao = "nao_conforme"; l.motivo = falhas.join("; ") + rp(R.reprova); }
      else if (foraObrig.length) { l.situacao = "nao_conforme"; l.motivo = "a estatística atende, mas a ES não tolera valores individuais fora: " + lista; }
      else if (l.fora.length) { l.situacao = "ressalva"; l.motivo = "a estatística atende" + rp(R.atende) + "; " + l.fora.length + " valor(es) individual(is) fora do limite — corrigir o local" + rp(R.corrige) + ": " + lista; }
      else { l.situacao = "conforme"; l.motivo = "X̄ " + (ok(min) ? "− k·s = " + fmt(l.inf, casas + 1) : "") + (ok(min) && ok(max) ? " e X̄ " : "") +
        (ok(max) ? "+ k·s = " + fmt(l.sup, casas + 1) : "") + " " + unid + rp(R.atende); }
      if (!K.exato) {
        var tab = tabelaDe(cfg), ult = tab[tab.length - 1];
        l.motivo += e.n > ult[0] ? " — n > " + ult[0] + ": k = " + fmt(ult[1], 2) + " (último da " + (R.tabela || "tabela de k") + ")" : " — n = " + e.n + " não tabelado: k de n = " + K.nTab;
      }
    } else {
      var tag = cfg.individual ? "" : " (n < " + nm + ", sem estatística)";
      l.regra = cfg.individual ? "valores individuais" : "valores individuais (n < " + nm + ")";
      if (l.fora.length) { l.situacao = cfg.falha || "nao_conforme"; l.motivo = "valor individual fora do limite" + tag + ": " + lista; }
      else { l.situacao = "conforme"; l.motivo = "todos os valores individuais atendem" + tag; }
    }
    if (l.situacao !== "conforme") l.motivos = [{ situacao: l.situacao, texto: l.motivo }];
    return l;
  }

  // =====================================================================================
  // parecer
  // =====================================================================================
  var PARECER = {
    ACEITO: { titulo: "LOTE ACEITO", texto: "Todos os critérios da especificação atendidos, com a frequência exigida." },
    RESSALVA: { titulo: "LOTE ACEITO COM RESSALVA", texto: "Nenhum critério reprovado, mas há pontos a corrigir ou a documentar (ressalvas abaixo)." },
    PENDENTE: { titulo: "LOTE PENDENTE — CONTROLE INCOMPLETO", texto: "Nenhum critério reprovado, mas faltam ensaios, determinações ou informações exigidos: complete o controle antes de aceitar o lote." },
    REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há critério não conforme: o serviço deve ser corrigido ou refeito e só é aceito quando as correções o colocarem em conformidade." },
  };
  var TIPO_ITEM = { nao_conforme: "Não conforme", pendente: "Pendente", sem_dados: "Pendente", ressalva: "Ressalva" };
  function parecer(linhas, freqs, opt) {
    opt = opt || {}; linhas = linhas || []; freqs = freqs || [];
    function sit(l) { return l.situacao; }
    var nc = linhas.filter(function (l) { return sit(l) === "nao_conforme"; });
    var pend = linhas.filter(function (l) { return sit(l) === "pendente" || sit(l) === "sem_dados"; });
    var falta = freqs.filter(function (f) { return f.situacao === "insuficiente" || f.situacao === "sem_dados"; });
    var res = linhas.filter(function (l) { return sit(l) === "ressalva"; });
    var cod = nc.length ? "REJEITADO" : (pend.length || falta.length) ? "PENDENTE" : res.length ? "RESSALVA" : "ACEITO";
    // itens: motivos de cada linha agrupados por gravidade (não conforme, pendente, frequência, ressalva)
    var grupos = { nao_conforme: [], pendente: [], ressalva: [] };
    linhas.forEach(function (l) {
      var ms = l.motivos && l.motivos.length ? l.motivos : SITUACAO[l.situacao] && peso(l.situacao) >= 2 ? [{ situacao: l.situacao, texto: l.motivo }] : [];
      ms.forEach(function (m) {
        var g = m.situacao === "sem_dados" ? "pendente" : m.situacao;
        if (grupos[g]) grupos[g].push([TIPO_ITEM[g], l.criterio + (l.secao ? " (" + l.secao + ")" : "") + ": " + m.texto]);
      });
    });
    var itens = grupos.nao_conforme.concat(grupos.pendente)
      .concat(falta.map(function (f) { return ["Pendente", "frequência de " + String(f.ensaio).toLowerCase() + ": " + f.realizado + " de " + (ok(f.exigido) ? f.exigido : "?") + " (" + f.regra + ")"]; }))
      .concat(grupos.ressalva);
    var tx = Object.assign({}, PARECER[cod], (opt.textos || {})[cod] || {});
    var par = { parecer: cod, titulo: tx.titulo, texto: tx.texto, itens: itens, nc: nc, pend: pend, falta: falta, res: res, nota: opt.nota || "" };
    par.prov = typeof opt.providencias === "function" ? opt.providencias(par, linhas) || [] : opt.providencias || [];
    return par;
  }

  // =====================================================================================
  // HTML
  // =====================================================================================
  function situacaoHtml(s, relat) {
    var x = SITUACAO[s] || [s, "", s];
    if (relat) return x[2];
    if (x[1] === "ambar") return '<span style="' + AMBAR + '">' + x[0] + "</span>";
    return x[1] ? '<span class="' + x[1] + '">' + x[0] + "</span>" : "<span>" + x[0] + "</span>";
  }
  function corParecer(cod) { return cod === "ACEITO" ? COR.ok : cod === "REJEITADO" ? COR.nok : COR.ambar; }
  function htmlParecer(par, opt) {
    opt = opt || {};
    var relat = opt.relat === true || opt === true, cor = corParecer(par.parecer), mot = par.itens || [], prov = par.prov || [], n5 = par.nota || "";
    if (relat) {
      return '<div style="border:2px solid ' + cor + ';padding:6px 9px;margin:6px 0"><div style="font-size:14px;font-weight:bold;color:' + cor + '">PARECER: ' + esc(par.titulo) +
        '</div><div style="margin-top:2px">' + esc(par.texto) + "</div>" +
        (mot.length ? '<ol style="margin:5px 0 0 18px;padding:0">' + mot.map(function (x) { return "<li><b>" + esc(x[0]) + ":</b> " + esc(x[1]) + "</li>"; }).join("") + "</ol>" : "") +
        (prov.length ? '<div style="margin-top:4px"><b>Providências</b><ul style="margin:3px 0 0 18px;padding:0">' + prov.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" : "") +
        (n5 ? '<div style="margin-top:4px;color:#555">' + esc(n5) + "</div>" : "") + "</div>";
    }
    return '<div style="border:2px solid ' + cor + ';border-radius:8px;padding:10px 14px;margin:4px 0 12px">' +
      '<div style="font-size:1.25em;font-weight:700;color:' + cor + '">' + esc(par.titulo) + "</div>" +
      '<div style="margin-top:3px;opacity:.9">' + esc(par.texto) + "</div>" +
      (mot.length ? '<ol style="margin:8px 0 0 20px;padding:0">' + mot.map(function (x) {
        var c = x[0] === "Não conforme" ? "fe-nok" : "";
        return '<li style="margin:2px 0"><b' + (c ? ' class="' + c + '"' : ' style="' + AMBAR + '"') + ">" + esc(x[0]) + ":</b> " + esc(x[1]) + "</li>";
      }).join("") + "</ol>" : "") +
      (prov.length ? '<div style="margin-top:6px"><b>Providências</b><ul style="margin:3px 0 0 18px;padding:0">' + prov.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" : "") +
      (n5 ? '<div style="margin-top:6px;font-size:.9em;opacity:.8">' + esc(n5) + "</div>" : "") + "</div>";
  }
  function vTxt(l, v, extra) { return ok(v) ? fmt(v, (l.casas || 0) + (extra || 0)) : "—"; }
  function linhaGrupo(g, ncol, relat) {
    return '<tr><td colspan="' + ncol + '" style="font-weight:bold;background:' + (relat ? "#e9e9e9" : "rgba(127,127,127,.12)") + '">' + esc(g) + "</td></tr>";
  }
  function detTxt(l) {
    if (l.exig !== undefined && ok(l.exig)) return (l.real || 0) + " / " + l.exig;
    if (l.real !== undefined) return l.real ? String(l.real) : "—";
    return l.n ? String(l.n) : "—";
  }
  function htmlCriterios(linhas, opt) {
    opt = opt || {};
    var relat = !!opt.relat, cls = relat ? "gr" : "fe-resumo", g = "", TL = '<td style="text-align:left">';
    if (opt.estilo === "resultado") {
      var h = '<table class="' + cls + '"><thead><tr><th style="text-align:left">Critério</th><th style="text-align:left">Seção</th><th>Determ.</th>' +
        '<th style="text-align:left">Resultado</th><th style="text-align:left">Exigido</th><th style="text-align:left">Situação</th></tr></thead><tbody>';
      linhas.forEach(function (l) {
        if (l.grupo && l.grupo !== g) { g = l.grupo; h += linhaGrupo(g, 6, relat); }
        h += "<tr>" + TL + esc(l.criterio) + "</td>" + TL + esc(l.secao) + "</td><td>" + esc(detTxt(l)) + "</td>" + TL + esc(l.resultado || "—") + "</td>" +
          TL + esc(l.exigido || "—") + "</td>" + TL + situacaoHtml(l.situacao, relat) +
          (l.motivo && l.situacao !== "conforme" ? '<br><small style="font-size:.9em">' + esc(l.motivo) + "</small>" : "") + "</td></tr>";
      });
      return h + "</tbody></table>";
    }
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Critério</th><th style="text-align:left">Seção</th><th>n</th><th>X̄</th><th>s</th><th>k</th><th>X̄ ∓ k·s</th>' +
      "<th>Exigido</th><th style=\"text-align:left\">Situação</th></tr></thead><tbody>" + linhas.map(function (l) {
        var lim = l.lim || {}, pre = "";
        if (l.grupo && l.grupo !== g) { g = l.grupo; pre = linhaGrupo(g, 9, relat); }
        var est = l.txtEstat !== undefined ? l.txtEstat
          : ok(l.inf) || ok(l.sup) ? [ok(lim.min) ? fmt(l.inf, (l.casas || 0) + 1) : "", ok(lim.max) ? fmt(l.sup, (l.casas || 0) + 1) : ""].filter(Boolean).join(" / ") : "—";
        return pre + '<tr><td style="text-align:left">' + esc(l.criterio) + '</td><td style="text-align:left">' + esc(l.secao) + "</td><td>" + (l.n || 0) + "</td><td>" + (l.semMedia ? "—" : vTxt(l, l.media, 1)) +
          "</td><td>" + (l.semMedia ? "—" : vTxt(l, l.s, 1)) + "</td><td>" + (ok(l.k) ? fmt(l.k, 2) : "—") + "</td><td>" + esc(est) + "</td><td>" + esc(l.exigido || "—") +
          "</td><td style=\"text-align:left\">" + situacaoHtml(l.situacao, relat) + (l.motivo ? '<br><small style="font-size:.9em">' + esc(l.motivo) + "</small>" : "") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function htmlFrequencia(freqs, relat) {
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Ensaio / determinação</th><th style="text-align:left">Método</th><th style="text-align:left">Frequência (ES)</th><th>Exigido</th><th>Realizado</th><th>Situação</th></tr></thead><tbody>' +
      freqs.map(function (f) {
        var L = '<td style="text-align:left">';
        return "<tr>" + L + esc(f.ensaio) + "</td>" + L + esc(f.metodo) + "</td>" + L + esc(f.regra) + "</td><td>" + (f.situacao === "nao_exigido" ? "—" : ok(f.exigido) ? f.exigido : "?") +
          "</td><td>" + f.realizado + "</td><td>" + situacaoHtml(f.situacao, relat) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function cartao(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }

  // =====================================================================================
  // importação e exemplos
  // =====================================================================================
  function ident(e) { return (e.dados || {}).ident || {}; }
  function temValor(c) {
    return Object.keys(c).some(function (k) { return k !== "usar" && c[k] !== "" && c[k] !== undefined && c[k] !== null; });
  }
  var importacao = {
    ident: ident,
    rotulo: function (e, extra) { return (ident(e).registro || "sem registro") + " · " + codigoCurto(e.ficha) + (extra ? " · " + extra : ""); },
    substituir: function (d, chave, novas, opt) {
      opt = opt || {};
      var campos = opt.chave || ["reg", "pos"];
      function key(c) { return typeof campos === "function" ? campos(c) : campos.map(function (k) { return c[k] === undefined ? "" : String(c[k]); }).join("|"); }
      // chave repetida (ex.: mesma posição em estacas diferentes): casa a n-ésima ocorrência com a n-ésima
      function chaves(lista) {
        var cont = {};
        return lista.map(function (c) { var k = key(c); cont[k] = (cont[k] || 0) + 1; return k + "#" + cont[k]; });
      }
      var antigas = d[chave] || [], velhas = {}, imps = antigas.filter(function (c) { return c.imp; });
      chaves(imps).forEach(function (k, i) { velhas[k] = imps[i]; });
      var kNovas = chaves(novas || []);
      var manter = antigas.filter(function (c) { return !c.imp && temValor(c); });
      (novas || []).forEach(function (c, i) {
        var orig = {};
        Object.keys(c).forEach(function (k) { if (k !== "imp" && k !== "impOrig") orig[k] = c[k]; });
        var v = velhas[kNovas[i]];
        // campo digitado/corrigido à mão na coluna importada antes (difere do valor importado, ou foi preenchido
        // num campo que a importação deixou vazio) prevalece sobre a nova importação
        if (v) Object.keys(v).forEach(function (k) {
          if (k === "imp" || k === "impOrig" || vazio(v[k])) return;
          var digitado = v.impOrig ? String(v[k]) !== String(v.impOrig[k] === undefined ? "" : v.impOrig[k]) : vazio(c[k]);
          if (digitado) c[k] = v[k];
        });
        if (!c.imp) c.imp = "1";
        c.impOrig = orig;
      });
      d[chave] = manter.concat(novas || []);
      if (!d[chave].length) d[chave].push({});
      return d[chave];
    },
    juntarPorRegistro: function (itens) {
      var out = [], por = {};
      itens.forEach(function (it) {
        var c = it.col, key = it.chave;
        if (key && por[key]) {
          var alvo = por[key];
          Object.keys(c).forEach(function (k) {
            if (k === "reg") return;
            if (c[k] !== "" && c[k] !== undefined && (alvo[k] === "" || alvo[k] === undefined)) alvo[k] = c[k];
          });
          if (alvo.reg.indexOf(it.cod) === -1) alvo.reg += " + " + it.cod;
        } else { out.push(c); if (key) por[key] = c; }
      });
      return out;
    },
  };
  var exemplos = {
    ensaio: function (fid, i) {
      var X = FE.FICHAS[fid], exs = X.exemplos || [{ dados: X.exemplo }];
      var dados = JSON.parse(JSON.stringify(exs[i].dados()));
      dados.params = Object.assign({}, X.padrao || {}, dados.params || {});
      dados.ident = dados.ident || {};
      return { ficha: fid, dados: dados, resultados: X.calcular(dados).resultados, exemplo: exs[i].nome };
    },
    importar: function (params, d, k, refs) {
      var f = params.filter(function (x) { return x.k === k; })[0];
      d.params = d.params || {};
      d.params[k] = refs.map(function (r) { return "ex:" + r[0] + ":" + r[1]; });
      f.aplicar(refs.map(function (r) { return exemplos.ensaio(r[0], r[1]); }), d.params, d);
      return d;
    },
  };

  // =====================================================================================
  // gráfico: valores × estaca (ou × nº da amostra) com limites
  // =====================================================================================
  function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), f = x / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }
  function grafico(titulo, pts, linhas, opt, eixoX) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 230, m = { l: 50, r: 14, t: 22, b: 36 };
    pts = pts.filter(function (p) { return ok(p.y) && ok(p.x); });
    if (!pts.length) return null;
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff";
    var ys = pts.map(function (p) { return p.y; }).concat(linhas.map(function (l) { return l.y; }).filter(ok));
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = Math.max((y1 - y0) * 0.12, Math.abs(y1) * 0.005, 0.05);
    y0 -= pad; y1 += pad;
    var xs = pts.map(function (p) { return p.x; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    if (x1 - x0 < 1e-9) { x0 -= 1; x1 += 1; }
    var dx = (x1 - x0) * 0.05; x0 -= dx; x1 += dx;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">' + esc(titulo) + "</text>";
    var passo = niceStep((y1 - y0) / 5);
    for (var gy = Math.ceil(y0 / passo) * passo; gy <= y1 + 1e-9; gy += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 5) + '" y="' + (Y(gy) + 3) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy, passo < 0.1 ? 2 : passo < 1 ? 1 : 0) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
    linhas.forEach(function (l) {
      if (!ok(l.y) || l.y < y0 || l.y > y1) return;
      var c = l.tipo === "lim" ? (imp ? "#c0392b" : "#e5534b") : l.tipo === "ks" ? (imp ? "#7a4fbf" : "#b58cff") : txt;
      s += '<line x1="' + m.l + '" y1="' + Y(l.y) + '" x2="' + (W - m.r) + '" y2="' + Y(l.y) + '" stroke="' + c + '" stroke-width="' + (l.tipo === "lim" ? 1.4 : 1) + '"' +
        (l.tipo === "med" ? "" : ' stroke-dasharray="' + (l.tipo === "lim" ? "6 3" : "2 3") + '"') + "/>";
      s += '<text x="' + (W - m.r - 3) + '" y="' + (Y(l.y) - 3) + '" text-anchor="end" fill="' + c + '">' + esc(l.txt) + "</text>";
    });
    var ord = pts.slice().sort(function (a, b) { return a.x - b.x; });
    if (opt.linha !== false) s += '<path d="' + ord.map(function (p, i) { return (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.y).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1" opacity="0.5"/>';
    pts.forEach(function (p) {
      s += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="3.5" fill="' + (p.fora ? (imp ? "#c0392b" : "#e5534b") : cor) + '"/>';
    });
    // eixo x: estacas (marcas em múltiplos de 20 m quando o trecho é longo) ou nº da amostra
    var pX = eixoX === "idx" ? Math.max(1, Math.round(niceStep((x1 - x0) / 6))) : niceStep((x1 - x0) / 6);
    if (eixoX !== "idx" && pX >= 20) pX = Math.round(pX / 20) * 20;
    if (eixoX !== "idx" && pX < 1) pX = 1;
    for (var xv = Math.ceil(x0 / pX) * pX; xv <= x1 + 1e-9; xv += pX) {
      s += '<line x1="' + X(xv) + '" y1="' + (H - m.b) + '" x2="' + X(xv) + '" y2="' + (H - m.b + 3) + '" stroke="' + txt + '" stroke-width="0.6"/>';
      s += '<text x="' + X(xv) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + esc(eixoX === "idx" ? String(Math.round(xv)) : fmtEstaca(Math.round(xv))) + "</text>";
    }
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">' + (eixoX === "idx" ? "Amostra" : "Estaca") + "</text>";
    return s + "</svg>";
  }
  function linhasEst(e, casas, u) {
    var l = [];
    if (ok(e.min)) l.push({ y: e.min, tipo: "lim", txt: "mín. " + fmt(e.min, casas) + u });
    if (ok(e.max)) l.push({ y: e.max, tipo: "lim", txt: "máx. " + fmt(e.max, casas) + u });
    if (ok(e.X)) l.push({ y: e.X, tipo: "med", txt: "X̄ " + fmt(e.X, casas) });
    if (e.modo === "estatistico") {
      if (ok(e.min)) l.push({ y: e.inf, tipo: "ks", txt: "X̄ − ks" });
      if (ok(e.max)) l.push({ y: e.sup, tipo: "ks", txt: "X̄ + ks" });
    }
    return l;
  }
  function graficoLinha(l, opt, titulo) {
    var e = l.est || estatistica(l.pontos || [], (l.lim || {}).min, (l.lim || {}).max);
    if (!e.n) return null;
    var usaEst = e.vals.every(function (p) { return ok(p.x); });
    var pts = e.vals.map(function (p, i) {
      return { x: usaEst ? p.x : i + 1, y: p.v, fora: e.fora.indexOf(p) >= 0 };
    });
    var t = titulo || l.criterio + (l.unid ? " (" + l.unid + ")" : "") + (usaEst ? " × estaca" : " por determinação") + (l.secao ? " — " + l.secao : "");
    return grafico(t, pts, linhasEst(e, l.casas || 0, l.unid ? " " + l.unid : ""), opt, usaEst ? undefined : "idx");
  }

  // =====================================================================================
  // fichaSimples: ficha de ES a partir da lista de critérios
  // =====================================================================================
  function simNao(t) {
    t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
    if (!t) return null;
    if (/^(s|sim|ok|c|conforme|atende|x|1)$/.test(t)) return true;
    if (/^(n|n[aã]o|nc|n[aã]o conforme|0)$/.test(t)) return false;
    return null;
  }
  function valorDe(v, P, L) { return typeof v === "function" ? v(P, L) : v; }
  function fichaSimples(cfg) {
    var itens = cfg.criterios || [], optLote = cfg.lote === false ? null : (cfg.lote || {});
    var itSN = itens.filter(function (it) { return it.tipo === "sim_nao"; });
    var itV = itens.filter(function (it) { return it.tipo !== "sim_nao"; });
    var usa = function (por) { return itens.some(function (it) { return it.freq && it.freq.por === por; }); };
    var params = [];
    if (optLote) params = params.concat(paramsLote({ largura: optLote.largura !== false || usa("area"),
      volume: optLote.volume || usa("volume"), dias: optLote.dias || usa("tempo") }));
    params = params.concat(cfg.params || []);
    itV.forEach(function (it) {
      if (!it.importar) return;
      params.push({ k: "imp_" + it.id, r: it.texto + " — importar" + (it.metodo ? " (" + it.metodo + ")" : ""), tipo: "importarVarios", de: it.importar.de,
        dica: "marque os ensaios e clique em \"Importar selecionados\" (substitui as colunas importadas antes; as digitadas são mantidas)",
        aplicar: function (lista, P, d) {
          var cols = [];
          lista.forEach(function (e) {
            var r = it.importar.valores(e), i = ident(e);
            (Array.isArray(r) ? r : [{ v: r }]).forEach(function (x, j) {
              if (!ok(x.v)) return;
              cols.push({ est: x.est || i.local || "", pos: x.pos || "", reg: importacao.rotulo(e, x.rot || (Array.isArray(r) && r.length > 1 ? "det. " + (j + 1) : "")),
                v: nstr(x.v, it.casas === undefined ? 1 : it.casas) });
            });
          });
          importacao.substituir(d, it.id, cols);
        } });
    });
    function aplica(it, P) { return !it.se || it.se(P); }
    function tabelas(d) {
      var P = d.params || {}, T = [];
      if (itSN.length) {
        if (Array.isArray(d.verificacoes)) while (d.verificacoes.length < itSN.length) d.verificacoes.push({});
        T.push({ chave: "verificacoes", titulo: "Verificações e inspeções", rotulo: "Item", iniciais: itSN.length, min: itSN.length, fixo: true,
          nomes: itSN.map(function (it) { return it.texto + " (" + it.secao + ")" + (aplica(it, P) ? "" : " — não se aplica"); }),
          dica: "uma coluna por item da ES: \"S\" ou \"N\"; ou o número de verificações realizadas e de não conformes",
          linhas: [{ k: "atende", r: "Atende? (S / N)", texto: true }, { k: "real", r: "Verificações realizadas", u: "nº" },
            { k: "nc", r: "Verificações não conformes", u: "nº" }, { k: "obs", r: "Observação", texto: true }] });
      }
      itV.forEach(function (it) {
        if (!aplica(it, P)) return;
        T.push({ chave: it.id, titulo: it.texto + " (" + it.secao + ")", rotulo: "Det.", iniciais: 1, min: 1,
          dica: (it.metodo ? it.metodo + "; " : "") + "exigido: " + (it.exigido || txtLimites(valorDe(it.min, P), valorDe(it.max, P), it.casas === undefined ? 1 : it.casas, it.unid, it.minEstrito)),
          linhas: [{ k: "est", r: "Estaca / local", texto: true }, { k: "pos", r: "Posição", texto: true }, { k: "reg", r: "Registro / origem", texto: true },
            { k: "v", r: it.texto, u: it.unid || "" }] });
      });
      return T;
    }
    function calcular(d) {
      var P = d.params || {}, L = optLote ? lote(P) : { ext: NaN, area: NaN }, avisos = [], linhas = [], freqs = [], porId = {};
      if (optLote && !ok(L.ext) && itens.some(function (it) { return it.freq && (it.freq.por === "extensao" || it.freq.por === "area"); }))
        avisos.push("Informe as estacas inicial e final (ou a extensão) do lote: as frequências dependem da extensão.");
      function freqDe(it, real) {
        var fr = it.freq || {}, q;
        if (fr.qtd !== undefined) q = typeof fr.qtd === "function" ? fr.qtd(P, L) : typeof fr.qtd === "string" ? num(P[fr.qtd]) : fr.qtd;
        else q = fr.por === "extensao" ? L.ext : fr.por === "area" ? L.area : fr.por === "volume" ? num(P.volume) : fr.por === "tempo" ? num(P.dias) : NaN;
        return frequencia({ ensaio: it.texto, metodo: it.metodo || "—", por: fr.por || "lote", a_cada: fr.a_cada, qtd: q, minimo: fr.minimo,
          unidade: fr.unidade, pontos: fr.pontos, regra: fr.regra, realizado: real, aplica: aplica(it, P) });
      }
      var iSN = 0;
      itens.forEach(function (it) {
        var ap = aplica(it, P), l;
        if (it.tipo === "sim_nao") {
          var c = (d.verificacoes || [])[iSN++] || {}, sn = simNao(c.atende), real = num(c.real), nc = num(c.nc);
          if (!ok(real)) real = sn === null ? (ok(nc) ? nc : 0) : 1;
          if (!ok(nc)) nc = sn === false ? 1 : 0;
          if (nc > real) real = nc;
          l = linha({ id: it.id, grupo: it.grupo || "", criterio: it.texto, secao: it.secao || "", exigido: it.exigido || "conforme a ES", n: real, metodo: it.metodo,
            resultado: real ? (real - nc) + " de " + real + " conforme(s)" + (c.obs ? " — " + c.obs : "") : "—" });
          if (!ap) { l.situacao = "nao_exigido"; l.motivo = it.naoAplicaPor || "não se aplica"; }
          else if (!real) marcar(l, "sem_dados", "não verificado");
          else if (nc > 0) marcar(l, it.falha || "nao_conforme", nc + " de " + real + " verificação(ões) não conforme(s)" + (c.obs ? " — " + c.obs : ""));
          else l.motivo = real + " verificação(ões) conforme(s)";
        } else {
          var min = valorDe(it.min, P, L), max = valorDe(it.max, P, L);
          var pts = (d[it.id] || []).map(function (c, i) { return { v: num(c.v), est: c.est || "", x: estacaM(c.est), rot: c.pos || "det. " + (i + 1) }; });
          l = avaliar({ id: it.id, grupo: it.grupo, criterio: it.texto, secao: it.secao, unid: it.unid, casas: it.casas, pontos: pts, min: min, max: max,
            minEstrito: it.minEstrito, obrigMin: it.obrigMin, obrigMax: it.obrigMax, falha: it.falha, individual: it.tipo !== "estatistico",
            exigido: it.exigido, aplica: ap, naoAplicaPor: it.naoAplicaPor || "não se aplica", refs: cfg.refs, tabelaK: cfg.tabelaK, nMin: cfg.nMin, metodo: it.metodo });
          if (ap && l.n && !ok(min) && !ok(max) && !it.exigido) marcar(l, "pendente", "informe o valor de projeto");
          if (ok(L.ini) && ok(L.fim)) {
            var fora = l.pontos.filter(function (p) { return ok(p.v) && ok(p.x) && (p.x < L.ini - 1e-6 || p.x > L.fim + 1e-6); });
            if (fora.length) avisos.push(it.texto + ": " + fora.length + " determinação(ões) fora das estacas do lote (" + fora.map(function (p) { return p.est; }).join("; ") + ").");
          }
        }
        linhas.push(l); porId[it.id] = l;
        if (ap || it.freq) freqs.push(freqDe(it, l.n || 0));
      });
      var ctx = { d: d, P: P, L: L, linhas: linhas, freqs: freqs, avisos: avisos, item: porId };
      if (cfg.extra) cfg.extra(ctx);
      freqs.forEach(function (f) { if (f.situacao === "insuficiente") avisos.push("Frequência: " + f.ensaio + " — " + f.realizado + " de " + f.exigido + " exigida(s) (" + f.regra + ")."); });
      var nota = linhas.filter(function (l) { return (l.situacao === "conforme" || l.situacao === "ressalva") && /^valores individuais \(n </.test(l.regra || ""); })
        .map(function (l) { return l.criterio; });
      var par = parecer(linhas, freqs, { textos: cfg.textos, providencias: cfg.providencias,
        nota: nota.length ? "Avaliados por valor individual (n < " + nMinDe(cfg) + ", fora da tabela de k): " + nota.join("; ") + "." : "" });
      return { tab: {}, resultados: { lote: L, linhas: linhas, freqs: freqs, parecer: par, conforme: par.parecer === "ACEITO" || par.parecer === "RESSALVA" }, avisos: avisos };
    }
    var estilo = cfg.estilo || (itens.some(function (it) { return it.tipo === "estatistico"; }) ? "estatistico" : "resultado");
    function cartoes(r) {
      var L = r.lote;
      if (!optLote) return "";
      return '<div class="fe-res">' + cartao(ok(L.ext) ? fmt(L.ext, 0) + " m" : "—", "Extensão do lote" + (ok(L.ini) && ok(L.fim) ? " (est. " + fmtEstaca(L.ini) + " a " + fmtEstaca(L.fim) + ")" : "")) +
        (ok(L.area) ? cartao(fmt(L.area, 0) + " m²", "Área (extensão × largura)") : "") + "</div>";
    }
    function resultadosHtml(calc) {
      var r = calc.resultados;
      return htmlParecer(r.parecer) + cartoes(r) +
        '<h4 style="margin:12px 0 4px">Critérios de aceitação</h4>' + htmlCriterios(r.linhas, { estilo: estilo }) +
        (r.freqs.length ? '<h4 style="margin:12px 0 4px">Frequência dos ensaios e verificações</h4>' + htmlFrequencia(r.freqs) : "");
    }
    function graficos(calc, d, opt) {
      var out = calc.resultados.linhas.filter(function (l) { return l.est && l.n; }).map(function (l) { return graficoLinha(l, opt); }).filter(Boolean);
      return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com os valores medidos do lote.</div>'];
    }
    var notaK = itens.some(function (it) { return it.tipo === "estatistico"; }) ? " Controle estatístico: X̄ − k·s ≥ mínimo e/ou X̄ + k·s ≤ máximo (s com n − 1), k da " +
      ((cfg.refs || {}).tabela || "tabela de amostragem variável") + "; n < " + nMinDe(cfg) + ": cada valor individual deve atender; n não tabelado: k do n tabelado imediatamente inferior." : "";
    var F = {
      titulo: cfg.titulo, resumo: cfg.resumo || "", rotuloLink: cfg.rotuloLink || "Aceitação de lote", lote: true,
      blocos: [], params: params, padrao: cfg.padrao || {}, tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: graficos,
      relatorio: {
        notas: (cfg.notas || "") + notaK + " Parecer: rejeitado se algum critério não conforme; pendente se faltar verificação/ensaio exigido; aceito com ressalva se houver ressalvas; aceito se tudo atender.",
        parametros: cfg.parametrosRelatorio,
        resultados: function (calc) {
          var r = calc.resultados, L = r.lote, rows = [["Parecer do lote", r.parecer.titulo]];
          if (optLote) rows.push(["Lote", (ok(L.ini) && ok(L.fim) ? "estaca " + fmtEstaca(L.ini) + " a " + fmtEstaca(L.fim) + " · " : "") + (ok(L.ext) ? fmt(L.ext, 0) + " m" : "—") + (ok(L.area) ? " · " + fmt(L.area, 0) + " m²" : "")]);
          rows.push(["Critérios", r.linhas.length + " verificados: " + ["conforme", "ressalva", "pendente", "sem_dados", "nao_conforme", "nao_exigido"].map(function (s) {
            var n = r.linhas.filter(function (l) { return l.situacao === s; }).length;
            return n ? n + " " + SITUACAO[s][0] : "";
          }).filter(Boolean).join(", ")]);
          return rows;
        },
        extraHtml: function (calc) {
          var r = calc.resultados;
          return htmlParecer(r.parecer, { relat: true }) + "<h2>Critérios de aceitação</h2>" + htmlCriterios(r.linhas, { relat: true, estilo: estilo }) +
            (r.freqs.length ? "<h2>Frequência dos ensaios e verificações</h2>" + htmlFrequencia(r.freqs, true) : "");
        },
      },
      exemplos: cfg.exemplos || [],
      simples: cfg,
    };
    if (!F.relatorio.parametros) delete F.relatorio.parametros;
    if (cfg.norma) F.norma = cfg.norma;
    if (cfg.id && cfg.registrar !== false) FE.FICHAS[cfg.id] = F;
    return F;
  }

  // =====================================================================================
  A = {
    // utilidades
    COR: COR, AMBAR: AMBAR, nstr: nstr, fmtR: fmtR, dataBR: dataBR, numOuNP: numOuNP, txtLimites: txtLimites, codigoCurto: codigoCurto,
    planoControle: planoControle,
    // estacas e lote
    estacaM: estacaM, fmtEstaca: fmtEstaca, lote: lote, paramsLote: paramsLote, cobertura: cobertura,
    // frequência
    nMin: nMin, nPontos: nPontos, frequencia: frequencia,
    // estatística
    K_DNIT: K_DNIT, coefK: coefK, estatistica: estatistica,
    // critérios e parecer
    SITUACAO: SITUACAO, PARECER: PARECER, pior: pior, linha: linha, marcar: marcar, aplicarFrequencia: aplicarFrequencia, avaliar: avaliar, parecer: parecer,
    // HTML
    situacaoHtml: situacaoHtml, htmlParecer: htmlParecer, htmlCriterios: htmlCriterios, htmlFrequencia: htmlFrequencia, cartao: cartao,
    // importação, exemplos, gráfico
    importacao: importacao, exemplos: exemplos, grafico: grafico, linhasEst: linhasEst, graficoLinha: graficoLinha,
    // ficha pronta
    fichaSimples: fichaSimples,
  };
  FE.aceitacao = A;
})();
