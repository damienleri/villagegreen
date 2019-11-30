import React from "react";
import { StyleSheet, SafeAreaView, View } from "react-native";
import {
  Layout,
  Icon,
  TopNavigation,
  TopNavigationAction
} from "react-native-ui-kitten";

const BackIcon = style => <Icon {...style} name="arrow-back" />;

const EditIcon = style => <Icon {...style} name="edit" />;

const MenuIcon = style => <Icon {...style} name="more-vertical" />;

const BackAction = props => <TopNavigationAction {...props} icon={BackIcon} />;

const EditAction = props => <TopNavigationAction {...props} icon={EditIcon} />;

const MenuAction = props => <TopNavigationAction {...props} icon={MenuIcon} />;

export default function(props) {
  const onBackPress = () => {
    props.navigation.goBack();
  };

  const renderLeftControl = () => <BackAction onPress={onBackPress} />;

  const renderRightControls = () => [];
  // const renderRightControls = () => [<EditAction />, <MenuAction />];

  return (
    <Layout>
      <SafeAreaView>
        <TopNavigation
          title={props.title}
          leftControl={renderLeftControl()}
          rightControls={renderRightControls()}
        />
      </SafeAreaView>
    </Layout>
  );
}
