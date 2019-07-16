//@flow
import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import normalize from 'react-native-elements/src/helpers/normalizeText'
import { CustomButton, Section } from '../../common'
import logger from '../../../lib/logger/pino-logger'
import goodWallet from '../../../lib/wallet/GoodWallet'
import userStorage from '../../../lib/gundb/UserStorage'
import Divider from '../../../assets/Dividers - Long Line - Stroke Width 2 - Round Cap - Light Blue.svg'
import Check from '../../../assets/Icons - Success - White.svg'
import Cross from '../../../assets/Icons - Close X - White.svg'
import LookingGood from '../../../assets/LookingGood.svg'
import GDStore from '../../../lib/undux/GDStore'

const log = logger.child({ from: 'GuidedFRProcessResults' })

const FRStep = ({ title, isActive, status, paddingBottom }) => {
  paddingBottom = paddingBottom === undefined ? 12 : paddingBottom
  let statusColor = status === true ? 'success' : 'failure'
  let statusIcon = <Image source={status ? Check : Cross} resizeMode={'center'} style={{ height: 14 }} />

  //not active use grey otherwise based on status
  let textStyle = isActive === false ? styles.textInactive : status === false ? styles.textError : styles.textActive
  log.debug('FRStep', { title, status, isActive, statusColor, textStyle })
  return (
    <View style={{ flexDirection: 'row', paddingTop: 0, marginRight: 0, paddingBottom }}>
      <View style={{ flexGrow: 2 }}>
        <Text style={textStyle}>{title}</Text>
      </View>
      {/* {isActive ? <Text>.....</Text> : null} */}
      {status === undefined ? null : <View style={[styles[statusColor], styles.statusIcon]}>{statusIcon}</View>}
    </View>
  )
}
const GuidedFRProcessResults = ({ profileSaved, sessionId, retry, done, navigation }: any) => {
  const store = GDStore.useStore()
  const { fullName } = store.get('profile')

  const [processStatus, setStatus] = useState({
    isNotDuplicate: undefined,
    isEnrolled: undefined,
    isLive: undefined,
    isWhitelisted: undefined
  })

  const updateProgress = data => {
    log.debug('updating progress', { data })

    // let explanation = ''
    setStatus({ ...processStatus, ...data })

    // log.debug('analyzed data,', { processStatus })

    // if (data && data.isNotDuplicate) {
    //   explanation = 'Your are already in the database'
    //   setText(explanation)

    //   return
    // }

    // log.debug('before enroll result', { explanation })
    // if (data && !data.isLive) {
    //   explanation = 'Please improve your conditions'
    //   setText(explanation)
    //   return
    // }

    // log.debug('before liveness result', { explanation })

    // log.info({ explanation })
    // setText(explanation)
  }

  // let [showDialogWithData] = useDialog()
  let gun = userStorage.gun
  log.debug({ sessionId })

  useEffect(() => {
    log.debug('subscriping to gun updates:', { sessionId })
    gun.get(sessionId).on(updateProgress, false)
    return () => {
      log.debug('Removing FR guided progress listener for sessionId ', sessionId)

      gun.get(sessionId).off()
      gun.get(sessionId).set(null)
    }
  }, [])

  const saveProfileAndDone = async () => {
    try {
      let account = await goodWallet.getAccountForType('zoomId')
      await userStorage.setProfileField('zoomEnrollmentId', account, 'private')
      setStatus({ ...processStatus, isProfileSaved: true })

      setTimeout(done, 2000)
    } catch (e) {
      setStatus({ ...processStatus, isProfileSaved: false })
    }
  }

  const gotoRecover = () => {
    navigation.push('Recover')
  }
  const gotoSupport = () => {
    navigation.push('Support')
  }
  useEffect(() => {
    //done save profile and call done callback
    if (processStatus.isWhitelisted) {
      saveProfileAndDone()
    }
  }, [processStatus.isWhitelisted])
  const isProcessFailed =
    processStatus.isNotDuplicate === false ||
    processStatus.isEnrolled === false ||
    processStatus.isLive === false ||
    processStatus.isWhitelisted === false ||
    processStatus.isProfileSaved === false

  const isProcessSuccess = processStatus.isWhitelisted === true
  log.debug('processStatus', { processStatus, isProcessSuccess, isProcessFailed })

  let retryButtonOrNull = isProcessFailed ? (
    <Section>
      <CustomButton style={styles.button} onPress={retry}>
        Please Try Again
      </CustomButton>
    </Section>
  ) : null

  let lookingGood =
    isProcessFailed === false && processStatus.isProfileSaved ? (
      <View style={{ flexShrink: 0 }}>
        <Text style={styles.textGood}>{`Looking Good ${fullName}`}</Text>
        <Image source={LookingGood} resizeMode={'center'} style={{ marginTop: 36, height: normalize(135) }} />
      </View>
    ) : null

  let helpText
  if (processStatus.isNotDuplicate === false) {
    helpText = (
      <View>
        <Text style={styles.textHelp}>
          {'You look very familiar...\nIt seems you already have a wallet,\nyou can:\n\n'}
        </Text>
        <Text style={styles.textHelp}>
          A.{' '}
          <Text style={[styles.helpLink, styles.textHelp]} onPress={gotoRecover}>
            Recover previous wallet
          </Text>
          {'\n'}
        </Text>
        <Text style={styles.textHelp}>
          B.{' '}
          <Text style={[styles.helpLink, styles.textHelp]} onPress={gotoSupport}>
            Contact support
          </Text>
          {'\n'}
        </Text>
      </View>
    )
  } else if (processStatus.isLive === false) {
    helpText =
      'We could not verify you are a living person. Funny hu? please make sure:\n\n\
A. Center your webcam\n\
B. Ensure camera is at eye level\n\
C. Light your face evenly'
  } else if (isProcessFailed) {
    helpText = 'Something went wrong, please try again...'
  }
  return (
    <View style={styles.topContainer}>
      <Section
        style={{
          paddingBottom: 0,
          paddingTop: 31,
          marginBottom: 0,
          paddingLeft: 44,
          paddingRight: 44,
          justifyContent: 'space-around',
          flex: 1
        }}
      >
        <Section.Title style={styles.mainTitle}>
          <Text>Analyzing Results...</Text>
        </Section.Title>
        <View
          style={{
            paddingBottom: 0,
            paddingTop: 0,
            marginBottom: 0,
            padding: 0,
            flexGrow: 0
          }}
        >
          <Image source={Divider} resizeMode={'cover'} style={{ width: 'auto', height: 2 }} />
          <View style={{ marginBottom: 22, marginTop: 22 }}>
            <FRStep
              title={'Checking duplicates'}
              isActive={true}
              status={isProcessSuccess || processStatus.isNotDuplicate}
            />
            <FRStep
              title={'Checking liveness'}
              isActive={
                isProcessSuccess ||
                (processStatus.isNotDuplicate !== undefined && processStatus.isNotDuplicate === true)
              }
              status={isProcessSuccess || processStatus.isLive}
            />
            <FRStep
              title={'Validating identity'}
              isActive={isProcessSuccess || (processStatus.isLive !== undefined && processStatus.isLive === true)}
              status={isProcessSuccess || processStatus.isWhitelisted}
            />
            <FRStep
              title={'Updating profile'}
              isActive={
                isProcessSuccess || (processStatus.isWhitelisted !== undefined && processStatus.isWhitelisted === true)
              }
              status={isProcessSuccess || processStatus.isProfileSaved}
              paddingBottom={0}
            />
          </View>
          <Image source={Divider} resizeMode={'cover'} style={{ height: 2 }} />
        </View>
        <View style={{ flexShrink: 0 }}>
          <Text style={styles.textHelp}>{helpText}</Text>
        </View>
        {lookingGood}
      </Section>
      {retryButtonOrNull}
    </View>
  )
}

