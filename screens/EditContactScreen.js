import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Icon,
  Layout,
  Text,
  Button,
  Radio,
  Card,
  CardHeader,
  List,
  ListItem,
  Spinner
} from "react-native-ui-kitten";
import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js";
import Form from "../components/Form";
import FormInput from "../components/FormInput";
import FormSubmitButton from "../components/FormSubmitButton";
import TopNavigation from "../components/TopNavigation";
import { getCurrentUser, createContact, updateContact } from "../utils/api";
import { gutterWidth } from "../utils/style";
import { formatPhone } from "../utils/etc";

export default class EditContactScreen extends React.Component {
  constructor(props) {
    super(props);
    this.firstNameInputRef = React.createRef();
    const contact = props.navigation.getParam("contact");
    if (contact) {
      /* Update mode */

      this.state = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: formatPhone(contact.phone),
        validPhone: contact ? contact.phone : null
      };
    } else {
      /* Create mode */
      this.state = {
        firstName: "",
        lastName: "",
        phone: "",
        validPhone: null
      };
    }
  }

  componentDidMount() {
    const contact = this.props.navigation.getParam("contact");
    if (!contact) this.firstNameInputRef.current.focus();
  }
  handleChangePhone = async text => {
    const parsed = parsePhoneNumberFromString(text, "US");
    const isValidPhone = !!parsed && parsed.isValid();
    const isBackspace = text.length < this.state.phone.length;
    const phone = isBackspace ? text : new AsYouType("US").input(text);
    this.setState({
      phone,
      validPhone: isValidPhone ? parsed.format("E.164") : null,
      phoneErrorMessage: null
    });
  };

  handleSubmit = async () => {
    const { firstName, lastName, validPhone } = this.state;
    const contact = this.props.navigation.getParam("contact");
    const type = this.props.navigation.getParam("type");
    if (contact) {
      /* Update mode */
      console.log("updating contact id", contact.id);
      const {
        contact: updatedContact,
        error: updateContactError
      } = await updateContact({
        id: contact.id,
        firstName,
        lastName,
        phone: validPhone
      });
      if (updateContactError) {
        this.setState({ errorMessage: updateContactError });
        return;
      }
      console.log("updated contact", updatedContact);
    } else {
      /* Create mode */
      const { contact, error: createContactError } = await createContact({
        firstName,
        lastName,
        phone: validPhone,
        type
      });
      if (createContactError) {
        this.setState({ errorMessage: createContactError });
        return;
      }
      console.log("created contact", contact);
    }

    this.props.navigation.goBack();
  };
  render() {
    const { navigation } = this.props;
    const {
      errorMessage,
      firstName,
      lastName,
      phone,
      isLoading,
      phoneErrorMessage,
      validPhone
    } = this.state;
    const contact = navigation.getParam("contact");
    const type = navigation.getParam("type");

    return (
      <Layout style={styles.container}>
        <View style={styles.intro}>
          <Text category="h5" style={styles.header}>
            {contact ? "Let's edit this " : "Let's add this "}
            {type}
          </Text>
          <Text style={styles.introText}></Text>
        </View>

        <Form>
          <FormInput
            label="First name"
            placeholder=""
            onChangeText={firstName =>
              this.setState({ firstName, errorMessage: false })
            }
            value={firstName}
            returnKeyType="done"
            autoCorrect={false}
            ref={this.firstNameInputRef}
          />
          <FormInput
            label="Last name"
            placeholder=""
            onChangeText={lastName =>
              this.setState({ lastName, errorMessage: false })
            }
            value={lastName}
            returnKeyType="done"
            autoCorrect={false}
          />
          <FormInput
            label="Phone number"
            placeholder=""
            onChangeText={this.handleChangePhone}
            value={phone}
            status={
              !phone.length
                ? null
                : phoneErrorMessage || !validPhone
                ? "danger"
                : "success"
            }
            caption={phoneErrorMessage}
            keyboardType={"phone-pad"}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errorMessage && (
            <Text style={styles.errorMessage} status="danger">
              {errorMessage}
            </Text>
          )}
          <FormSubmitButton
            onPress={this.handleSubmit}
            disabled={!firstName || !lastName || !validPhone || isLoading}
          >
            {isLoading ? "Saving contact" : "Save"}
          </FormSubmitButton>
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
  header: { marginTop: 20, marginBottom: 10 },
  introText: { marginBottom: 10 },
  errorMessage: {
    marginTop: 4,
    marginBottom: 8,
    textAlign: "center"
  }
});
