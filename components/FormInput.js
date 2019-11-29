import React from "react";
import { StyleSheet } from "react-native";
import { Input, Icon } from "react-native-ui-kitten";

export default React.forwardRef((props, ref) => {
  // export default React.FC<InputProps> = (props, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      style={[props.style, styles.input]}
      labelStyle={styles.inputLabelStyle}
    />
  );
});
const styles = StyleSheet.create({
  input: {
    marginVertical: 10
  },
  inputLabelStyle: {
    textTransform: "uppercase"
  }
});
