/*
 * Ficha de ES: DNER-ES 349/97 — Edificações — Impermeabilização (aceitação: seção 6 — certificado por carregamento,
 * inspeção visual, prova de carga d'água de 5 dias, estanqueidade do concreto impermeável; execução pela seção 5).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var sn = G.sn, v = G.v, ID = "dner-es-349-97";
  var sis = function (l) { return G.selecionado("sistema", l); }, loc = function (l) { return G.selecionado("local", l); };
  var feltro = sis(["feltro"]), butil = sis(["butil"]), argam = sis(["argamassa"]), membrana = sis(["feltro", "butil"]);
  var horizontal = loc(["cobertura", "piso"]);
  function nMembranas(P) { var m = num(P.modulo); return !ok(m) ? undefined : m <= 24 ? 3 : m <= 34 ? 4 : 5; }
  function espArg(P) { var h = num(P.coluna); if (!ok(h)) return 3; return h <= 10 ? 3 : 3 + Math.ceil((h - 10) / 5 - 1e-9); }

  G.ficha({
    id: ID, es: "DNER-ES 349/97", secAceit: "6.3", secRejeita: "6.3.2", secRefazer: "6.3.3", area: true, rotArea: "Área impermeabilizada em projeção (m²)",
    titulo: "Edificações — impermeabilização — aceitação",
    resumo: "Certificado de qualidade por carregamento e inspeção visual (6.1), execução por sistema (membrana de feltro asfáltico, elastômero butil, argamassa impermeável, cimento cristalizado, concreto impermeável — seção 5), prova de carga d'água por 5 dias sem fuga (6.2.1–6.2.3) e estanqueidade do concreto impermeável (6.2.4).",
    params: [
      { k: "sistema", r: "Sistema de impermeabilização (5.1)", tipo: "select", recarrega: true, opcoes: [
        ["feltro", "Membranas de feltro asfáltico (5.2.17)"], ["butil", "Membrana de elastômero butil (5.2.18)"], ["argamassa", "Argamassa impermeável (5.2.19)"],
        ["cristal", "Cimento cristalizado (5.2.16)"], ["concreto", "Concreto impermeável (5.2.15; 6.2.4)"]] },
      { k: "local", r: "Local impermeabilizado", tipo: "select", recarrega: true, opcoes: [
        ["cobertura", "Laje de cobertura (5.2.1–5.2.6)"], ["piso", "Varanda, piso de poço, área interna a revestir (6.2.1)"],
        ["reservatorio", "Reservatório (5.2.12)"], ["subsolo", "Subsolo (5.2.13)"], ["embasamento", "Embasamento / paredes ao nível do solo (5.2.14)"]] },
      { k: "nCarreg", r: "Nº de carregamentos de material recebidos (6.1.2)", dica: "um certificado de laboratório oficial por carregamento" },
      { k: "modulo", r: "Módulo construtivo (m) (5.2.17)", se: function (d) { return (d.params || {}).sistema === "feltro"; }, dica: "até 24 m: 3 membranas; 24 a 34 m: 4; > 34 m: 5" },
      { k: "coluna", r: "Pressão d'água — coluna (m) (5.2.19)", se: function (d) { return (d.params || {}).sistema === "argamassa"; },
        dica: "3,0 cm até 10 m de coluna; +1,0 cm a cada 5,0 m a mais" },
    ],
    padrao: { sistema: "feltro", local: "cobertura" },
    criterios: [
      sn("cert", "6.1.2", "Certificado de qualidade do material (laboratório oficial)", "um por carregamento que chega à obra",
        { freq: { por: "contagem", a_cada: 1, qtd: "nCarreg", unidade: "carregamento(s)", regra: "1 por carregamento" } }),
      sn("visual", "6.1.3", "Inspeção visual no recebimento", "material sem avarias, conforme especificado"),
      sn("seg", "4.2–4.5", "Segurança e mão de obra", "acesso restrito; sem calçados de sola grossa (asfaltos/elastômeros); ventilação, máscaras, equipamento sem centelha; funcionários habilitados"),
      sn("tempo", "5.2.7; 5.2.8", "Execução com tempo seco e sem umidade retida", "tempo seco e firme; sem água ou umidade sob as camadas"),
      sn("pontos", "5.2.1; 5.2.10; 5.2.11", "Juntas, rodapés, platibandas, passagens de tubos e pontos notáveis", "tratados conforme o projeto (preferência por pingadeiras/chapas de recobrimento)", { se: horizontal }),
      sn("ralos", "5.2.3; 5.2.4; 5.2.6", "Ralos e bocas de condutores", "impermeabilização sobre a gola, reforço com tecido em faixa ≥ 15 cm, até a bolsa do condutor; proteção removível", { se: horizontal }),
      sn("protec", "5.2.9", "Camada protetora sem danificar a impermeabilização", "assentamento cuidadoso"),
      sn("teste", "6.2.1–6.2.3", "Prova de carga d'água (lâmina ≈ 5 cm, saídas vedadas)", "nenhuma fuga ou sinal de umidade", { se: horizontal }),
      sn("reserv", "5.2.12", "Reservatório: faces internas e tampa; sem odor/gosto; lâmina de 20 cm após a conclusão", "conforme 5.2.12", { se: loc(["reservatorio"]) }),
      sn("subsolo", "5.2.13", "Subsolo: camada confinada entre superfícies resistentes", "cargas uniformes; confinamento (taxa de 1,0 MPa)", { se: loc(["subsolo"]) }),
      sn("embas", "5.2.14", "Alturas da argamassa impermeável nos embasamentos", "30 cm acima do piso externo; 60 cm (face externa) e 15 cm (faces internas) acima do piso interno", { se: loc(["embasamento"]) }),
      sn("asfalto", "5.2.17; 5.2.17.4", "Asfalto oxidado e feltro", "asfalto oxidado (penetração normalmente 20/30); feltro 250/15, 330/20, 420/25 ou 500/30", { se: feltro }),
      sn("mineral", "5.2.17.6", "Folha de telhado asfáltico mineralizado sobre a última demão", "colada com a demão ainda quente", { se: feltro }),
      sn("butilExec", "5.2.18; 5.2.18.3", "Membrana butil: camada separadora (1:4:12) até 20 cm nos emergentes, camada berço, ancoragem só na periferia com perfis", "conforme 5.2.18", { se: butil }),
      sn("argExec", "5.2.19", "Argamassa impermeável: chapisco 1:2 e argamassa 1:3 com hidrófugo", "conforme 5.2.19", { se: argam }),
      sn("cristal", "5.2.16.2; 5.2.16.3", "Cimento cristalizado: superfície curada, limpa, porosa e úmida; demãos cruzadas", "conforme 5.2.16 e o fabricante", { se: sis(["cristal"]) }),
      sn("concAdit", "5.2.15", "Concreto impermeável com plastificante e densificador", "aditivos BV-DIN e PL", { se: sis(["concreto"]) }),
      v("decl", "5.2.2", "Inclinação da superfície (recomendada)", "%", 1, 1.5, 2.5, { se: function (P) { return membrana(P) && horizontal(P); }, falha: "ressalva", exigido: "ótima de 1,5 a 2,5 %" }),
      v("declCalha", "5.2.2", "Declividade nas calhas e rincões", "%", 1, 1.0, undefined, { se: function (P) { return membrana(P) && horizontal(P); } }),
      v("declRalo", "5.2.5", "Declividade junto às bocas dos ralos", "%", 1, 5, 7, { se: horizontal }),
      v("rebaixo", "5.2.5", "Rebaixo junto às bocas (faixa de 15 cm)", "cm", 1, 2.0, undefined, { se: horizontal }),
      v("dias", "6.2.2", "Duração da prova de carga d'água", "dias", 0, 5, undefined, { se: horizontal }),
      v("hReserv", "5.2.12", "Altura da impermeabilização acima do nível máximo d'água", "cm", 0, 30, undefined, { se: loc(["reservatorio"]) }),
      v("nMemb", "5.2.17", "Número de membranas de feltro", "", 0, nMembranas, undefined, { se: feltro, exigido: "3 (módulo ≤ 24 m); 4 (24–34 m); 5 (> 34 m)" }),
      v("tAsf", "5.2.17.4", "Temperatura de aplicação do asfalto oxidado", "°C", 0, 180, 200, { se: feltro }),
      v("consumo", "5.2.17.1; 5.2.17.6", "Consumo de asfalto oxidado na 1ª e na última demão", "kg/m²", 1, 2.0, undefined, { se: feltro, falha: "ressalva", exigido: "2,0 kg/m²" }),
      v("recLong", "5.2.17.5", "Recobrimento das juntas longitudinais dos feltros", "mm", 0, 200, undefined, { se: feltro }),
      v("recTransv", "5.2.17.5", "Recobrimento das juntas transversais dos feltros", "mm", 0, 100, undefined, { se: feltro }),
      v("espSep", "5.2.18", "Espessura da camada separadora", "mm", 1, 5, undefined, { se: butil, falha: "ressalva", exigido: "5,0 mm" }),
      v("espProt", "5.2.18.1", "Espessura da camada protetora armada", "cm", 1, 2, undefined, { se: butil, falha: "ressalva", exigido: "2,0 cm" }),
      v("espButil", "5.2.18.3", "Espessura da membrana butil", "mm", 1, 1.0, undefined, { se: butil }),
      v("espArg", "5.2.19", "Espessura total da argamassa impermeável", "cm", 1, espArg, undefined, { se: argam, exigido: "≥ 3,0 cm (+1,0 cm a cada 5 m de coluna acima de 10 m)" }),
      v("camada", "5.2.19", "Espessura de cada camada de argamassa", "cm", 1, undefined, 1.5, { se: argam }),
      v("interv", "5.2.19", "Intervalo entre camadas de argamassa", "h", 0, 12, 24, { se: argam }),
      v("penet", "6.2.4", "Penetração de água no concreto impermeável (0,1 MPa/48 h; 0,3 MPa/24 h; 0,7 MPa/12 h)", "cm", 1, undefined, 3.0, { se: sis(["concreto"]) }),
    ],
    extra: function (ctx) {
      var P = ctx.P, l;
      if ((l = ctx.item.nMemb) && ok(nMembranas(P))) l.exigido = "≥ " + nMembranas(P) + " (módulo de " + fmt(num(P.modulo), 1) + " m)";
      else if (l && l.n && l.situacao !== "nao_exigido") FE.aceitacao.marcar(l, "pendente", "informe o módulo construtivo (5.2.17)");
      if ((l = ctx.item.espArg) && l.situacao !== "nao_exigido") l.exigido = "≥ " + fmt(espArg(P), 1) + " cm" + (ok(num(P.coluna)) ? " (coluna de " + fmt(num(P.coluna), 1) + " m)" : " (coluna ≤ 10 m)");
    },
    notas: "Prova de carga (6.2.1–6.2.3): lâmina de ≈ 5 cm por 5 dias consecutivos, satisfatória se não houver fuga nem sinal de umidade — aplicada a lajes de cobertura, varandas, pisos de poços e áreas internas. 5.2.2: a inclinação de 1,5 a 2,5 % é recomendada (\"deve-se procurar\"): fora dela, ressalva; a declividade mínima de 1,0 % nas calhas e rincões é exigência. Valores nominais da ES (consumo de 2,0 kg/m², camada separadora de 5 mm, camada protetora de 2 cm) tratados como mínimos com falta = ressalva. Argamassa impermeável: espessura mínima de 3,0 cm até 10 m de coluna d'água e +1,0 cm para cada 5,0 m (ou fração) a mais. Pontos de fusão do asfalto oxidado (\"médio de 84º e 94º C\", 5.2.17) e massas do feltro: exigências de recebimento (certificado, 6.1.2).",
    exemplos: [
      { nome: "Laje de cobertura com 3 membranas de feltro asfáltico — aceito", dados: function () {
        var P = { servico: "Bloco A — laje de cobertura", area: "380", sistema: "feltro", local: "cobertura", nCarreg: "2", modulo: "18" };
        return { ident: { registro: "ED-IMP-01", obra: "Obra A", local: "Bloco A — cobertura", data: "2026-09-02" }, params: P,
          verificacoes: G.verif(ID, { cert: { atende: "S", real: "2" } }, P),
          decl: [{ est: "Pano 1", v: "2,0" }, { est: "Pano 2", v: "1,8" }], declCalha: [{ est: "Calha C1", v: "1,2" }],
          declRalo: [{ est: "Ralo R1", v: "6,0" }, { est: "Ralo R2", v: "5,5" }], rebaixo: [{ est: "Ralo R1", v: "2,0" }, { est: "Ralo R2", v: "2,5" }],
          dias: [{ est: "Laje inteira", v: "5" }], nMemb: [{ est: "Laje", v: "3" }],
          tAsf: [{ est: "Caldeira — 9 h", v: "185" }, { est: "Caldeira — 14 h", v: "195" }], consumo: [{ est: "1ª demão", v: "2,1" }, { est: "Última demão", v: "2,0" }],
          recLong: [{ est: "Rolo 3", v: "210" }], recTransv: [{ est: "Rolo 3", v: "110" }] };
      } },
      { nome: "Reservatório com argamassa impermeável fina — rejeitado", dados: function () {
        var P = { servico: "Reservatório inferior — Bloco B", area: "95", sistema: "argamassa", local: "reservatorio", nCarreg: "3", coluna: "14" };
        return { ident: { registro: "ED-IMP-02", obra: "Obra B", local: "Reservatório inferior", data: "2026-09-20" }, params: P,
          verificacoes: G.verif(ID, { cert: { atende: "S", real: "2", obs: "falta o certificado da 3ª carga de hidrófugo" } }, P),
          hReserv: [{ est: "Parede norte", v: "32" }, { est: "Parede sul", v: "25" }],
          espArg: [{ est: "Parede norte", v: "4,0" }, { est: "Fundo", v: "3,5" }],
          camada: [{ est: "Parede norte", v: "1,5" }, { est: "Fundo", v: "1,8" }], interv: [{ est: "1ª–2ª camada", v: "18" }, { est: "2ª–3ª camada", v: "30" }] };
      } },
    ],
  });
})();
