// @flow
import React from 'react'
import { View } from 'react-native'
import normalize from 'react-native-elements/src/helpers/normalizeText'
import { withStyles } from '../../../lib/styles'
import Icon from '../view/Icon'

const ErrorIcon = ({ styles, style, theme }) => (
  <View style={[styles.errorIconContainer, style]}>
    <View style={styles.errorIconFrame}>
      <Icon name="close" color={theme.colors.error} size={30} />
    </View>
  </View>
)

const getStylesFromProps = ({ theme }) => ({
  errorIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: normalize(16),
  },
  errorIconFrame: {
    alignItems: 'center',
    borderColor: theme.colors.red,
    borderRadius: '50%',
    borderWidth: normalize(3),
    display: 'flex',
    flexDirection: 'row',
    height: normalize(90),
    justifyContent: 'center',
    width: normalize(90),
  },
})

export default withStyles(getStylesFromProps)(ErrorIcon)
