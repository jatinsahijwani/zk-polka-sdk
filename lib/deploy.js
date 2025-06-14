const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

async function deployVerifier(folderPath, privateKey) {
  try {
    const rpcUrl = "https://testnet-passet-hub-eth-rpc.polkadot.io";
    const verifierPath = path.join(folderPath, 'verifier.sol');

    if (!fs.existsSync(verifierPath)) {
      console.error(`❌ verifier.sol not found in folder: ${folderPath}`);
      process.exit(1);
    }

    // ✅ Compile using @parity/revive
    console.log("🛠️ Compiling verifier.sol to PolkaVM bytecode...");

    // Ensure npm project
    if (!fs.existsSync(path.join(folderPath, 'package.json'))) {
      execSync(`npm init -y`, { cwd: folderPath });
    }

    // Install revive + solc@0.8.29 locally
    execSync(`npm install @parity/revive solc@0.8.29`, {
      cwd: folderPath,
      stdio: 'inherit',
    });

    // Compile using local revive
    execSync(`npx @parity/revive --bin verifier.sol`, { cwd: folderPath });

    // 🔍 Locate the .polkavm file after compiling
    const files = fs.readdirSync(folderPath);
    const polkavmFile = files.find(f => f.endsWith('.polkavm'));
    if (!polkavmFile) throw new Error("No .polkavm file found after compilation.");
    const polkavmPath = path.join(folderPath, polkavmFile);

    // ✅ Read compiled .polkavm and convert to hex
    const compiledBuffer = await fs.readFile(polkavmPath);
    const hexData = compiledBuffer.toString('hex');

    console.log("🚀 Deploying contract to PolkaVM...");
    const deployCmd = `cast send --rpc-url ${rpcUrl} --private-key ${privateKey} --create "${hexData}" --json`;
    const deployOutput = execSync(deployCmd).toString();
    const deployResult = JSON.parse(deployOutput);

    const deploymentInfo = {
      contractAddress: deployResult.contractAddress,
      transactionHash: deployResult.transactionHash,
    };

    await fs.writeJson(path.join(folderPath, 'deployment.json'), deploymentInfo, { spaces: 2 });

    console.log(`✅ Contract deployed!`);
    console.log(`📦 Contract Address: ${deployResult.contractAddress}`);
    console.log(`🔗 Transaction Hash: ${deployResult.transactionHash}`);
  } catch (err) {
    console.error("❌ Deployment failed:", err.message || err);
    process.exit(1);
  }
}

module.exports = { deployVerifier };
