// @flow
import React, { useState } from 'react'
import { AmountInput, Section, Wrapper } from '../common'
import TopBar from '../common/view/TopBar'
import { BackButton, NextButton, useScreenState } from '../appNavigation/stackNavigation'
import goodWallet from '../../lib/wallet/GoodWallet'
import { gdToWei, weiToGd } from '../../lib/wallet/utils'
import { ACTION_RECEIVE, navigationOptions } from './utils/sendReceiveFlow'

export type AmountProps = {
  screenProps: any,
  navigation: any,
}

const Amount = (props: AmountProps) => {
  const { screenProps } = props
  const [screenState, setScreenState] = useScreenState(screenProps)
  const { params } = props.navigation.state
  const { amount, ...restState } = { amount: 0, ...screenState } || {}
  const [GDAmount, setGDAmount] = useState(amount > 0 ? weiToGd(amount) : '')
  const [loading, setLoading] = useState(amount <= 0)
  const [error, setError] = useState()

  const canContinue = async weiAmount => {
    if (params && params.action === ACTION_RECEIVE) {
      return true
    }
    console.info('canContiniue?', { weiAmount, params })
    try {
      if (await goodWallet.canSend(weiAmount)) {
        return true
      }

      setError(`Sorry, you don't have enough G$`)
      return false
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  const handleContinue = async () => {
    setLoading(true)

    const weiAmount = gdToWei(GDAmount)
    setScreenState({ amount: weiAmount })
    const can = await canContinue(weiAmount)

    setLoading(false)

    return can
  }

  const handleAmountChange = (value: string) => {
    setGDAmount(value)
    setLoading(value <= 0)
  }

  return (
    <Wrapper>
      <TopBar push={screenProps.push} />
      <Section grow>
        <Section.Title>How much?</Section.Title>
        <Section.Stack grow justifyContent="flex-start">
          <AmountInput amount={GDAmount} handleAmountChange={handleAmountChange} error={error} />
        </Section.Stack>
        <Section.Row>
          <Section.Row grow={1} justifyContent="flex-start">
            <BackButton mode="text" screenProps={screenProps}>
              Cancel
            </BackButton>
          </Section.Row>
          <Section.Stack grow={3}>
            <NextButton
              nextRoutes={screenState.nextRoutes}
              canContinue={handleContinue}
              values={{ ...restState, amount: gdToWei(GDAmount), params }}
              disabled={loading}
              {...props}
            />
          </Section.Stack>
        </Section.Row>
      </Section>
    </Wrapper>
  )
}

Amount.navigationOptions = navigationOptions

Amount.shouldNavigateToComponent = props => {
  const { screenState } = props.screenProps
  return !!screenState.nextRoutes
}

export default Amount
