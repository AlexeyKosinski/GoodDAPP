// @flow
import React, { PureComponent } from 'react'
import { ActivityIndicator, Animated, Dimensions, FlatList, SwipeableFlatList, View } from 'react-native'
import normalize from '../../lib/utils/normalizeText'
import GDStore from '../../lib/undux/GDStore'
import pino from '../../lib/logger/pino-logger'
import { withStyles } from '../../lib/styles'
import FeedActions from './FeedActions'
import FeedListItem from './FeedItems/FeedListItem'
import FeedModalItem from './FeedItems/FeedModalItem'

const log = pino.child({ from: 'FeedListView' })
const SCREEN_SIZE = {
  width: 200,
  height: 72,
}

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
}

const emptyFeed = { type: 'empty', data: {} }

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)
const AnimatedSwipeableFlatList = Animated.createAnimatedComponent(SwipeableFlatList)

const { height } = Dimensions.get('window')

export type FeedListProps = {
  fixedHeight: boolean,
  virtualized: boolean,
  data: any,
  updateData: any,
  onEndReached: any,
  initialNumToRender: ?number,
  store: GDStore,
  handleFeedSelection: Function,
  horizontal: boolean,
  selectedFeed: ?string,
}

type FeedListState = {
  debug: boolean,
  inverted: boolean,
  filterText: '',
  logViewable: boolean,
}

type ItemComponentProps = {
  item: any,
  separators: {
    highlight: any,
    unhighlight: any,
  },
  index: number,
}

class FeedList extends PureComponent<FeedListProps, FeedListState> {
  state = {
    debug: false,
    inverted: false,
    filterText: '',
    logViewable: false,
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedFeed !== this.props.selectedFeed) {
      const item = this.props.data.find(item => item.transactionHash === this.props.selectedFeed)
      this.scrollToItem(item)
    }
  }

  scrollToItem = item => {
    log.info('Scroll to item', { item })
    this.flatListRef && this.flatListRef.getNode().scrollToItem({ animated: true, item, viewPosition: 0.5 })
  }

  getItemLayout = (data: any, index: number) => {
    const [length, separator, header] = this.props.horizontal
      ? [SCREEN_SIZE.width, 0, 100]
      : [SCREEN_SIZE.height, 1, 30]
    return { index, length, offset: (length + separator) * index + header }
  }

  pressItem = (item, index: number) => () => {
    const { handleFeedSelection, horizontal } = this.props
    if (item.type !== 'empty') {
      handleFeedSelection(item, !horizontal)
      this.scrollToItem(item)
    }
  }

  flatListRef = null

  swipeableFlatListRef = null

  renderItemComponent = ({ item, separators, index }: ItemComponentProps) => {
    const { fixedHeight, horizontal } = this.props
    const itemProps = {
      item,
      separators,
      onPress: this.pressItem(item, index + 1),
      fixedHeight,
    }
    return horizontal ? <FeedModalItem {...itemProps} /> : <FeedListItem {...itemProps} />
  }

  renderQuickActions = ({ item }) => <FeedActions item={item} />

  renderList = (feeds: any, loading: boolean) => {
    const { fixedHeight, onEndReached, initialNumToRender, horizontal, styles } = this.props

    if (horizontal) {
      return (
        <View style={styles.horizontalContainer}>
          {loading ? <ActivityIndicator style={styles.loading} animating={true} color="gray" size="large" /> : null}
          <AnimatedFlatList
            contentContainerStyle={styles.horizontalList}
            data={feeds && feeds.length ? feeds : [emptyFeed]}
            getItemLayout={fixedHeight ? this.getItemLayout : undefined}
            horizontal={horizontal}
            initialNumToRender={5}
            key={(horizontal ? 'h' : 'v') + (fixedHeight ? 'f' : 'd')}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="always"
            legacyImplementation={false}
            numColumns={1}
            onEndReached={onEndReached}
            pagingEnabled={true}
            ref={ref => (this.flatListRef = ref)}
            refreshing={false}
            renderItem={this.renderItemComponent}
            viewabilityConfig={VIEWABILITY_CONFIG}
          />
        </View>
      )
    }
    return (
      <View style={styles.verticalContainer}>
        <AnimatedSwipeableFlatList
          bounceFirstRowOnMount={true}
          contentContainerStyle={styles.verticalList}
          data={feeds && feeds.length ? [...feeds, emptyFeed] : [emptyFeed]}
          getItemLayout={fixedHeight ? this.getItemLayout : undefined}
          horizontal={horizontal}
          initialNumToRender={initialNumToRender || 10}
          key={(horizontal ? 'h' : 'v') + (fixedHeight ? 'f' : 'd')}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          legacyImplementation={false}
          maxSwipeDistance={80}
          numColumns={1}
          onEndReached={onEndReached}
          ref={ref => (this.swipeableFlatListRef = ref)}
          refreshing={false}
          renderItem={this.renderItemComponent}
          renderQuickActions={this.renderQuickActions}
          viewabilityConfig={VIEWABILITY_CONFIG}
        />
      </View>
    )
  }

  render() {
    const { data } = this.props
    const feeds = data && data instanceof Array && data.length ? data : undefined
    const loading = this.props.store.get('feedLoading')
    return this.renderList(feeds, loading)
  }
}

const getStylesFromProps = ({ theme }) => ({
  loading: {
    marginTop: normalize(8),
  },
  horizontalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: normalize(20),
    position: 'fixed',
    height,
  },
  verticalContainer: {
    backgroundColor: '#efeff4',
    flex: 1,
    justifyContent: 'center',
  },
  verticalList: {
    width: '100%',
    maxWidth: '100vw',
  },
  horizontalList: {
    width: '100%',
    maxWidth: '100vw',
    flex: 1,
    padding: theme.sizes.defaultHalf,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchRow: {
    paddingHorizontal: theme.sizes.default,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: 'rgb(200, 199, 204)',
  },
})

export default GDStore.withStore(withStyles(getStylesFromProps)(FeedList))
