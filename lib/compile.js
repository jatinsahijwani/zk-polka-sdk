const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

async function compileCircuit(circuitPath) {
  const baseName = path.basename(circuitPath, ".circom");
  const cwd = process.cwd(); // User's project directory
  const outDir = path.join(cwd, baseName);

  await fs.ensureDir(outDir);

  console.log(`📦 Compiling ${baseName} into ${outDir}...`);

  // Find circomlib path relative to this SDK's root
  const circomlibPath = path.join(__dirname, "..", "node_modules", "circomlib", "circuits");

  // Step 1: Compile circom to wasm + r1cs using SDK's own circomlib
  execSync(
    `circom ${path.resolve(circuitPath)} --wasm --r1cs -l "${circomlibPath}" -o "${outDir}"`,
    { stdio: "inherit" }
  );

  // Step 2: Check PTAU file
  const ptauPath = path.join(__dirname, "..", "ptau", "pot12_final.ptau");
  if (!fs.existsSync(ptauPath)) {
    throw new Error(`Missing PTAU file at: ${ptauPath}`);
  }

  // Step 3: Run groth16 setup
  execSync(
    `snarkjs groth16 setup "${outDir}/${baseName}.r1cs" "${ptauPath}" "${outDir}/circuit_final.zkey"`,
    { stdio: "inherit" }
  );

  // Step 4: Export verifier
  execSync(
    `snarkjs zkey export solidityverifier "${outDir}/circuit_final.zkey" "${outDir}/verifier.sol"`,
    { stdio: "inherit" }
  );

  console.log(`✅ All files generated in: ${outDir}`);
}

module.exports = { compileCircuit };