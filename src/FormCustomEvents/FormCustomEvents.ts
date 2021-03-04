import {
  IWorkItemFieldChangedArgs,
  IWorkItemLoadedArgs,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import { requireAreaSelection } from "./RequireAreaSelection";
import {
  taskParentValidation,
  taskParentValidationClearErrors,
} from "./TaskParentValidation";
import { getCustomEventSettings } from "./CustomEventSettings";
import { reorderNewWorkItem } from "./ReorderNewWorkItems";

const registerEvents = () => {
  const settings = getCustomEventSettings();

  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
        if (settings.reorderNewItemOn) {
          reorderNewWorkItem(args);
        }

        if (settings.taskParentValidationOn) {
          taskParentValidationClearErrors(args);
          // Need to also validate on field change for Parent removal scenario
          taskParentValidation();
        }
      },
      // Called when a new work item is being loaded in the UI
      onLoaded: (args: IWorkItemLoadedArgs) => {
        if (settings.taskParentValidationOn) {
          taskParentValidation();
        }

        if (settings.requireAreaSelectionOn) {
          requireAreaSelection(args);
        }
      },
    };
  });
};

try {
  SDK.init().then(() => {
    registerEvents();
  });
} catch (err) {
  console.error("Error initializing FormCustomEvents", err);
}
