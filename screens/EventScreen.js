import React from "react";
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  TextInput
} from "react-native";
import {
  Icon,
  Layout,
  Text,
  Spinner,
  Input,
  OverflowMenu
} from "@ui-kitten/components";
import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js";
import moment from "moment";
import { cloneDeep, sortBy } from "lodash";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import Button from "../components/Button";
import InlineForm from "../components/InlineForm";
import Form from "../components/Form";
import FormInput from "../components/FormInput";
import InlineFormInput from "../components/InlineFormInput";
import FormSubmitButton from "../components/FormSubmitButton";
import InlineFormCancelButton from "../components/InlineFormCancelButton";
import InlineFormSubmitButton from "../components/InlineFormSubmitButton";
import TopNavigation from "../components/TopNavigation";
import {
  getEventByIdWithMessages,
  updateEvent,
  deleteEvent,
  createMessage,
  subscribeToEventUpdate
} from "../utils/api";
import { gutterWidth, colors, topNavigationHeight } from "../utils/style";
import {
  formatPhone,
  getFormattedNameFromContact,
  getFormattedNameFromUser,
  getFormattedMessageTime
} from "../utils/etc";

export default class EventScreen extends React.Component {
  // static navigationOptions = props => ({
  //   header: <TopNavigation {...props} style={{ height: topNavHeight }} />
  // });
  constructor(props) {
    super(props);
    const event = props.navigation.getParam("event");
    console.log(`constructor() on EventScreen`);
    this.messageInputRef = React.createRef();
    this.state = {
      title: event.title,
      event,
      messages: []
    };
  }
  handleServerUpdatedEvent = async event => {
    // console.log("handleServerUpdatedEvent", event);
    await this.loadEventWithMessages();
  };

  setupEventSubscription = async () => {
    const event = this.props.navigation.getParam("event");
    const { subscription, error } = await subscribeToEventUpdate({
      eventId: event.id,
      callback: this.handleServerUpdatedEvent
    });
    if (error) {
      this.setState({ errorMessage: error });
    } else {
      this.eventUpdateSubscription = subscription;
    }
  };

  componentDidMount = async () => {
    console.log("componentdidmount");
    this.loadEventSubcription = this.props.navigation.addListener(
      "didFocus",
      this.loadEventWithMessages
    );
    //   async () => {
    //     await this.loadEventWithMessages();
    //   }
    // );

    if (this.props.navigation.getParam("isNewEvent"))
      this.messageInputRef.current.focus();

    this.unsubscribeToNetworkChanges = NetInfo.addEventListener(
      this.handleNetworkChanges
    );
    const networkState = await NetInfo.fetch();

    if (networkState.isConnected) {
      this.setupEventSubscription();
    }
  };
  componentWillUnmount = async () => {
    this.loadEventSubcription.remove();
    if (this.unsubscribeToNetworkChanges) this.unsubscribeToNetworkChanges();
    if (this.eventUpdateSubscription)
      await this.eventUpdateSubscription.unsubscribe();
  };
  handleNetworkChanges = state => {
    this.setState({ networkIsOffline: !state.isConnected });
    if (state.isConnected) {
      this.loadEventWithMessages();
      this.setupEventSubscription();
    }
  };
  loadEventWithMessages = async () => {
    const { networkIsOffline } = this.state;
    console.log("networkIsOffline", networkIsOffline);
    if (networkIsOffline) return;
    const eventParam = this.props.navigation.getParam("event");
    if (this.props.navigation.getParam("isNewEvent"))
      return this.setState({ messagesAreLoaded: true });
    const { event, error: eventError } = await getEventByIdWithMessages(
      eventParam.id
    );
    if (eventError)
      return this.setState({
        errorMessage: eventError
      });
    const messages = sortBy(
      cloneDeep(event.messages.items),
      "createdAt"
    ).reverse(); // the flalist is inverted
    this.setState({ event, messages, messagesAreLoaded: true });
  };

  handleSubmitTitle = async () => {
    const { title } = this.state;
    const event = this.props.navigation.getParam("event");
    this.setState({ isSubmittingTitle: true });

    // console.log("updating title event id", event.id);
    const { event: updatedEvent, error: updateEventError } = await updateEvent({
      id: event.id,
      title
    });
    if (updateEventError) {
      this.setState({
        errorMessage: updateEventError,
        isSubmittingTitle: false
      });
      return;
    }
    this.setState({ isSubmittingTitle: false, isEditingTitle: false });
    // console.log("updated event", updatedEvent);
  };

