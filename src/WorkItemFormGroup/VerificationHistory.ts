import { getWorkItemService, fieldNames } from "./Common";
import { IVerificationInfo } from "./Data";

export const isValidationField = (fieldName: string) =>
  fieldName === fieldNames.status ||
  fieldName === fieldNames.verifiedBy ||
  fieldName === fieldNames.dateOfVerification;

export const handleValidationFields = (fields: string[]) => {
  fields.map((field) => {
    console.log(field);
  });
};

export const getValidationHistory = async () => {
  const workItemFormService = await getWorkItemService();
  const itemsRaw = await workItemFormService.getFieldValue(
    fieldNames.validationHistory,
    { returnOriginalValue: false }
  );
  const itemsData = JSON.parse(itemsRaw.toString());

  return <IVerificationInfo[]>itemsData;
};

const isVerificationUpdated = () => {};

// We will not rely on the changed fields themselves, we will get a snapshot of the current status of the Verification fields to work with.
// Only the single-line fields get sent in practice, so the Verification of change would need to be read.
// On Save, we will check if any of the verification items are being modified, if so, then we will add a new record to the verification history,
// capturing the snapshot of what we have.

// Events needed to map:
// - onSave or isSave
// - isVerificationUpdated
// Then do two methods:
// - addVerificationHistory: to read entries, and then add a new one at the top of the list, then update value and save, perhaps reload.
// - readVerificationHistory: to parse saved items from custom field or storage and then populate view items. This can be done in the component
// renderer automatically.
