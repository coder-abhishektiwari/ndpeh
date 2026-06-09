const { spawnSync } = require("child_process");
const r = spawnSync("npx.cmd", ["next", "build"], { cwd: __dirname, stdio: "inherit", shell: true });
process.exit(r.status || 0);
