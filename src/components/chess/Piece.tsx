import type { PieceSymbol, Color } from "chess.js";

type PieceStyle = "classic" | "carved" | "metal";
type Props = { kind: PieceSymbol; color: Color; className?: string; styleName?: PieceStyle };

const PIECE_SRC: Record<PieceSymbol, string> = {
  b: "/chess/pieces/black-bishop.png?v=2",
  q: "/chess/pieces/black-queen.png?v=2",
  k: "/chess/pieces/black-king.png?v=2",
  n: "/chess/pieces/black-knight.png?v=2",
  r: "/chess/pieces/black-rook.png?v=2",
  p: "/chess/pieces/black-pawn.png?v=2",
} as const;

export function Piece({ kind, color, className = "", styleName = "classic" }: Props) {
  const src = PIECE_SRC[kind];
  const isWhite = color === "w";

  return (
    <img
      src={src}
      aria-label={`${isWhite ? "white" : "black"} ${kind}`}
      role="img"
      alt=""
      className={[
        "piece piece-image",
        `piece-image--${styleName}`,
        isWhite ? "piece-image--white" : "",
        className,
      ].join(" ")}
      draggable={false}
    />
  );
}
