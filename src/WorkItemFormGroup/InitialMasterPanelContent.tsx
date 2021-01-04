import {
  IObservableValue,
  ObservableArray,
} from "azure-devops-ui/Core/Observable";
import {
  IListItemDetails,
  List,
  ListItem,
  ListSelection,
} from "azure-devops-ui/List";
import {
  bindSelectionToObservable,
  MasterDetailsContext,
} from "azure-devops-ui/MasterDetailsContext";
import {
  IStatusProps,
  Status,
  Statuses,
  StatusSize,
} from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as React from "react";
import { fieldNames, getWorkItemService, verificationStatus } from "./Common";
import { IVerificationInfo, verificationHistory } from "./Data";

const mapStatus = (status: string): IStatusProps => {
  switch (status) {
    case verificationStatus.passed:
      return Statuses.Success;
    case verificationStatus.failed:
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
              {item.status} - {item.dateOfVerification.toLocaleString()}
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

export const items = new ObservableArray(verificationHistory);
export const selection = new ListSelection({ selectOnFocus: false });

export const InitialMasterPanelContent: React.FunctionComponent<{
  initialSelectedMasterItem: IObservableValue<IVerificationInfo>;
}> = (props) => {
  const [initialItemProvider] = React.useState(items);
  const masterDetailsContext = React.useContext(MasterDetailsContext);

  React.useEffect(() => {
    bindSelectionToObservable(
      selection,
      initialItemProvider,
      props.initialSelectedMasterItem
    );
  });

  const getVerificationHistory = async () => {
    const workItemFormService = await getWorkItemService();
    const fieldValue = await workItemFormService.getFieldValue(
      fieldNames.validationHistory,
      { returnOriginalValue: false }
    );

    const jsonData = fieldValue
      .toString()
      .replace(/(?<!=)&quot;/g, '"')
      .replace(/["]?%5c%22["]?/g, '\\"');

    const itemsData: IVerificationInfo[] = JSON.parse(jsonData);

    itemsData.forEach((item) => {
      item.details = decodeURIComponent(item.details);
      item.dateOfVerification = new Date(item.dateOfVerification);
    });

    items.value = itemsData;
    selection.select(0);
  };

  React.useEffect(() => {
    getVerificationHistory();
  }, []);

  return (
    <List
      ariaLabel={"Validation history entries"}
      itemProvider={initialItemProvider}
      selection={selection}
      renderRow={renderInitialRow}
      width="100%"
      onSelect={() => {
        masterDetailsContext.setDetailsPanelVisbility(true);
      }}
    />
  );
};
