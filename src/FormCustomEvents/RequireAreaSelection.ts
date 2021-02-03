import { IWorkItemLoadedArgs } from "azure-devops-extension-api/WorkItemTracking";
import { fieldNames, getWorkItemService } from "../Common";

export const requireAreaSelection = async (args: IWorkItemLoadedArgs) => {
  try {
    if (args.isNew && !args.isReadOnly) {
      const workItemService = await getWorkItemService();
      await workItemService.setFieldValue(fieldNames.areaPath, "");
    }
  } catch (err) {
    console.error("Error on Area Path selection rule: ", err);
  }
};
