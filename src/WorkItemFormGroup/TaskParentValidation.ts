import {
    IWorkItemFormService,
    WorkItemTrackingServiceIds
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";



export const checkParentIfTask = async () => {
    // Set an error if we have a Task and the System.Parent value is null
    const workItemFormService = await SDK.getService<IWorkItemFormService>(
        WorkItemTrackingServiceIds.WorkItemFormService
    );
    const values = await workItemFormService.getFieldValues(["System.Parent", "System.WorkItemType"]);

    if (values["System.WorkItemType"] === "Task" && values["System.Parent"] === null) {
        workItemFormService.setError("Parent is required for a Task Work Item, please add a parent link in the Related Work section");
    }
};

export const clearTaskMissingParentError = async () => {
    // Clear the error that we set if the parent is set
    const workItemFormService = await SDK.getService<IWorkItemFormService>(
        WorkItemTrackingServiceIds.WorkItemFormService
    );
    const values = await workItemFormService.getFieldValues(["System.Parent", "System.WorkItemType"]);

    if (values["System.WorkItemType"] === "Task" && values["System.Parent"] !== null) {
        workItemFormService.clearError();
    }
};