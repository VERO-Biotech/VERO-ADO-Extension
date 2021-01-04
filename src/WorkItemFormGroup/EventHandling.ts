import {
  IWorkItemChangedArgs,
  IWorkItemFieldChangedArgs,
  IWorkItemLoadedArgs,
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";
import { getWorkItemService, fieldNames, convertDateToUtc } from "./Common";
import { IVerificationInfo } from "./Data";
import { items, selection } from "./InitialMasterPanelContent";
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
          args.changedFields[fieldNames.parent] &&
          args.changedFields[fieldNames.parent] !== null
        ) {
          clearTaskMissingParentError();
        }

        const validationFields = Object.keys(args.changedFields).filter((el) =>
          isValidationField(el)
        );

        if (validationFields && validationFields.length > 1) {
          handleValidationFields(validationFields);
        }

        // Naive check for onSave
        if (args.changedFields[fieldNames.revision]) {
          onSave(args);
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

// This will handle a 'beforeSave' scenario
const onSave = async (args: IWorkItemChangedArgs) => {
  const workItemFormService = await getWorkItemService();
  const fieldValues = await workItemFormService.getFieldValues(
    [
      fieldNames.verifiedBy,
      fieldNames.status,
      fieldNames.dateOfVerification,
      fieldNames.details,
    ],
    { returnOriginalValue: false }
  );

  const dateOfVerification = <Date>fieldValues[fieldNames.dateOfVerification];
  const verifiedBy = <string>fieldValues[fieldNames.verifiedBy];

  const newItem: IVerificationInfo = {
    dateOfVerification: convertDateToUtc(dateOfVerification),
    details: <string>fieldValues[fieldNames.details],
    status: <string>fieldValues[fieldNames.status],
    verifiedBy: verifiedBy.split("<")[0],
  };

  const firstItem = items.value[0] || null;

  if (
    firstItem !== null &&
    (newItem.dateOfVerification.toISOString() !==
      firstItem.dateOfVerification.toISOString() ||
      newItem.details !== firstItem.details ||
      newItem.status !== firstItem.status ||
      newItem.verifiedBy !== firstItem.verifiedBy)
  ) {
    items.splice(0, 0, newItem);
    selection.select(0);

    await workItemFormService.setFieldValue(
      fieldNames.validationHistory,
      JSON.stringify(items.value)
    );

    const validationHist = await workItemFormService.getFieldValue(
      fieldNames.validationHistory,
      { returnOriginalValue: false }
    );

    await workItemFormService.save();
  }
};
