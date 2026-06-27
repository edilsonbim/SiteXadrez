declare module "stockfish/src/stockfish-nnue-16.js" {
  function stockfish(): {
    postMessage(msg: string): void;
    onmessage: ((msg: string) => void) | null;
  };
  export default stockfish;
}

