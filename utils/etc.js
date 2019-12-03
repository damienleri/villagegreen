import { parsePhoneNumberFromString } from "libphonenumber-js";

export const formatPhone = phone => {
  const phoneParsed = parsePhoneNumberFromString(phone, "US");
  return phoneParsed.country === "US"
    ? phoneParsed.formatNational()
    : phoneParsed.formatInternational();
};

export const getFormattedNameFromContact = contact => {
  const user = null;
  // TODO. this would be a user whose phone matches the contact.
  // but it would be too slow to query for it in the middle of the multi-select on editevent screen
  const firstName = user ? user.firstName : contact.firstName;
  const lastName = user ? user.lastName : contact.lastName;
  if (firstName !== contact.firstName && lastName !== contact.lastName) {
    return `${firstName} ${lastName} (${contact.firstName} ${contact.lastName})`;
  } else {
    return `${firstName} ${lastName}`;
  }
};
