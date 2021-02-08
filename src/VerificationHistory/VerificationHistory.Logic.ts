import {
  CommonServiceIds,
  getClient,
  IProjectPageService,
} from "azure-devops-extension-api";
import {
  WorkItemTrackingRestClient,
  WorkItemUpdate,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { IObservableArray } from "azure-devops-ui/Core/Observable";
import { IListSelection } from "azure-devops-ui/List";
import { deflate, inflate } from "pako";
import { fieldNames, getWorkItemService, compareDates } from "../Common";
import { IVerificationInfo } from "./VerificationInfo";

export const getVerificationHistory = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  /*const workItemFormService = await getWorkItemService();
  const fieldValue = await workItemFormService.getFieldValue(
    fieldNames.verificationHistory,
    { returnOriginalValue: false }
  );

  items.value = decodeItems(fieldValue.toString());
  selection.select(0);*/
  getWorkItemUpdates(items, selection);
};

const invalidDate = new Date(0);
const maxNumberOfItemsInFetch = 200;

export const getWorkItemUpdates = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  const projectService = await SDK.getService<IProjectPageService>(
    CommonServiceIds.ProjectPageService
  );
  const project = await projectService.getProject();
  const workItemFormService = await getWorkItemService();
  const client = getClient(WorkItemTrackingRestClient);
  const workItemId = await workItemFormService.getId();

  let updates: WorkItemUpdate[] = [];
  let i = 0;

  do {
    const fetchedUpdates = await client.getUpdates(
      workItemId,
      project?.name,
      undefined,
      i * maxNumberOfItemsInFetch
    );
    updates = updates.concat(fetchedUpdates);
    i++;
  } while (updates.length / i === maxNumberOfItemsInFetch);

  const verificationHistory = updates
    .filter(isUpdateFromVerification)
    .map((x) => transformToVerificationInfo(x));

  const lastGoodValues: IVerificationInfo = {
    build: "",
    dateOfVerification: invalidDate,
    details: "",
    status: "",
    verifiedBy: "",
    dateAdded: new Date(),
  };

  verificationHistory.forEach((verification) => {
    swapWithLastGoodValue(verification, lastGoodValues, "build");
    swapWithLastGoodValue(verification, lastGoodValues, "dateOfVerification");
    swapWithLastGoodValue(verification, lastGoodValues, "details");
    swapWithLastGoodValue(verification, lastGoodValues, "status");
    swapWithLastGoodValue(verification, lastGoodValues, "verifiedBy");
  });

  items.value = verificationHistory
    .filter(filterEmptyVerifications)
    .sort((a, b) => -compareDates(a.dateOfVerification, b.dateOfVerification));

  selection.select(0);
};

interface IIndexable {
  [key: string]: any;
}

const swapWithLastGoodValue = (
  item: IVerificationInfo,
  lastGoodValues: IVerificationInfo,
  propertyName: string
) => {
  if ((item as IIndexable)[propertyName] !== undefined) {
    (lastGoodValues as IIndexable)[propertyName] = (item as IIndexable)[
      propertyName
    ];
  } else {
    (item as IIndexable)[propertyName] = (lastGoodValues as IIndexable)[
      propertyName
    ];
  }
};

const isUpdateFromVerification = (update: WorkItemUpdate) => {
  return (
    update.fields &&
    (update.fields[fieldNames.details] ||
      update.fields[fieldNames.verifiedBy] ||
      update.fields[fieldNames.status] ||
      update.fields[fieldNames.dateOfVerification] ||
      update.fields[fieldNames.integrationBuild])
  );
};

const transformToVerificationInfo = (update: WorkItemUpdate) => {
  return <IVerificationInfo>{
    build: update.fields[fieldNames.integrationBuild]?.newValue,
    dateAdded: update.revisedDate,
    dateOfVerification: update.fields[fieldNames.dateOfVerification]?.newValue,
    details: update.fields[fieldNames.details]?.newValue,
    status: update.fields[fieldNames.status]?.newValue,
    verifiedBy: update.fields[fieldNames.verifiedBy]?.newValue?.displayName,
  };
};

const filterEmptyVerifications = (verification: IVerificationInfo) => {
  return (
    verification.details &&
    verification.details.length > 0 &&
    verification.dateOfVerification &&
    verification.dateOfVerification !== invalidDate &&
    verification.build &&
    verification.build.length > 0 &&
    verification.status &&
    verification.status.length > 0 &&
    verification.verifiedBy &&
    verification.verifiedBy.length > 0
  );
};

const decodeItems = (data: string) => {
  if (data.length === 0) {
    return <IVerificationInfo[]>[];
  }

  const dataToBeInflated = data.split(",").map(Number);
  const items: IVerificationInfo[] =
    JSON.parse(inflate(dataToBeInflated, { to: "string" })) || [];

  items.forEach((item) => {
    item.dateAdded = new Date(item.dateAdded);
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
    dateOfVerification: dateOfVerification,
    details: <string>fieldValues[fieldNames.details],
    status: <string>fieldValues[fieldNames.status],
    verifiedBy: verifiedBy.split("<")[0],
    build: <string>fieldValues[fieldNames.integrationBuild],
    dateAdded: new Date(),
  };

  if (
    isVerificationValid(newItem) &&
    areVerificationsNotEqual(newItem, items.value[0])
  ) {
    items.splice(0, 0, newItem);
    selection.select(0);

    await workItemFormService.setFieldValue(
      fieldNames.verificationHistory,
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
