// @flow
import React, { useState } from 'react'
import { withStyles } from '../../../lib/styles'
import Icon from '../view/Icon'
import Text from '../view/Text'
import CustomButton from './CustomButton'

const NOT_SAVED = 'NOT_SAVED'
const SAVING = 'SAVING'
const DONE = 'DONE'
const TRANSITION_TIME = 1000

type SaveButtonProps = {
  children?: any,
  beforeSave?: () => boolean,
  onPress: () => void,
  onPressDone?: () => void,
  loadingDelay?: number,
  doneDelay?: number,
  styles: any,
  theme: any,
  style?: any,
  color?: string,
}

const SaveButton = ({
  children,
  beforeSave,
  onPress,
  onPressDone,
  loadingDelay,
  doneDelay,
  styles,
  theme,
  ...props
}: SaveButtonProps) => {
  const [state, setState] = useState(NOT_SAVED)

  const pressAndNextState = async () => {
    setState(SAVING)
    const isValid = await beforeSave()
    if (isValid) {
      onPress()
      setTimeout(() => {
        setState(DONE)
        setTimeout(onPressDone, doneDelay)
      }, loadingDelay)
    } else {
      setState(NOT_SAVED)
    }
  }

  return (
    <CustomButton
      style={[styles.saveButton, props.style]}
      color={props.color || theme.colors.darkBlue}
      loading={state === SAVING}
      {...props}
      onPress={pressAndNextState}
    >
      {state === DONE ? (
        <Icon size={16} name="success" color={theme.colors.surface} />
      ) : (
        <Text color="surface" textTransform="uppercase" fontSize={14} style={styles.customButtonText}>
          {children || 'Save'}
        </Text>
      )}
    </CustomButton>
  )
}

SaveButton.defaultProps = {
  mode: 'contained',
  beforeSave: () => true,
  loadingDelay: TRANSITION_TIME,
  doneDelay: TRANSITION_TIME,
  onPressDone: () => {},
}

const getStylesFromProps = ({ theme }) => ({
  saveButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: theme.sizes.defaultDouble,
    marginVertical: 0,
  },
  customButtonText: {
    fontWeight: 'bold',
    lineHeight: 0,
    paddingTop: 1,
  },
})

export default withStyles(getStylesFromProps)(SaveButton)
