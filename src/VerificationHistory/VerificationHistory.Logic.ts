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

export const getVerificationHistory = async (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  try {
    await getWorkItemUpdates(items, selection);
  } catch (err) {
    console.error("Error reading updates for Verification History.", err);
  }
};

const invalidDate = new Date(0);
const maxNumberOfItemsInFetch = 200;

const getWorkItemUpdates = async (
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

  await SDK.notifyLoadSucceeded();
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
