// @flow
import React from 'react'
import { View } from 'react-native'
import normalize from 'react-native-elements/src/helpers/normalizeText'
import { moneyRegexp } from '../../../lib/wallet/utils'
import backKeyboardButton from '../../../assets/backKeyboardButton.png'
import { withStyles } from '../../../lib/styles'
import KeyboardKey from './KeyboardKey'
import KeyboardRow from './KeyboardRow'

type CaretPosition = {
  start: number,
  end: number,
}

type KeyboardProps = {
  onPress: string => void,
  amount: string,
  caretPosition?: CaretPosition,
  updateCaretPosition?: CaretPosition => void,
}

const NumPadKeyboard = ({ onPress, amount, caretPosition, updateCaretPosition, styles }: KeyboardProps) => {
  const onPressKey = (value: string) => {
    const stringAmount = `${amount}`
    const updatedValue = caretPosition
      ? [stringAmount.slice(0, caretPosition.start), value, stringAmount.slice(caretPosition.end)].join('')
      : `${stringAmount}${value}`

    if (moneyRegexp.test(updatedValue)) {
      onPress(updatedValue)
      updateCaretPosition({
        start: caretPosition.start + 1,
        end: caretPosition.start + 1,
      })
    }
  }

  const onBackspaceKey = () => {
    if (!caretPosition || caretPosition.end > 0) {
      const stringAmount = `${amount}`
      let updatedValue = stringAmount.slice(0, -1)
      if (caretPosition) {
        updatedValue = [stringAmount.slice(0, caretPosition.start - 1), stringAmount.slice(caretPosition.end)].join('')
        updateCaretPosition({
          start: caretPosition.start - 1,
          end: caretPosition.start - 1,
        })
      }
      onPress(updatedValue)
    }
  }

  return (
    <View style={styles.keyboard}>
      <KeyboardRow keys={['1', '2', '3']} onPress={onPressKey} />
      <KeyboardRow keys={['4', '5', '6']} onPress={onPressKey} />
      <KeyboardRow keys={['7', '8', '9']} onPress={onPressKey} />
      <View style={styles.row}>
        <KeyboardKey keyValue="." onPress={onPressKey} />
        <KeyboardKey keyValue="0" onPress={onPressKey} />
        <KeyboardKey keyValue="backspace" onPress={onBackspaceKey} />
      </View>
    </View>
  )
}

NumPadKeyboard.defaultProps = {
  caretPosition: null,
  updateCaretPosition: () => {},
}

const getStylesFromProps = ({ theme }) => {
  return {
    keyboard: {
      display: 'flex',
      marginBottom: theme.sizes.default,
      marginTop: theme.sizes.defaultDouble,
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backspaceButton: {
      backgroundImage: `url(${backKeyboardButton})`,
      height: normalize(25),
      width: normalize(25),
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      cursor: 'pointer',
    },
  }
}

export default withStyles(getStylesFromProps)(NumPadKeyboard)
