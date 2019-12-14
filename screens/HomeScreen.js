import React from "react";
import { connect } from "react-redux";
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  FlatList,
  SectionList,
  TouchableOpacity
} from "react-native";
import {
  Icon,
  Layout,
  Text,
  Radio,
  Card,
  CardHeader,
  Spinner
} from "@ui-kitten/components";
import { groupBy } from "lodash";
import moment from "moment";
import Form from "../components/Form";
import FormInput from "../components/FormInput";
import FormSubmitButton from "../components/FormSubmitButton";
import TopNavigation from "../components/TopNavigation";
import { Linking } from "expo";
import Button from "../components/Button";
import {
  getCurrentUser,
  getEventPhonesByPhone,
  subscribeToServerUpdate
} from "../utils/api";
import {
  formatPhone,
  getFormattedNameFromEventPhone,
  getFormattedNameFromUser,
  getFormattedMessageTime
} from "../utils/etc";
import { cachedRefresh } from "../utils/caching";
import { gutterWidth, colors, textLinkColor } from "../utils/style";
import EventsEmptyState from "../components/EventsEmptyState";
import AddEventActions from "../components/AddEventActions";
import { setSettings as setSettingsType } from "../redux/actions";
import { NetworkContext } from "../components/NetworkProvider";

class HomeScreen extends React.Component {
  static contextType = NetworkContext;
  state = {};
  componentDidMount = async () => {
    this.screenFocusSubcription = this.props.navigation.addListener(
      "willFocus",
      this.loadUserData
    );
    this.subscribeToServer();
  };

  componentWillUnmount() {
    this.screenFocusSubcription.remove();
    if (this.userSubscription) this.eventSubscription.unsubscribe();
  }

  subscribeToServer = () => {
    if (!this.context.isConnected) return;
    const { settings = {}, setSettings } = this.props;
    const { user } = settings;
    this.userSubscription = subscribeToServerUpdate({
      type: "User",
      id: user.id,
      callback: ({ event, error }) => {
        if (error) this.setState({ error });
        console.log("homscreen: user subscription fired.");
        this.loadUserData();
      }
    });
  };

  fetchUserData = async () => {
    const { user, error: currentUserError } = await getCurrentUser();
    if (currentUserError) return { error: currentUserError };
    const {
      eventPhones,
      error: eventPhonesError
    } = await getEventPhonesByPhone(user.phone);
    if (eventPhonesError) return { error: eventPhonesError };
    console.log(
      "epsorting",
      eventPhones.map(e => [e.phone, e.updatedAt, e.latestMessage])
    );
    const events = eventPhones.map(ep => ep.event).filter(event => !!event);
    return { user, events };
  };

  loadUserData = async () => {
    const { settings = {}, setSettings } = this.props;
    this.setState({ error: null });
    if (!this.context.isConnected) return;
    const { user, events, error } = await this.fetchUserData();
    if (user) setSettings({ user, events });
    if (error) this.setState({ error });
  };

  handlePullToRefresh = async () => {
    this.setState({ isRefreshing: true });
    await this.loadUserData();
    this.setState({ isRefreshing: false });
  };

  handleAddEvent = ({}) => {
    const { user } = this.props.settings;
    this.props.navigation.navigate("EditEventPhones", {
      user
    });
  };

  renderEvent = ({ item: event, index }) => {
    let { title, createdAt, latestMessage } = event;
    const { user } = this.props.settings;

    const onPress = () =>
      this.props.navigation.navigate("Event", {
        event,
        user: user
      });
    const eventPhonesExceptMe = event.eventPhones.items.filter(
      ep => ep.phone !== user.phone
    );
    const eventPhonesText =
      eventPhonesExceptMe
        .map(({ firstName, lastName }) => `${firstName} ${lastName}`)
        .join(", ") || "";

    return (
      <TouchableOpacity onPress={onPress}>
        <View style={styles.listItem}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.eventInnerRow}>
              <Text style={styles.creationTimeLabel}>Includes </Text>
              <Text style={{}}>{eventPhonesText}</Text>
            </Text>
            <Text style={styles.eventInnerRow}>
              <Text style={styles.creationTimeLabel}>Started by </Text>
              {event.user.id === user.id
                ? "you"
                : getFormattedNameFromUser(event.user)}
            </Text>
            {latestMessage && (
              <View>
                <Text style={styles.eventInnerRow}>
                  <Text style={styles.creationTimeLabel}>
                    {"Last mesg "}
                    {getFormattedMessageTime(latestMessage.createdAt)}
                    {" by "}{" "}
                  </Text>
                  {latestMessage.user.phone === user.phone
                    ? "you"
                    : getFormattedNameFromUser(latestMessage.user)}
                  {": "}
                </Text>
                <Text style={styles.latestMessageText}>
                  {latestMessage.text}
                </Text>
              </View>
            )}
          </View>

          <Icon
            name="chevron-right"
            width={32}
            height={32}
            fill={colors.brandColor}
          />
        </View>
      </TouchableOpacity>
    );
  };

  renderEventsList = () => {
    const { user, events } = this.props.settings;
    const { isParent } = user;

    if (!events.length) return null;

    return (
      <View>
        <AddEventActions
          user={user}
          handleAddEvent={this.handleAddEvent}
          appearance="outline"
        />

        <FlatList
          style={styles.list}
          renderItem={this.renderEvent}
          data={events}
          keyExtractor={event => event.id}
          ItemSeparatorComponent={() => (
            <View style={styles.listItemSeparator} />
          )}
        />
      </View>
    );
  };
  render() {
    const { error, isRefreshing } = this.state;
    const { user, events } = this.props.settings;
    const showSteps = true;

    return (
      <Layout style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={this.handlePullToRefresh}
            />
          }
        >
          {error && (
            <Text status="danger" style={styles.error}>
              {error}
            </Text>
          )}

          <Text style={styles.header}>Village Keep</Text>

          <View style={styles.eventsContainer}>
            {!user ? (
              <Spinner />
            ) : (
              this.renderEventsList() || (
                <EventsEmptyState
                  user={user}
                  handleAddEvent={this.handleAddEvent}
                  navigation={this.props.navigation}
                />
              )
            )}
          </View>
        </ScrollView>
      </Layout>
    );
  }
}
export default connect(
  ({ settings }) => ({ settings }),
  { setSettings: setSettingsType }
)(HomeScreen);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: gutterWidth
  },
  header: {
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: "normal",
    textTransform: "uppercase",
    textAlign: "center",
    color: colors.brandColor
  },
  error: {
    marginVertical: 24
  },
  eventsContainer: { paddingVertical: 0 },
  list: {
    marginVertical: 16
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  listItemSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.brandColor,
    marginVertical: 12
  },
  eventTopRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    fontWeight: "normal",
    fontSize: 16,
    color: colors.brandColor,
    fontWeight: "bold"
  },
  // creationTimeContainer: { justifyContent: "flex-end" },
  eventInnerRow: {
    marginVertical: 2
  },
  eventPhonesText: {
    fontSize: 16,
    color: colors.brandColor,
    marginVertical: 5
  },
  creationTimeLabel: { color: "#aaa" },
  latestMessageText: { fontStyle: "italic", marginVertical: 5 },
  eventsHeader: {},
  eventName: { fontWeight: "bold" },
  eventPhone: { color: textLinkColor, marginVertical: 5 }
});
