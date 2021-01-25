import { IObservableArray } from "azure-devops-ui/Core/Observable";
import { IListSelection } from "azure-devops-ui/List";
import { convertDateToUtc, fieldNames, getWorkItemService } from "../Common";
import { IVerificationInfo } from "./VerificationInfo";
import { deflate, inflate } from "pako";

export const getVerificationHistory = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  const workItemFormService = await getWorkItemService();
  const fieldValue = await workItemFormService.getFieldValue(
    fieldNames.validationHistory,
    { returnOriginalValue: false }
  );

  items.value = decodeItems(fieldValue.toString());
  selection.select(0);
};

const decodeItems = (data: string) => {
  if (data.length === 0) {
    return <IVerificationInfo[]>[];
  }

  const dataToBeInflated = data.split(",").map(Number);
  const items: IVerificationInfo[] =
    JSON.parse(inflate(dataToBeInflated, { to: "string" })) || [];

  items.forEach((item) => {
    item.dateOfVerification = new Date(item.dateOfVerification);
  });

  return items;
};

const encodeItems = (data: IVerificationInfo[]) => {
  return deflate(JSON.stringify(data), { to: "string" }).toString();
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

  if (
    isVerificationValid(newItem) &&
    areVerificationsNotEqual(newItem, items.value[0])
  ) {
    items.splice(0, 0, newItem);
    selection.select(0);

    await workItemFormService.setFieldValue(
      fieldNames.validationHistory,
      encodeItems(items.value)
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