  handleDelete = async () => {
    const event = this.props.navigation.getParam("event");
    this.setState({ isLoading: true });

    const { error: errorMessage } = await deleteEvent({ eventId: event.id });
    if (errorMessage) {
      this.setState({ errorMessage });
      return;
    }
    this.props.navigation.goBack();
  };

  handleDeletePress = () => {
    this.setState({ showMoreActions: false });
    Alert.alert(
      "Delete this event?",
      "",
      [
        { text: "Delete", onPress: this.handleDelete, style: "destructive" },
        {
          text: "Nevermind",
          onPress: () => {},
          style: "cancel"
        }
      ],
      { cancelable: false }
    );
  };

  renderMessage = ({ item: message }) => {
    const user = this.props.navigation.getParam("user");
    const isByMe = !message.user || message.user.id === user.id;
    return (
      <View style={styles.message}>
        <Text style={styles.messageText}>{message.text}</Text>
        {message.id ? (
          <Text style={styles.messageTime}>
            {getFormattedMessageTime(message.createdAt || message.localSentAt)}{" "}
            by{" "}
            <Text style={styles.messageAuthor}>
              {message.user.id === user.id
                ? "you"
                : getFormattedNameFromUser(message.user)}
            </Text>
          </Text>
        ) : (
          <Text style={styles.messageTime}>Sending...</Text>
        )}
      </View>
    );
  };

  renderMessageList = () => {
    const { event, messages } = this.state;
    // console.log(messages);
    return (
      <FlatList
        inverted
        style={styles.messageList}
        renderItem={this.renderMessage}
        data={messages}
        keyExtractor={message => message.localSentAt.toString()}
        ItemSeparatorComponent={() => <View style={styles.listItemSeparator} />}
      />
    );
  };

  addMessageToQueue = async localMessage => {
    // console.log(this.state.messages);
    await this.setState({
      messages: [localMessage].concat(this.state.messages) // at the beginning because list is inverted
    });
  };
  sendMessageInQueue = async localSentAt => {
    this.setState({ isSubittingMessage: true });
    const localMessage = this.state.messages.find(
      m => m.localSentAt === localSentAt
    );
    if (!localMessage)
      return console.log(
        `can't find localSentAt ${localSentAt} in messages`,
        this.state.messages
      );
    if (localMessage.id)
      return console.log(`Message ${localSentAt} is already sent!`);

    const { error, message } = await createMessage(localMessage);

    this.updateMessageInQueue({ localSentAt, message, error });
    this.setState({
      isSubittingMessage: false
    });
  };
  updateMessageInQueue = ({ localSentAt, message, error }) => {
    // Either 'message' or 'error' should be sent. message is the returned object from server after creation.
    const localMessage = this.state.messages.find(
      m => m.localSentAt === localSentAt
    );
    if (!localMessage)
      return console.log(
        `can't find localSentAt ${localSentAt} in messages`,
        this.state.messages
      );
    if (message) {
      localMessage.wasDelivered = true;
      localMessage.id = message.id;
    } else {
      localMessage.error = error;
    }
  };

  handleMessageSubmit = async () => {
    const { inputText = "", event } = this.state;
    const user = this.props.navigation.getParam("user");
    // this.messageInputRef.current.focus();
    if (!inputText.length) return;
    // localSentAt is just a unique key that allows local messages to be identifed when they round trip from server
    const localSentAt = new Date().getTime();
    await this.addMessageToQueue({
      localSentAt,
      text: inputText,
      event,
      user
    });
    this.setState({ inputText: "" });
    await this.sendMessageInQueue(localSentAt);
  };

