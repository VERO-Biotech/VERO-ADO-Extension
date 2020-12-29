import { IObservableValue } from "azure-devops-ui/Core/Observable";
import {
  IListItemDetails,
  List,
  ListItem,
  ListSelection
} from "azure-devops-ui/List";
import {
  bindSelectionToObservable,
  MasterDetailsContext
} from "azure-devops-ui/MasterDetailsContext";
import {
  IStatusProps,
  Status,
  Statuses,
  StatusSize
} from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IVerificationInfo, verificationHistory } from "./Data";

const mapStatus = (verificationStatus: string): IStatusProps => {
  switch (verificationStatus) {
    case "Passed":
      return Statuses.Success;
    case "Failed":
      return Statuses.Failed;
  }
  // Return blank status if no mapping found
  return Statuses.Queued;
};

const renderInitialRow = (
  index: number,
  item: IVerificationInfo,
  details: IListItemDetails<IVerificationInfo>,
  key?: string
): JSX.Element => {
  return (
    <ListItem
      className="master-example-row"
      key={key || "list-item" + index}
      index={index}
      details={details}
    >
      <div className="master-example-row-content flex-row flex-center h-scroll-hidden">
        <Status
          {...mapStatus(item.status)}
          key={item.status.toLowerCase()}
          size={StatusSize.l}
          className="status-example flex-self-center "
        />
        <div
          className="flex-column text-ellipsis"
          style={{ marginLeft: "10px", padding: "10px 0px" }}
        >
          <Tooltip overflowOnly={true}>
            <div className="primary-text text-ellipsis">
              {item.status} - {item.dateOfVerification}
            </div>
          </Tooltip>
          <Tooltip overflowOnly={true}>
            <div className="primary-text text-ellipsis">{item.verifiedBy}</div>
          </Tooltip>
        </div>
      </div>
    </ListItem>
  );
};

export const InitialMasterPanelContent: React.FunctionComponent<{
  initialSelectedMasterItem: IObservableValue<IVerificationInfo>;
}> = (props) => {
  const [initialItemProvider] = React.useState(
    new ArrayItemProvider(verificationHistory)
  );
  const [initialSelection] = React.useState(
    new ListSelection({ selectOnFocus: false })
  );
  const masterDetailsContext = React.useContext(MasterDetailsContext);

  React.useEffect(() => {
    bindSelectionToObservable(
      initialSelection,
      initialItemProvider,
      props.initialSelectedMasterItem
    );
  });

  return (
    <List
      ariaLabel={"Validation history entries"}
      itemProvider={initialItemProvider}
      selection={initialSelection}
      renderRow={renderInitialRow}
      width="100%"
      onSelect={() => masterDetailsContext.setDetailsPanelVisbility(true)}
    />
  );
};
