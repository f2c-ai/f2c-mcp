const script = process.env.npm_lifecycle_script || "";
const isDev = script.includes("--watch");

export const result = await Bun.build({
  entrypoints: [
    "src/stdio.ts",
    "src/cli.ts",
    "src/streamable-http.ts",
    "src/socket.ts",
  ],
  outdir: "dist",
  format: "cjs",
  target: "node",
  sourcemap: "linked",
  minify: !isDev,
  env: isDev ? "inline" : "disable",
});
