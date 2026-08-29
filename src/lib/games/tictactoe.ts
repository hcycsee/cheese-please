import { type BaseSession, type GameMode, getSession as getBaseSession, setSession, clearTimer } from "./shared";

export type Mark = "X" | "O";

export type TicTacToeSession = BaseSession & {
  type: "tictactoe";
  board: (Mark | null)[];
  marks: Record<string, Mark>; // userId -> mark, at most 2 entries
  turn: Mark;
  winner?: Mark | "draw";
};

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function asTicTacToe(s: BaseSession | null): TicTacToeSession | null {
  return s && s.type === "tictactoe" ? (s as TicTacToeSession) : null;
}

export function getSession(key: string): TicTacToeSession | null {
  return asTicTacToe(getBaseSession(key));
}

export function createLobby(key: string, mode: GameMode, targetId: string, startedBy: string, startedByName: string): TicTacToeSession {
  clearTimer(key);
  const session: TicTacToeSession = {
    key,
    mode,
    targetId,
    type: "tictactoe",
    status: "lobby",
    players: { [startedBy]: startedByName },
    playerOrder: [startedBy],
    startedBy,
    board: Array(9).fill(null),
    marks: {},
    turn: "X",
  };
  setSession(key, session);
  return session;
}

export function joinLobby(key: string, userId: string, name: string): TicTacToeSession | null {
  const s = getSession(key);
  if (!s || s.status !== "lobby") return null;
  if (!s.players[userId]) {
    if (s.playerOrder.length >= 2) return null; // full — tic-tac-toe is strictly 1v1
    s.players[userId] = name;
    s.playerOrder.push(userId);
  }
  return s;
}

export function beginRound(key: string): TicTacToeSession | null {
  const s = getSession(key);
  if (!s || s.status !== "lobby") return null;
  if (s.playerOrder.length < 2) return null;
  s.marks[s.playerOrder[0]] = "X";
  s.marks[s.playerOrder[1]] = "O";
  s.status = "active";
  return s;
}

function checkWinner(board: (Mark | null)[]): Mark | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export function makeMove(key: string, userId: string, index: number): TicTacToeSession | null {
  const s = getSession(key);
  if (!s || s.status !== "active") return null;
  const mark = s.marks[userId];
  if (!mark || mark !== s.turn) return null;
  if (index < 0 || index >= 9 || s.board[index]) return null;

  s.board[index] = mark;
  const winner = checkWinner(s.board);
  if (winner) {
    s.status = "ended";
    s.winner = winner;
  } else if (s.board.every((c) => c)) {
    s.status = "ended";
    s.winner = "draw";
  } else {
    s.turn = mark === "X" ? "O" : "X";
  }
  return s;
}
