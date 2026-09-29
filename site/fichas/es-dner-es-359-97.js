/*
 * Ficha de aceitação — DNER-ES 359/97 Edificações — Instalações de esgoto e águas pluviais.
 * Usa FE.aceitacaoG10b (definido em es-dner-es-353-97.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var sim = G.se;
  // 5.4.2: declividade mínima dos ramais de esgoto e subcoletores por diâmetro; diâmetro entre dois tabelados → o da linha do menor (mais exigente)
  var DECL = [[100, 2.0], [125, 1.2], [150, 0.7], [200, 0.5], [250, 0.4]];
  function declMin(dn) {
    if (!ok(dn)) return NaN;
    var sel = DECL[0];
    DECL.forEach(function (x) { if (dn >= x[0] - 1e-9) sel = x; });
    return sel[1];
  }
  function pFumaca(P) { var p = num((P || {}).pFumaca); return ok(p) ? p : 25; }
  // declividade 1:300 a 1:500 → 0,20 % a 0,333 %
  var D500 = 100 / 500, D300 = 100 / 300;
  function faixa(v, a, b, nome, u, casas, f) {
    if (!ok(v)) return;
    if ((ok(a) && v < a - 1e-9) || (ok(b) && v > b + 1e-9))
      f.push({ txt: nome + " " + fmt(v, casas) + " " + u + " fora de " + (ok(a) && ok(b) ? fmt(a, casas) + " a " + fmt(b, casas) : ok(a) ? "≥ " + fmt(a, casas) : "≤ " + fmt(b, casas)) + " " + u });
  }

  var F = G.ficha({
    id: "dner-es-359-97",
    titulo: "Instalações de esgoto e águas pluviais (DNER-ES 359/97) — aceitação",
    resumo: "Inspeção das canalizações de esgoto e águas pluviais, ventilação e disposição do efluente (seções 5 e 6) — declividades mínimas " +
      "(5.4, Tabela do 5.4.2), recobrimento, grelhas, ventiladores, fossa, valas de infiltração/filtração e sumidouros — e provas da verificação final " +
      "(7.3.1): água ou ar ≥ 3,0 m c.a. antes dos aparelhos e fumaça ≥ 25,0 m c.a. depois, por 15 min cada.",
    lote: false,
    params: [
      { k: "nUnid", r: "Nº de unidades de serviço do lote", dica: "medição por unidade de serviço executado (seção 8)" },
      { k: "pFumaca", r: "Pressão mínima da prova de fumaça (m c.a.)", ph: "25,0", dica: "7.3.1 da ES: 25,0 m de coluna d'água (ver nota do relatório)" },
      G.sel("aparente", "Há colunas não embutidas (chaminés falsas / shafts)? (5.1)"),
      G.sel("enterrada", "Há canalizações enterradas? (5.3)"),
      G.sel("lajeUtil", "Há ventilador acima de laje utilizada para outros fins? (5.17.4)"),
      G.sel("fossa", "Há fossa séptica? (5.18/5.19)"),
      G.sel("infilt", "Há valas de infiltração? (5.22)"),
      G.sel("intermit", "Valas de infiltração alimentadas intermitentemente (tanque fluxível)? (5.22.2)"),
      G.sel("sumid", "Há sumidouros? (5.23)"),
      G.sel("filtr", "Há valas de filtração? (5.24)"),
      { k: "pessoas", r: "Nº de pessoas (ou equivalente) atendidas pela fossa", dica: "5.24.4: extensão mínima das valas de filtração = 8,0 m por pessoa" },
    ],
    padrao: { pFumaca: "25,0", aparente: "nao", lajeUtil: "nao", enterrada: "sim", fossa: "nao", infilt: "nao", intermit: "nao", sumid: "nao", filtr: "nao" },
    providencias: G.providencias("7.4.3"),
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto e códigos/posturas dos órgãos competentes", secao: "4.1", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "colunas", grupo: "Canalizações", texto: "Colunas embutidas (ou em espaços previstos, com braçadeiras); passagens na estrutura previstas antes da concretagem", secao: "5.1/5.2",
        tipo: "sim_nao", exigido: "5.1 e 5.2 atendidos" },
      { id: "bracad", grupo: "Canalizações", texto: "Espaçamento das braçadeiras das colunas não embutidas", secao: "5.1", tipo: "valor", unid: "m", casas: 2, max: 3.0,
        se: sim("aparente"), metodo: "trena", exigido: "de 3,0 m em 3,0 m, no mínimo (≤ 3,0 m)" },
      { id: "recVia", grupo: "Canalizações", texto: "Recobrimento das canalizações enterradas sob o leito de vias trafegáveis", secao: "5.3", tipo: "valor", unid: "m", casas: 2, min: 0.5,
        se: sim("enterrada"), metodo: "trena" },
      { id: "recOut", grupo: "Canalizações", texto: "Recobrimento das canalizações enterradas nos demais casos", secao: "5.3", tipo: "valor", unid: "m", casas: 2, min: 0.3,
        se: sim("enterrada"), metodo: "trena" },
      { id: "assent", grupo: "Canalizações", texto: "Enterradas em terreno resistente ou embasamento; proteção ou ferro fundido sob pressões/choques ou sob edificações", secao: "5.3",
        tipo: "sim_nao", se: sim("enterrada"), exigido: "5.3 atendido" },
      { id: "descarga", grupo: "Canalizações", texto: "Declividade dos ramais de descarga", secao: "5.4.1", tipo: "valor", unid: "%", casas: 1, min: 2.0, metodo: "nível / trena" },
      { id: "local", grupo: "Canalizações", texto: "Nenhuma canalização imediatamente acima de reservatórios de água, depósitos de gelo ou de alimentos", secao: "5.5", tipo: "sim_nao",
        exigido: "5.5 atendido" },
      { id: "bolsas", grupo: "Canalizações", texto: "Tubos com a bolsa voltada contra o sentido do escoamento", secao: "5.6", tipo: "sim_nao", exigido: "bolsas a montante" },
      { id: "inspec", grupo: "Canalizações", texto: "Elementos de inspeção e desobstrução: caixas/peças de inspeção, sifões visitáveis, visitas nos tubos de queda", secao: "5.7/5.9 a 5.11",
        tipo: "sim_nao", exigido: "5.7 e 5.9 a 5.11 atendidos" },
      { id: "bujoes", grupo: "Canalizações", texto: "Extremidades livres vedadas com bujões ou plugues (não buchas de madeira ou papel); condutores pluviais protegidos de detritos",
        secao: "5.8", tipo: "sim_nao", exigido: "bujões/plugues apertados" },
      { id: "emendas", grupo: "Canalizações", texto: "Emendas conforme os materiais; cimento-amianto só na ventilação; cerâmica vidrada só enterrada nas condições do 5.14",
        secao: "5.12 a 5.14/7.2.1", tipo: "sim_nao", exigido: "5.12 a 5.14 atendidos" },
      { id: "grelhas", grupo: "Canalizações", texto: "Relação soma das seções dos furos da grelha / seção do conduto ou ramal", secao: "5.15", tipo: "valor", unid: "", casas: 2, min: 1.0,
        metodo: "medição / catálogo", exigido: "≥ 1,00 (soma dos furos ≥ seção do conduto)" },
      { id: "vent", grupo: "Ventilação", texto: "Tubos de queda ventilados na cobertura; ligação do ventilador acima do eixo da horizontal; colunas verticais, desvios com curvas < 90°",
        secao: "5.17 a 5.17.3", tipo: "sim_nao", exigido: "sem possibilidade de gases entrarem no prédio" },
      { id: "vNivel", grupo: "Ventilação", texto: "Elevação do tubo ventilador acima do nível máximo d'água do aparelho mais alto, antes de desenvolver-se na horizontal", secao: "5.17.2",
        tipo: "valor", unid: "cm", casas: 0, min: 15, metodo: "trena" },
      { id: "vTelh", grupo: "Ventilação", texto: "Altura do ventilador acima da cobertura — telhado ou laje simples", secao: "5.17.4", tipo: "valor", unid: "m", casas: 2, min: 0.30,
        metodo: "trena" },
      { id: "vLaje", grupo: "Ventilação", texto: "Altura do ventilador acima da cobertura — laje utilizada para outros fins (protegido)", secao: "5.17.4", tipo: "valor", unid: "m", casas: 2,
        min: 2.0, se: sim("lajeUtil"), metodo: "trena", exigido: "≥ 2,00 m, com proteção contra choques" },
      { id: "fossaI", grupo: "Fossa séptica e disposição do efluente", texto: "Fossa de tipo e material previstos; fácil ligação ao coletor público; acesso para remoção do lodo; sem comprometer mananciais e prédios",
        secao: "5.18/5.19 a, b, d", tipo: "sim_nao", se: sim("fossa"), exigido: "5.18 e 5.19 atendidos" },
      { id: "fMan", grupo: "Fossa séptica e disposição do efluente", texto: "Afastamento da fossa séptica a qualquer manancial", secao: "5.19 c", tipo: "valor", unid: "m", casas: 1, min: 20.0,
        se: sim("fossa"), metodo: "trena" },
      { id: "infI", grupo: "Fossa séptica e disposição do efluente", texto: "Valas de infiltração: tubos com juntas livres, envoltório de brita/pedregulho, papel alcatroado antes do enchimento",
        secao: "5.22/5.22.1", tipo: "sim_nao", se: sim("infilt"), exigido: "5.22 e 5.22.1 atendidos" },
      { id: "sumI", grupo: "Fossa séptica e disposição do efluente", texto: "Sumidouros: paredes com juntas livres ou anéis furados; laje no nível do terreno com tampão hermético; não atingem o lençol freático",
        secao: "5.23 a 5.23.3", tipo: "sim_nao", se: sim("sumid"), exigido: "5.23 atendido" },
      { id: "sAbert", grupo: "Fossa séptica e disposição do efluente", texto: "Menor dimensão da abertura de inspeção dos sumidouros", secao: "5.23.1", tipo: "valor", unid: "m", casas: 2, min: 0.60,
        se: sim("sumid"), metodo: "trena" },
      { id: "filI", grupo: "Fossa séptica e disposição do efluente", texto: "Valas de filtração: camadas (areia grossa, cascalho/brita), papel alcatroado, caixas de inspeção nos terminais, distribuição equitativa",
        secao: "5.24/5.24.1/5.24.3", tipo: "sim_nao", se: sim("filtr"), exigido: "5.24 atendido" },
      { id: "ambiente", grupo: "Manejo ambiental", texto: "Sem risco a mananciais, águas receptoras, balneabilidade, águas subterrâneas e solo; sem odores ou insetos", secao: "6.1 a 6.6",
        tipo: "sim_nao", exigido: "seção 6 atendida" },
      { id: "embal", grupo: "Inspeção", texto: "Materiais recebidos nas embalagens originais invioladas", secao: "7.1.1", tipo: "sim_nao", exigido: "embalagens invioladas" },
      { id: "cotas", grupo: "Inspeção", texto: "Cotas, alinhamentos e dimensões conforme o projeto", secao: "7.2.2", tipo: "sim_nao", exigido: "conforme o projeto" },
    ],
    medicoes: [
      { id: "declRam", apos: "descarga", grupo: "Canalizações", texto: "Declividade dos ramais de esgoto e subcoletores (por diâmetro)", secao: "5.4.2", metodo: "nível / trena",
        exigido: "DN ≤ 100: 2,0 % · 125: 1,2 % · 150: 0,7 % · 200: 0,5 % · ≥ 250: 0,4 %",
        colunas: [{ k: "dn", r: "Diâmetro do tubo", u: "mm" }, { k: "i", r: "Declividade medida", u: "%" }],
        checar: function (c) {
          var dn = num(c.dn), i = num(c.i);
          if (!ok(dn) || !ok(i)) return { falta: "informe o diâmetro e a declividade" };
          var m = declMin(dn);
          return { falhas: i < m - 1e-9 ? [{ txt: "DN " + fmt(dn, 0) + ": " + fmt(i, 2) + " % < " + fmt(m, 1) + " %" }] : [] };
        } },
      { id: "vJanela", apos: "vLaje", grupo: "Ventilação", texto: "Ventilador a menos de 4,0 m de janela ou porta: elevação acima da verga", secao: "5.17.5", metodo: "trena",
        exigido: "distância < 4,0 m → ≥ 1,0 m acima da verga",
        colunas: [{ k: "dist", r: "Distância à janela/porta", u: "m" }, { k: "elev", r: "Elevação acima da verga", u: "m" }],
        checar: function (c) {
          var dd = num(c.dist), e = num(c.elev);
          if (!ok(dd)) return { falta: "informe a distância" };
          if (dd >= 4 - 1e-9) return { falhas: [] };
          if (!ok(e)) return { falta: "a menos de 4,0 m: informe a elevação acima da verga" };
          return { falhas: e < 1 - 1e-9 ? [{ txt: "a " + fmt(dd, 1) + " m da abertura, elevação de " + fmt(e, 2) + " m < 1,0 m" }] : [] };
        } },
      { id: "valasI", apos: "infI", grupo: "Fossa séptica e disposição do efluente", texto: "Dimensões das valas de infiltração", secao: "5.22/5.22.2/5.22.3",
        se: sim("infilt"), minimo: 2, regra: "todas as valas (mín. 2)", rotulo: "Vala", rotuloLocal: "Vala nº / local", metodo: "trena / nível",
        exigido: function (P) {
          return "profundidade 0,4 a 0,9 m · largura ≥ 0,5 m · tubo Ø ≥ 0,1 m · comprimento ≤ 30,0 m · espaçamento ≥ 1,0 m · mín. 2 valas" +
            (P.intermit === "sim" ? " · declividade 1:300 a 1:500 (0,20 a 0,33 %)" : "");
        },
        colunas: [{ k: "prof", r: "Profundidade", u: "m" }, { k: "larg", r: "Largura", u: "m" }, { k: "diam", r: "Diâmetro do tubo", u: "m" },
          { k: "comp", r: "Comprimento", u: "m" }, { k: "esp", r: "Espaçamento à vala vizinha", u: "m" }, { k: "decl", r: "Declividade do tubo", u: "%" }],
        checar: function (c, P) {
          var f = [];
          if (!ok(num(c.prof)) || !ok(num(c.larg)) || !ok(num(c.comp))) return { falta: "informe profundidade, largura e comprimento" };
          faixa(num(c.prof), 0.4, 0.9, "profundidade", "m", 2, f);
          faixa(num(c.larg), 0.5, NaN, "largura", "m", 2, f);
          faixa(num(c.diam), 0.1, NaN, "diâmetro", "m", 2, f);
          faixa(num(c.comp), NaN, 30, "comprimento", "m", 1, f);
          faixa(num(c.esp), 1.0, NaN, "espaçamento", "m", 2, f);
          if (P.intermit === "sim") {
            if (!ok(num(c.decl))) return { falta: "alimentação intermitente: informe a declividade" };
            faixa(num(c.decl), D500, D300, "declividade", "%", 2, f);
          }
          return { falhas: f };
        },
        todas: function (rows) { return rows.length && rows.length < 2 ? [{ txt: "só " + rows.length + " vala de infiltração (mínimo de duas, 5.22.3)" }] : []; } },
      { id: "valasF", apos: "filI", grupo: "Fossa séptica e disposição do efluente", texto: "Dimensões das valas de filtração", secao: "5.24/5.24.2/5.24.4",
        se: sim("filtr"), minimo: 2, regra: "todas as valas (mín. 2)", rotulo: "Vala", rotuloLocal: "Vala nº / local", metodo: "trena / nível",
        exigido: "profundidade 1,2 a 1,5 m · soleira 0,5 m · tubos Ø 0,10 m · declividade 1:300 a 1:500 · extensão total ≥ 8,0 m por pessoa · mín. 2 valas",
        colunas: [{ k: "prof", r: "Profundidade", u: "m" }, { k: "larg", r: "Largura na soleira", u: "m" }, { k: "diam", r: "Diâmetro dos tubos", u: "m" },
          { k: "decl", r: "Declividade dos tubos", u: "%" }, { k: "comp", r: "Extensão", u: "m" }],
        checar: function (c) {
          var f = [];
          if (!ok(num(c.prof)) || !ok(num(c.comp)) || !ok(num(c.decl))) return { falta: "informe profundidade, declividade e extensão" };
          faixa(num(c.prof), 1.2, 1.5, "profundidade", "m", 2, f);
          faixa(num(c.larg), 0.5, NaN, "largura na soleira", "m", 2, f);
          faixa(num(c.diam), 0.1, NaN, "diâmetro", "m", 2, f);
          faixa(num(c.decl), D500, D300, "declividade", "%", 2, f);
          return { falhas: f };
        },
        todas: function (rows, P) {
          var f = [], n = num(P.pessoas), tot = rows.reduce(function (s, c) { var v = num(c.comp); return s + (ok(v) ? v : 0); }, 0);
          if (rows.length && rows.length < 2) f.push({ txt: "só " + rows.length + " vala de filtração (mínimo de duas por fossa, 5.24.4)" });
          if (rows.length && !ok(n)) f.push({ sit: "pendente", txt: "informe o nº de pessoas atendidas para conferir a extensão mínima (5.24.4)" });
          else if (rows.length && tot < 8 * n - 1e-9) f.push({ txt: "extensão total " + fmt(tot, 1) + " m < 8,0 m × " + fmt(n, 0) + " pessoas = " + fmt(8 * n, 1) + " m" });
          return f;
        } },
      G.prova({ id: "provaAgua", grupo: "Verificação final", texto: "Prova com água ou ar comprimido (antes da instalação dos aparelhos)", secao: "7.3.1",
        unid: "m c.a.", casas: 1, pMin: 3.0, durMin: 15, durUnid: "min", metodo: "coluna d'água / manômetro" }),
      G.prova({ id: "provaFumaca", grupo: "Verificação final", texto: "Prova de fumaça (depois da colocação dos aparelhos)", secao: "7.3.1",
        unid: "m c.a.", casas: 1, pMin: pFumaca, durMin: 15, durUnid: "min", metodo: "máquina de fumaça / manômetro",
        regra: "todas as tubulações, depois da colocação dos aparelhos" }),
    ],
    notas: "DNER-ES 359/97: aceitação condicionada ao atendimento das exigências (7.4.1); trabalhos em desacordo são rejeitados e refeitos pela construtora (7.4.2/7.4.3). " +
      "Declividade dos ramais de esgoto e subcoletores pela tabela do 5.4.2; diâmetro entre dois valores tabelados: vale a declividade do menor diâmetro (mais exigente). " +
      "Provas (7.3.1): água ou ar ≥ 3,0 m c.a. e fumaça ≥ 25,0 m c.a. (valor impresso na ES; a prova de fumaça usual é de 25 mm c.a. — confira o valor contratual), 15 min cada, " +
      "sem queda de pressão nem vazamento. Declividade 1:300 a 1:500 = 0,20 % a 0,33 %.",
  });

  F.exemplos = [
    { nome: "Lote aceito — esgoto e águas pluviais do bloco com fossa e valas de infiltração (Obra A)", dados: function () {
      return G.dados(F, { ident: { registro: "ESG-01", data: "2026-08-29", obra: "Obra A — edifício administrativo", local: "Bloco 1 — sanitários, copa e cobertura",
          camada: "PVC esgoto série normal; fossa de câmara única" },
        params: { nUnid: "1", fossa: "sim", infilt: "sim", lajeUtil: "sim" },
        verif: {},
        recVia: [{ est: "Travessia do estacionamento", v: "0,55" }],
        recOut: [{ est: "Coletor até a fossa", v: "0,40" }, { est: "Caixa de inspeção 2", v: "0,35" }],
        descarga: [{ est: "Lavatórios", v: "2,5" }, { est: "Pia da copa", v: "2,0" }],
        declRam: [{ local: "Ramal sanitário masc.", dn: "100", i: "2,0" }, { local: "Subcoletor", dn: "150", i: "1,0" }, { local: "Coletor predial", dn: "150", i: "0,8" }],
        grelhas: [{ est: "Ralo sanitário", v: "1,20" }, { est: "Calha — ralo 1", v: "1,05" }],
        vNivel: [{ est: "Ventilador sanitário", v: "20" }],
        vTelh: [{ est: "Tubo de queda TQ-1", v: "0,40" }, { est: "Coluna de ventilação CV-1", v: "0,35" }],
        vLaje: [{ est: "Ventilador da laje técnica", v: "2,10" }],
        vJanela: [{ local: "TQ-1", dist: "3,2", elev: "1,10" }, { local: "CV-1", dist: "6,0" }],
        fMan: [{ est: "Fossa", v: "35,0" }],
        valasI: [{ local: "Vala 1", prof: "0,60", larg: "0,50", diam: "0,10", comp: "18,0", esp: "1,50" }, { local: "Vala 2", prof: "0,65", larg: "0,55", diam: "0,10", comp: "18,0", esp: "1,50" }],
        provaAgua: [{ local: "Ramais e subcoletores", p: "3,0", t: "15", queda: "0", vaz: "N" }, { local: "Tubos de queda", p: "3,2", t: "20", queda: "0", vaz: "N" }],
        provaFumaca: [{ local: "Instalação completa", p: "25,0", t: "15", queda: "0", vaz: "N" }] });
    } },
    { nome: "Lote rejeitado — subcoletor com declividade baixa e vazamento na prova (Obra B)", dados: function () {
      return G.dados(F, { ident: { registro: "ESG-02", data: "2026-09-11", obra: "Obra B — posto de pesagem", local: "Vestiários e alojamento",
          camada: "PVC esgoto" },
        params: { nUnid: "1" },
        verif: { bolsas: { real: "10", nc: "1", obs: "trecho do vestiário com bolsa a jusante" } },
        recVia: [{ est: "Acesso", v: "0,50" }],
        recOut: [{ est: "Coletor", v: "0,30" }],
        descarga: [{ est: "Chuveiros", v: "2,0" }],
        declRam: [{ local: "Ramal vestiário", dn: "100", i: "1,5" }, { local: "Subcoletor", dn: "150", i: "0,7" }],
        grelhas: [{ est: "Ralo vestiário", v: "1,10" }],
        vNivel: [{ est: "Ventilador", v: "15" }],
        vTelh: [{ est: "TQ-1", v: "0,30" }],
        vJanela: [{ local: "TQ-1", dist: "2,5", elev: "0,60" }],
        provaAgua: [{ local: "Ramais", p: "3,0", t: "15", queda: "0,2", vaz: "S" }],
        provaFumaca: [{ local: "Instalação completa", p: "25,0", t: "15", queda: "0", vaz: "N" }] });
    } },
  ];
})();
