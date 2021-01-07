import { IObservableArray } from "azure-devops-ui/Core/Observable";
import { IListSelection } from "azure-devops-ui/List";
import { convertDateToUtc, fieldNames, getWorkItemService } from "./Common";
import { emptyVerificationInfo, IVerificationInfo } from "./VerificationInfo";

export const getVerificationHistory = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  const workItemFormService = await getWorkItemService();
  const fieldValue = await workItemFormService.getFieldValue(
    fieldNames.validationHistory,
    { returnOriginalValue: false }
  );

  const jsonData = fieldValue
    .toString()
    .replace(/(?<!=)&quot;/g, '"')
    .replace(/["]?%5c%22["]?/g, '\\"');

  console.log("Json Data", jsonData);

  if (jsonData.length === 0) {
    return;
  }

  const itemsData: IVerificationInfo[] = JSON.parse(jsonData);

  itemsData.forEach((item) => {
    item.details = decodeURIComponent(item.details);
    item.dateOfVerification = new Date(item.dateOfVerification);
  });

  items.value = itemsData;
  selection.select(0);
};

export const saveVerificationHistory = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  const workItemFormService = await getWorkItemService();
  const fieldValues = await workItemFormService.getFieldValues(
    [
      fieldNames.verifiedBy,
      fieldNames.status,
      fieldNames.dateOfVerification,
      fieldNames.details,
      fieldNames.integrationBuild,
    ],
    { returnOriginalValue: false }
  );

  const dateOfVerification = <Date>fieldValues[fieldNames.dateOfVerification];
  const verifiedBy = <string>fieldValues[fieldNames.verifiedBy];

  if (dateOfVerification === null) {
    return;
  }

  const newItem: IVerificationInfo = {
    dateOfVerification: convertDateToUtc(dateOfVerification),
    details: <string>fieldValues[fieldNames.details],
    status: <string>fieldValues[fieldNames.status],
    verifiedBy: verifiedBy.split("<")[0],
    build: <string>fieldValues[fieldNames.integrationBuild],
  };

  console.log("New item", newItem);

  if (
    isVerificationValid(newItem) &&
    areVerificationsNotEqual(newItem, items.value[0])
  ) {
    items.splice(0, 0, newItem);
    selection.select(0);

    console.log("Items Data", items.value);

    await workItemFormService.setFieldValue(
      fieldNames.validationHistory,
      JSON.stringify(items.value)
    );

    await workItemFormService.save();
  }
};

const isVerificationValid = (verificationInfo: IVerificationInfo) => {
  return (
    verificationInfo.status &&
    verificationInfo.details &&
    verificationInfo.verifiedBy &&
    verificationInfo.build
  );
};

const areVerificationsNotEqual = (
  newItem: IVerificationInfo,
  item: IVerificationInfo
) => {
  if (item === undefined || item === null) {
    return true;
  }

  return (
    newItem.dateOfVerification.toISOString() !==
      item.dateOfVerification.toISOString() ||
    newItem.details !== item.details ||
    newItem.status !== item.status ||
    newItem.verifiedBy !== item.verifiedBy ||
    newItem.build !== item.build
  );
};
