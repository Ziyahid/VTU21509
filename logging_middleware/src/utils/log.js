function Log(stack, level, pkg, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${stack}] [${level.toUpperCase()}] [${pkg}] ${message}`);
}

module.exports = { Log };