  renderMessageInputRow = () => {
    const { inputText, networkIsOffline } = this.state;

    return (
      <View
        style={[
          styles.messageInputRow,
          networkIsOffline ? styles.messageInputRowOffline : {}
        ]}
      >
        <TextInput
          blurOnSubmit={false}
          // multiline={true}
          style={[
            styles.messageInput,
            networkIsOffline ? styles.messageInputOffline : {}
          ]}
          value={inputText}
          onChangeText={inputText => this.setState({ inputText })}
          onSubmitEditing={this.handleMessageSubmit}
          ref={this.messageInputRef}
          returnKeyType="send"
          placeholder={
            networkIsOffline ? "You are offline. Waiting..." : "Type a thing"
          }
          placeholderTextColor={
            networkIsOffline ? colors.dangerColor : colors.brandColor
          }
          editable={!networkIsOffline}
        />
        <TouchableOpacity
          onPress={this.handleMessageSubmit}
          style={styles.messageSubmitContainer}
        >
          <View style={styles.messageSubmitButton}>
            <Icon
              name="arrow-upward"
              fill={colors.brandColor}
              height={40}
              width={40}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  handleAddPerson = () => {
    const { event } = this.state;
    this.setState({ showMoreActions: false });
    const user = this.props.navigation.getParam("user");
    this.props.navigation.navigate("EditEventPhones", { event, user });
  };
  render() {
    const {
      errorMessage,
      title,
      isRefreshing,
      isLoading,
      isEditingTitle,
      isSubmittingTitle,
      messagesAreLoaded,
      showMoreActions
    } = this.state;

    const moreActionsData = [
      {
        title: "Add person",
        icon: style => <Icon {...style} name="person-add" />,
        onPress: this.handleAddPerson
      },
      {
        title: "Delete event",
        icon: style => <Icon {...style} name="trash" />,
        onPress: this.handleDeletePress
      }
    ];
    const event = this.props.navigation.getParam("event");
    const user = this.props.navigation.getParam("user");

    return (
      <Layout style={styles.container}>
        {isEditingTitle ? (
          <InlineForm>
            <InlineFormInput
              label=""
              placeholder="A name for the event"
              onChangeText={title =>
                this.setState({ title, errorMessage: false })
              }
              value={title}
              maxLength={50}
              returnKeyType="done"
            />
            <View
              style={{
                flexDirection: "row"
              }}
            >
              <InlineFormSubmitButton
                onPress={this.handleSubmitTitle}
                disabled={!title || isSubmittingTitle}
              >
                {isSubmittingTitle ? "Saving" : "Save"}
              </InlineFormSubmitButton>
              <InlineFormCancelButton
                onPress={() => this.setState({ isEditingTitle: false })}
              >
                Cancel
              </InlineFormCancelButton>
            </View>
          </InlineForm>
        ) : (
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.titleContainer}
              onPress={() =>
                this.setState({ isEditingTitle: true, title: event.title })
              }
            >
              <Text style={styles.title}>{title}</Text>
              <Icon
                name="edit-outline"
                width={24}
                height={24}
                fill={colors.brandColor}
              />
            </TouchableOpacity>
            <OverflowMenu
              data={moreActionsData}
              visible={showMoreActions}
              selectedIndex={null}
              onSelect={index => moreActionsData[index].onPress()}
              onBackdropPress={() => this.setState({ showMoreActions: false })}
            >
              <Icon
                name="more-vertical"
                width={24}
                height={24}
                fill={colors.brandColor}
                onPress={() => this.setState({ showMoreActions: true })}
              />
            </OverflowMenu>
          </View>
        )}

        {errorMessage && (
          <Text style={styles.errorMessage} status="danger">
            {errorMessage}
          </Text>
        )}

        <Form style={styles.messageForm}>
          <View style={styles.messageListContainer}>
            {!messagesAreLoaded ? <Spinner /> : this.renderMessageList()}
          </View>
          {this.renderMessageInputRow()}
        </Form>
      </Layout>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  intro: { marginHorizontal: gutterWidth },
  topRow: {
    flexDirection: "row",
    marginHorizontal: gutterWidth,
    marginVertical: 10,
    justifyContent: "space-between"
  },

  titleContainer: {
    flexDirection: "row"
  },
  title: { fontSize: 18, marginRight: 20 },
  // header: { marginTop: 20, marginBottom: 10, fontWeight: "normal" },
  introText: { marginBottom: 10 },

  messageForm: { flex: 1, paddingHorizontal: 0 },
  messageListContainer: { flex: 1 },
  message: { paddingHorizontal: gutterWidth, paddingVertical: 10 },
  messageText: {},
  messageAuthor: { color: "#aaa", fontSize: 13, fontWeight: "bold" },
  messageTime: { color: "#aaa", fontSize: 13 },
  messageInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopColor: colors.brandColor,
    borderTopWidth: 1
    // backgroundColor: "white"
  },
  messageInputRowOffline: { borderTopColor: colors.dangerColor },
  messageInput: {
    borderWidth: 0,
    flex: 2,
    height: 50,
    // backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 2,
    color: "white", // todo: detect theme
    fontSize: 16
  },
  messageSubmitContainer: { paddingHorizontal: 10 }, //TouchableOpacity
  messageSubmitButton: {
    justifyContent: "center",
    alignItems: "center"
  },
  messageSubmitButtonIcon: {},
  deleteButton: { marginTop: 20 },
  errorMessage: {
    marginHorizontal: gutterWidth,
    marginVertical: gutterWidth,
    textAlign: "center"
  }
});
