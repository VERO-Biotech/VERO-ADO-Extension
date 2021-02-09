import {
  IObservableArray,
  IObservableValue,
} from "azure-devops-ui/Core/Observable";
import {
  IListItemDetails,
  IListSelection,
  List,
  ListItem,
} from "azure-devops-ui/List";
import {
  bindSelectionToObservable,
  MasterDetailsContext,
} from "azure-devops-ui/MasterDetailsContext";
import { Status, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as React from "react";
import Moment from "react-moment";
import { dateFormat, mapStatus } from "../Common";
import { getInitialWorkItemUpdates } from "./VerificationHistory.Logic";
import { IVerificationInfo } from "./VerificationInfo";

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
              <strong>{item.status}:</strong>{" "}
              {item.build || "Build or version N/A"}
            </div>
          </Tooltip>
          <Tooltip overflowOnly={true}>
            <div className="primary-text text-ellipsis">
              {item.verifiedBy} -{" "}
              <Moment date={item.dateOfVerification} format={dateFormat} />
            </div>
          </Tooltip>
        </div>
      </div>
    </ListItem>
  );
};

type InitialMasterPanelProps = {
  initialSelectedMasterItem: IObservableValue<IVerificationInfo>;
  items: IObservableArray<IVerificationInfo>;
  selection: IListSelection;
};

export const InitialMasterPanelContent: React.FunctionComponent<InitialMasterPanelProps> = ({
  initialSelectedMasterItem,
  items,
  selection,
}) => {
  const masterDetailsContext = React.useContext(MasterDetailsContext);
  const [initialItemProvider] = React.useState(items);

  React.useEffect(() => {
    bindSelectionToObservable(
      selection,
      initialItemProvider,
      initialSelectedMasterItem
    );
  });

  React.useEffect(() => {
    try {
      getInitialWorkItemUpdates(items, selection);
    } catch (err) {
      console.error("Error getting the work item updates (initial load)", err);
    }
  }, []);

  return (
    <List
      ariaLabel={"Verification History entries"}
      itemProvider={initialItemProvider}
      selection={selection}
      renderRow={renderInitialRow}
      width="100%"
      onSelect={() => masterDetailsContext.setDetailsPanelVisbility(true)}
    />
  );
};
