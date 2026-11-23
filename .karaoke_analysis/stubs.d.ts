// Ambient stubs so tsc can type-check our changed files without a full install.
declare module '*' {
  const value: any
  export = value
}
declare module 'bun:test' {
  export const describe: any
  export const expect: any
  export const it: any
}
