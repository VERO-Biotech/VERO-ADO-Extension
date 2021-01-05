import {
  IWorkItemChangedArgs,
  IWorkItemFieldChangedArgs,
  IWorkItemLoadedArgs,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { IObservableArray } from "azure-devops-ui/Core/Observable";
import { IListSelection } from "azure-devops-ui/List";
import { fieldNames } from "./Common";
import { IVerificationInfo } from "./VerificationInfo";
import {
  checkParentIfTask,
  clearTaskMissingParentError,
} from "./TaskParentValidation";
import { saveVerificationHistory } from "./VerificationHistory";

export const registerEvents = (
  component: React.Component<{}, {}>,
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
        if (
          args.changedFields[fieldNames.parent] &&
          args.changedFields[fieldNames.parent] !== null
        ) {
          clearTaskMissingParentError();
        }

        // Naive check for onSave
        if (args.changedFields[fieldNames.revision]) {
          saveVerificationHistory(items, selection);
        }
      },

      // Called when a new work item is being loaded in the UI
      onLoaded: (args: IWorkItemLoadedArgs) => {
        checkParentIfTask();
      },

      // Called when the active work item is being unloaded in the UI
      onUnloaded: (args: IWorkItemChangedArgs) => {},

      // Called after the work item has been saved
      onSaved: (args: IWorkItemChangedArgs) => {},

      // Called when the work item is reset to its unmodified state (undo)
      onReset: (args: IWorkItemChangedArgs) => {},

      // Called when the work item has been refreshed from the server
      onRefreshed: (args: IWorkItemChangedArgs) => {},
    };
  });
};
