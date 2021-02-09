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
import {
  compareDates,
  fieldNames,
  getWorkItemService,
  IIndexable,
} from "../Common";
import { IVerificationInfo } from "./VerificationInfo";

const invalidDate = new Date(0);
const verificationInfoOrder = (a: IVerificationInfo, b: IVerificationInfo) =>
  -compareDates(a.dateOfVerification, b.dateOfVerification);

// This should be a scoped variable, or refactored into something less brittle.
let readItems = 0;

export const getInitialWorkItemUpdates = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  const lastGoodValue: IVerificationInfo = {
    build: "",
    dateOfVerification: invalidDate,
    details: "",
    status: "",
    verifiedBy: "",
    dateAdded: new Date(),
  };

  readItems = 0;
  items.value = await getWorkItemUpdates(lastGoodValue);
  selection.select(0);

  await SDK.notifyLoadSucceeded();
};

export const getLatestWorkItemUpdates = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  if (items.value.length === 0) {
    return await getInitialWorkItemUpdates(items, selection);
  }
  // This assumes that item 0 is the latest entry, if reverse order use items.length - 1.
  // We need a copy, otherwise values will get replaced in the original element
  const lastGoodValue = { ...items.value[0] };
  const latestUpdates = await getWorkItemUpdates(lastGoodValue);

  items.value = items.value
    .concat(...latestUpdates)
    .sort(verificationInfoOrder);
  selection.select(0);
};

const getWorkItemUpdates = async (lastGoodValue: IVerificationInfo) => {
  const updates = await fetchUpdates(readItems);
  readItems += updates.length;

  const verificationInfo = updates
    .filter(isUpdateFromVerification)
    .map((x) => transformToVerificationInfo(x));

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

  const maxNumberOfItemsInFetch = 200;
  const projectService = await SDK.getService<IProjectPageService>(
    CommonServiceIds.ProjectPageService
  );
  const project = await projectService.getProject();
  const client = getClient(WorkItemTrackingRestClient);

  let updates: WorkItemUpdate[] = [];
  let i = 0;

  do {
    const fetchedUpdates = await client.getUpdates(
      workItemId,
      project?.name,
      undefined,
      skip + i * maxNumberOfItemsInFetch
    );
    updates = updates.concat(fetchedUpdates);
    i++;
  } while (updates.length / i === maxNumberOfItemsInFetch);

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
