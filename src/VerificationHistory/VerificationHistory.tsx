import { IWorkItemFieldChangedArgs } from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import {
  IObservableArray,
  ObservableArray,
  ObservableValue
} from "azure-devops-ui/Core/Observable";
import { IListSelection, ListSelection } from "azure-devops-ui/List";
import { DetailsPanel, MasterPanel } from "azure-devops-ui/MasterDetails";
import {
  BaseMasterDetailsContext,
  IMasterDetailsContext,
  IMasterDetailsContextLayer,
  MasterDetailsContext
} from "azure-devops-ui/MasterDetailsContext";
import * as React from "react";
import { fieldNames } from "../Common";
import { showRootComponent } from "../CommonReact";
import { InitialDetailView } from "./InitialDetailView";
import { InitialMasterPanelContent } from "./InitialMasterPanelContent";
import "./VerificationHistory.css";
import { getVerificationHistory } from "./VerificationHistory.Logic";
import { emptyVerificationInfo, IVerificationInfo } from "./VerificationInfo";

const initialPayload: IMasterDetailsContextLayer<
  IVerificationInfo,
  undefined
> = {
  key: "initial",
  masterPanelContent: {
    renderContent: (parentItem, initialSelectedMasterItem) => (
      <InitialMasterPanelContent
        initialSelectedMasterItem={initialSelectedMasterItem}
        items={items}
        selection={selection}
      />
    ),
    hideBackButton: true,
  },
  detailsContent: {
    renderContent: (item) => <InitialDetailView detailItem={item} />,
  },
  selectedMasterItem: new ObservableValue<IVerificationInfo>(
    emptyVerificationInfo[0] // This is actually undefined
  ),
  parentItem: undefined,
};

const masterDetailsContext: IMasterDetailsContext = new BaseMasterDetailsContext(
  initialPayload,
  () => {
    alert("Triggered onExit");
  }
);

const registerEvents = (
  items: IObservableArray<IVerificationInfo>,
  selection: IListSelection
) => {
  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
        // onSave, revision gets updated
        if (args.changedFields[fieldNames.revision]) {
          getVerificationHistory(items, selection);
        }
      },
    };
  });
};

const readConfigValues = () => {
  const configVars = SDK.getConfiguration().witInputs;

  fieldNames.verificationHistory = configVars.VerificationHistory;
  fieldNames.verifiedBy = configVars.VerifiedBy;
  fieldNames.status = configVars.VerificationStatus;
  fieldNames.dateOfVerification = configVars.DateOfVerification;
  fieldNames.details = configVars.VerificationOfChange;
};

const items = new ObservableArray(emptyVerificationInfo);
const selection = new ListSelection({ selectOnFocus: false });

class VerificationHistoryComponent extends React.Component<{}, {}> {
  constructor(prop: {} | Readonly<{}>) {
    super(prop);
    
    SDK.init({ loaded: false }).then(() => {
      readConfigValues();
      registerEvents(items, selection);
    });
  }

  public render(): JSX.Element {
    return (
      <MasterDetailsContext.Provider value={masterDetailsContext}>
        <div className="flex-row" style={{ display: "flex", width: "100%" }}>
          <MasterPanel className="master-example-panel show-on-small-screens" />
          <DetailsPanel />
        </div>
      </MasterDetailsContext.Provider>
    );
  }
}

showRootComponent(<VerificationHistoryComponent />);
