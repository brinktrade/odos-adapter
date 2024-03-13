const hre = require('hardhat')
const { ethers } = hre
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, constants } = brinkUtils
const { BN18 } = constants
const setupAdapterOwner = require('./helpers/setupAdapterOwner')
const axios = require('axios')
const { post } = require('axios')
const { Router } = require('@brinkninja/routing')

// const { RouteHandler } = require('@brinkninja/routing')

const DAI_WHALE = '0x2291f52bddc937b5b840d15e551e1da8c80c2b3c'
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

// 100000000000000000000 wei 
const ONE_HUNDRED = BN(100).mul(BN18)
const TWO_HUNDRED = BN(200).mul(BN18)
const ONE_MILLION = BN(10).pow(BN(6)).mul(BN18)

// const routeHandler = new RouteHandler()

describe('ERC20Adapter', function () {
  beforeEach(async function () {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [DAI_WHALE],
    })
    const daiWhale = await hre.ethers.getSigner(DAI_WHALE)
    const ERC20Adapter = await ethers.getContractFactory('ERC20Adapter')
    this.dai = (await ethers.getContractAt('contracts/token/IERC20.sol:IERC20', DAI_ADDRESS)).connect(daiWhale)
    this.weth = (await ethers.getContractAt('contracts/token/IERC20.sol:IERC20', WETH_ADDRESS)).connect(daiWhale)
    this.uni = await ethers.getContractAt('contracts/token/IERC20.sol:IERC20', UNI_ADDRESS)
    this.accountAddress = '0xa2884fB9F79D7060Bcfaa0e7D8a25b7F725de2fa'
    this.adapterOwner = await setupAdapterOwner()
    this.adapter = await ERC20Adapter.deploy()
    await this.adapter.initialize(WETH_ADDRESS)
  })

  it('token to weth', async function () {
    await this.dai.transfer(this.adapter.address, TWO_HUNDRED)

    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: WETH_ADDRESS, userAddr: this.adapter.address })
          
    const initialWethBalance = await this.weth.balanceOf(this.accountAddress)
    const initialDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const initialWethOwnerBalance = await this.weth.balanceOf(this.adapterOwner.address)
    
    const toAddress = swapObj.to
    const callData = swapObj.data
    await this.adapter.erc20Swap(toAddress, callData, DAI_ADDRESS, WETH_ADDRESS, '10', this.accountAddress, 0, 0)

    const finalWethBalance = await this.weth.balanceOf(this.accountAddress)
    const finalDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const finalWethOwnerBalance = await this.weth.balanceOf(this.adapterOwner.address)

    expect(finalWethOwnerBalance.gt(initialWethOwnerBalance)).to.equal(true)
    expect(finalDaiOwnerBalance.eq(initialDaiOwnerBalance.add(ONE_HUNDRED))).to.equal(true)
    expect(finalWethBalance.eq(initialWethBalance.add(BN('10')))).to.equal(true)
    await expectAdapterZeroBalances.call(this)
  })

  it('weth to token', async function () {
    await this.weth.transfer(this.adapter.address, TWO_HUNDRED)

    const swapObj = await routeMarketSwap({ tokenIn: WETH_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: DAI_ADDRESS, userAddr: this.adapter.address })
          
    const initialDaiBalance = await this.dai.balanceOf(this.accountAddress)
    const initialWethOwnerBalance = await this.weth.balanceOf(this.adapterOwner.address)
    const initialDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
  
    const toAddress = swapObj.to
    const callData = swapObj.data
    await this.adapter.erc20Swap(toAddress, callData, WETH_ADDRESS, DAI_ADDRESS, '10', this.accountAddress, 0, 0)

    const finalDaiBalance = await this.dai.balanceOf(this.accountAddress)
    const finalWethOwnerBalance = await this.weth.balanceOf(this.adapterOwner.address)
    const finalDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)

    expect(finalDaiOwnerBalance.gt(initialDaiOwnerBalance)).to.equal(true)
    expect(finalWethOwnerBalance.eq(initialWethOwnerBalance.add(ONE_HUNDRED))).to.equal(true)
    expect(finalDaiBalance.eq(initialDaiBalance.add(BN('10')))).to.equal(true)

    await expectAdapterZeroBalances.call(this)
  })

  it('token to token', async function () {
    await this.dai.transfer(this.adapter.address, TWO_HUNDRED)

    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: UNI_ADDRESS, userAddr: this.adapter.address })

    const initialUniBalance = await this.uni.balanceOf(this.accountAddress)
    const initialDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const initialUniOwnerBalance = await this.uni.balanceOf(this.adapterOwner.address)
    
    const toAddress = swapObj.to
    const callData = swapObj.data
    await this.adapter.erc20Swap(toAddress, callData, DAI_ADDRESS, UNI_ADDRESS, '10', this.accountAddress, 0, 0)

    const finalUniBalance = await this.uni.balanceOf(this.accountAddress)
    const finalDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const finalUniOwnerBalance = await this.uni.balanceOf(this.adapterOwner.address)

    expect(finalDaiOwnerBalance.eq(initialDaiOwnerBalance.add(ONE_HUNDRED))).to.equal(true)
    expect(finalUniOwnerBalance.gt(initialUniOwnerBalance)).to.equal(true)
    expect(finalUniBalance.eq(initialUniBalance.add(BN('10')))).to.equal(true)

    await expectAdapterZeroBalances.call(this)
  })

  it('token to token', async function () {
    await this.dai.transfer(this.adapter.address, TWO_HUNDRED)

    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: UNI_ADDRESS, userAddr: this.adapter.address, source: 'enso' })

    const initialUniBalance = await this.uni.balanceOf(this.accountAddress)
    const initialDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const initialUniOwnerBalance = await this.uni.balanceOf(this.adapterOwner.address)
    
    const toAddress = swapObj.to
    const callData = swapObj.data
    await this.adapter.erc20DelegateCallSwap(toAddress, callData, DAI_ADDRESS, UNI_ADDRESS, '10', this.accountAddress, 0, 0)

    const finalUniBalance = await this.uni.balanceOf(this.accountAddress)
    const finalDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const finalUniOwnerBalance = await this.uni.balanceOf(this.adapterOwner.address)

    expect(finalDaiOwnerBalance.eq(initialDaiOwnerBalance.add(ONE_HUNDRED))).to.equal(true)
    expect(finalUniOwnerBalance.gt(initialUniOwnerBalance)).to.equal(true)
    expect(finalUniBalance.eq(initialUniBalance.add(BN('10')))).to.equal(true)

    await expectAdapterZeroBalances.call(this)
  })

  it('eth to token', async function () {
    const swapObj = await routeMarketSwap({ tokenIn: WETH_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: UNI_ADDRESS, userAddr: this.adapter.address })

    const initialUniBalance = await this.uni.balanceOf(this.accountAddress)
    const initialWethOwnerBalance = await this.weth.balanceOf(this.adapterOwner.address)
    const initialUniOwnerBalance = await this.uni.balanceOf(this.adapterOwner.address)

    const toAddress = swapObj.to
    const callData = swapObj.data
    await this.adapter.erc20Swap(toAddress, callData, ETH_ADDRESS, UNI_ADDRESS, '10', this.accountAddress, 0, 0, { value: ethers.utils.parseEther("200.0") })

    const finalUniBalance = await this.uni.balanceOf(this.accountAddress)
    const finalWethOwnerBalance = await this.weth.balanceOf(this.adapterOwner.address)
    const finalUniOwnerBalance = await this.uni.balanceOf(this.adapterOwner.address)

    expect(finalUniOwnerBalance.gt(initialUniOwnerBalance)).to.equal(true)
    expect(finalWethOwnerBalance.eq(initialWethOwnerBalance.add(ONE_HUNDRED))).to.equal(true)
    expect(finalUniBalance.eq(initialUniBalance.add(BN('10')))).to.equal(true)

    await expectAdapterZeroBalances.call(this)
  })

  it('token to eth', async function () {
    await this.dai.transfer(this.adapter.address, TWO_HUNDRED)
    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: WETH_ADDRESS, userAddr: this.adapter.address })

    const initialDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const initialEthOwnerBalance = await ethers.provider.getBalance(this.adapterOwner.address)
    const initialEthBalance = await ethers.provider.getBalance(this.accountAddress);

    const toAddress = swapObj.to
    const callData = swapObj.data
    await this.adapter.erc20Swap(toAddress, callData, DAI_ADDRESS, ETH_ADDRESS, '10', this.accountAddress, 0, 0)

    const finalDaiOwnerBalance = await this.dai.balanceOf(this.adapterOwner.address)
    const finalEthOwnerBalance = await ethers.provider.getBalance(this.adapterOwner.address)
    const finalEthBalance = await ethers.provider.getBalance(this.accountAddress);

    expect(finalDaiOwnerBalance.eq(initialDaiOwnerBalance.add(ONE_HUNDRED))).to.equal(true)
    expect(finalEthOwnerBalance.gt(initialEthOwnerBalance)).to.equal(true)
    expect(finalEthBalance.eq(initialEthBalance.add(BN('10')))).to.equal(true)
  
    await expectAdapterZeroBalances.call(this)
  })

  it('should revert on token to eth swap if not enough eth is available to transfer', async function () {
    await this.dai.transfer(this.adapter.address, ONE_HUNDRED)
    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: WETH_ADDRESS, userAddr: this.adapter.address })
    const toAddress = swapObj.to
    const callData = swapObj.data
    await expect(
      this.adapter.erc20Swap(toAddress, callData, DAI_ADDRESS, ETH_ADDRESS, TWO_HUNDRED, this.accountAddress, 0, 0)
    ).to.be.revertedWith('NotEnoughETH()')
  })

  it('should revert on token to token swap if output amount remaining after swap is less than minTokenOutArb', async function () {
    await this.dai.transfer(this.adapter.address, ONE_HUNDRED)
    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: UNI_ADDRESS, userAddr: this.adapter.address })
    const toAddress = swapObj.to
    const callData = swapObj.data

    // massive amount of UNI out required to force revert
    const minUniOut = ONE_HUNDRED.mul(ONE_MILLION)
  
    await expect(
      this.adapter.erc20Swap(toAddress, callData, DAI_ADDRESS, UNI_ADDRESS, '10', this.accountAddress, 0, minUniOut)
    ).to.be.revertedWith('NotEnoughTokenOut')
  })

  it('should revert on token to eth swap if output amount remaining after swap is less than minTokenOutArb', async function () {
    await this.dai.transfer(this.adapter.address, ONE_HUNDRED)

    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: WETH_ADDRESS, userAddr: this.adapter.address })
    const toAddress = swapObj.to
    const callData = swapObj.data

    // massive amount of ETH out required to force revert
    const minEthOut = ONE_HUNDRED.mul(ONE_MILLION)

    await expect(
      this.adapter.erc20Swap(toAddress, callData, DAI_ADDRESS, ETH_ADDRESS, '10', this.accountAddress, 0, minEthOut)
    ).to.be.revertedWith('NotEnoughTokenOut')
  })

  it('should revert if token in amount remaining after swap is less than minTokenInArb', async function () {
    await this.dai.transfer(this.adapter.address, TWO_HUNDRED)

    const swapObj = await routeMarketSwap({ tokenIn: DAI_ADDRESS, tokenInAmount: ONE_HUNDRED.toString(), tokenOut: UNI_ADDRESS, userAddr: this.adapter.address })
    const toAddress = swapObj.to
    const callData = swapObj.data
  
    await expect(
      this.adapter.erc20Swap(toAddress, callData, DAI_ADDRESS, UNI_ADDRESS, '10', this.accountAddress, ONE_HUNDRED.add(BN(1)), 0)
    ).to.be.revertedWith(`NotEnoughTokenIn(${ONE_HUNDRED.toString()})`)
  })
})

