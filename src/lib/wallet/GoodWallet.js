// @flow
import type { Web3, PromiEvent, Transaction } from 'web3'
import WalletFactory from './WalletFactory'
import IdentityABI from '@gooddollar/goodcontracts/build/contracts/Identity.json'
import RedemptionABI from '@gooddollar/goodcontracts/build/contracts/RedemptionFunctional.json'
import GoodDollarABI from '@gooddollar/goodcontracts/build/contracts/GoodDollar.json'
import ReserveABI from '@gooddollar/goodcontracts/build/contracts/GoodDollarReserve.json'
import OneTimePaymentLinksABI from '@gooddollar/goodcontracts/build/contracts/OneTimePaymentLinks.json'
import timeoutPromise, { TimeoutError } from 'promise-timeout'
import logger from '../../lib/logger/pino-logger'
import Config from '../../config/config'

const log = logger.child({ from: 'GoodWallet' })

/**
 * the HDWallet account to use.
 * we use different accounts for different actions in order to preserve privacy and simplify things for user
 * in background
 */
const AccountUsageToPath = {
  gd: 0,
  gundb: 1,
  eth: 2,
  donate: 3
}
export type AccountUsage = $Keys<typeof AccountUsageToPath>

class TxTimeoutError extends Error {
  constructor(txHash, ...args) {
    super(...args)
    this.txHash = txHash
  }
}
export class GoodWallet {
  ready: Promise<Web3>
  wallet: Web3
  accountsContract: Web3.eth.Contract
  tokenContract: Web3.eth.Contract
  identityContract: Web3.eth.Contract
  claimContract: Web3.eth.Contract
  reserveContract: Web3.eth.Contract
  oneTimePaymentLinksContract: Web3.eth.Contract
  account: string
  accounts: Array<string>
  networkId: number
  gasPrice: number

  constructor() {
    this.init()
  }

  init(): Promise<any> {
    const ready = WalletFactory.create('software')
    this.ready = ready
      .then(wallet => {
        this.wallet = wallet
        this.account = this.wallet.eth.defaultAccount
        this.accounts = this.wallet.eth.accounts.wallet
        this.networkId = Config.networkId
        this.gasPrice = wallet.utils.toWei('1', 'gwei')
        this.identityContract = new this.wallet.eth.Contract(
          IdentityABI.abi,
          IdentityABI.networks[this.networkId].address,
          { from: this.account }
        )
        this.claimContract = new this.wallet.eth.Contract(
          RedemptionABI.abi,
          RedemptionABI.networks[this.networkId].address,
          { from: this.account }
        )
        this.tokenContract = new this.wallet.eth.Contract(
          GoodDollarABI.abi,
          GoodDollarABI.networks[this.networkId].address,
          { from: this.account }
        )
        this.reserveContract = new this.wallet.eth.Contract(
          ReserveABI.abi,
          ReserveABI.networks[this.networkId].address,
          {
            from: this.account
          }
        )
        this.oneTimePaymentLinksContract = new this.wallet.eth.Contract(
          OneTimePaymentLinksABI.abi,
          OneTimePaymentLinksABI.networks[this.networkId].address,
          {
            from: this.account
          }
        )
        log.info('GoodWallet Ready.')
      })
      .catch(e => {
        log.error('Failed initializing GoodWallet', e)
        throw e
      })
    return this.ready
  }

  async claim() {
    try {
      const gas = await this.claimContract.methods.claimTokens().estimateGas()
      return this.claimContract.methods.claimTokens().send({
        gas,
        gasPrice: await this.wallet.eth.getGasPrice()
      })
    } catch (e) {
      log.info(e)
      return Promise.reject(e)
    }
  }

  async checkEntitlement() {
    return await this.claimContract.methods.checkEntitlement().call()
  }

  balanceChanged(callback: (error: any, event: any) => any): [Promise<any>, Promise<any>] {
    const fromHanlder: Promise<any> = this.tokenContract.events.Transfer(
      { fromBlock: 'latest', filter: { from: this.account } },
      callback
    )
    const toHandler: Promise<any> = this.tokenContract.events.Transfer(
      { fromBlock: 'latest', filter: { to: this.account } },
      callback
    )

    return [toHandler, fromHanlder]
  }

