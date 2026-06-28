import type { PieceSymbol, Color } from "chess.js";

type PieceStyle = "classic" | "carved" | "metal";
type Props = { kind: PieceSymbol; color: Color; className?: string; styleName?: PieceStyle };

const PIECE_SRC: Record<`${Color}-${PieceSymbol}`, string> = {
  "b-b": "/chess/pieces/black-bishop.png?v=3",
  "b-k": "/chess/pieces/black-king.png?v=3",
  "b-n": "/chess/pieces/black-knight.png?v=3",
  "b-p": "/chess/pieces/black-pawn.png?v=2",
  "b-q": "/chess/pieces/black-queen.png?v=3",
  "b-r": "/chess/pieces/black-rook.png?v=3",
  "w-b": "/chess/pieces/white-bishop.png?v=3",
  "w-k": "/chess/pieces/white-king.png?v=3",
  "w-n": "/chess/pieces/white-knight.png?v=3",
  "w-p": "/chess/pieces/black-pawn.png?v=2",
  "w-q": "/chess/pieces/white-queen.png?v=3",
  "w-r": "/chess/pieces/white-rook.png?v=3",
} as const;

export function Piece({ kind, color, className = "", styleName = "classic" }: Props) {
  const src = PIECE_SRC[`${color}-${kind}`];
  const isWhite = color === "w";
  const usesWhiteFallbackTint = isWhite && kind === "p";

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
        usesWhiteFallbackTint ? "piece-image--white-fallback" : "",
        className,
      ].join(" ")}
      draggable={false}
    />
  );
}
