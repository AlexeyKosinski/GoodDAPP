// @flow
import fromPairs from 'lodash/fromPairs'
import toPairs from 'lodash/toPairs'
import { decode, encode, isMNID } from 'mnid'
import isURL from 'validator/lib/isURL'
import isEmail from 'validator/lib/isEmail'

import Config from '../../config/config'
import isMobilePhone from '../validators/isMobilePhone'

/**
 * Generates a code contaning an MNID with an amount if this las one is speced
 * @param address - address required to generate MNID
 * @param networkId - network identifier required to generate MNID
 * @param amount - amount to be attached to the generated MNID code
 * @returns {string} - 'MNID|amount'|'MNID'
 */
export function generateCode(address: string, networkId: number, amount: number) {
  const mnid = encode({ address, network: `0x${networkId.toString(16)}` })

  return amount > 0 ? `${mnid}|${amount}` : mnid
}

/**
 * Extracts the information from the generated code in `generateCode`
 * @param code - code returned by `generateCode`
 * @returns {null|{amount: *, address, networkId: number}}
 */
export function readCode(code: string) {
  const [mnid, value] = code.split('|')

  if (!isMNID(mnid)) {
    return null
  }

  const { network, address } = decode(mnid)
  const amount = value && parseInt(value)

  return {
    networkId: parseInt(network),
    address,
    amount: amount ? amount : undefined
  }
}

/**
 * Parses the read ReceiveGDLink from QR Code.
 * If not valid, returns null.
 * If valid, returns the ReceiveGDLink.
 * @param {string} link - receive G$ Link
 * @returns {string|null} - {link|null}
 */
export function readReceiveLink(link: string) {
  // checks that the link has the expected strings in it
  const isValidReceiveLink = [Config.publicUrl, 'receiveLink', 'reason'].every(v => link.indexOf(v) !== -1)
  const isUrlOptions = Config.env === 'development' ? { require_tld: false } : {}

  if (!isURL(link, isUrlOptions) || !isValidReceiveLink) {
    return null
  }

  return link
}

/**
 * Extracts query params values and returns them as a key-value pair
 * @param {string} link - url with queryParams
 * @returns {object} - {key: value}
 */
export function extractQueryParams(link: string = ''): {} {
  const queryParams = link.split('?')[1] || ''
  const keyValuePairs: Array<[string, string]> = queryParams
    .split('&')

    // $FlowFixMe
    .map(p => p.split('='))

  return fromPairs(keyValuePairs)
}

type ShareObject = {
  title: string,
  text: string,
  url: string
}

/**
 * Generates the standard object required for `navigator.share` method to trigger Share menu on mobile devices
 * @param url - Link
 * @returns {ShareObject}
 */
export function generateShareObject(url: string): ShareObject {
  return {
    title: 'Sending G$ via Good Dollar App',
    text: 'You got G$. To withdraw open:',
    url
  }
}

type HrefLinkProps = {
  link: string,
  description: string
}

/**
 * Generates the links to share via anchor tag
 * @param {string} to - Email address or phone number
 * @param {string} sendLink - Link
 * @returns {HrefLinkProps[]}
 */
export function generateHrefLinks(sendLink: string, to?: string = ''): Array<HrefLinkProps> {
  const { title, text, url } = generateShareObject(sendLink)
  const body = `${text} ${url}`
  const viaEmail = { link: `mailto:${to}?subject=${title}&body=${body}`, description: 'e-mail' }
  const viaSMS = { link: `sms:${to}?body=${body}`, description: 'sms' }

  if (isEmail(to)) {
    return [viaEmail]
  }

  if (isMobilePhone(to)) {
    return [viaSMS]
  }

  return [viaEmail, viaSMS]
}

type ActionType = 'receive' | 'send'

/**
 * Generates URL link to share/receive GDs
 * @param {ActionType} action - Wether 'receive' or 'send'
 * @param {object} params - key-pair of query params to be added to the URL
 * @returns {string} - URL to use to share/receive GDs
 */
export function generateShareLink(action: ActionType = 'receive', params: {} = {}): string {
  // depending on the action, routes may vary
  const destination = {
    receive: 'Send',
    send: 'Home'
  }[action]

  // creates query params from params object
  const queryParams = toPairs(params)
    .map(param => param.join('='))
    .join('&')

  if (!queryParams || !destination) {
    throw new Error(`Link couldn't be generated`)
  }

  return `${Config.publicUrl}/AppNavigation/Dashboard/${destination}?${queryParams}`
}
