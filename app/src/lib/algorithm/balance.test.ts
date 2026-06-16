import { describe, it, expect } from 'vitest';
import { balanceTeams, calculateStdDev, maxMinDiff } from './balance';
import type { Player } from '../../types';

// Helper to create mock players
function createMockPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p-${i}`,
    name: `Player ${i}`,
    photo_url: null,
    defense: 5 + (i % 5),
    attack: 5 + (i % 4),
    fitness: 5 + (i % 3),
    technique: 5 + (i % 2),
    iq: 5 + (i % 3),
    total_score: 25 + (i % 5) + (i % 4) + (i % 3),
    country: 'es',
    is_active: true,
    created_at: new Date().toISOString(),
  }));
}

describe('Balance Algorithm', () => {
  it('should throw an error if players length is less than numTeams', () => {
    const players = createMockPlayers(2);
    expect(() => balanceTeams(players, 3)).toThrowError(
      'No hay suficientes jugadores (2) para 3 equipos.'
    );
  });

  it('should throw an error if numTeams is less than 2 or greater than 4', () => {
    const players = createMockPlayers(6);
    expect(() => balanceTeams(players, 1)).toThrowError(
      'El número de equipos debe ser 2, 3 o 4.'
    );
    expect(() => balanceTeams(players, 5)).toThrowError(
      'El número de equipos debe ser 2, 3 o 4.'
    );
  });

  it('should balance players into 2 teams correctly', () => {
    const players = createMockPlayers(12);
    const result = balanceTeams(players, 2);

    expect(result.teams.length).toBe(2);
    expect(result.metrics.totalPlayers).toBe(12);
    expect(result.metrics.numTeams).toBe(2);

    // Verify all players are allocated exactly once
    const allocatedPlayers = result.teams.flatMap((t) => t.players);
    expect(allocatedPlayers.length).toBe(12);
    const playerIds = allocatedPlayers.map((p) => p.id);
    const uniqueIds = new Set(playerIds);
    expect(uniqueIds.size).toBe(12);

    // Verify team sizes (6 and 6)
    expect(result.teams[0].players.length).toBe(6);
    expect(result.teams[1].players.length).toBe(6);

    // Verify metrics consistency
    const totalPointsA = result.teams[0].totalPoints;
    const totalPointsB = result.teams[1].totalPoints;
    const expectedAverage = (totalPointsA + totalPointsB) / 2;
    expect(result.metrics.averagePerTeam).toBe(expectedAverage);

    const calculatedDiff = Math.abs(totalPointsA - totalPointsB);
    expect(result.metrics.maxMinDifference).toBe(calculatedDiff);
  });

  it('should balance players into 3 teams correctly', () => {
    const players = createMockPlayers(15);
    const result = balanceTeams(players, 3);

    expect(result.teams.length).toBe(3);
    expect(result.metrics.totalPlayers).toBe(15);
    expect(result.metrics.numTeams).toBe(3);

    // Verify all players are allocated exactly once
    const allocatedPlayers = result.teams.flatMap((t) => t.players);
    expect(allocatedPlayers.length).toBe(15);
    const playerIds = allocatedPlayers.map((p) => p.id);
    const uniqueIds = new Set(playerIds);
    expect(uniqueIds.size).toBe(15);

    // Verify team sizes (5, 5, 5)
    expect(result.teams[0].players.length).toBe(5);
    expect(result.teams[1].players.length).toBe(5);
    expect(result.teams[2].players.length).toBe(5);
  });

  it('should balance players into 4 teams correctly', () => {
    const players = createMockPlayers(16);
    const result = balanceTeams(players, 4);

    expect(result.teams.length).toBe(4);
    expect(result.metrics.totalPlayers).toBe(16);
    expect(result.metrics.numTeams).toBe(4);

    // Verify all players are allocated exactly once
    const allocatedPlayers = result.teams.flatMap((t) => t.players);
    expect(allocatedPlayers.length).toBe(16);

    // Verify team sizes (4, 4, 4, 4)
    expect(result.teams[0].players.length).toBe(4);
    expect(result.teams[1].players.length).toBe(4);
    expect(result.teams[2].players.length).toBe(4);
    expect(result.teams[3].players.length).toBe(4);
  });

  it('should handle uneven player distribution (e.g. 13 players for 3 teams)', () => {
    const players = createMockPlayers(13);
    const result = balanceTeams(players, 3);

    expect(result.teams.length).toBe(3);
    expect(result.metrics.totalPlayers).toBe(13);

    const sizes = result.teams.map((t) => t.players.length);
    // Total should be 13, min team size should be 4, max 5
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(13);
    expect(Math.max(...sizes)).toBe(5);
    expect(Math.min(...sizes)).toBe(4);
  });

  it('should calculate metrics properly', () => {
    const values = [10, 12, 11, 13];
    const stdDev = calculateStdDev(values);
    // Mean = 11.5
    // Diffs = [-1.5, 0.5, -0.5, 1.5]
    // Squared = [2.25, 0.25, 0.25, 2.25]
    // Sum = 5
    // Var = 5 / 4 = 1.25
    // StdDev = sqrt(1.25) ~ 1.118
    expect(stdDev).toBeCloseTo(1.118, 3);
    expect(maxMinDiff(values)).toBe(3);
  });
});