  async balanceOf() {
    return this.tokenContract.methods.balanceOf(this.account).call()
  }

  signMessage() {}

  sendTx() {}

  async getAccountForType(type: AccountUsage) {
    let account = this.accounts[AccountUsageToPath[type]].address || this.account
    return account
  }

  async sign(toSign: string, accountType: AccountUsage = 'gd') {
    let account = await this.getAccountForType(accountType)
    return this.wallet.eth.sign(toSign, account)
  }

  async isVerified(address: string): Promise<boolean> {
    const tx: boolean = await this.identityContract.methods.isVerified(address).call()
    return tx
  }

  async isCitizen(): Promise<boolean> {
    const tx: boolean = await this.identityContract.methods.isVerified(this.account).call()
    return tx
  }

  async canSend(amount: number) {
    const balance = await this.balanceOf()
    return amount < balance
  }

  async handleTxGracefully(promievent: PromiEvent): Promise<Transaction> {
    let txHash = undefined
    const resPromise = new Promise((resolve, reject) => {
      promievent.on('transactionHash', hash => (txHash = hash))
      promievent.on('reciept', resolve)
      promievent.on('error', e => {
        log.debug({ txError: e })
        reject(e)
      })
    })
    return timeoutPromise(resPromise, 15000).catch(e => {
      log.debug({ txError: e })
      if (e instanceof TimeoutError && txHash) throw new TxTimeoutError(txHash, 'Transaction timed out')
      else throw e
    })
  }

  async generateLink(amount: number) {
    if (!(await this.canSend(amount))) {
      throw new Error(`Amount is bigger than balance`)
    }
    const generatedString = this.wallet.utils.sha3(this.wallet.utils.randomHex(10))

    log.debug('this.oneTimePaymentLinksContract', this.oneTimePaymentLinksContract)
    log.debug('this.tokenContract', this.tokenContract)

    const encodedABI = await this.oneTimePaymentLinksContract.methods
      .deposit(this.account, generatedString, amount)
      .encodeABI()

    const gas = await this.tokenContract.methods
      .transferAndCall(this.oneTimePaymentLinksContract.defaultAccount, amount, encodedABI)
      .estimateGas()
      .catch(err => {
        log.error(err)
        throw err
      })
    log.debug({ amount, gas })
    const tx = await this.tokenContract.methods
      .transferAndCall(this.oneTimePaymentLinksContract.defaultAccount, amount, encodedABI)
      .send({ gas })
      .on('transactionHash', hash => log.debug({ hash }))
      .catch(err => {
        log.error({ err })
        throw err
      })
    log.debug({ tx })
    return generatedString
  }

  async getGasPrice() {
    let gasPrice = this.gasPrice

    try {
      const { toBN } = this.wallet.utils
      const networkGasPrice = toBN(await this.wallet.eth.getGasPrice())

      if (networkGasPrice.gt(toBN('0'))) {
        gasPrice = networkGasPrice.toString()
      }
    } catch (e) {
      log.error('failed to retrieve gas price from network', { e })
    }

    return gasPrice
  }

  async sendAmount(to: string, amount: number) {
    if (!this.wallet.utils.isAddress(to)) {
      throw new Error('Address is invalid')
    }

    if (amount === 0 || !(await this.canSend(amount))) {
      throw new Error('Amount is bigger than balance')
    }

    const gasPrice = await this.getGasPrice()
    log.info({ gasPrice, thisGasPrice: this.gasPrice })

    const handleError = err => {
      log.error({ err })
      throw err
    }

    const transferCall = this.tokenContract.methods.transfer(to, amount)
    const gas = await transferCall.estimateGas().catch(handleError)

    log.debug({ amount, to, gas })

    return await transferCall
      .send({ gas, gasPrice })
      .on('transactionHash', hash => log.debug({ hash }))
      .catch(handleError)
  }
}
export default new GoodWallet()
