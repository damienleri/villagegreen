import React from "react";
import { connect } from "react-redux";
import { Platform, SafeAreaView, StyleSheet, View } from "react-native";
import {} from "react-navigation";
import {
  Layout,
  List,
  ListItem,
  Card,
  Text,
  Toggle
} from "@ui-kitten/components";
import { Auth } from "aws-amplify";

import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import Constants from "expo-constants";

import { gutterWidth } from "../utils/style";
import Button from "../components/Button";
import BuildInfo from "../components/BuildInfo";
import { NetworkContext } from "../components/NetworkProvider";
import { setSettings as setSettingsType } from "../redux/actions";
import { getCurrentUser, updateUser } from "../utils/api";

class SettingNotificationsForm extends React.Component {
  render() {}
}

export default SettingNotificationsForm;
