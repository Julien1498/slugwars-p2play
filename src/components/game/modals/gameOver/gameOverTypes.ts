import { Team } from '../../../../core/types';

export interface TeamSummary {
  team: Team;
  isWinner: boolean;
  totalRemainingHp: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
}
