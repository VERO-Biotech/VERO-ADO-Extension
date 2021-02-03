import { IWorkItemFieldChangedArgs } from "azure-devops-extension-api/WorkItemTracking";
import { fieldNames, getWorkItemService, workItemTypes } from "../Common";

export const taskParentValidation = () => {
  try {
    checkTaskForMissingParent();
  } catch (err) {
    console.error("Error checking for Task missing parent: ", err);
  }
};

export const taskParentValidationClearErrors = (
  args: IWorkItemFieldChangedArgs
) => {
  try {
    if (
      args.changedFields[fieldNames.parent] &&
      args.changedFields[fieldNames.parent] !== null
    ) {
      clearTaskMissingParentError();
    }
  } catch (err) {
    console.error("Error clearing missing parent messages: ", err);
  }
};

const checkTaskForMissingParent = async () => {
  // Set an error if we have a Task and the System.Parent value is null
  const workItemFormService = await getWorkItemService();
  const values = await getParentAndItemTypeValues();

  if (
    values[fieldNames.workItemType] === workItemTypes.task &&
    values[fieldNames.parent] === null
  ) {
    workItemFormService.setError(
      "Parent is required for a Task Work Item, please add a parent link in the Related Work section"
    );
  }
};

const clearTaskMissingParentError = async () => {
  // Clear the error that we set if the parent is set
  const workItemFormService = await getWorkItemService();
  const values = await getParentAndItemTypeValues();

  if (
    values[fieldNames.workItemType] === workItemTypes.task &&
    values[fieldNames.parent] !== null
  ) {
    workItemFormService.clearError();
  }
};

const getParentAndItemTypeValues = async () => {
  const workItemFormService = await getWorkItemService();

  return workItemFormService.getFieldValues(
    [fieldNames.parent, fieldNames.workItemType],
    { returnOriginalValue: false }
  );
};
