import * as SDK from "azure-devops-extension-sdk";

export interface ICustomEventSettings {
  taskParentValidationOn: boolean;
  requireAreaSelectionOn: boolean;
}

export const getCustomEventSettings = (): ICustomEventSettings => {
  const config = SDK.getConfiguration().witInputs;

  // The following names are mapped to inputs that are defined in vss-extension.json
  return {
    taskParentValidationOn: config.EnableTaskOrphanCheck,
    requireAreaSelectionOn: config.RequireAreaSelection,
  };
};
