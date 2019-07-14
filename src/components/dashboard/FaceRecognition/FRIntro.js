import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import normalize from 'react-native-elements/src/helpers/normalizeText'
import { isIOS, isMobileSafari } from 'mobile-device-detect'

import { CustomButton, Section, Wrapper } from '../../common'
import Divider from '../../../assets/Dividers - Long Line - Stroke Width 2 - Round Cap - Light Blue.svg'
import SmileyHug from '../../../assets/smileyhug.svg'
import GDStore from '../../../lib/undux/GDStore'

import logger from '../../../lib/logger/pino-logger'

const log = logger.child({ from: 'FRIntro' })
const FRIntro = props => {
  const store = GDStore.useStore()
  const { fullName } = store.get('profile')

  const isUnsupported = isIOS && isMobileSafari === false
  const isValid = props.screenProps.screenState && props.screenProps.screenState.isValid

  log.debug({ isIOS, isMobileSafari })
  if (isUnsupported) {
    props.screenProps.navigateTo('UnsupportedDevice', { reason: 'isNotMobileSafari' })
  }
  if (isValid) {
    props.screenProps.pop({ isValid: true })
  }
  const gotoFR = () => props.screenProps.navigateTo('FaceRecognition')
  return (
    <Wrapper>
      <View style={styles.topContainer}>
        <Section
          style={{
            paddingBottom: 0,
            paddingTop: 0,
            marginBottom: 0,
            paddingLeft: normalize(44),
            paddingRight: normalize(44),
            justifyContent: 'space-evenly',
            flex: 1
          }}
        >
          <Section.Title style={styles.mainTitle}>
            {`${fullName},\nLets verify you are a living and unique special human being that you are!`}
          </Section.Title>
          <Image source={SmileyHug} resizeMode={'center'} style={{ height: normalize(152) }} />
          <Section
            style={{
              paddingBottom: 0,
              paddingTop: 0,
              marginBottom: 0
            }}
          >
            <Image source={Divider} style={{ height: normalize(2) }} />
            <Section.Text style={styles.description}>
              For GoodDollar to succeed
              <Text style={{ fontWeight: 'normal' }}>
                {`\nwe need to make sure every person in our community registered only once for UBI. No BOTS allowed!`}
              </Text>
            </Section.Text>
            <Image source={Divider} style={{ height: normalize(2) }} />
          </Section>
        </Section>
        <Section>
          <CustomButton onPress={gotoFR}>Face CAPTCHA Verification</CustomButton>
        </Section>
      </View>
    </Wrapper>
  )
}
FRIntro.navigationOptions = {
  navigationBarHidden: false,
  title: 'Face Verification'
}

const styles = StyleSheet.create({
  topContainer: {
    display: 'flex',
    backgroundColor: 'white',
    height: '100%',
    flex: 1,
    flexGrow: 1,
    flexShrink: 0,
    justifyContent: 'space-evenly',
    paddingTop: normalize(33),
    borderRadius: 5
  },
  bottomContainer: {
    display: 'flex',
    flex: 1,
    paddingTop: normalize(20),
    justifyContent: 'flex-end'
  },
  description: {
    fontSize: normalize(16),
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#00AFFF',
    verticalAlign: 'text-top',
    paddingTop: normalize(25),
    paddingBottom: normalize(25)
  },
  mainTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: normalize(24),
    color: '#42454A',
    textTransform: 'none'
  }
})

FRIntro.navigationOptions = {
  title: 'Face Matching',
  navigationBarHidden: false
}
export default FRIntro
