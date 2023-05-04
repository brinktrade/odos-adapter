const hre = require('hardhat')
const { ethers } = hre
const { ERC20_ADAPTER_OWNER } = require('../../constants')

// get adapter owner address from constants, fund it and impersonate it, return it as an ethers.js signer
async function setupAdapterOwner () {
  const [ethStore] = await ethers.getSigners()
  await ethStore.sendTransaction({
    to: ERC20_ADAPTER_OWNER,
    value: ethers.BigNumber.from('10000000000000000000000000')
  })
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [ERC20_ADAPTER_OWNER],
  })
  const adapterOwner = await ethers.getSigner(ERC20_ADAPTER_OWNER)
  return adapterOwner
}

module.exports = setupAdapterOwner