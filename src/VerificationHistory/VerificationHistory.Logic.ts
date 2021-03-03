import { getClient } from "azure-devops-extension-api";
import {
  WorkItemTrackingRestClient,
  WorkItemUpdate,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { IObservableArray } from "azure-devops-ui/Core/Observable";
import { IListSelection } from "azure-devops-ui/List";
import {
  compareDates,
  fieldNames,
  getWorkItemService,
  getProjectService,
  IIndexable,
} from "../Common";
import { IVerificationInfo } from "./VerificationInfo";

const invalidDate = new Date(0);

const verificationInfoOrder = (a: IVerificationInfo, b: IVerificationInfo) => {
  const dateOfVerificationResult = -compareDates(
    a.dateOfVerification,
    b.dateOfVerification
  );

  if (dateOfVerificationResult === 0) {
    return b.index - a.index;
  } else {
    return dateOfVerificationResult;
  }
};

interface IVerificationHistoryContext {
  updates: WorkItemUpdate[];
}

const context: IVerificationHistoryContext = {
  updates: [],
};

export const getInitialWorkItemUpdates = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  await getVerificationHistory(items, selection);
  await SDK.notifyLoadSucceeded();
};

export const getVerificationHistory = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  items.value = await getWorkItemUpdates();
  selection.select(0);
};

const getWorkItemUpdates = async () => {
  const updates = await fetchUpdates(context.updates.length);
  context.updates.push(...updates);

  const verificationInfo = context.updates
    .filter(isUpdateFromVerification)
    .map((x) => transformToVerificationInfo(x));

  const lastGoodValue: IVerificationInfo = {
    build: "",
    dateOfVerification: invalidDate,
    details: "",
    status: "",
    verifiedBy: "",
    dateAdded: new Date(),
    index: -1,
  };

  verificationInfo.forEach((verification) => {
    swapWithLastGoodValue(verification, lastGoodValue, "build");
    swapWithLastGoodValue(verification, lastGoodValue, "dateOfVerification");
    swapWithLastGoodValue(verification, lastGoodValue, "details");
    swapWithLastGoodValue(verification, lastGoodValue, "status");
    swapWithLastGoodValue(verification, lastGoodValue, "verifiedBy");
  });

  return verificationInfo
    .filter(filterEmptyVerifications)
    .sort(verificationInfoOrder);
};

const fetchUpdates = async (skip: number = 0) => {
  const workItemFormService = await getWorkItemService();
  const workItemId = await workItemFormService.getId();

  // If new work item then id is 0
  if (workItemId === 0) {
    return <WorkItemUpdate[]>[];
  }

  const maxItemsInFetch = 200;

  const projectService = await getProjectService();
  const project = await projectService.getProject();
  const client = getClient(WorkItemTrackingRestClient);

  const updates: WorkItemUpdate[] = [];
  let i = 0;

  do {
    const fetchedUpdates = await client.getUpdates(
      workItemId,
      project?.name,
      maxItemsInFetch,
      skip + i * maxItemsInFetch
    );

    updates.push(...fetchedUpdates);
    i++;
  } while (updates.length / i === maxItemsInFetch);

  return updates;
};

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
    index: update.id,
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
