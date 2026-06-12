// ============================================================
// Algoritmo de Balanceo de Equipos ⚽
// Snake Sort + Swap Optimization
// ============================================================

import type { Player, BalanceResult, BalancedTeam, BalanceMetrics, MatchWithTeams } from '../../types';
import { TEAM_COLORS, TEAM_NAMES, type TeamColorKey } from '../../types';

/**
 * Calcula la desviación estándar de un array de números.
 */
function calculateStdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Calcula la diferencia entre el máximo y el mínimo.
 */
function maxMinDiff(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

/**
 * Calcula el total de puntos de cada equipo.
 */
function getTeamTotals(teams: Player[][]): number[] {
  return teams.map(team =>
    team.reduce((sum, p) => sum + p.total_score, 0)
  );
}

/**
 * Calcula estadísticas detalladas de cada equipo.
 */
function getTeamStats(teams: Player[][]) {
  return teams.map(team =>
    team.reduce((acc, p) => ({
      defense: acc.defense + p.defense,
      attack: acc.attack + p.attack,
      fitness: acc.fitness + p.fitness,
      total_score: acc.total_score + p.total_score,
    }), { defense: 0, attack: 0, fitness: 0, total_score: 0 })
  );
}

/**
 * Métrica combinada de desviación para optimizar todos los stats
 */
function calculateCombinedStdDev(stats: { defense: number, attack: number, fitness: number, total_score: number }[]): number {
  const defStdDev = calculateStdDev(stats.map(s => s.defense));
  const atkStdDev = calculateStdDev(stats.map(s => s.attack));
  const fitStdDev = calculateStdDev(stats.map(s => s.fitness));
  const totalStdDev = calculateStdDev(stats.map(s => s.total_score));
  
  // Damos peso a los atributos individuales y también al total general
  return defStdDev + atkStdDev + fitStdDev + totalStdDev;
}

/**
 * Distribución inicial usando Snake Sort (serpentina).
 * Los jugadores ordenados se distribuyen alternando la dirección
 * en cada ronda para equilibrar los equipos.
 */
function snakeSort(sortedPlayers: Player[], numTeams: number): Player[][] {
  const teams: Player[][] = Array.from({ length: numTeams }, () => []);

  let direction = 1; // 1 = izquierda→derecha, -1 = derecha→izquierda
  let teamIndex = 0;

  for (const player of sortedPlayers) {
    teams[teamIndex].push(player);

    // Mover al siguiente equipo
    const nextIndex = teamIndex + direction;
    if (nextIndex >= numTeams || nextIndex < 0) {
      // Cambiar dirección al llegar al borde
      direction *= -1;
    } else {
      teamIndex = nextIndex;
    }
  }

  return teams;
}

function buildHistoryMatrix(players: Player[], pastMatches: MatchWithTeams[]): Map<string, number> {
  const matrix = new Map<string, number>();
  if (!pastMatches || pastMatches.length === 0) return matrix;

  for (const match of pastMatches) {
    for (const team of match.teams) {
      const pIds = team.players.map(p => p.id);
      for (let i = 0; i < pIds.length; i++) {
        for (let j = i + 1; j < pIds.length; j++) {
          const key1 = `${pIds[i]}-${pIds[j]}`;
          const key2 = `${pIds[j]}-${pIds[i]}`;
          matrix.set(key1, (matrix.get(key1) || 0) + 1);
          matrix.set(key2, (matrix.get(key2) || 0) + 1);
        }
      }
    }
  }
  return matrix;
}

function calculateHistoryPenalty(teams: Player[][], historyMatrix: Map<string, number>): number {
  let penalty = 0;
  for (const team of teams) {
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        const key = `${team[i].id}-${team[j].id}`;
        const count = historyMatrix.get(key) || 0;
        // Penalti muy alto (ej. 3 puntos por cada coincidencia) para forzar variedad
        penalty += count * 3.0; 
      }
    }
  }
  return penalty;
}

export function generateTeamSummary(teamPlayers: Player[], allPlayers: Player[]): string {
  if (teamPlayers.length === 0 || allPlayers.length === 0) return "Equipo vacío";

  const teamAvgAtk = teamPlayers.reduce((sum, p) => sum + p.attack, 0) / teamPlayers.length;
  const teamAvgDef = teamPlayers.reduce((sum, p) => sum + p.defense, 0) / teamPlayers.length;
  const teamAvgFit = teamPlayers.reduce((sum, p) => sum + p.fitness, 0) / teamPlayers.length;

  const globalAvgAtk = allPlayers.reduce((sum, p) => sum + p.attack, 0) / allPlayers.length;
  const globalAvgDef = allPlayers.reduce((sum, p) => sum + p.defense, 0) / allPlayers.length;
  const globalAvgFit = allPlayers.reduce((sum, p) => sum + p.fitness, 0) / allPlayers.length;

  const diffAtk = teamAvgAtk - globalAvgAtk;
  const diffDef = teamAvgDef - globalAvgDef;
  const diffFit = teamAvgFit - globalAvgFit;

  let summary = "Equipo equilibrado.";
  const maxDiff = Math.max(diffAtk, diffDef, diffFit);
  
  if (maxDiff > 0.4) {
    if (maxDiff === diffAtk) summary = "🔥 Fuerte en ataque.";
    else if (maxDiff === diffDef) summary = "🛡️ Sólido en defensa.";
    else if (maxDiff === diffFit) summary = "🏃‍♂️ Gran forma física.";
  }
  
  const minDiff = Math.min(diffAtk, diffDef, diffFit);
  if (minDiff < -0.4) {
    if (minDiff === diffAtk) summary += " Algo débil en ataque.";
    else if (minDiff === diffDef) summary += " Vulnerable en defensa.";
    else if (minDiff === diffFit) summary += " Forma física mejorable.";
  }

  return summary;
}

