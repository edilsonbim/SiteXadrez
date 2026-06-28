import type { PieceSymbol, Color } from "chess.js";

type PieceStyle = "classic" | "carved" | "metal";
type Props = { kind: PieceSymbol; color: Color; className?: string; styleName?: PieceStyle };

const PIECE_SRC: Record<PieceSymbol, string> = {
  b: "/chess/pieces/black-bishop.png",
  q: "/chess/pieces/black-queen.png",
  k: "/chess/pieces/black-king.png",
  n: "/chess/pieces/black-knight.png",
  r: "/chess/pieces/black-rook.png",
  p: "/chess/pieces/black-pawn.png",
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
