import * as SDK from "azure-devops-extension-sdk";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ListSelection, SimpleList } from "azure-devops-ui/List";
import { DetailsPanel, MasterPanel } from "azure-devops-ui/MasterDetails";
import {
  BaseMasterDetailsContext,
  IMasterDetailsContext,
  IMasterDetailsContextLayer,
  MasterDetailsContext,
} from "azure-devops-ui/MasterDetailsContext";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { showRootComponent } from "../Common";
import { IVerificationInfo, verificationHistory } from "./Data";
import { registerEvents } from "./EventHandling";
import "./MasterDetail.Example.css";
import { InitialDetailView } from "./WorkItemFormGroup.Details";
import { InitialMasterPanelContent } from "./WorkItemFormGroup.Master";

const initialPayload: IMasterDetailsContextLayer<
  IVerificationInfo,
  undefined
> = {
  key: "initial",
  masterPanelContent: {
    renderContent: (parentItem, initialSelectedMasterItem) => (
      <InitialMasterPanelContent
        initialSelectedMasterItem={initialSelectedMasterItem}
      />
    ),
    //renderHeader: () => <MasterPanelHeader title={"Validation History"} />,
    hideBackButton: true,
  },
  detailsContent: {
    renderContent: (item) => <InitialDetailView detailItem={item} />,
  },
  selectedMasterItem: new ObservableValue<IVerificationInfo>(
    verificationHistory[0]
  ),
  parentItem: undefined,
};

const masterDetailsContext: IMasterDetailsContext = new BaseMasterDetailsContext(
  initialPayload,
  () => {
    alert("Triggered onExit");
  }
);

export interface WorkItemFormGroupComponentState {
  eventContent: string[];
}
class WorkItemFormGroupComponent extends React.Component<
  {},
  WorkItemFormGroupComponentState
> {
  constructor(props: {}) {
    super(props);
    this.state = {
      eventContent: [],
    };
  }

  public componentDidMount() {
    SDK.init().then(() => {
      registerEvents(this);
    });
  }

  private selection = new ListSelection(true);

  public render(): JSX.Element {
    return (
      <MasterDetailsContext.Provider value={masterDetailsContext}>
        <div className="flex-row" style={{ display: "flex", width: "100%" }}>
          <MasterPanel className="master-example-panel" />
          <DetailsPanel />
        </div>
        <SimpleList
          itemProvider={new ArrayItemProvider<string>(this.state.eventContent)}
          selection={this.selection}
        />
      </MasterDetailsContext.Provider>
    );
  }
}

showRootComponent(<WorkItemFormGroupComponent />);
