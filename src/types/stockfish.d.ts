declare module "stockfish" {
  interface StockfishEngine {
    postMessage(msg: string): void;
    onmessage: ((msg: string) => void) | null;
  }
  function stockfish(): StockfishEngine;
  export default stockfish;
}
