// Tipe minimal untuk test Bun — menghindari dependensi `bun-types` hanya untuk 3 simbol.
declare module "bun:test" {
  export const describe: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => void | Promise<void>) => void;
  // ponytail: `any` cukup untuk matcher; ganti ke tipe Bun asli bila test makin rumit.
  export const expect: (actual: unknown) => any;
}
