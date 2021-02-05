import {
  IWorkItemFormService,
  WorkItemTrackingServiceIds,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";

export const getWorkItemService = async () => {
  return await SDK.getService<IWorkItemFormService>(
    WorkItemTrackingServiceIds.WorkItemFormService
  );
};

export interface IFieldNames {
  verificationHistory: string;
  verifiedBy: string;
  status: string;
  dateOfVerification: string;
  details: string;
  parent: string;
  revision: string;
  workItemType: string;
  integrationBuild: string;
  areaPath: string;
}

export const fieldNames: IFieldNames = {
  verificationHistory: "",
  verifiedBy: "",
  status: "",
  dateOfVerification: "",
  details: "",
  parent: "System.Parent",
  revision: "System.Rev",
  workItemType: "System.WorkItemType",
  integrationBuild: "Microsoft.VSTS.Build.IntegrationBuild",
  areaPath: "System.AreaPath",
};

export interface IWorkItemTypes {
  task: string;
}

export const workItemTypes: IWorkItemTypes = {
  task: "Task",
};

export interface IVerificationStatus {
  passed: string;
  failed: string;
}

export const verificationStatus: IVerificationStatus = {
  passed: "Passed",
  failed: "Failed",
};

export const mapStatus = (status: string): IStatusProps => {
  switch (status) {
    case verificationStatus.passed:
      return Statuses.Success;
    case verificationStatus.failed:
      return Statuses.Failed;
  }
  // Return blank status if no mapping found
  return Statuses.Queued;
};

export const dateFormat: string = "MMM DD YYYY, h:mm:ss A";
