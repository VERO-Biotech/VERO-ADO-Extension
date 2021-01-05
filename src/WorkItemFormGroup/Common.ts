import {
  IWorkItemFormService,
  WorkItemTrackingServiceIds
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";

export const getWorkItemService = async () => {
  return await SDK.getService<IWorkItemFormService>(
    WorkItemTrackingServiceIds.WorkItemFormService
  );
};

export interface IFieldNames {
  validationHistory: string;
  verifiedBy: string;
  status: string;
  dateOfVerification: string;
  details: string;
  parent: string;
  revision: string;
  workItemType: string;
}

export const fieldNames: IFieldNames = {
  validationHistory: "Custom.VerificationHistoryLong",
  verifiedBy: "Custom.Verifiedby",
  status: "Custom.Verificationstatus",
  dateOfVerification: "Custom.Dateofverification",
  details: "Custom.Verificationofchange",
  parent: "System.Parent",
  revision: "System.Rev",
  workItemType: "System.WorkItemType",
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

export const convertDateToUtc = (dateOfVerification: Date) => {
  return new Date(
    dateOfVerification.getUTCFullYear(),
    dateOfVerification.getUTCMonth(),
    dateOfVerification.getUTCDate(),
    dateOfVerification.getUTCHours(),
    dateOfVerification.getUTCMinutes(),
    dateOfVerification.getUTCSeconds(),
    dateOfVerification.getUTCMilliseconds()
  );
};