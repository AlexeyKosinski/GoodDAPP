// @flow
import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { getFirstWord } from '../../lib/utils/getFirstWord'
import illustration from '../../assets/Signup/illustration.svg'
import Text from '../common/view/Text'
import CustomWrapper from './signUpWrapper'

type Props = {
  screenProps: any,
}
type State = {}
export default class SignupCompleted extends React.Component<Props, State> {
  handleSubmit = () => {
    this.props.screenProps.doneCallback({ isEmailConfirmed: true })
  }

  render() {
    const { createError, fullName, loading } = this.props.screenProps.data
    return (
      <CustomWrapper
        handleSubmit={this.handleSubmit}
        submitText="Let's start!"
        loading={loading}
        valid={createError !== true}
      >
        <Text fontWeight="500" fontSize={22} color="darkGray">
          {`Thanks ${getFirstWord(fullName)}\nYou're all set`}
        </Text>
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      </CustomWrapper>
    )
  }
}

const styles = StyleSheet.create({
  illustration: {
    minWidth: 220,
    maxWidth: '100%',
    minHeight: 260,
  },
})