class Token {
  address
  standard
  idsMerkleRoot
  id
  disallowFlagged

  constructor (args) {
    this.address = args.address
    this.standard = args.standard || 0
    this.idsMerkleRoot = args.idsMerkleRoot || '0x0000000000000000000000000000000000000000000000000000000000000000'
    this.id = BigInt(args?.id || 0)
    this.disallowFlagged = args.disallowFlagged || false
  }

  toStruct() {
    return {
      addr: this.address,
      standard: this.standard,
      idsMerkleRoot: this.idsMerkleRoot,
      id: this.id,
      disallowFlagged: this.disallowFlagged
    }
  }

  toJSON() {
    return {
      address: this.address,
      standard: this.standard,
      idsMerkleRoot: this.idsMerkleRoot,
      id: this.id.toString(),
      disallowFlagged: this.disallowFlagged
    }
  }

}

async function routeMarketSwap ({ tokenIn, tokenInAmount, tokenOut, userAddr, chainId=1, source='odos' }) {
  const router = new Router({})
  const tokenInArgs = new Token({ address: tokenIn });
  const tokenOutArgs = new Token({ address: tokenOut });
  const resp = await router.routeSwapForInput({ chainId: BigInt(chainId), tokenIn: tokenInArgs, tokenOut: tokenOutArgs, tokenInAmount: BigInt(tokenInAmount), buyer: userAddr, sources: [source] })
  return resp[0]
}

async function expectAdapterZeroBalances () {
  const adapterDaiBal = await this.dai.balanceOf(this.adapter.address)
  const adapterUniBal = await this.uni.balanceOf(this.adapter.address)
  const adapterWethBal = await this.weth.balanceOf(this.adapter.address)
  const adapterEthBal = await ethers.provider.getBalance(this.adapter.address)
  expect(adapterDaiBal).to.equal(BN(0))
  expect(adapterUniBal).to.equal(BN(0))
  expect(adapterWethBal).to.equal(BN(0))
  expect(adapterEthBal).to.equal(BN(0))
}