const styles = StyleSheet.create({
  topContainer: {
    display: 'flex',
    backgroundColor: 'white',
    height: '100%',
    flex: 1,
    justifyContent: 'space-evenly',
    paddingTop: 33,
    borderRadius: 5
  },
  mainTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: normalize(24),
    color: '#42454A',
    textTransform: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    fontFamily: 'Roboto-Medium',
    fontSize: normalize(16)
  },
  statusIcon: {
    justifyContent: 'center'
  },
  textActive: {
    fontFamily: 'Roboto-Medium',
    fontSize: normalize(16),
    color: '#42454A',
    textTransform: 'none',
    verticalAlign: 'middle',
    lineHeight: 28
  },
  textInactive: {
    fontFamily: 'Roboto',
    fontSize: normalize(16),
    color: '#CBCBCB',
    textTransform: 'none',
    verticalAlign: 'middle',
    lineHeight: 28
  },
  textError: {
    fontFamily: 'Roboto-Medium',
    fontSize: normalize(16),
    color: '#FA6C77',
    textTransform: 'none',
    verticalAlign: 'middle',
    lineHeight: 28
  },
  textHelp: {
    fontFamily: 'Roboto',
    fontSize: normalize(16),
    color: '#FA6C77',
    textTransform: 'none'
  },
  helpLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  },
  textGood: {
    fontFamily: 'Roboto-medium',
    fontSize: normalize(24),
    textTransform: 'none',
    textAlign: 'center'
  },
  success: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#00C3AE'
  },
  failure: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#FA6C77',
    flexGrow: 0
  }
})
export default GuidedFRProcessResults
