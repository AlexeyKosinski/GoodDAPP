// @flow
import React from 'react'
import PhoneInput from 'react-phone-number-input'
import './PhoneForm.css'
import GDStore from '../../lib/undux/GDStore'
import { userModelValidations } from '../../lib/gundb/UserModel'
import logger from '../../lib/logger/pino-logger'
import api from '../../lib/API/api'
import { Description, Title, Wrapper } from './components'
import userStorage from '../../lib/gundb/UserStorage'

const log = logger.child({ from: 'PhoneForm' })

type Props = {
  // callback to report to parent component
  doneCallback: ({ phone: string }) => null,
  screenProps: any,
  navigation: any
}

export type MobileRecord = {
  mobile: string,
  errorMessage?: string,
  countryCode?: string | null,
  isValid: boolean
}

type State = MobileRecord

class PhoneForm extends React.Component<Props, State> {
  state = {
    mobile: this.props.screenProps.data.mobile || '',
    errorMessage: '',
    countryCode: null,
    isValid: false
  }

  setCountryCode = async () => {
    try {
      const { data } = await api.getLocation()
      this.setState({ countryCode: data.country })
    } catch (e) {
      log.error('Could not get user location', e)
    }
  }

  componentDidMount() {
    this.setCountryCode()
  }

  handleChange = (mobile: string) => {
    if (this.state.errorMessage !== '') {
      this.setState({ errorMessage: '' })
    }

    this.setState({ mobile })
  }

  handleSubmit = () => {
    this.checkErrors(() => {
      if (this.state.isValid) {
        this.props.screenProps.doneCallback({ mobile: this.state.mobile })
      }
    })
  }

  handleEnter = (event: { nativeEvent: { key: string } }) => {
    if (event.keyCode === 13) {
      this.handleSubmit()
    }
  }

  checkErrors = async (callback: Function) => {
    let errorMessage = userModelValidations.mobile(this.state.mobile)
    if (!errorMessage && (await userStorage.isFieldIndexedByOther('mobile', this.state.mobile))) {
      errorMessage = 'Duplicated Mobile Phone'
    }
    log.info('dsadsa', { errorMessage })
    this.setState({ errorMessage, isValid: errorMessage === '' }, callback)
  }

  render() {
    const errorMessage = this.state.errorMessage || this.props.screenProps.error
    this.props.screenProps.error = undefined

    const { key } = this.props.navigation.state
    const { loading } = this.props.screenProps.data
    return (
      <Wrapper valid={this.state.isValid} handleSubmit={this.handleSubmit} loading={loading}>
        <Title>{`${this.props.screenProps.data.fullName.split(' ')[0]}, \n May we have your number please?`}</Title>
        <PhoneInput
          id={key + '_input'}
          value={this.state.mobile}
          onChange={this.handleChange}
          onBlur={() => this.checkErrors()}
          error={errorMessage}
          onKeyDown={this.handleEnter}
          country={this.state.countryCode}
        />
        <Description>A verification code will be sent to this number</Description>
      </Wrapper>
    )
  }
}

export default GDStore.withStore(PhoneForm)
