import { IObservableArray } from "azure-devops-ui/Core/Observable";
import { IListSelection } from "azure-devops-ui/List";
import { convertDateToUtc, fieldNames, getWorkItemService } from "./Common";
import { IVerificationInfo } from "./VerificationInfo";

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
    ],
    { returnOriginalValue: false }
  );

  const dateOfVerification = <Date>fieldValues[fieldNames.dateOfVerification];
  const verifiedBy = <string>fieldValues[fieldNames.verifiedBy];

  const newItem: IVerificationInfo = {
    dateOfVerification: convertDateToUtc(dateOfVerification),
    details: <string>fieldValues[fieldNames.details],
    status: <string>fieldValues[fieldNames.status],
    verifiedBy: verifiedBy.split("<")[0],
  };

  const firstItem = items.value[0] || null;

  if (
    firstItem !== null &&
    (newItem.dateOfVerification.toISOString() !==
      firstItem.dateOfVerification.toISOString() ||
      newItem.details !== firstItem.details ||
      newItem.status !== firstItem.status ||
      newItem.verifiedBy !== firstItem.verifiedBy)
  ) {

    items.splice(0, 0, newItem);
    selection.select(0);

    await workItemFormService.setFieldValue(
      fieldNames.validationHistory,
      JSON.stringify(items.value)
    );

    const validationHist = await workItemFormService.getFieldValue(
      fieldNames.validationHistory,
      { returnOriginalValue: false }
    );

    await workItemFormService.save();
  }
};