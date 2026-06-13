const hre = require("hardhat");

async function main() {
  console.log("\n🚀  Deploying CitizenCredits to Ganache...\n");

  const CitizenCredits = await hre.ethers.getContractFactory("CitizenCredits");
  const contract = await CitizenCredits.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✅  CitizenCredits deployed at:", address);
  console.log("\n   Add this line to backend/.env:");
  console.log(`   CONTRACT_ADDRESS=${address}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