/**
 * Optimización mediante swaps aleatorios.
 * Intenta intercambiar jugadores entre equipos para minimizar
 * la desviación estándar combinada de todos los atributos.
 */
function optimizeWithSwaps(
  teams: Player[][],
  historyMatrix: Map<string, number>,
  iterations: number = 2000
): Player[][] {
  // Copiar teams para no mutar el original
  const optimized = teams.map(t => [...t]);

  let currentStats = getTeamStats(optimized);
  let currentMetric = calculateCombinedStdDev(currentStats) + calculateHistoryPenalty(optimized, historyMatrix);

  for (let i = 0; i < iterations; i++) {
    // Seleccionar dos equipos aleatorios distintos
    const teamA = Math.floor(Math.random() * optimized.length);
    let teamB = Math.floor(Math.random() * optimized.length);
    while (teamB === teamA) {
      teamB = Math.floor(Math.random() * optimized.length);
    }

    // Seleccionar un jugador aleatorio de cada equipo
    if (optimized[teamA].length === 0 || optimized[teamB].length === 0) continue;
    const playerIdxA = Math.floor(Math.random() * optimized[teamA].length);
    const playerIdxB = Math.floor(Math.random() * optimized[teamB].length);

    // Simular el swap
    const playerA = optimized[teamA][playerIdxA];
    const playerB = optimized[teamB][playerIdxB];

    // Clonar los stats actuales y simular el swap
    const newStats = currentStats.map(s => ({ ...s }));
    
    // Quitar jugador A del equipo A, agregar jugador B
    newStats[teamA].defense = newStats[teamA].defense - playerA.defense + playerB.defense;
    newStats[teamA].attack = newStats[teamA].attack - playerA.attack + playerB.attack;
    newStats[teamA].fitness = newStats[teamA].fitness - playerA.fitness + playerB.fitness;
    newStats[teamA].total_score = newStats[teamA].total_score - playerA.total_score + playerB.total_score;

    // Quitar jugador B del equipo B, agregar jugador A
    newStats[teamB].defense = newStats[teamB].defense - playerB.defense + playerA.defense;
    newStats[teamB].attack = newStats[teamB].attack - playerB.attack + playerA.attack;
    newStats[teamB].fitness = newStats[teamB].fitness - playerB.fitness + playerA.fitness;
    newStats[teamB].total_score = newStats[teamB].total_score - playerB.total_score + playerA.total_score;

    const simulatedTeams = optimized.map(t => [...t]);
    simulatedTeams[teamA][playerIdxA] = playerB;
    simulatedTeams[teamB][playerIdxB] = playerA;

    const newMetric = calculateCombinedStdDev(newStats) + calculateHistoryPenalty(simulatedTeams, historyMatrix);

    // Si mejora la métrica combinada, confirmar el swap
    if (newMetric < currentMetric) {
      optimized[teamA][playerIdxA] = playerB;
      optimized[teamB][playerIdxB] = playerA;
      currentStats = newStats;
      currentMetric = newMetric;
    }
  }

  return optimized;
}

/**
 * Algoritmo principal de balanceo de equipos.
 * 
 * @param players - Lista de jugadores convocados
 * @param numTeams - Número de equipos a generar (2, 3 o 4)
 * @returns BalanceResult con equipos y métricas
 * 
 * @example
 * const result = balanceTeams(selectedPlayers, 2);
 * console.log(result.metrics.standardDeviation); // ~0.5
 */
export function balanceTeams(players: Player[], numTeams: number, pastMatches: MatchWithTeams[] = []): BalanceResult {
  if (players.length < numTeams) {
    throw new Error(
      `No hay suficientes jugadores (${players.length}) para ${numTeams} equipos.`
    );
  }

  if (numTeams < 2 || numTeams > 4) {
    throw new Error('El número de equipos debe ser 2, 3 o 4.');
  }

  // 1. Ordenar jugadores por total_score descendente
  const sorted = [...players].sort((a, b) => b.total_score - a.total_score);

  // 2. Distribución inicial con Snake Sort
  const initialTeams = snakeSort(sorted, numTeams);

  // 3. Matriz de penalizaciones
  const historyMatrix = buildHistoryMatrix(players, pastMatches);

  // 4. Optimización con swaps aleatorios
  const optimizedTeams = optimizeWithSwaps(initialTeams, historyMatrix, 2000);

  // 5. Construir resultado
  const teamTotals = getTeamTotals(optimizedTeams);
  const totalAllPlayers = teamTotals.reduce((s, t) => s + t, 0);

  const teams: BalancedTeam[] = optimizedTeams.map((teamPlayers, i) => {
    const teamNum = (i + 1) as TeamColorKey;
    return {
      teamNumber: teamNum,
      teamName: TEAM_NAMES[teamNum],
      teamColor: TEAM_COLORS[teamNum].hex,
      players: teamPlayers,
      totalPoints: teamTotals[i],
      summary: generateTeamSummary(teamPlayers, players),
    };
  });

  const metrics: BalanceMetrics = {
    standardDeviation: Math.round(calculateStdDev(teamTotals) * 100) / 100,
    maxMinDifference: maxMinDiff(teamTotals),
    averagePerTeam: Math.round((totalAllPlayers / numTeams) * 100) / 100,
    totalPlayers: players.length,
    numTeams,
  };

  return { teams, metrics };
}

// ---- Utilidades exportadas ----

export { calculateStdDev, maxMinDiff };
