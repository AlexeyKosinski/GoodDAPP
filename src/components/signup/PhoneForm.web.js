// @flow
import React from 'react'
import PhoneInput from 'react-phone-number-input'
import debounce from 'lodash/debounce'
import './PhoneForm.css'
import { userModelValidations } from '../../lib/gundb/UserModel'
import userStorage from '../../lib/gundb/UserStorage'
import logger from '../../lib/logger/pino-logger'
import api from '../../lib/API/api'
import { withStyles } from '../../lib/styles'
import Config from '../../config/config'
import Section from '../common/layout/Section'
import CustomWrapper from './signUpWrapper'

const log = logger.child({ from: 'PhoneForm' })

type Props = {
  doneCallback: ({ phone: string }) => null,
  screenProps: any,
  navigation: any,
}

export type MobileRecord = {
  mobile: string,
  errorMessage?: string,
  countryCode?: string | null,
  isValid: boolean,
}

type State = MobileRecord

class PhoneForm extends React.Component<Props, State> {
  state = {
    mobile: this.props.screenProps.data.mobile || '',
    errorMessage: '',
    countryCode: null,
    isValid: false,
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
    this.checkErrorsSlow()

    this.setState({ mobile })
  }

  handleSubmit = async () => {
    const isValid = await this.checkErrors()
    if (isValid) {
      this.props.screenProps.doneCallback({ mobile: this.state.mobile })
    }
  }

  handleEnter = (event: { nativeEvent: { key: string } }) => {
    if (event.keyCode === 13 && this.state.isValid) {
      this.handleSubmit()
    }
  }

  checkErrors = async () => {
    const modelErrorMessage = userModelValidations.mobile(this.state.mobile)
    const isValidIndexValue =
      Config.skipMobileVerification || (await userStorage.isValidValue('mobile', this.state.mobile))
    const errorMessage = modelErrorMessage || (isValidIndexValue ? '' : 'Unavailable mobile')
    log.debug({ modelErrorMessage, isValidIndexValue, errorMessage, Config })
    this.setState({ errorMessage, isValid: errorMessage === '' })
    return errorMessage === ''
  }

  checkErrorsSlow = debounce(this.checkErrors, 500)

  render() {
    const errorMessage = this.state.errorMessage || this.props.screenProps.error
    this.props.screenProps.error = undefined

    const { key } = this.props.navigation.state
    const { styles } = this.props
    const { loading } = this.props.screenProps.data
    return (
      <CustomWrapper valid={this.state.isValid} handleSubmit={this.handleSubmit} loading={loading}>
        <Section.Stack grow justifyContent="flex-start" style={styles.row}>
          <Section.Row justifyContent="center">
            <Section.Title textTransform="none">
              {`${this.props.screenProps.data.fullName.split(' ')[0]}, May we have your number please?`}
            </Section.Title>
          </Section.Row>
          <Section.Row justifyContent="center" style={styles.row}>
            <PhoneInput
              id={key + '_input'}
              value={this.state.mobile}
              onChange={this.handleChange}
              error={errorMessage}
              onKeyDown={this.handleEnter}
              country={this.state.countryCode}
            />
          </Section.Row>
          <Section.Row justifyContent="center" style={styles.bottomText}>
            <Section.Text fontFamily="regular" fontSize={14} color="gray80Percent">
              A verification code will be sent to this number
            </Section.Text>
          </Section.Row>
        </Section.Stack>
      </CustomWrapper>
    )
  }
}

const getStylesFromProps = ({ theme }) => ({
  bottomText: {
    marginTop: 'auto',
  },
  row: {
    marginVertical: theme.sizes.defaultQuadruple,
  },
})

export default withStyles(getStylesFromProps)(PhoneForm)
