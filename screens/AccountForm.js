import React from "react";
import { StyleSheet } from "react-native";
import {
  Icon,
  Layout,
  Text,
  Button,
  Radio,
  Spinner
} from "react-native-ui-kitten";
import Form from "../components/Form";
import FormInput from "../components/FormInput";
import FormSubmitButton from "../components/FormSubmitButton";
import { getCurrentUser, updateUser } from "../utils/api";

export default class AccountForm extends React.Component {
  state = { firstName: "", lastName: "" };
  constructor(props) {
    super(props);
    this.firstNameInputRef = React.createRef();
  }
  async componentDidMount() {
    if (this.props.isNewUser) this.firstNameInputRef.current.focus();
    this.setState({ isLoading: true });
    const { user, error: getCurrentUserError } = await getCurrentUser();
    if (getCurrentUserError)
      return this.setState({
        errorMessage: getCurrentUserError,
        isLoading: false
      });

    this.setState({
      isLoading: false,
      user,
      firstName: user.firstName,
      lastName: user.lastName,
      isParent: user.isParent
    });
  }

  handleSubmit = async () => {
    const { navigation, onSave, isNewUser = false } = this.props;
    const { user, firstName, lastName, isParent } = this.state;
    this.setState({ isSubmitting: true });
    const { error } = await updateUser({
      id: user.id,
      firstName,
      lastName,
      isParent
    });

    if (error) {
      console.log("error updating user", error);
      return this.setState({ errorMessage: error, isSubmitting: false });
    }

    await onSave();
  };

  render() {
    const {
      errorMessage,
      firstName,
      lastName,
      isParent,
      isParentMessage,
      isKid,
      isLoading,
      isSubmitting
    } = this.state;
    const { isNewUser } = this.props;
    if (isLoading) return <Spinner size="giant" />;
    return (
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
        <Layout style={styles.radioRow}>
          <Radio
            style={styles.radio}
            status="primary"
            text="Parent or guardian"
            checked={isParent}
            onChange={isParent =>
              this.setState({
                isParent,
                isParentMessage: "Chief Chaperone in the house!"
              })
            }
          />
          <Radio
            style={styles.radio}
            status="primary"
            text="Teen"
            checked={isKid}
            onChange={isKid =>
              this.setState({
                isKid,
                isParentMessage: "Small fry are the future!"
              })
            }
          />
        </Layout>
        {isParentMessage && (
          <Text style={styles.isParentMessage} status="success">
            {isParentMessage}
          </Text>
        )}
        {errorMessage && (
          <Text style={styles.errorMessage} status="danger">
            {errorMessage}
          </Text>
        )}
        <FormSubmitButton
          onPress={this.handleSubmit}
          disabled={
            !firstName || !lastName || !(isParent || isKid) || isSubmitting
          }
        >
          {isNewUser && isSubmitting
            ? "Getting started..."
            : isNewUser
            ? "Get started"
            : isSubmitting
            ? "Saving..."
            : "Save"}
        </FormSubmitButton>
      </Form>
    );
  }
}

const styles = StyleSheet.create({
  radioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 8
  },
  radio: {
    marginVertical: 4,
    marginHorizontal: 4
  },
  isParentMessage: {
    marginTop: 4,
    marginBottom: 8,
    textAlign: "center"
  },
  errorMessage: {
    marginTop: 4,
    marginBottom: 8,
    textAlign: "center"
  }
});
