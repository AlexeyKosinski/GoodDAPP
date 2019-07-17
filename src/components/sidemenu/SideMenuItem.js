// @flow
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { normalize } from 'react-native-elements'
import { withStyles } from '../../lib/styles'
import { Icon, Text } from '../common'

export type SideMenuItemProps = {
  icon: string,
  name: string,
  action: Function,
}

const SideMenuItem = ({ icon, name, action, styles, theme }: SideMenuItemProps) => (
  <TouchableOpacity style={styles.clickableRow} onPress={action}>
    <View style={styles.menuIcon}>
      <Icon name={icon} size={24} color={theme.colors.primary} />
    </View>
    <Text color="darkGray" fontFamily="medium" textAlign="left">
      {name}
    </Text>
  </TouchableOpacity>
)

const sideMenuItemStyles = ({ theme }) => ({
  clickableRow: {
    borderBottomWidth: normalize(1),
    borderBottomColor: theme.colors.lightGray,
    borderBottomStyle: 'solid',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    cursor: 'pointer',
    padding: normalize(16),
    paddingLeft: 0,
  },
  menuIcon: {
    marginLeft: normalize(8),
    marginRight: normalize(20),
  },
  menuText: {
    paddingRight: normalize(16),
  },
})

export default withStyles(sideMenuItemStyles)(SideMenuItem)
