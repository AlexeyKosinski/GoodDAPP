// @flow
import React, { useMemo } from 'react'
import { isMobile } from 'mobile-device-detect'
import normalize from 'react-native-elements/src/helpers/normalizeText'

import goodWallet from '../../lib/wallet/GoodWallet'
import { generateCode, generateReceiveShareObject } from '../../lib/share'
import { BigGoodDollar, CopyButton, CustomButton, QRCode, Section, TopBar, Wrapper } from '../common'
import { useErrorDialog } from '../../lib/undux/utils/dialog'

import { useScreenState } from '../appNavigation/stackNavigation'
import { withStyles } from '../../lib/styles'

export type ReceiveProps = {
  screenProps: any,
  navigation: any,
  styles: any,
}

const RECEIVE_TITLE = 'Receive G$'

const ReceiveConfirmation = ({ screenProps, styles, ...props }: ReceiveProps) => {
  const { account, networkId } = goodWallet
  const [screenState] = useScreenState(screenProps)
  const { amount, reason, counterPartyDisplayName } = screenState
  const [showErrorDialog] = useErrorDialog()

  const code = useMemo(() => generateCode(account, networkId, amount, reason, counterPartyDisplayName), [
    account,
    networkId,
    amount,
    reason,
    counterPartyDisplayName,
  ])
  const share = useMemo(() => generateReceiveShareObject(code), [code])

  const shareAction = async () => {
    try {
      await navigator.share(share)
    } catch (e) {
      if (e.name !== 'AbortError') {
        showErrorDialog(e)
      }
    }
  }
  console.info({ styles })
  return (
    <Wrapper>
      <TopBar push={screenProps.push} hideBalance />
      <Section justifyContent="space-between" grow>
        <Section.Stack style={styles.qrCode}>
          <QRCode value={code} />
        </Section.Stack>
        <Section.Stack grow justifyContent="center" alignItems="center">
          <Section.Text style={[styles.textRow]}>Request exactly</Section.Text>
          {counterPartyDisplayName && (
            <Section.Text style={[styles.textRow]}>
              From: <Section.Text style={styles.counterPartyDisplayName}>{counterPartyDisplayName}</Section.Text>
            </Section.Text>
          )}
          {amount && (
            <BigGoodDollar
              bigNumberStyles={styles.bigGoodDollar}
              bigNumberUnitStyles={styles.bigGoodDollarUnit}
              number={amount}
              color={props.theme.colors.primary}
            />
          )}
          <Section.Text style={[styles.textRow]}>{reason}</Section.Text>
        </Section.Stack>
        <Section.Stack>
          {isMobile && navigator.share ? (
            <CustomButton onPress={shareAction}>Share as link</CustomButton>
          ) : (
            <CopyButton toCopy={share.url} onPressDone={screenProps.goToRoot}>
              Share as link
            </CopyButton>
          )}
        </Section.Stack>
      </Section>
    </Wrapper>
  )
}

ReceiveConfirmation.navigationOptions = {
  title: RECEIVE_TITLE,
}

ReceiveConfirmation.shouldNavigateToComponent = props => {
  const { screenState } = props.screenProps
  return screenState.amount
}

const getStylesFromProps = ({ theme }) => {
  return {
    qrCode: {
      paddingTop: theme.sizes.default,
    },
    textRow: {
      marginBottom: theme.sizes.default,
    },
    doneButton: {
      marginTop: theme.paddings.defaultMargin,
    },
    bigGoodDollar: {
      fontSize: normalize(28),
      fontFamily: theme.fonts.bold,
    },
    bigGoodDollarUnit: {
      fontSize: normalize(16),
      fontFamily: theme.fonts.bold,
    },
    counterPartyDisplayName: {
      fontSize: normalize(18),
    },
  }
}

export default withStyles(getStylesFromProps)(ReceiveConfirmation)
