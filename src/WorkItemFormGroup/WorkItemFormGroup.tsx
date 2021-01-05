import * as SDK from "azure-devops-extension-sdk";
import {
  ObservableArray,
  ObservableValue
} from "azure-devops-ui/Core/Observable";
import { ListSelection } from "azure-devops-ui/List";
import { DetailsPanel, MasterPanel } from "azure-devops-ui/MasterDetails";
import {
  BaseMasterDetailsContext,
  IMasterDetailsContext,
  IMasterDetailsContextLayer,
  MasterDetailsContext
} from "azure-devops-ui/MasterDetailsContext";
import * as React from "react";
import { showRootComponent } from "../Common";
import { registerEvents } from "./EventHandling";
import { InitialDetailView } from "./InitialDetailView";
import { InitialMasterPanelContent } from "./InitialMasterPanelContent";
import "./MasterDetail.Example.css";
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
    emptyVerificationInfo[0]
  ),
  parentItem: undefined,
};

const masterDetailsContext: IMasterDetailsContext = new BaseMasterDetailsContext(
  initialPayload,
  () => {
    alert("Triggered onExit");
  }
);

const items = new ObservableArray(emptyVerificationInfo);
const selection = new ListSelection({ selectOnFocus: false });

class VerificationHistoryComponent extends React.Component<{}, {}> {
  public componentDidMount() {
    SDK.init().then(() => {
      registerEvents(this, items, selection);
    });
  }

  public render(): JSX.Element {
    return (
      <MasterDetailsContext.Provider value={masterDetailsContext}>
        <div className="flex-row" style={{ display: "flex", width: "100%" }}>
          <MasterPanel className="master-example-panel" />
          <DetailsPanel />
        </div>
      </MasterDetailsContext.Provider>
    );
  }
}

showRootComponent(<VerificationHistoryComponent />);
