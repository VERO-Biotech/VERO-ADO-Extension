import {
  IWorkItemFieldChangedArgs,
  IWorkItemLoadedArgs,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { fieldNames } from "../Common";
import {
  checkTaskForMissingParent,
  clearTaskMissingParentError,
} from "../FormCustomEvents/TaskParentValidation";

const registerEvents = () => {
  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
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
      },

      // Called when a new work item is being loaded in the UI
      onLoaded: (args: IWorkItemLoadedArgs) => {
        try {
          checkTaskForMissingParent();
        } catch (err) {
          console.error("Error checking for Task missing parent: ", err);
        }
      },
    };
  });
};

SDK.init().then(() => {
  registerEvents();
});
