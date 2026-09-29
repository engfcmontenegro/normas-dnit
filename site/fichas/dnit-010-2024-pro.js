/*
 * Ficha: DNIT 010/2024-PRO — Inspeções em pontes e viadutos (e passarelas).
 * Registro da inspeção conforme o tipo (Quadro 1: cadastral, rotineira, extraordinária, especial, intermediária) e sua
 * periodicidade; elementos observados (5.1.1 a 5.1.12) e registro fotográfico (mínimo de seis fotos, 5.1); notas técnicas
 * de 1 a 5 por elemento (Anexo B item 2; Anexo C), danos com extensão relativa e estado de condição EC 1 a 4 (Anexo B
 * item 3; Anexo D, Tabela D1), insuficiências estruturais e causas prováveis (Anexo B item 4) e laudo (item 5).
 * Nota final da estrutura = menor nota dos elementos com função estrutural (Anexo C, Obs.), com a classificação, a
 * ação corretiva e as condições de estabilidade do Quadro do Anexo C; parecer de conformidade do registro com a PRO
 * (usa FE.aceitacao). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dnit-010-2024-pro";

  var TIPOS = [["rotineira", "Rotineira (4.2.2; 5.3) — a cada 2 anos"], ["cadastral", "Cadastral (4.2.1; 5.2) — primeira inspeção"],
    ["especial", "Especial (4.2.4; 5.5) — 5 anos ou sob demanda"], ["extraordinaria", "Extraordinária (4.2.3; 5.4) — sob demanda"],
    ["intermediaria", "Intermediária (4.2.5; 5.6) — sob demanda"]];
  var ENTREGA = { cadastral: "Cadastro no SGE (Anexo A)", rotineira: "Cadastro no SGE (Anexo B)", extraordinaria: "Upload de relatório no SGE",
    especial: "Upload de relatório no SGE", intermediaria: "Upload de relatório no SGE" };
  // Anexo C — nota, danos/insuficiência, ação corretiva, condições de estabilidade, classificação
  var NOTAS = {
    5: ["Não há danos nem insuficiência estrutural.", "Nada a fazer.", "Excelente", "Estrutura sem problemas."],
    4: ["Há alguns danos, mas não há sinais de que estejam gerando insuficiência estrutural.", "Nada a fazer, apenas serviços de manutenção.", "Boa", "Estrutura sem problemas importantes."],
    3: ["Há danos gerando alguma insuficiência estrutural, mas não há sinais de comprometimento da estabilidade da estrutura.",
      "A recuperação pode ser postergada, colocando-se o problema em observação sistemática.", "Regular",
      "Estrutura potencialmente problemática: acompanhar a evolução dos problemas por inspeções rotineiras, para detectar em tempo hábil um eventual agravamento da insuficiência estrutural."],
    2: ["Há danos gerando significativa insuficiência estrutural, porém ainda sem risco tangível de colapso.", "A recuperação (geralmente com reforço estrutural) deve ser feita a curto prazo.", "Ruim",
      "Estrutura problemática: postergar demais a recuperação pode levá-la a estado crítico. Inspeções intermediárias (novas inspeções a intervalos inferiores aos normais) são recomendáveis."],
    1: ["Há danos gerando grave insuficiência estrutural; o elemento está em estado crítico, com risco tangível de colapso.", "A recuperação (geralmente com reforço) — ou a substituição — deve ser feita sem tardar.", "Crítica",
      "Estrutura crítica: pode configurar emergência, com medidas preventivas especiais (restrição de carga, interdição total ou parcial, escoramentos provisórios, instrumentação com leituras contínuas)."],
  };
  // Anexo D — Tabela D1
  var EC = { 4: "Bom — dano irrisório ou não encontrado", 3: "Razoável — não afeta o desempenho e/ou já há medidas contra o avanço",
    2: "Ruim — não afeta o desempenho, mas afeta a vida útil, sem necessidade de avaliação estrutural", 1: "Severo — requer avaliação estrutural" };
  var ITENS = [["i511", "5.1.1 Geometria e condições viárias"], ["i512", "5.1.2 Acessos"], ["i513", "5.1.3 Cursos d'água"], ["i514", "5.1.4 Encontros e fundações"],
    ["i515", "5.1.5 Apoios intermediários"], ["i516", "5.1.6 Aparelhos de apoio"], ["i517", "5.1.7 Superestrutura"], ["i518", "5.1.8 Pista de rolamento"],
    ["i519", "5.1.9 Juntas de dilatação (abertura e temperatura)"], ["i5110", "5.1.10 Barreiras e guarda-corpos"], ["i5111", "5.1.11 Sinalização"], ["i5112", "5.1.12 Instalações de utilidade pública"]];
  var OBS = [["", "—"], ["ok", "Verificado"], ["na", "Não existe / não se aplica"], ["nao", "Não verificado"]];
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var ENT_EXT = [["e_a", "a) descrição da obra e do fato gerador"], ["e_b", "b) relato das atividades"], ["e_c", "c) registros fotográficos datados e identificados"],
    ["e_d", "d) dados colhidos no local / relatos (ou registro da inexistência)"], ["e_e", "e) laudo técnico conclusivo"], ["e_f", "f) requisição fundamentada de inspeção especial, se necessária"]];
  var ENT_ESP = [["s_a", "a) identificação, localização, data, nº do relatório"], ["s_b", "b) descrição da obra e documentos de referência"], ["s_c", "c) classificação da obra justificada"],
    ["s_d", "d) comparação com a inspeção anterior"], ["s_e", "e) mapeamento e quantificação das anomalias com EC e fotos"], ["s_f", "f) ensaios: locais, métodos, resultados e normas"],
    ["s_g", "g) recomendações de providências"]];
  function tp(d) { return (d.params || {}).tipo || "rotineira"; }
  function dias(a, b) { var x = Date.parse(a), y = Date.parse(b); return ok(x) && ok(y) ? (y - x) / 86400000 : NaN; }
  function somaAnos(dt, n) { var x = new Date(Date.parse(dt)); if (!ok(x.getTime())) return ""; x.setFullYear(x.getFullYear() + n); return x.toISOString().slice(0, 10); }
  function inteiro(v, a, b) { return ok(v) && Math.round(v) === v && v >= a && v <= b; }
  function chave(o) { return (String(o.tramo || "").trim() + "|" + String(o.elem || "").trim()).toLowerCase(); }

  var params = [
    { k: "tipo", r: "Tipo de inspeção (4.2; Quadro 1)", tipo: "select", recarrega: true, opcoes: TIPOS },
    { k: "codigo", r: "Código da estrutura (SGE)" },
    { k: "nome", r: "Nome da estrutura", ph: "Ponte sobre o Rio A" },
    { k: "estrutura", r: "Tipo de obra (3.1 a 3.4)", tipo: "select", opcoes: [["ponte", "Ponte / viaduto"], ["passarela", "Passarela de pedestres"]] },
    { k: "sistema", r: "Material / sistema construtivo (1)", tipo: "select", opcoes: [["ca", "Concreto armado"], ["cp", "Concreto protendido"], ["aco", "Aço"], ["mista", "Mista aço-concreto"], ["outro", "Outro (madeira, alvenaria…)"]] },
    { k: "vao", r: "Maior vão livre, m (3.1; 3.2)" },
    { k: "comp", r: "Comprimento, m (Anexo A)" },
    { k: "larg", r: "Largura, m (Anexo A)" },
    { k: "nTramos", r: "Nº de tramos" },
    { k: "dataAnt", r: "Data da inspeção regular anterior (cadastral ou rotineira)", tipo: "date" },
    { k: "dataEsp", r: "Data da última inspeção especial", tipo: "date" },
    { k: "cadastro", r: "Existe inspeção cadastral localizada? (5.3.1)", tipo: "select", opcoes: SN, se: function (d) { return tp(d) === "rotineira"; } },
    { k: "interv", r: "Houve obra/intervenção desde a rotineira anterior? (5.3.1)", tipo: "select", opcoes: SN, se: function (d) { return tp(d) === "rotineira"; } },
    { k: "anexoA", r: "Relatório do Anexo A (cadastral) também preenchido? (5.3.2)", tipo: "select", opcoes: SN, se: function (d) { return tp(d) === "rotineira"; } },
    { k: "fotos", r: "Nº de fotos do registro (mínimo 6, 5.1)" },
    { k: "vistas", r: "Fotos com vista superior, inferior, laterais e detalhes de apoios, articulações e juntas? (5.1)", tipo: "select", opcoes: SN },
    { k: "croqui", r: "Croquis em planta, corte e detalhes (5.2.1)?", tipo: "select", opcoes: SN, se: function (d) { return tp(d) === "cadastral"; } },
    { k: "motivo", r: "Fato gerador / anomalia motivadora (4.2.3; 4.2.5)", se: function (d) { return tp(d) === "extraordinaria" || tp(d) === "intermediaria"; } },
    { k: "notif", r: "Condição que exige restrição de carga ou interdição: DNIT notificado? (5.1)", tipo: "select", opcoes: [["", "—"], ["na", "Não há tal condição"], ["sim", "Sim, notificado"], ["nao", "Não notificado"]] },
    { k: "trafego", r: "Medidas de tráfego adotadas (5.4.1)", ph: "ex.: faixa interditada, carga limitada a 20 t" },
    { k: "laudoData", r: "Data do laudo especializado (Anexo B item 5)", tipo: "date" },
    { k: "laudo", r: "Laudo especializado / avaliação estrutural (Anexo B item 5)" },
  ].concat(ITENS.map(function (x) { return { k: x[0], r: "Observado — " + x[1], tipo: "select", opcoes: OBS }; }))
    .concat(ENT_EXT.map(function (x) { return { k: x[0], r: "Entregável 5.4.2 " + x[1], tipo: "select", opcoes: SN, se: function (d) { return tp(d) === "extraordinaria"; } }; }))
    .concat(ENT_ESP.map(function (x) { return { k: x[0], r: "Entregável 5.5.2 " + x[1], tipo: "select", opcoes: SN, se: function (d) { return tp(d) === "especial"; } }; }))
    .concat([{ k: "i_rel", r: "Relatório com a anomalia, sua evolução e providências (5.6.2)?", tipo: "select", opcoes: SN, se: function (d) { return tp(d) === "intermediaria"; } }]);

  function calcular(d) {
    var P = d.params || {}, tipo = P.tipo || "rotineira", avisos = [], linhas = [], data = (d.ident || {}).data || "";
    var els = (d.elem || []).map(function (x, i) {
      var o = { i: i, tramo: x.tramo || "", reg: x.reg || "", fam: x.fam || "", elem: x.elem || "", nota: num(x.nota), estr: !/^n/i.test(String(x.estr || "").trim()) };
      o.valido = inteiro(o.nota, 1, 5);
      return o;
    }).filter(function (o) { return o.elem || o.fam || ok(o.nota); });
    var dns = (d.dano || []).map(function (x, i) {
      var o = { i: i, tramo: x.tramo || "", reg: x.reg || "", fam: x.fam || "", elem: x.elem || "", dano: x.dano || "", quant: x.quant || "", local: x.local || "",
        ext: num(x.ext), ec: num(x.ec), insuf: x.insuf || "", causa: x.causa || "" };
      o.valido = inteiro(o.ec, 1, 4);
      return o;
    }).filter(function (o) { return o.dano || o.elem || ok(o.ec); });

    // nota final da estrutura (Anexo C, Obs.): menor nota dos elementos com função estrutural
    var estr = els.filter(function (o) { return o.estr && o.valido; }), todos = els.filter(function (o) { return o.valido; });
    var nFinal = estr.length ? Math.min.apply(null, estr.map(function (o) { return o.nota; })) : NaN;
    var nTodos = todos.length ? Math.min.apply(null, todos.map(function (o) { return o.nota; })) : NaN;
    var criticos = estr.filter(function (o) { return o.nota === nFinal; });
    var ecCont = { 1: 0, 2: 0, 3: 0, 4: 0 };
    dns.forEach(function (o) { if (o.valido) ecCont[o.ec]++; });

    var G1 = "Tipo e periodicidade (4.2; Quadro 1)", G2 = "Procedimentos gerais (5.1)", G3 = "Notas, danos e estados de condição (Anexos B, C e D)", G4 = "Entregáveis";
    // periodicidade
    var lp = A.linha({ id: "per", grupo: G1, criterio: "Periodicidade da inspeção " + tipo, secao: "Quadro 1", exigido: tipo === "rotineira" ? "≤ 2 anos da anterior" : tipo === "especial" ? "5 anos (ou sob demanda)" : tipo === "cadastral" ? "primeira inspeção / após reabilitação" : "sob demanda" });
    if (tipo === "rotineira") {
      var dd = dias(P.dataAnt, data);
      lp.resultado = ok(dd) ? fmt(dd / 365.25, 1) + " ano(s) desde " + A.dataBR(P.dataAnt) : "—";
      if (!ok(dd)) A.marcar(lp, "pendente", "informe a data desta inspeção e a da inspeção anterior");
      else if (dd < 0) A.marcar(lp, "nao_conforme", "inspeção anterior posterior a esta — confira as datas");
      else if (dd > 2 * 365.25 + 1) A.marcar(lp, "ressalva", "intervalo de " + fmt(dd / 365.25, 1) + " anos: a rotineira deve ser feita a cada 2 anos (Quadro 1; 4.2.2)");
    } else lp.situacao = "informativo";
    linhas.push(lp);
    var de = dias(P.dataEsp, data);
    if (tipo !== "especial" && ok(de)) {
      var le = A.linha({ id: "esp", grupo: G1, criterio: "Última inspeção especial", secao: "Quadro 1", exigido: "a cada 5 anos", resultado: fmt(de / 365.25, 1) + " ano(s) atrás" });
      if (de > 5 * 365.25 + 1) A.marcar(le, "ressalva", "inspeção especial vencida (mais de 5 anos): programar");
      linhas.push(le);
    }
    if (tipo === "rotineira" && (P.cadastro === "nao" || P.interv === "sim")) {
      var la = A.linha({ id: "cad", grupo: G1, criterio: "Procedimentos da inspeção cadastral incluídos", secao: "5.3.1; 5.3.2", exigido: "relatório do Anexo A preenchido",
        resultado: P.anexoA === "sim" ? "sim" : P.anexoA === "nao" ? "não" : "—" });
      if (P.anexoA === "nao") A.marcar(la, "nao_conforme", (P.cadastro === "nao" ? "sem inspeção cadastral localizada" : "houve intervenção") + ": a rotineira deve englobar a cadastral (Anexo A)");
      else if (P.anexoA !== "sim") A.marcar(la, "pendente", "informe se o Anexo A foi preenchido");
      linhas.push(la);
    }
    // 5.1 — fotos e elementos observados
    var nf = num(P.fotos);
    var lf = A.linha({ id: "fot", grupo: G2, criterio: "Registro fotográfico", secao: "5.1", exigido: "≥ 6 fotos: vistas superior, inferior, laterais e detalhes", resultado: ok(nf) ? fmt(nf, 0) + " foto(s)" : "—" });
    if (!ok(nf)) A.marcar(lf, "pendente", "informe o número de fotos");
    else if (nf < 6) A.marcar(lf, "nao_conforme", "mínimo de seis fotos (5.1)");
    if (P.vistas === "nao") A.marcar(lf, "nao_conforme", "as fotos devem registrar vista superior, inferior, laterais e detalhes de apoios, articulações e juntas");
    else if (P.vistas !== "sim") A.marcar(lf, "pendente", "confirme as vistas fotografadas");
    linhas.push(lf);
    if (tipo === "cadastral") {
      var lc = A.linha({ id: "croq", grupo: G2, criterio: "Croquis em planta, corte e detalhes", secao: "5.2.1", exigido: "fornecidos", resultado: P.croqui === "sim" ? "sim" : P.croqui === "nao" ? "não" : "—" });
      if (P.croqui === "nao") A.marcar(lc, "nao_conforme", "o inspetor deve fornecer esquemas estruturais (croquis)"); else if (P.croqui !== "sim") A.marcar(lc, "pendente", "informe");
      linhas.push(lc);
    }
    var naoV = ITENS.filter(function (x) { return P[x[0]] === "nao"; }), semI = ITENS.filter(function (x) { return !P[x[0]]; });
    var lo = A.linha({ id: "obs", grupo: G2, criterio: "Elementos observados (5.1.1 a 5.1.12)", secao: "5.1", exigido: "todos os itens aplicáveis",
      resultado: (ITENS.length - naoV.length - semI.length) + " de " + ITENS.length + " informados" });
    if (naoV.length) A.marcar(lo, tipo === "extraordinaria" ? "ressalva" : "pendente", "não verificados: " + naoV.map(function (x) { return x[1].split(" ")[0]; }).join(", "));
    if (semI.length) A.marcar(lo, "pendente", "sem registro: " + semI.map(function (x) { return x[1].split(" ")[0]; }).join(", "));
    linhas.push(lo);
    // notas por elemento
    var exigeNotas = tipo === "rotineira" || tipo === "especial";
    var ln = A.linha({ id: "notas", grupo: G3, criterio: "Nota técnica de 1 a 5 por elemento", secao: "5.3.1; Anexo C", exigido: "nota inteira 1 a 5 para cada elemento",
      resultado: todos.length + " elemento(s) com nota", n: todos.length });
    var inval = els.filter(function (o) { return !o.valido; });
    if (!els.length) A.marcar(ln, exigeNotas ? "pendente" : "informativo", "sem elementos avaliados");
    if (inval.length) A.marcar(ln, "nao_conforme", "nota ausente ou fora de 1 a 5: " + inval.map(function (o) { return o.elem || "elemento " + (o.i + 1); }).join(", "));
    if (els.length && !estr.length) A.marcar(ln, "pendente", "nenhum elemento com função estrutural avaliado — a nota final sai deles (Anexo C, Obs.)");
    linhas.push(ln);
    // danos
    var ld = A.linha({ id: "danos", grupo: G3, criterio: "Danos com extensão relativa e estado de condição", secao: "Anexo D; Tabela D1", exigido: "EC 1 a 4 e extensão para cada dano",
      resultado: dns.length + " dano(s) · EC1 " + ecCont[1] + " · EC2 " + ecCont[2] + " · EC3 " + ecCont[3] + " · EC4 " + ecCont[4], n: dns.length });
    var dInv = dns.filter(function (o) { return !o.valido; }), dExt = dns.filter(function (o) { return !ok(o.ext); }), dEl = dns.filter(function (o) { return !o.elem; });
    if (dInv.length) A.marcar(ld, "nao_conforme", "EC ausente ou fora de 1 a 4: " + dInv.map(function (o) { return (o.dano || "dano") + " (" + (o.elem || "?") + ")"; }).join("; "));
    if (dExt.length) A.marcar(ld, "pendente", "sem extensão relativa: " + dExt.length + " dano(s)");
    if (dns.some(function (o) { return ok(o.ext) && (o.ext < 0 || o.ext > 100); })) A.marcar(ld, "nao_conforme", "extensão relativa fora de 0 a 100 %");
    if (dEl.length) A.marcar(ld, "pendente", "dano(s) sem o elemento em que foi encontrado");
    linhas.push(ld);
    // coerência nota × danos (Anexo C)
    var porEl = {};
    dns.forEach(function (o) { var k = chave(o); (porEl[k] = porEl[k] || []).push(o); });
    var lcoh = A.linha({ id: "coer", grupo: G3, criterio: "Coerência entre notas e danos registrados", secao: "Anexo C", exigido: "nota 5 sem danos; nota ≤ 3 com danos e insuficiência registrados", resultado: "—" });
    var inc5 = [], semDano = [], semInsuf = [];
    els.filter(function (o) { return o.valido; }).forEach(function (o) {
      var ds = porEl[chave(o)] || [];
      if (o.nota === 5 && ds.some(function (x) { return x.valido && x.ec <= 3; })) inc5.push(o.elem);
      if (o.nota <= 3 && !ds.length) semDano.push(o.elem);
      if (o.estr && o.nota <= 3 && ds.length && !ds.some(function (x) { return String(x.insuf).trim(); })) semInsuf.push(o.elem);
    });
    lcoh.resultado = inc5.length + semDano.length + semInsuf.length ? (inc5.length + semDano.length + semInsuf.length) + " incoerência(s)" : "coerente";
    if (inc5.length) A.marcar(lcoh, "ressalva", "nota 5 (\"não há danos\") com dano EC ≤ 3: " + inc5.join(", "));
    if (semDano.length) A.marcar(lcoh, "ressalva", "nota ≤ 3 sem dano registrado no Anexo B item 3: " + semDano.join(", "));
    if (semInsuf.length) A.marcar(lcoh, "ressalva", "nota ≤ 3 sem insuficiência estrutural registrada (Anexo B item 4): " + semInsuf.join(", "));
    if (lcoh.situacao === "conforme" && !els.length) lcoh.situacao = "informativo";
    linhas.push(lcoh);
    // EC 1 → avaliação estrutural
    if (ecCont[1]) {
      var l1 = A.linha({ id: "ec1", grupo: G3, criterio: "Danos EC 1 — avaliação estrutural", secao: "Tabela D1", exigido: "avaliação estrutural do efeito na resistência/funcionalidade",
        resultado: ecCont[1] + " dano(s) EC 1" + (String(P.laudo || "").trim() ? " · laudo registrado" : "") });
      if (!String(P.laudo || "").trim()) A.marcar(l1, "pendente", "registre a avaliação estrutural / laudo especializado (Anexo B item 5)");
      linhas.push(l1);
    }
    // nota crítica → notificação
    if (ok(nFinal) && nFinal <= 2 || P.notif === "sim" || P.notif === "nao") {
      var lnf = A.linha({ id: "notif", grupo: G3, criterio: "Notificação imediata ao DNIT de condição que exija restrição/interdição", secao: "5.1",
        exigido: "notificar imediatamente", resultado: P.notif === "sim" ? "notificado" : P.notif === "nao" ? "não notificado" : P.notif === "na" ? "sem tal condição" : "—" });
      if (P.notif === "nao") A.marcar(lnf, "nao_conforme", "a equipe deve notificar imediatamente o DNIT (5.1)");
      else if (nFinal === 1 && P.notif !== "sim") A.marcar(lnf, "pendente", "nota 1 (crítica): informe a notificação ao DNIT e as medidas preventivas (Anexo C)");
      else if (!P.notif) A.marcar(lnf, "pendente", "nota " + nFinal + ": informe se há condição que exija restrição de carga");
      linhas.push(lnf);
    }
    // entregáveis
    function entregas(lista, sec) {
      var falt = lista.filter(function (x) { return P[x[0]] === "nao"; }), sem = lista.filter(function (x) { return !P[x[0]]; });
      var l = A.linha({ id: "ent", grupo: G4, criterio: "Conteúdo mínimo do relatório", secao: sec, exigido: lista.length + " itens", resultado: (lista.length - falt.length - sem.length) + " de " + lista.length });
      if (falt.length) A.marcar(l, "nao_conforme", "faltam: " + falt.map(function (x) { return x[1].split(")")[0] + ")"; }).join(", "));
      if (sem.length) A.marcar(l, "pendente", "não informados: " + sem.map(function (x) { return x[1].split(")")[0] + ")"; }).join(", "));
      linhas.push(l);
    }
    if (tipo === "extraordinaria") entregas(ENT_EXT, "5.4.2");
    if (tipo === "especial") entregas(ENT_ESP, "5.5.2");
    if (tipo === "intermediaria") {
      var li = A.linha({ id: "ent", grupo: G4, criterio: "Relatório com a anomalia, sua evolução e providências", secao: "5.6.2", exigido: "sim", resultado: P.i_rel === "sim" ? "sim" : P.i_rel === "nao" ? "não" : "—" });
      if (P.i_rel === "nao") A.marcar(li, "nao_conforme", "o relatório deve descrever a anomalia, sua evolução e as providências"); else if (P.i_rel !== "sim") A.marcar(li, "pendente", "informe");
      linhas.push(li);
    }
    if ((tipo === "extraordinaria" || tipo === "intermediaria") && !String(P.motivo || "").trim()) avisos.push("Descreva o fato gerador / a anomalia monitorada (4.2.3; 4.2.5).");

    // classificação e avisos
    var vao = num(P.vao);
    var classeObra = P.estrutura === "passarela" ? "Passarela (3.4)" : ok(vao) ? (vao > 6 ? "Ponte (vão livre > 6 m, 3.1)" : "Pontilhão (vão livre ≤ 6 m, 3.2)") : "Ponte / viaduto";
    if (P.sistema === "outro") avisos.push("A metodologia se aplica a estruturas de concreto, aço ou mistas aço-concreto (1).");
    if (ok(nFinal) && ok(nTodos) && nTodos < nFinal) avisos.push("Há elemento sem função estrutural com nota " + nTodos + ", menor que a nota final " + nFinal + " (que considera só os estruturais, Anexo C).");
    if (nFinal <= 2) avisos.push("Nota " + nFinal + ": " + NOTAS[nFinal][1] + " " + (nFinal === 2 ? "Inspeções intermediárias recomendáveis (Anexo C)." : "Avaliar restrição de carga, interdição, escoramento e instrumentação (Anexo C)."));
    if (nFinal <= 2 && tipo !== "especial") avisos.push("Nas conclusões, avaliar a necessidade de inspeção especial para esclarecer o diagnóstico (5.4.1; 4.2.4).");
    if (nFinal === 3) avisos.push("Nota 3: colocar o problema em observação sistemática e acompanhar a evolução por inspeções rotineiras (Anexo C).");

    var prox = [];
    if (data) {
      if (tipo === "rotineira" || tipo === "cadastral") prox.push(["Próxima rotineira (Quadro 1)", A.dataBR(somaAnos(data, 2))]);
      if (tipo === "especial") prox.push(["Próxima especial (Quadro 1)", A.dataBR(somaAnos(data, 5))]);
      else if (P.dataEsp) prox.push(["Próxima especial (Quadro 1)", A.dataBR(somaAnos(P.dataEsp, 5))]);
    }
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "INSPEÇÃO REGISTRADA CONFORME A PRO", texto: "Registro completo segundo a DNIT 010/2024-PRO para o tipo de inspeção." },
      RESSALVA: { titulo: "INSPEÇÃO REGISTRADA COM RESSALVAS", texto: "Registro utilizável; há pontos a corrigir ou documentar." },
      PENDENTE: { titulo: "REGISTRO DA INSPEÇÃO INCOMPLETO", texto: "Faltam informações exigidas pela PRO para o tipo de inspeção." },
      REJEITADO: { titulo: "REGISTRO DA INSPEÇÃO NÃO CONFORME", texto: "Há requisito da PRO descumprido: complementar ou refazer a inspeção/relatório." } } });
    var r = { tipo: tipo, nFinal: nFinal, nTodos: nTodos, criticos: criticos, els: els, dns: dns, ecCont: ecCont, linhas: linhas, parecer: par, classeObra: classeObra, prox: prox };
    return { tab: {}, resultados: r, avisos: avisos };
  }

  function corNota(n) { return n >= 5 ? "#2e9d5b" : n === 4 ? "#6cbf45" : n === 3 ? "#d9a520" : n === 2 ? "#e0772d" : "#c0392b"; }
  function htmlNota(r, relat) {
    var n = r.nFinal;
    if (!ok(n)) return '<div style="border:2px solid #999;padding:8px 12px;margin:4px 0 10px">Nota da estrutura: <b>—</b> (atribua notas aos elementos com função estrutural)</div>';
    var t = NOTAS[n], c = corNota(n);
    return '<div style="border:2px solid ' + c + ';' + (relat ? "padding:6px 9px;margin:6px 0" : "border-radius:8px;padding:10px 14px;margin:4px 0 12px") + '">' +
      '<div style="font-size:' + (relat ? "14px" : "1.25em") + ';font-weight:bold;color:' + c + '">NOTA DA ESTRUTURA: ' + n + " — " + esc(t[2].toUpperCase()) + "</div>" +
      "<div><b>Classificação (Anexo C):</b> " + esc(t[3]) + "</div><div><b>Danos / insuficiência:</b> " + esc(t[0]) + "</div><div><b>Ação corretiva:</b> " + esc(t[1]) + "</div>" +
      "<div style=\"margin-top:3px;opacity:.85\">Menor nota dos elementos com função estrutural (Anexo C, Obs.; a nota oficial é calculada pelo SGE). Elemento(s) determinante(s): " +
      esc(r.criticos.map(function (o) { return (o.tramo ? "T" + o.tramo + " " : "") + o.elem; }).join("; ")) + ".</div></div>";
  }
  function tabElementos(r, relat) {
    if (!r.els.length) return "";
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Tramo</th><th style="text-align:left">Região / família</th><th style="text-align:left">Elemento</th><th>Estrutural</th><th>Nota</th><th style="text-align:left">Condição (Anexo C)</th><th>Danos (EC mín.)</th></tr></thead><tbody>' +
      r.els.map(function (o) {
        var ds = r.dns.filter(function (x) { return chave(x) === chave(o) && x.valido; });
        var ecm = ds.length ? Math.min.apply(null, ds.map(function (x) { return x.ec; })) : NaN;
        return '<tr><td style="text-align:left">' + esc(o.tramo) + '</td><td style="text-align:left">' + esc([o.reg, o.fam].filter(Boolean).join(" / ")) + '</td><td style="text-align:left">' + esc(o.elem) + "</td><td>" + (o.estr ? "sim" : "não") +
          "</td><td><b" + (relat ? "" : ' style="color:' + corNota(o.nota) + '"') + ">" + (o.valido ? o.nota : "?") + '</b></td><td style="text-align:left">' + (o.valido ? esc(NOTAS[o.nota][2]) : "—") + "</td><td>" + (ds.length ? ds.length + " (EC " + ecm + ")" : "—") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function tabDanos(r, relat) {
    if (!r.dns.length) return "";
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Elemento</th><th style="text-align:left">Dano</th><th>Ext. rel. (%)</th><th style="text-align:left">Estado de condição (Tabela D1)</th><th style="text-align:left">Insuficiência / causa provável</th></tr></thead><tbody>' +
      r.dns.map(function (o) {
        return '<tr><td style="text-align:left">' + esc((o.tramo ? "T" + o.tramo + " " : "") + o.elem) + '</td><td style="text-align:left">' + esc(o.dano) + (o.quant ? " (" + esc(o.quant) + ")" : "") + "</td><td>" + (ok(o.ext) ? fmt(o.ext, 0) : "—") +
          '</td><td style="text-align:left">' + (o.valido ? "EC " + o.ec + " — " + esc(EC[o.ec]) : "—") + '</td><td style="text-align:left">' + esc([o.insuf, o.causa].filter(Boolean).join(" / ") || "—") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function grafico(calc, d, opt) {
    var r = calc.resultados, els = r.els.filter(function (o) { return o.valido; }), imp = opt.imprimir;
    if (!els.length) return '<div class="fe-graf-vazio">O gráfico aparece com as notas dos elementos.</div>';
    var txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ccc" : "var(--border)";
    var W = 620, L = 210, h = 16, top = 26, H = top + els.length * (h + 4) + 24, wN = W - L - 30;
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + (W / 2) + '" y="13" text-anchor="middle" fill="' + txt + '">Nota técnica por elemento (Anexo C) — nota final ' + (ok(r.nFinal) ? r.nFinal : "—") + "</text>";
    for (var n = 0; n <= 5; n++) {
      var x = L + n / 5 * wN;
      s += '<line x1="' + x + '" y1="' + (top - 4) + '" x2="' + x + '" y2="' + (H - 18) + '" stroke="' + grade + '"/><text x="' + x + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">' + n + "</text>";
    }
    els.forEach(function (o, i) {
      var y = top + i * (h + 4), lab = ((o.tramo ? "T" + o.tramo + " · " : "") + o.elem).slice(0, 36);
      s += '<text x="' + (L - 6) + '" y="' + (y + 12) + '" text-anchor="end" fill="' + txt + '">' + esc(lab) + (o.estr ? "" : " *") + "</text>";
      s += '<rect x="' + L + '" y="' + y + '" width="' + (o.nota / 5 * wN) + '" height="' + h + '" fill="' + corNota(o.nota) + '" opacity="' + (o.estr ? 0.9 : 0.45) + '"><title>' + esc(o.elem) + ": nota " + o.nota + "</title></rect>";
      s += '<text x="' + (L + o.nota / 5 * wN + 4) + '" y="' + (y + 12) + '" fill="' + txt + '">' + o.nota + "</text>";
    });
    return s + '<text x="4" y="' + (H - 6) + '" fill="' + txt + '" font-size="9">* sem função estrutural</text></svg>';
  }

  function linhasEl(rows) { return rows.map(function (x) { return { tramo: x[0], reg: x[1], fam: x[2], elem: x[3], estr: x[4], nota: x[5] }; }); }
  function linhasDn(rows) { return rows.map(function (x) { return { tramo: x[0], reg: x[1], fam: x[2], elem: x[3], dano: x[4], quant: x[5], local: x[6], ext: x[7], ec: x[8], insuf: x[9], causa: x[10] }; }); }
  function itensOk(v) { var o = {}; ITENS.forEach(function (x) { o[x[0]] = v; }); return o; }

  FE.FICHAS[ID] = {
    titulo: "Inspeção de ponte, viaduto ou passarela",
    lote: true,
    resumo: "Ficha de inspeção (Anexos A e B): tipo e periodicidade (Quadro 1), elementos observados (5.1.1–5.1.12), fotos (mínimo 6), nota técnica 1–5 por elemento (Anexo C), danos com extensão relativa e estado de condição EC 1–4 (Anexo D), insuficiências e causas, laudo; nota final da estrutura = menor nota dos elementos estruturais, com classificação e ação corretiva, e parecer do registro.",
    rotuloImportar: function (r) { return "nota " + (ok(r.nFinal) ? r.nFinal + " (" + NOTAS[r.nFinal][2] + ")" : "—") + " · " + (r.tipo || ""); },
    params: params,
    padrao: { tipo: "rotineira", estrutura: "ponte", sistema: "ca" },
    tabelas: function () {
      return [
        { chave: "elem", titulo: "Nota técnica por elemento (Anexo B item 2; Anexo C)", rotulo: "Elemento", iniciais: 6, min: 1, dica: "uma coluna por elemento individual (repetir por tramo)",
          linhas: [{ k: "tramo", r: "Nº do tramo", texto: true }, { k: "reg", r: "Região (superestrutura, mesoestrutura, infraestrutura, pista/acessórios)", texto: true },
            { k: "fam", r: "Família de elementos", texto: true }, { k: "elem", r: "Elemento individual", texto: true },
            { k: "estr", r: "Função estrutural? (sim/não)", texto: true, ph: "sim" }, { k: "nota", r: "Nota técnica (1 a 5)", u: "" }] },
        { chave: "dano", titulo: "Danos aos elementos e insuficiências estruturais (Anexo B itens 3 e 4; Anexo D)", rotulo: "Dano", iniciais: 3, min: 0, dica: "um dano por coluna, relacionado ao elemento em que foi encontrado (mesmo tramo e nome do elemento)",
          linhas: [{ k: "tramo", r: "Nº do tramo", texto: true }, { k: "reg", r: "Região", texto: true }, { k: "fam", r: "Família de elementos", texto: true }, { k: "elem", r: "Elemento individual", texto: true },
            { k: "dano", r: "Dano", texto: true }, { k: "quant", r: "Quantidade", texto: true }, { k: "local", r: "Localização / coordenadas X, Y, Z", texto: true },
            { k: "ext", r: "Extensão relativa", u: "%" }, { k: "ec", r: "Estado de condição EC (1 severo a 4 bom)", u: "" },
            { k: "insuf", r: "Insuficiência estrutural (item 4)", texto: true }, { k: "causa", r: "Causa provável (item 4)", texto: true }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return htmlNota(r) + A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(r.classeObra, "Classificação da obra") +
        A.cartao(r.els.length + " / " + r.dns.length, "Elementos avaliados / danos registrados") +
        A.cartao("EC1 " + r.ecCont[1] + " · EC2 " + r.ecCont[2] + " · EC3 " + r.ecCont[3] + " · EC4 " + r.ecCont[4], "Danos por estado de condição (Tabela D1)") +
        (r.prox.length ? A.cartao(r.prox.map(function (p) { return p[1]; }).join(" · "), r.prox.map(function (p) { return p[0]; }).join(" · ")) : "") + "</div>" +
        '<h4 style="margin:12px 0 4px">Elementos</h4>' + tabElementos(r) + (r.dns.length ? '<h4 style="margin:12px 0 4px">Danos</h4>' + tabDanos(r) : "") +
        '<h4 style="margin:12px 0 4px">Verificações do registro</h4>' + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: function (calc, d, opt) { return [grafico(calc, d, opt || {})]; },
    relatorio: {
      notas: "DNIT 010/2024-PRO. Nota técnica de 1 a 5 por elemento conforme o Quadro do Anexo C; nota final da estrutura adotada como a menor nota dos elementos com função estrutural (alternativa admitida no Anexo C — a nota oficial é calculada pelo SGE). Estados de condição dos danos pela Tabela D1 (modelo genérico; as tabelas por elemento constam da documentação do SGE). Periodicidade: rotineira a cada 2 anos, especial a cada 5 anos (Quadro 1).",
      resultados: function (calc) {
        var r = calc.resultados, t = ok(r.nFinal) ? NOTAS[r.nFinal] : null;
        var rows = [["Nota da estrutura (Anexo C)", ok(r.nFinal) ? r.nFinal + " — " + t[2] : "—"], ["Classificação", t ? t[3] : "—"], ["Ação corretiva", t ? t[1] : "—"],
          ["Registro da inspeção", r.parecer.titulo], ["Tipo de obra", r.classeObra], ["Danos por EC", "EC1 " + r.ecCont[1] + " · EC2 " + r.ecCont[2] + " · EC3 " + r.ecCont[3] + " · EC4 " + r.ecCont[4]]];
        r.prox.forEach(function (p) { rows.push(p); });
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return htmlNota(r, true) + A.htmlParecer(r.parecer, { relat: true }) + "<h2>Elementos e notas</h2>" + tabElementos(r, true) + (r.dns.length ? "<h2>Danos e estados de condição</h2>" + tabDanos(r, true) : "") +
          "<h2>Verificações do registro</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Rotineira — ponte em concreto armado, 3 tramos, nota 4", dados: function () {
        return { ident: { registro: "OAE-001/2026", data: "2026-05-14", obra: "BR-000 — km 45,2", local: "Ponte sobre o Rio A", laboratorista: "Inspetor A", responsavel: "Engenheiro A" },
          params: Object.assign({ tipo: "rotineira", codigo: "OAE-000-045", nome: "Ponte sobre o Rio A", estrutura: "ponte", sistema: "ca", vao: "18,0", comp: "54,0", larg: "12,8", nTramos: "3",
            dataAnt: "2024-06-03", dataEsp: "2022-08-20", cadastro: "sim", interv: "nao", fotos: "42", vistas: "sim", notif: "na" }, itensOk("ok"), { i513: "ok", i5112: "na" }),
          elem: linhasEl([["1", "Superestrutura", "Vigas", "Longarina V1", "sim", "4"], ["1", "Superestrutura", "Lajes", "Laje do tabuleiro", "sim", "4"],
            ["1", "Mesoestrutura", "Pilares", "Pilar P1", "sim", "5"], ["1", "Mesoestrutura", "Aparelhos de apoio", "Aparelho AP1", "sim", "4"],
            ["1", "Infraestrutura", "Encontros", "Encontro E1", "sim", "5"], ["1", "Pista e acessórios", "Juntas", "Junta J1", "não", "4"], ["1", "Pista e acessórios", "Guarda-corpos", "Guarda-corpo LD", "não", "4"]]),
          dano: linhasDn([["1", "Superestrutura", "Vigas", "Longarina V1", "Eflorescência", "2 pontos", "face inferior, meio do vão", "5", "3", "", "drenagem deficiente"],
            ["1", "Superestrutura", "Lajes", "Laje do tabuleiro", "Infiltração", "1", "junto ao buzinote", "3", "3", "", "ausência de pingadeira"],
            ["1", "Mesoestrutura", "Aparelhos de apoio", "Aparelho AP1", "Distorção excessiva", "1 un.", "apoio E1", "10", "2", "", "detritos acumulados"],
            ["1", "Pista e acessórios", "Juntas", "Junta J1", "Perda de vedação", "12 m", "junta sobre P1 (abertura 32 mm a 24 °C)", "40", "2", "", "desgaste"]]) };
      } },
      { nome: "Rotineira atrasada — pilar com armadura corroída (nota 2), registro incompleto", dados: function () {
        return { ident: { registro: "OAE-014/2026", data: "2026-07-09", obra: "BR-000 — km 112", local: "Viaduto B" },
          params: Object.assign({ tipo: "rotineira", codigo: "OAE-000-112", nome: "Viaduto B", estrutura: "ponte", sistema: "ca", vao: "22", nTramos: "2",
            dataAnt: "2023-02-10", cadastro: "nao", interv: "nao", anexoA: "", fotos: "4", vistas: "nao", notif: "" }, itensOk("ok"), { i513: "na", i516: "nao", i5111: "" }),
          elem: linhasEl([["1", "Superestrutura", "Vigas", "Viga V2", "sim", "3"], ["1", "Mesoestrutura", "Pilares", "Pilar P2", "sim", "2"],
            ["2", "Superestrutura", "Lajes", "Laje do tabuleiro", "sim", "5"], ["2", "Infraestrutura", "Blocos", "Bloco B2", "sim", ""]]),
          dano: linhasDn([["1", "Mesoestrutura", "Pilares", "Pilar P2", "Armadura exposta e corroída", "3 barras", "base do pilar, face montante", "25", "1", "perda de seção de armadura", "cobrimento deficiente"],
            ["2", "Superestrutura", "Lajes", "Laje do tabuleiro", "Fissuras", "", "balanço LE", "", "2", "", ""]]) };
      } },
    ],
  };
})();
