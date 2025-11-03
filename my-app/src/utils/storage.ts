const PLAYER_TOKEN_KEY = "ai_game_player_token";

export function getPlayerToken(): string | null {
  return localStorage.getItem(PLAYER_TOKEN_KEY);
}

export function setPlayerToken(token: string): void {
  localStorage.setItem(PLAYER_TOKEN_KEY, token);
}

export function clearPlayerToken(): void {
  localStorage.removeItem(PLAYER_TOKEN_KEY);
}

export function hasPlayerToken(): boolean {
  return localStorage.getItem(PLAYER_TOKEN_KEY) !== null;
}
