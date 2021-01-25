import {
  IWorkItemFieldChangedArgs,
  IWorkItemLoadedArgs,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { fieldNames } from "../Common";
import {
  checkTaskForMissingParent,
  clearTaskMissingParentError,
} from "./TaskParentValidation";

const registerEvents = () => {
  const isTaskParentValidationOn = SDK.getConfiguration().witInputs
    .EnableTaskOrphanCheck;

  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
        if (isTaskParentValidationOn) {
          taskParentValidationClearErrors(args);
          // Need to also validate on field change for Parent removal scenario
          taskParentValidation();
        }
      },
      // Called when a new work item is being loaded in the UI
      onLoaded: (args: IWorkItemLoadedArgs) => {
        if (isTaskParentValidationOn) {
          taskParentValidation();
        }
      },
    };
  });
};

const taskParentValidation = () => {
  try {
    checkTaskForMissingParent();
  } catch (err) {
    console.error("Error checking for Task missing parent: ", err);
  }
};

const taskParentValidationClearErrors = (args: IWorkItemFieldChangedArgs) => {
  if (
    args.changedFields[fieldNames.parent] &&
    args.changedFields[fieldNames.parent] !== null
  ) {
    try {
      clearTaskMissingParentError();
    } catch (err) {
      console.error("Error clearing missing parent messages: ", err);
    }
  }
};

SDK.init().then(() => {
  registerEvents();
});
