import type { CSSProperties } from "react";
import type { PieceSymbol, Color } from "chess.js";

type PieceStyle = "classic" | "carved" | "metal";
type Props = { kind: PieceSymbol; color: Color; className?: string; styleName?: PieceStyle };

const PIECE_INDEX: Record<PieceSymbol, number> = {
  b: 0,
  q: 1,
  k: 2,
  n: 3,
  r: 4,
  p: 5,
};

const PIECE_ATLAS = {
  classic: "/chess/silhouette-atlas.png",
  carved: "/chess/silhouette-atlas.png",
  metal: "/chess/silhouette-atlas.png",
} as const;

export function Piece({ kind, color, className = "", styleName = "classic" }: Props) {
  const atlas = PIECE_ATLAS[styleName];
  const isWhite = color === "w";
  const pieceIndex = PIECE_INDEX[kind];

  return (
    <div
      aria-label={`${isWhite ? "white" : "black"} ${kind}`}
      role="img"
      className={[
        "piece piece-atlas",
        `piece-atlas--${styleName}`,
        isWhite ? "piece-atlas--white" : "",
        className,
      ].join(" ")}
      style={
        {
          ["--piece-index" as never]: pieceIndex,
          ["--piece-atlas" as never]: `url(${atlas})`,
        } as CSSProperties
      }
    />
  );
}
