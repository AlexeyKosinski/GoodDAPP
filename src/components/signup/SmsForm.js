// @flow
import React from 'react'
import logger from '../../lib/logger/pino-logger'
import API from '../../lib/API/api'
import { withStyles } from '../../lib/styles'
import Icon from '../common/view/Icon'
import LoadingIndicator from '../common/view/LoadingIndicator'
import Section from '../common/layout/Section'
import { ErrorText } from '../common/form/InputText'
import OtpInput from '../common/form/OtpInput'
import CustomWrapper from './signUpWrapper'
import type { SignupState } from './SignupState'

const log = logger.child({ from: 'SmsForm' })

const DONE = 'DONE'
const WAIT = 'WAIT'
const PENDING = 'PENDING'

type Props = {
  phone: string,
  data: SignupState,
  doneCallback: ({ isPhoneVerified: boolean }) => null,
  screenProps: any,
}

export type SMSRecord = {
  smsValidated: boolean,
  sentSMS?: boolean,
}

type State = SMSRecord & {
  errorMessage: string,
  sendingCode: boolean,
  renderButton: boolean,
  loading: boolean,
  otp: string | number,
}

class SmsForm extends React.Component<Props, State> {
  state = {
    smsValidated: false,
    sentSMS: false,
    errorMessage: '',
    sendingCode: false,
    renderButton: false,
    resentCode: false,
    loading: false,
    otp: undefined,
  }

  numInputs: number = 6

  componentDidMount() {}

  componentDidUpdate() {
    if (!this.state.renderButton) {
      this.displayDelayedRenderButton()
    }
  }

  displayDelayedRenderButton = () => {
    setTimeout(() => {
      this.setState({ renderButton: true })
    }, 10000)
  }

  handleChange = async (otp: string | number) => {
    const otpValue = otp.toString()
    if (otpValue.length === this.numInputs) {
      this.setState({
        loading: true,
        otp,
      })
      try {
        await this.verifyOTP(otpValue)
        this.handleSubmit()
      } catch (e) {
        log.error({ e })

        this.setState({
          errorMessage: e.message || e.response.data.message,
        })
      } finally {
        this.setState({ loading: false })
      }
    } else {
      this.setState({
        errorMessage: '',
        otp,
      })
    }
  }

  handleSubmit = () => {
    this.props.screenProps.doneCallback({ smsValidated: true })
  }

  // eslint-disable-next-line class-methods-use-this
  verifyOTP(otp: string) {
    return API.verifyMobile({ otp })
  }

  handleRetry = async () => {
    this.setState({ sendingCode: true, otp: '', errorMessage: '' })

    try {
      await API.sendOTP({ ...this.props.screenProps.data })
      this.setState({ sendingCode: false, renderButton: false, resentCode: true }, this.displayDelayedRenderButton)

      //turn checkmark back into regular resend text
      setTimeout(() => this.setState({ ...this.state, resentCode: false }), 2000)
    } catch (e) {
      log.error(e)
      this.setState({
        errorMessage: e.message || e.response.data.message,
        sendingCode: false,
        renderButton: true,
      })
    }
  }

  render() {
    const { errorMessage, renderButton, loading, otp, resentCode } = this.state
    const { styles } = this.props

    return (
      <CustomWrapper handleSubmit={this.handleSubmit} footerComponent={() => <React.Fragment />}>
        <Section.Stack grow justifyContent="flex-start">
          <Section.Row justifyContent="center" style={styles.row}>
            <Section.Title textTransform="none">{'Enter the verification code \n sent to your phone'}</Section.Title>
          </Section.Row>
          <Section.Stack justifyContent="center">
            <OtpInput
              shouldAutoFocus
              numInputs={this.numInputs}
              onChange={this.handleChange}
              isInputNum
              hasErrored={errorMessage !== ''}
              errorStyle={styles.errorStyle}
              value={otp}
              placeholder="*"
            />
            <ErrorText error={errorMessage} />
          </Section.Stack>
          <Section.Row alignItems="center" justifyContent="center" style={styles.row}>
            <SMSAction status={resentCode ? DONE : renderButton ? PENDING : WAIT} handleRetry={this.handleRetry} />
          </Section.Row>
        </Section.Stack>
        <LoadingIndicator force={loading} />
      </CustomWrapper>
    )
  }
}

const SMSAction = ({ status, handleRetry }) => {
  if (status === DONE) {
    return <Icon size={16} name="success" color="blue" />
  } else if (status === WAIT) {
    return (
      <Section.Text fontSize={14} color="gray80Percent">
        Please wait a few seconds until the SMS arrives
      </Section.Text>
    )
  }
  return (
    <Section.Text fontWeight="500" fontSize={14} color="primary" onPress={handleRetry}>
      Send me the code again
    </Section.Text>
  )
}

const getStylesFromProps = ({ theme }) => ({
  informativeParagraph: {
    margin: '1em',
  },
  buttonWrapper: {
    alignContent: 'stretch',
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'space-between',
  },
  button: {
    justifyContent: 'center',
    width: '100%',
    height: 60,
  },
  row: {
    marginVertical: theme.sizes.defaultQuadruple,
  },
  errorStyle: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.red,
    color: theme.colors.red,
  },
})

export default withStyles(getStylesFromProps)(SmsForm)
