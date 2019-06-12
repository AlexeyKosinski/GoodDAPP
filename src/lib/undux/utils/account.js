// @flow
import type { Store } from 'undux'
import logger from '../../logger/pino-logger'
import goodWallet from '../../wallet/GoodWallet'
import userStorage from '../../gundb/UserStorage'

const log = logger.child({ from: 'undux/utils/balance' })

const updateAll = (store: Store) => {
  return Promise.all([goodWallet.balanceOf(), goodWallet.checkEntitlement()])
    .then(([balance, entitlement]) => {
      const account = store.get('account')
      if (account.balance.eq(balance) && account.entitlement.eq(entitlement) && account.ready === true) return

      store.set('account')({ balance, entitlement, ready: true })
    })
    .catch(error => {
      log.error(error)
    })
}

/**
 * Callback to handle events emmited
 * @param error
 * @param event
 * @param store
 * @returns {Promise<void>}
 */
const onBalanceChange = async (error: {}, event: [any] = [], store: Store) => {
  log.debug('new Transfer event:', { error, event })

  if (!error && event.length) {
    await updateAll(store)
  }
}

const status = {
  started: false
}

/**
 * Starts listening to Transfer events to (and from) the current account
 */
const initTransferEvents = async (store: Store) => {
  if (!status.started) {
    const lastBlock = await userStorage.getLastBlockNode().then()
    log.debug('starting events listener', { lastBlock })

    status.started = true

    goodWallet.listenTxUpdates(lastBlock, ({ fromBlock, toBlock }) => userStorage.saveLastBlockNumber(toBlock))

    goodWallet.balanceChanged((error, event) => onBalanceChange(error, event, store))
  }
}

export { initTransferEvents, updateAll }
