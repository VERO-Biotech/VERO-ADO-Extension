import {
  IWorkItemChangedArgs,
  IWorkItemFieldChangedArgs,
  IWorkItemLoadedArgs,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";
import {
  checkParentIfTask,
  clearTaskMissingParentError,
} from "./TaskParentValidation";
import {
  handleValidationFields,
  isValidationField,
} from "./VerificationHistory";
import { WorkItemFormGroupComponentState } from "./WorkItemFormGroup";

export const registerEvents = (
  component: React.Component<{}, WorkItemFormGroupComponentState>
) => {
  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
        component.setState({
          eventContent: [
            `onFieldChanged - ${JSON.stringify(args)}`,
            ...component.state.eventContent,
          ],
        });
        if (
          args.changedFields["System.Parent"] &&
          args.changedFields["System.Parent"] !== null
        ) {
          clearTaskMissingParentError();
        }

        const validationFields = Object.keys(args.changedFields).filter((el) =>
          isValidationField(el)
        );

        if (validationFields && validationFields.length > 1) {
          handleValidationFields(validationFields);
        }
      },

      // Called when a new work item is being loaded in the UI
      onLoaded: (args: IWorkItemLoadedArgs) => {
        component.setState({
          eventContent: [
            `onLoaded - ${JSON.stringify(args)}`,
            ...component.state.eventContent,
          ],
        });

        checkParentIfTask();
      },

      // Called when the active work item is being unloaded in the UI
      onUnloaded: (args: IWorkItemChangedArgs) => {
        component.setState({
          eventContent: [
            `onUnloaded - ${JSON.stringify(args)}`,
            ...component.state.eventContent,
          ],
        });
      },

      // Called after the work item has been saved
      onSaved: (args: IWorkItemChangedArgs) => {
        component.setState({
          eventContent: [
            `onSaved - ${JSON.stringify(args)}`,
            ...component.state.eventContent,
          ],
        });
      },

      // Called when the work item is reset to its unmodified state (undo)
      onReset: (args: IWorkItemChangedArgs) => {
        component.setState({
          eventContent: [
            `onReset - ${JSON.stringify(args)}`,
            ...component.state.eventContent,
          ],
        });
      },

      // Called when the work item has been refreshed from the server
      onRefreshed: (args: IWorkItemChangedArgs) => {
        component.setState({
          eventContent: [
            `onRefreshed - ${JSON.stringify(args)}`,
            ...component.state.eventContent,
          ],
        });
      },
    };
  });
};
