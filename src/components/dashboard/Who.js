// @flow
import React from 'react'
import InputText from '../common/form/InputText'

import { ScanQRButton, Section, Wrapper } from '../common'
import TopBar from '../common/view/TopBar'
import { BackButton, NextButton, useScreenState } from '../appNavigation/stackNavigation'
import { withStyles } from '../../lib/styles'
import useValidatedValueState from '../../lib/utils/useValidatedValueState'
import { ACTION_RECEIVE, navigationOptions } from './utils/sendReceiveFlow'

export type AmountProps = {
  screenProps: any,
  navigation: any,
}

const getError = value => {
  if (!value) {
    return 'Name is mandatory'
  }

  return null
}

const Who = (props: AmountProps) => {
  const { screenProps } = props

  const [screenState] = useScreenState(screenProps)
  const { params } = props.navigation.state
  const text = params && params.action === ACTION_RECEIVE ? 'From Who?' : 'Send To?'
  const { counterPartyDisplayName } = screenState

  const getErrorFunction = params && params.action === ACTION_RECEIVE ? () => null : getError
  const [state, setValue] = useValidatedValueState(counterPartyDisplayName, getErrorFunction)

  console.info('Component props -> ', { props, params, text, state })

  return (
    <Wrapper>
      <TopBar push={screenProps.push}>
        {params && params.action !== ACTION_RECEIVE && <ScanQRButton onPress={() => screenProps.push('SendByQR')} />}
      </TopBar>
      <Section grow>
        <Section.Stack justifyContent="flex-start">
          <Section.Title>{text}</Section.Title>
          <InputText
            autoFocus
            style={props.styles.input}
            value={state.value}
            error={state.error}
            onChangeText={setValue}
            placeholder="Enter the recipient name"
          />
        </Section.Stack>
        <Section.Row grow alignItems="flex-end">
          <Section.Row grow={1} justifyContent="flex-start">
            <BackButton mode="text" screenProps={screenProps}>
              Cancel
            </BackButton>
          </Section.Row>
          <Section.Stack grow={3}>
            <NextButton
              nextRoutes={screenState.nextRoutes}
              values={{ params, counterPartyDisplayName }}
              canContinue={() => state.isValid}
              {...props}
              label={state.value ? 'Next' : 'Skip'}
              disabled={!state.isValid}
            />
          </Section.Stack>
        </Section.Row>
      </Section>
    </Wrapper>
  )
}

Who.navigationOptions = navigationOptions

Who.shouldNavigateToComponent = props => {
  const { screenState } = props.screenProps
  return screenState.nextRoutes
}

export default withStyles(({ theme }) => ({ input: { marginTop: theme.sizes.defaultDouble } }))(Who)
