import React from 'react'
import normalize from 'react-native-elements/src/helpers/normalizeText'
import { StyleSheet } from 'react-native'

import GDStore from '../../../lib/undux/GDStore'
import Section from '../layout/Section'

import Avatar from './Avatar'
import BigGoodDollar from './BigGoodDollar'

/**
 * TopBar - used To display contextual information in a small container
 * @param {object} props - an object with props
 * @param {boolean} props.hideBalance - if falsy balance will be displayed
 * @param {function} props.push - pushes a route to the nav stack. When called, apps navigates to the specified ruote
 * @param {React.Node} props.children
 * @returns {React.Node}
 */
const TopBar = ({ hideBalance, push, children }) => {
  const store = GDStore.useStore()
  const { balance } = store.get('account')
  const { avatar } = store.get('profile')

  return (
    <Section style={styles.topBar}>
      <Section.Row>
        <Avatar source={avatar} onPress={push && (() => push('Profile'))} />
        {/*
         if children exist, it will be rendered
         if children=undefined and hideBalance=false, BigGoodDollar will be rendered
         if children=undefined and hideBalance=true, nothing will be rendered
         */}
        {children ? children : !hideBalance && <BigGoodDollar number={balance} />}
      </Section.Row>
    </Section>
  )
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: normalize(8),
    paddingBottom: normalize(8),
    marginBottom: normalize(8),
  },
})

export default TopBar
