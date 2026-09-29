/*
 * Ficha de ACEITAÇÃO: DNIT 028/2004-ES — Drenagem — Limpeza e desobstrução de dispositivos de drenagem.
 *
 * O que a ES manda (seções do PDF):
 *   4     limpeza só após vistoria que constate a necessidade; atividades planejadas (processos e equipamentos);
 *         avaliação da capacidade de escoamento (suficiência hidráulica ou substituição); ponto de descarga dos entulhos
 *         previamente determinado, sem reconduzi-los ao sistema; recolhimento por carrinhos até o ponto de carga.
 *   5.1.1 dispositivos de concreto: limpeza manual ou especial sem danificar paredes e fundo por impacto; motoniveladora
 *         só em sarjeta triangular revestida, com cuidado e velocidade controlada; rupturas reparadas; canalização
 *         fechada: arraste ("bucket machine") ou hidrojateamento (NBR 11997), remoção por vácuo.
 *   5.1.2 sem revestimento: motoniveladora nas sarjetas; retroescavadeira/valetadeira nas canaletas; sem desagregação
 *         hidráulica.
 *   5.1.3 pontuais (caixas, entradas, descidas): limpeza manual; deficiências reparadas ou anotadas em relatório.
 *   5.2   NOTA: equipamentos vistoriados antes do início.
 *   6     excedente removido; resíduo vegetal sem queima (reduzido e incorporado ao terreno); proteção dos deságues;
 *         sem tráfego desnecessário em terreno natural; DNER-ISA 07.
 *   7.1   Notas de Serviço e acompanhamento visual.  7.2  apreciação visual da limpeza e adequação do local de
 *         deposição.  7.3  não conforme → refazer ou complementar.
 * Sem ensaio nem tolerância numérica: lista de verificações; extensão/volume (medição, 8) como informação.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var G4 = "Condições gerais (4; 5.2)", G5 = "Execução (5.1)", G6 = "Manejo ambiental (6)", G7 = "Inspeção (7.1; 7.2)";
  function tipo(P) { return P.tipo || "concreto"; }
  function preencher(F, d, falhas) {
    d.verificacoes = [];
    F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
      if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
      d.verificacoes.push((falhas || {})[it.id] || { atende: "S", real: "1" });
    });
  }
  function eh(t) { return function (P) { return tipo(P) === t; }; }
  var F = A.fichaSimples({
    id: "dnit-028-2004-es",
    titulo: "Limpeza e desobstrução de dispositivos de drenagem — aceitação (DNIT 028/2004-ES)",
    resumo: "Aceitação da limpeza/desobstrução de dispositivos de drenagem: condições prévias (4), processo conforme o tipo de dispositivo (5.1), manejo ambiental (6) e inspeção visual da limpeza e do local de deposição (7). Não conforme → refazer ou complementar (7.3).",
    lote: false,
    params: [
      { k: "tipo", r: "Tipo de dispositivo", tipo: "select", recarrega: true, opcoes: [["concreto", "Dispositivo de concreto — a céu aberto ou canalização fechada (5.1.1)"],
        ["semrev", "Dispositivo sem revestimento — sarjeta/canaleta de terra (5.1.2)"], ["pontual", "Dispositivo pontual — caixa, entrada, descida d'água (5.1.3)"]] },
      { k: "fechada", r: "Canalização fechada (bueiro, galeria)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não — a céu aberto"], ["sim", "Sim"]],
        se: function (d) { return tipo((d && d.params) || {}) === "concreto"; } },
      { k: "disp", r: "Dispositivo / segmento", ph: "ex.: sarjeta SCC, est. 100 a 140 LD" },
      { k: "ns", r: "Nota de Serviço", ph: "ex.: NS-05" },
      { k: "extNS", r: "Extensão prevista — Nota de Serviço (m)" },
      { k: "extExec", r: "Extensão efetivamente limpa (m)", dica: "8 a: medição por extensão limpa (obras longitudinais)" },
      { k: "volRem", r: "Volume removido (m³) — dispositivos pontuais", dica: "8 b" },
    ],
    padrao: { tipo: "concreto", fechada: "nao" },
    refs: { reprova: "7.3" },
    textos: { REJEITADO: { titulo: "SERVIÇO NÃO CONFORME", texto: "Há exigência da ES não atendida: os serviços devem ser refeitos ou complementados, de forma a atenderem ao especificado (7.3)." },
      ACEITO: { titulo: "SERVIÇO CONFORME", texto: "Todas as exigências da DNIT 028/2004-ES verificadas e atendidas (7.3)." } },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Serviço não conforme: refazer ou complementar e verificar de novo (7.3)."]; },
    criterios: [
      { id: "vistoria", grupo: G4, texto: "Vistoria prévia constatando a necessidade; atividades planejadas com processos e equipamentos indicados", secao: "4", tipo: "sim_nao" },
      { id: "capac", grupo: G4, texto: "Capacidade de escoamento avaliada (suficiência hidráulica ou necessidade de substituição)", secao: "4", tipo: "sim_nao" },
      { id: "descarga", grupo: G4, texto: "Ponto de descarga dos entulhos previamente determinado, sem reconduzi-los ao sistema de drenagem; recolhimento por carrinhos até o ponto de carga", secao: "4", tipo: "sim_nao" },
      { id: "equip", grupo: G4, texto: "Equipamentos vistoriados antes do início do serviço", secao: "5.2 NOTA", tipo: "sim_nao" },
      { id: "semDano", grupo: G5, texto: "Limpeza manual ou especial, sem danificar paredes e fundo por impacto (motoniveladora só em sarjeta triangular revestida, com cuidado e velocidade controlada)", secao: "5.1.1", tipo: "sim_nao", se: eh("concreto"), naoAplicaPor: "dispositivo não revestido de concreto" },
      { id: "reparo", grupo: G5, texto: "Trechos com ruptura das superfícies reparados", secao: "5.1.1", tipo: "sim_nao", se: eh("concreto"), naoAplicaPor: "dispositivo não revestido de concreto" },
      { id: "fechada", grupo: G5, texto: "Canalização fechada: arraste (\"bucket machine\") ou hidrojateamento conforme NBR 11997, com remoção do material por vácuo", secao: "5.1.1", tipo: "sim_nao",
        se: function (P) { return tipo(P) === "concreto" && P.fechada === "sim"; }, naoAplicaPor: "dispositivo a céu aberto (ferramentas manuais)" },
      { id: "semrev", grupo: G5, texto: "Sarjetas sem revestimento com motoniveladora; canaletas com retroescavadeira/valetadeira de caçamba adequada; sem desagregação hidráulica", secao: "5.1.2", tipo: "sim_nao", se: eh("semrev"), naoAplicaPor: "dispositivo revestido ou pontual" },
      { id: "pontual", grupo: G5, texto: "Limpeza manual do dispositivo pontual", secao: "5.1.3", tipo: "sim_nao", se: eh("pontual"), naoAplicaPor: "dispositivo não pontual" },
      { id: "deficiencias", grupo: G5, texto: "Deficiências constatadas reparadas ou anotadas em relatório ao setor de conservação", secao: "5.1.3", tipo: "sim_nao", se: eh("pontual"), naoAplicaPor: "dispositivo não pontual" },
      { id: "excedente", grupo: G6, texto: "Material excedente de limpeza removido das proximidades dos dispositivos", secao: "6 a", tipo: "sim_nao" },
      { id: "queima", grupo: G6, texto: "Resíduos vegetais sem queima: reduzidos com ferramentas manuais e incorporados ao terreno ou aos taludes", secao: "6 b", tipo: "sim_nao" },
      { id: "desague", grupo: G6, texto: "Obras de proteção nos pontos de deságue (sem erosão nem assoreamento)", secao: "6 c", tipo: "sim_nao" },
      { id: "trafego", grupo: G6, texto: "Sem tráfego desnecessário de equipamentos em terreno natural; recomendações da DNER-ISA 07", secao: "6 d, e", tipo: "sim_nao" },
      { id: "acomp", grupo: G7, texto: "Serviços conforme Notas de Serviço, com acompanhamento visual durante a execução", secao: "7.1", tipo: "sim_nao" },
      { id: "visual", grupo: G7, texto: "Limpeza efetivada: dispositivo desobstruído (apreciação visual)", secao: "7.2", tipo: "sim_nao" },
      { id: "deposito", grupo: G7, texto: "Local de deposição do material removido adequado", secao: "7.2", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P, e0 = num(P.extNS), e1 = num(P.extExec), v = num(P.volRem);
      if (ok(e1)) ctx.linhas.push(A.linha({ id: "ext", grupo: G7, criterio: "Extensão limpa × Nota de Serviço", secao: "7.1; 8 a", situacao: "informativo",
        exigido: ok(e0) ? fmt(e0, 1) + " m (Nota de Serviço)" : "—", resultado: fmt(e1, 1) + " m" + (ok(e0) && e0 > 0 ? " (" + A.fmtR(e1 / e0 * 100, 1) + " % do previsto)" : ""),
        motivo: "medição pela extensão efetivamente limpa (8 a)" }));
      if (ok(v)) ctx.linhas.push(A.linha({ id: "vol", grupo: G7, criterio: "Volume removido", secao: "8 b", situacao: "informativo", exigido: "—", resultado: fmt(v, 2) + " m³", motivo: "medição dos dispositivos pontuais (8 b)" }));
    },
    notas: "Critérios da DNIT 028/2004-ES (seções 4 a 7). A ES não define ensaios, tolerâncias nem frequência: cada verificação é exigida ao menos uma vez por serviço (Nota de Serviço). Não conforme → os serviços devem ser refeitos ou complementados (7.3).",
    exemplos: [
      { nome: "Limpeza de sarjeta de concreto — conforme", dados: function () {
        var d = { ident: { registro: "LMP-A-001", data: "2026-04-22", obra: "Obra A — BR-000", trecho: "Conservação — segmento 4", local: "Est. 100 a 140 LD" },
          params: { tipo: "concreto", fechada: "nao", disp: "Sarjeta triangular de concreto, est. 100 a 140 LD", ns: "NS-05", extNS: "800", extExec: "800" } };
        preencher(F, d);
        return d;
      } },
      { nome: "Desobstrução de caixa coletora — não conforme (entulho queimado e reconduzido)", dados: function () {
        var d = { ident: { registro: "LMP-B-002", data: "2026-05-09", obra: "Obra B — BR-000", trecho: "Conservação — segmento 1", local: "Est. 12+10 LE" },
          params: { tipo: "pontual", disp: "Caixa coletora CC-07", ns: "NS-09", volRem: "1,80" } };
        preencher(F, d, {
          descarga: { real: "1", nc: "1", obs: "entulho deixado a montante da caixa, voltando ao sistema com a chuva" },
          queima: { real: "1", nc: "1", obs: "galhos e folhas queimados no local" } });
        return d;
      } },
    ],
  });
})();
