/*
 * Ficha de ACEITAÇÃO: DNIT 029/2004-ES — Drenagem — Restauração de dispositivos de drenagem danificados.
 *
 * O que a ES manda (seções do PDF):
 *   4     restauração só após vistoria que constate a necessidade; atividades planejadas, inclusive projeto; avaliação
 *         da capacidade de escoamento (suficiência hidráulica ou substituição).
 *   5.1   concreto e argamassa de cimento Portland conforme DNER-ES 330/97 (cimento, brita, areia e água também);
 *         argamassa cimento-areia preparada em betoneira, traço 1:3 em massa.
 *   5.2   a) superfície limpa, sem fragmentos soltos; b) apicoamento (marreta e punção) e limpeza com escova de aço;
 *         c) fôrmas, se necessárias; d) superfície umedecida, lançamento, espalhamento e cura, recompondo a forma
 *         original; e) retirada das fôrmas.
 *   5.3   NOTA: equipamentos vistoriados antes do início.
 *   6     excedente removido a local definido com a Fiscalização, sem atingir cursos d'água; proteção dos deságues;
 *         sem tráfego desnecessário em terreno natural; DNER-ISA 07.
 *   7.1   Notas de Serviço e acompanhamento visual.  7.2  apreciação visual da restauração; local de deposição;
 *         controle geométrico com régua e trena; acompanhamento dos volumes.  7.3  não conforme → refazer/complementar.
 * Sem ensaio nem tolerância numérica própria (a ES remete à DNER-ES 330/97 para os materiais): lista de verificações;
 * volume de concreto/argamassa (medição, 8 a) como informação.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var G4 = "Condições gerais (4; 5.3)", GM = "Materiais (5.1)", G5 = "Execução (5.2)", G6 = "Manejo ambiental (6)", G7 = "Inspeção (7.1; 7.2)";
  function preencher(F, d, falhas) {
    d.verificacoes = [];
    F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
      if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
      d.verificacoes.push((falhas || {})[it.id] || { atende: "S", real: "1" });
    });
  }
  function usa(m) { return function (P) { return (P.material || "argamassa") === m || P.material === "ambos"; }; }
  var F = A.fichaSimples({
    id: "dnit-029-2004-es",
    titulo: "Restauração de dispositivos de drenagem danificados — aceitação (DNIT 029/2004-ES)",
    resumo: "Aceitação da restauração de dispositivos de drenagem de concreto: condições prévias (4), materiais conforme DNER-ES 330/97 e argamassa 1:3 (5.1), etapas de execução (5.2), manejo ambiental (6) e inspeção visual, geométrica e dos volumes (7). Não conforme → refazer ou complementar (7.3).",
    lote: false,
    params: [
      { k: "disp", r: "Dispositivo restaurado", ph: "ex.: descida d'água em degraus, est. 55 LE" },
      { k: "ns", r: "Nota de Serviço", ph: "ex.: NS-21" },
      { k: "material", r: "Material de restauração", tipo: "select", recarrega: true, opcoes: [["argamassa", "Argamassa de cimento e areia"], ["concreto", "Concreto de cimento Portland"], ["ambos", "Concreto e argamassa"]] },
      { k: "formas", r: "Com fôrmas?", tipo: "select", recarrega: true, opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "volPrev", r: "Volume previsto — Nota de Serviço (m³)" },
      { k: "volExec", r: "Volume de concreto/argamassa utilizado (m³)", dica: "8 a" },
    ],
    padrao: { material: "argamassa", formas: "nao" },
    refs: { reprova: "7.3" },
    textos: { REJEITADO: { titulo: "SERVIÇO NÃO CONFORME", texto: "Há exigência da ES não atendida: os serviços devem ser refeitos ou complementados, de forma a atenderem ao especificado (7.3)." },
      ACEITO: { titulo: "SERVIÇO CONFORME", texto: "Todas as exigências da DNIT 029/2004-ES verificadas e atendidas (7.3)." } },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Serviço não conforme: refazer ou complementar e verificar de novo (7.3)."]; },
    criterios: [
      { id: "vistoria", grupo: G4, texto: "Vistoria prévia constatando a necessidade; atividades planejadas (inclusive projeto)", secao: "4", tipo: "sim_nao" },
      { id: "capac", grupo: G4, texto: "Capacidade de escoamento avaliada (suficiência hidráulica ou necessidade de substituição)", secao: "4", tipo: "sim_nao" },
      { id: "equip", grupo: G4, texto: "Equipamentos vistoriados antes do início do serviço", secao: "5.3 NOTA", tipo: "sim_nao" },
      { id: "insumos", grupo: GM, texto: "Concreto/argamassa, cimento, brita, areia e água conforme DNER-ES 330/97", secao: "5.1", tipo: "sim_nao" },
      { id: "traco", grupo: GM, texto: "Argamassa cimento-areia preparada em betoneira, traço 1:3 em massa", secao: "5.1", tipo: "sim_nao", se: usa("argamassa"), naoAplicaPor: "restauração só com concreto" },
      { id: "preparo", grupo: G5, texto: "Superfície limpa, sem fragmentos soltos", secao: "5.2 a", tipo: "sim_nao" },
      { id: "apic", grupo: G5, texto: "Superfície apicoada (marreta e punção) e limpa com escova de aço", secao: "5.2 b", tipo: "sim_nao" },
      { id: "formas", grupo: G5, texto: "Fôrmas instaladas e retiradas após a cura", secao: "5.2 c, e", tipo: "sim_nao", se: function (P) { return P.formas !== "nao"; }, naoAplicaPor: "restauração sem fôrmas" },
      { id: "lanc", grupo: G5, texto: "Superfície umedecida; lançamento, espalhamento e cura do concreto/argamassa recompondo a forma original", secao: "5.2 d", tipo: "sim_nao" },
      { id: "excedente", grupo: G6, texto: "Material excedente removido a local definido com a Fiscalização, sem atingir cursos d'água", secao: "6 a, b", tipo: "sim_nao" },
      { id: "desague", grupo: G6, texto: "Obras de proteção nos pontos de deságue (sem erosão nem assoreamento)", secao: "6 c", tipo: "sim_nao" },
      { id: "trafego", grupo: G6, texto: "Sem tráfego desnecessário de equipamentos em terreno natural; recomendações da DNER-ISA 07", secao: "6 d, e", tipo: "sim_nao" },
      { id: "acomp", grupo: G7, texto: "Serviços conforme Notas de Serviço, com acompanhamento visual durante a execução", secao: "7.1", tipo: "sim_nao" },
      { id: "visual", grupo: G7, texto: "Restauração efetuada sem falhas (apreciação visual)", secao: "7.2", tipo: "sim_nao" },
      { id: "geom", grupo: G7, texto: "Forma original recomposta — medidas a régua e trena", secao: "7.2", tipo: "sim_nao" },
      { id: "deposito", grupo: G7, texto: "Local de deposição do material removido adequado", secao: "7.2", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var v0 = num(ctx.P.volPrev), v1 = num(ctx.P.volExec);
      if (!ok(v1)) return;
      ctx.linhas.push(A.linha({ id: "vol", grupo: G7, criterio: "Volume de concreto/argamassa × Nota de Serviço", secao: "7.2; 8 a", situacao: "informativo",
        exigido: ok(v0) ? fmt(v0, 2) + " m³ (Nota de Serviço)" : "—", resultado: fmt(v1, 2) + " m³" + (ok(v0) && v0 > 0 ? " (" + A.fmtR((v1 / v0 - 1) * 100, 1) + " %)" : ""),
        motivo: "acompanhamento dos volumes (7.2); a ES não fixa tolerância" }));
    },
    notas: "Critérios da DNIT 029/2004-ES (seções 4 a 7). A ES não define ensaios, tolerâncias nem frequência próprios (os materiais seguem a DNER-ES 330/97): cada verificação é exigida ao menos uma vez por serviço (Nota de Serviço). Não conforme → os serviços devem ser refeitos ou complementados (7.3).",
    exemplos: [
      { nome: "Restauração de descida d'água com argamassa — conforme", dados: function () {
        var d = { ident: { registro: "RST-A-001", data: "2026-03-17", obra: "Obra A — BR-000", trecho: "Conservação — segmento 3", local: "Est. 55 LE" },
          params: { disp: "Descida d'água em degraus — degraus 4 a 9", ns: "NS-21", material: "argamassa", formas: "nao", volPrev: "0,60", volExec: "0,58" } };
        preencher(F, d);
        return d;
      } },
      { nome: "Restauração de sarjeta com concreto — não conforme (sem apicoamento, forma não recomposta)", dados: function () {
        var d = { ident: { registro: "RST-B-002", data: "2026-04-02", obra: "Obra B — BR-000", trecho: "Conservação — segmento 6", local: "Est. 210 a 214 LD" },
          params: { disp: "Sarjeta de concreto — placas rompidas", ns: "NS-27", material: "concreto", formas: "sim", volPrev: "1,20", volExec: "0,85" } };
        preencher(F, d, {
          apic: { real: "3", nc: "1", obs: "placa da est. 212 sem apicoamento — descolamento do reparo" },
          geom: { real: "3", nc: "1", obs: "seção da est. 213 com 4 cm a menos de profundidade (régua)" } });
        return d;
      } },
    ],
  });
})();
