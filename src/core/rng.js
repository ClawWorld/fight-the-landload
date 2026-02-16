export function createSeededRng(seed = 123456789) {
  let s = seed >>> 0;
  return function rng() {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x100000000;
  };
}
