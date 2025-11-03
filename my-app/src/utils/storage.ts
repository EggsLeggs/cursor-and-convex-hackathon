const PLAYER_TOKEN_KEY = "ai_game_player_token";
const PLAYER_NAME_KEY = "ai_game_player_name";

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

export function getPlayerName(): string | null {
  return localStorage.getItem(PLAYER_NAME_KEY);
}

export function setPlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

export function clearPlayerName(): void {
  localStorage.removeItem(PLAYER_NAME_KEY);
}

export function hasPlayerName(): boolean {
  return localStorage.getItem(PLAYER_NAME_KEY) !== null;
}
