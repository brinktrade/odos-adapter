const { ethers } = require('hardhat')
const snapshot = require('snap-shot-it')
const { expect } = require('chai')
const deploySaltedBytecode = require('@brinkninja/core/test/helpers/deploySaltedBytecode')
const { ERC20_ADAPTER } = require('../constants')

describe('ERC20Adapter.sol', function () {
  it('deterministic address check', async function () {
    const ERC20Adapter = await ethers.getContractFactory('ERC20Adapter')
    const address = await deploySaltedBytecode(ERC20Adapter.bytecode, [], [])
    console.log(address)
    snapshot(address)
    expect(address, 'Deployed account address and ERC20_ADAPTER constant are different').to.equal(ERC20_ADAPTER)
  })
})
