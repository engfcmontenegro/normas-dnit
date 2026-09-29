/*
 * Ficha de aceitação — DNER-ES 357/97 Edificações — Instalações elétricas, mecânicas e de telecomunicações.
 * Usa FE.aceitacaoG10b (definido em es-dner-es-353-97.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10b, num = FE.num, ok = FE.ok;
  function rMax(P) { var r = num((P || {}).rProj); return ok(r) && r > 0 ? Math.min(r, 5) : 5; }
  function barrasMin(P) { return (P || {}).tensao === "600" ? 10 : 6; }
  var se = G.se, sim = function (k) { return se(k); };

  var F = G.ficha({
    id: "dner-es-357-97",
    titulo: "Instalações elétricas, mecânicas e de telecomunicações (DNER-ES 357/97) — aceitação",
    resumo: "Inspeção das instalações (seção 5) e verificação final do funcionamento (6.3): acabamento e proteção, condutos, caixas e " +
      "suas alturas (5.17), afastamentos e espaçamentos (5.18, 5.20, 5.23), resistência de aterramento ≤ projeto e ≤ 5 Ω (5.8), " +
      "ocupação de calhas ≤ 35 % (5.9), barras nuas, quadros, transformadores, motores e pára-raios (5.33 a 5.37).",
    lote: false,
    params: [
      { k: "nUnid", r: "Nº de unidades de serviço (pontos/equipamentos) do lote", dica: "medição por unidade instalada (seção 7); 6.3.1: todos os equipamentos verificados" },
      { k: "rProj", r: "Resistência de aterramento de projeto (Ω)", ph: "5", dica: "5.8: o valor do projeto, nunca acima de 5 Ω" },
      { k: "tol", r: "Tolerância de posicionamento das caixas adotada (± cm)", dica: "5.17: a ES não fixa tolerância; 0 = exatamente a altura indicada" },
      G.sel("telecom", "Há tubulação telefônica / de telecomunicações? (5.2/5.3)"),
      G.sel("calhas", "Há calhas ou bandejas de cabos? (5.9)"),
      G.sel("subterr", "Há instalações subterrâneas (dutos, canaletas, galerias)? (5.23 a 5.25)"),
      G.sel("barras", "Há barras nuas sobre isoladores? (5.33)"),
      Object.assign(G.sel("tensao", "Tensão das barras nuas (5.33)", [["300", "Até 300 V"], ["600", "Entre 300 V e 600 V"]]),
        { se: function (d) { return ((d && d.params) || {}).barras === "sim"; } }),
      G.sel("trafo", "Há transformador? (5.35)"),
      G.sel("motores", "Há motores elétricos? (5.36)"),
      G.sel("spda", "Há pára-raios? (5.37)"),
    ],
    padrao: { rProj: "5", tol: "1,0", telecom: "sim", calhas: "nao", subterr: "nao", barras: "nao", tensao: "300", trafo: "nao", motores: "nao", spda: "nao" },
    providencias: function (par) {
      return par.parecer === "REJEITADO" ? ["O executante deve substituir e/ou refazer, por sua conta, os trabalhos impugnados, logo após a Ordem de Serviço (6.4.3)."] : [];
    },
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto, normas ABNT, NEC e concessionárias locais", secao: "4/5.1", tipo: "sim_nao",
        exigido: "conforme projeto e normas" },
      { id: "telef", grupo: "Condições gerais", texto: "Tubulação telefônica executada só com o projeto aprovado", secao: "5.2/5.3", tipo: "sim_nao", se: sim("telecom"),
        exigido: "projeto aprovado antes da execução" },
      { id: "acab", grupo: "Condições gerais", texto: "Esmero e bom acabamento: condutores, condutos e equipamentos arrumados e firmemente fixados", secao: "5.4",
        tipo: "sim_nao", exigido: "conjunto mecânica e eletricamente satisfatório" },
      { id: "vivas", grupo: "Condições gerais", texto: "Partes vivas protegidas contra contatos; equipamentos que centelham separados de material combustível", secao: "5.5",
        tipo: "sim_nao", exigido: "proteção e separação incombustível" },
      { id: "umidos", grupo: "Condições gerais", texto: "Métodos e materiais próprios em locais úmidos ou sujeitos às intempéries", secao: "5.6", tipo: "sim_nao",
        exigido: "materiais adequados" },
      { id: "rAt", grupo: "Aterramento", texto: "Resistência de aterramento", secao: "5.8", tipo: "valor", unid: "Ω", casas: 1, max: rMax,
        metodo: "terrômetro", exigido: "≤ valor de projeto e nunca > 5 Ω" },
      { id: "terra", grupo: "Aterramento", texto: "Condutores terra curtos, retilíneos, sem emendas nem chaves; ligação mecânica (sem solda de estanho); massas aterradas",
        secao: "5.29 a 5.31", tipo: "sim_nao", exigido: "5.29, 5.30 e 5.31 atendidos" },
      { id: "obtur", grupo: "Condutos", texto: "Extremidades dos tubos obturadas antes da concretagem e durante a obra", secao: "5.7", tipo: "sim_nao",
        exigido: "sem penetração de detritos e umidade" },
      { id: "ocup", grupo: "Condutos", texto: "Taxa de ocupação das calhas (área útil)", secao: "5.9", tipo: "valor", unid: "%", casas: 0, max: 35, se: sim("calhas"),
        metodo: "cálculo das seções dos cabos", exigido: "≤ 35 %" },
      { id: "bandeja", grupo: "Condutos", texto: "Cabos em bandejas em camada única, presos à estrutura", secao: "5.9", tipo: "sim_nao", se: sim("calhas"), exigido: "camada única" },
      { id: "metal", grupo: "Condutos", texto: "Condutos metálicos com luvas, buchas e porcas vedadas; envolvendo as três fases; aterrados e contínuos; flexíveis metálicos em máquinas com vibração",
        secao: "5.10 a 5.12/5.14", tipo: "sim_nao", exigido: "5.10, 5.11, 5.12 e 5.14 atendidos" },
      { id: "limpos", grupo: "Condutos", texto: "Condutos limpos e secos antes da enfiação (após pavimentações, impermeabilização e revestimentos); arames-guia nos não utilizados",
        secao: "5.13/5.32", tipo: "sim_nao", exigido: "enfiação só nas condições do 5.32" },
      { id: "rigidos", grupo: "Condutos", texto: "Instalações embutidas só em eletrodutos rígidos emendados por luvas; canalização em concreto sem esforços; expostos bem fixados",
        secao: "5.15/5.21/5.22", tipo: "sim_nao", exigido: "eletrodutos rígidos, continuidade e fixação" },
      { id: "caixas", grupo: "Caixas e pontos", texto: "Caixas em todos os pontos de entrada/saída, emendas, derivações e aparelhos; pontos de luz centrados ou alinhados",
        secao: "5.16/5.19", tipo: "sim_nao", exigido: "5.16 e 5.19 atendidos" },
      { id: "hInt", grupo: "Caixas e pontos", texto: "Altura de interruptores e botões de campainha (bordo superior da caixa)", secao: "5.17 a", tipo: "valor", unid: "m", casas: 2,
        min: G.alvo(1.10, "tol").min, max: G.alvo(1.10, "tol").max, metodo: "trena" },
      { id: "hTomB", grupo: "Caixas e pontos", texto: "Altura das tomadas baixas fora do rodapé (bordo inferior da caixa)", secao: "5.17 b", tipo: "valor", unid: "m", casas: 2,
        min: G.alvo(0.20, "tol").min, max: G.alvo(0.20, "tol").max, metodo: "trena" },
      { id: "hTomU", grupo: "Caixas e pontos", texto: "Altura das tomadas em locais úmidos (bordo inferior da caixa)", secao: "5.17 c", tipo: "valor", unid: "m", casas: 2,
        min: G.alvo(0.80, "tol").min, max: G.alvo(0.80, "tol").max, metodo: "trena" },
      { id: "hPass", grupo: "Caixas e pontos", texto: "Altura das caixas de passagem (bordo inferior da caixa)", secao: "5.17 d", tipo: "valor", unid: "m", casas: 2,
        min: G.alvo(0.20, "tol").min, max: G.alvo(0.20, "tol").max, metodo: "trena" },
      { id: "alizar", grupo: "Caixas e pontos", texto: "Distância das caixas de interruptores aos alizares próximos", secao: "5.18", tipo: "valor", unid: "m", casas: 2, min: 0.10,
        metodo: "trena" },
      { id: "dReta", grupo: "Caixas e pontos", texto: "Distância entre caixas/conduletes em trecho retilíneo", secao: "5.20", tipo: "valor", unid: "m", casas: 1, max: 15.0, metodo: "trena" },
      { id: "dCurva", grupo: "Caixas e pontos", texto: "Distância entre caixas/conduletes em trecho com curvas de 90°", secao: "5.20", tipo: "valor", unid: "m", casas: 1, max: 3.0,
        metodo: "trena", exigido: "≤ 3,0 m (texto literal da ES)" },
      { id: "emendas", grupo: "Condutores", texto: "Condutores sem esforços, curvados com raio ≥ mínimo; emendas com isolamento equivalente; fios > 10 mm² com terminais",
        secao: "5.27/5.28", tipo: "sim_nao", exigido: "5.27 e 5.28 atendidos" },
      { id: "subt", grupo: "Instalações subterrâneas", texto: "Caixas de alvenaria revestidas, impermeabilizadas e drenadas, com tampas calafetadas; canaletas com fundo em desnível e drenagem",
        secao: "5.23 a 5.26", tipo: "sim_nao", se: sim("subterr"), exigido: "5.23 a 5.26 atendidos" },
      { id: "dSubt", grupo: "Instalações subterrâneas", texto: "Espaçamento entre caixas das canalizações subterrâneas", secao: "5.23", tipo: "valor", unid: "m", casas: 1, max: 60.0,
        se: sim("subterr"), metodo: "trena", exigido: "≤ 60,0 m (e caixa em toda mudança de direção)" },
      { id: "barrasP", grupo: "Barras, quadros e equipamentos", texto: "Barras nuas protegidas contra contatos; não usadas em locais perigosos", secao: "5.33", tipo: "sim_nao",
        se: sim("barras"), exigido: "protegidas" },
      { id: "dBarras", grupo: "Barras, quadros e equipamentos", texto: "Distância entre barras nuas", secao: "5.33", tipo: "valor", unid: "cm", casas: 1, min: barrasMin,
        se: sim("barras"), metodo: "trena", exigido: "≥ 6,0 cm (até 300 V) / ≥ 10,0 cm (300 a 600 V)" },
      { id: "hQuadro", grupo: "Barras, quadros e equipamentos", texto: "Altura do bordo inferior dos quadros de distribuição acima do piso acabado", secao: "5.34", tipo: "valor",
        unid: "m", casas: 2, min: 0.60, metodo: "trena" },
      { id: "trafoI", grupo: "Barras, quadros e equipamentos", texto: "Transformador em base apropriada, local ventilado, tanque ligado à malha de terra, escoamento do óleo não ligado ao esgoto",
        secao: "5.35", tipo: "sim_nao", se: sim("trafo"), exigido: "5.35 a 5.35.2 atendidos" },
      { id: "motorI", grupo: "Barras, quadros e equipamentos", texto: "Motores em bases apropriadas (amortecedores nos casos críticos), local ventilado e espaço para manutenção",
        secao: "5.36", tipo: "sim_nao", se: sim("motores"), exigido: "5.36 e 5.36.1 atendidos" },
      { id: "spdaI", grupo: "Pára-raios", texto: "Proteção de todo o prédio; aterramentos interligados em malha comum; hastes em caixas com tampa removível", secao: "5.37/5.37.2/5.37.3",
        tipo: "sim_nao", se: sim("spda"), exigido: "5.37, 5.37.2 e 5.37.3 atendidos" },
      { id: "dHaste", grupo: "Pára-raios", texto: "Distância das hastes de aterramento às paredes ou muros", secao: "5.37.1", tipo: "valor", unid: "m", casas: 2, min: 3.0,
        se: sim("spda"), metodo: "trena" },
      { id: "dFix", grupo: "Pára-raios", texto: "Distância entre fixadores das cordoalhas de descida", secao: "5.37.4", tipo: "valor", unid: "m", casas: 2, max: 1.5,
        se: sim("spda"), metodo: "trena" },
      { id: "sCord", grupo: "Pára-raios", texto: "Seção das cordoalhas de descida e de interligação das hastes", secao: "5.37.5", tipo: "valor", unid: "mm²", casas: 0, min: 70,
        se: sim("spda"), metodo: "catálogo / medição", exigido: "≥ 70 mm² (proteção mecânica não magnética até 3,0 m do solo)" },
      { id: "embal", grupo: "Inspeção", texto: "Materiais recebidos nas embalagens originais invioladas", secao: "6.1", tipo: "sim_nao", exigido: "embalagens invioladas" },
      { id: "cotas", grupo: "Inspeção", texto: "Cotas, alinhamentos e dimensões conforme o projeto", secao: "6.2", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "funcion", grupo: "Inspeção", texto: "Funcionamento e características dos equipamentos conforme os catálogos dos fabricantes", secao: "6.3.1/6.3.2",
        tipo: "sim_nao", exigido: "todos funcionando (senão, rejeitados)", freq: G.todas("nUnid", "todas as unidades") },
    ],
    notas: "DNER-ES 357/97: equipamentos e serviços aceitos se atendem às exigências de funcionamento (6.3.2) e às da ES (6.4.1); rejeitados, são substituídos " +
      "ou refeitos pelo executante (6.4.2/6.4.3). Alturas das caixas (5.17) conferidas com a tolerância informada (a ES não fixa tolerância). " +
      "5.20: a ES diz que, nos trechos com curvas, o espaçamento \"será reduzido para 3,0 m entre curvas de 90°\" — aplicado literalmente (≤ 3,0 m).",
  });

  F.exemplos = [
    { nome: "Lote aceito — instalações elétricas e de telefonia do bloco (Obra A)", dados: function () {
      return G.dados(F, { ident: { registro: "ELE-01", data: "2026-09-03", obra: "Obra A — edifício administrativo", local: "Bloco 1 — térreo e superior",
          camada: "Instalações elétricas de baixa tensão, SPDA e telefonia" },
        params: { nUnid: "86", rProj: "5", spda: "sim" },
        verif: { caixas: { real: "12", nc: "0" }, funcion: { real: "86", nc: "0" } },
        rAt: [{ est: "Malha — caixa 1", v: "3,8" }, { est: "Malha — caixa 3", v: "4,2" }],
        hInt: [{ est: "Sala 1", v: "1,10" }, { est: "Sala 2", v: "1,11" }, { est: "Sala 3", v: "1,10" }, { est: "Circulação", v: "1,09" }],
        hTomB: [{ est: "Sala 1", v: "0,20" }, { est: "Sala 2", v: "0,21" }, { est: "Sala 3", v: "0,20" }],
        hTomU: [{ est: "Copa", v: "0,80" }, { est: "Sanitário", v: "0,81" }],
        hPass: [{ est: "Circulação", v: "0,20" }],
        alizar: [{ est: "Sala 1", v: "0,12" }, { est: "Sala 2", v: "0,10" }],
        dReta: [{ est: "Circulação", v: "12,0" }, { est: "Sala 3", v: "8,5" }],
        dCurva: [{ est: "Sala 2", v: "2,8" }],
        hQuadro: [{ est: "QD-1", v: "1,20" }, { est: "QD-2", v: "1,15" }],
        dHaste: [{ est: "Haste 1", v: "3,2" }, { est: "Haste 2", v: "3,5" }, { est: "Haste 3", v: "3,0" }],
        dFix: [{ est: "Descida 1", v: "1,5" }, { est: "Descida 2", v: "1,4" }],
        sCord: [{ est: "Descidas", v: "70" }] });
    } },
    { nome: "Lote rejeitado — aterramento acima de 5 Ω e calha superlotada (Obra B)", dados: function () {
      return G.dados(F, { ident: { registro: "ELE-02", data: "2026-09-12", obra: "Obra B — posto de pesagem", local: "Casa de máquinas e escritório",
          camada: "Instalações elétricas e de força" },
        params: { nUnid: "34", rProj: "5", telecom: "nao", calhas: "sim", motores: "sim" },
        verif: { caixas: { real: "8", nc: "0" }, funcion: { real: "34", nc: "2", obs: "motor da bomba 2 com aquecimento; tomada da oficina sem tensão" } },
        rAt: [{ est: "Malha — caixa 1", v: "6,4" }, { est: "Malha — caixa 2", v: "5,1" }],
        ocup: [{ est: "Calha CM-1", v: "42" }, { est: "Calha CM-2", v: "30" }],
        hInt: [{ est: "Escritório", v: "1,10" }, { est: "Oficina", v: "1,25" }],
        hTomB: [{ est: "Escritório", v: "0,20" }],
        hTomU: [{ est: "Oficina", v: "0,80" }],
        hPass: [{ est: "Oficina", v: "0,20" }],
        alizar: [{ est: "Escritório", v: "0,11" }],
        dReta: [{ est: "Casa de máquinas", v: "14,0" }],
        dCurva: [{ est: "Oficina", v: "2,5" }],
        hQuadro: [{ est: "QF-1", v: "0,80" }] });
    } },
  ];
})();
