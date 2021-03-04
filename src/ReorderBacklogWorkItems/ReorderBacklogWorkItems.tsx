import * as SDK from "azure-devops-extension-sdk";
import { Button } from "azure-devops-ui/Button";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { FormItem } from "azure-devops-ui/FormItem";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { RadioButton, RadioButtonGroup } from "azure-devops-ui/RadioButton";
import * as React from "react";
import { getProjectService, fieldNames } from "../Common";
import { showRootComponent } from "../CommonReact";
import {
  Backlog,
  StateMapping,
  getBacklogs,
  getBacklogWorkItems,
  getBoardColumns,
  getTeams,
  getWorkItemsByState,
  reorderBacklogWorkItems
} from "./ReorderBacklogWorkItems.Logic";

class ReorderBacklogWorkItems extends React.Component<{}, {}> {
  private team = new ObservableValue<string>("");
  private backlog = new ObservableValue<Backlog>({ id: "", name: "" });
  private column = new ObservableValue<string>("");
  private boardColumns = new ObservableValue<Map<string, StateMapping>>(
    new Map()
  );
  private project = new ObservableValue<string>("");
  private sortDirection = new ObservableValue<string>("asc");

  constructor(prop: {} | Readonly<{}>) {
    super(prop);

    SDK.init().then(async () => {
      const projectService = await getProjectService();
      const projectInfo = await projectService.getProject();

      if (!projectInfo) {
        return;
      }
      this.project.value = projectInfo.name;

      const teams = await getTeams(this.project.value);
      this.team.value = teams[1];

      const backlogs = await getBacklogs(this.project.value, this.team.value);
      this.backlog.value = backlogs[1];

      const boardCols = await getBoardColumns(
        this.project.value,
        this.team.value,
        this.backlog.value.name
      );

      this.boardColumns.value = boardCols;
      this.column.value = boardCols.keys().next().value;
    });
  }

  public render(): JSX.Element {
    return (
      <div className="flex-column margin-8">
        <div className="flex-row margin-8">
          <FormItem label="Team">
            <Dropdown
              ariaLabel="Basic"
              className="example-dropdown"
              placeholder="Select the Team that owns the Board"
              items={[
                { id: "ExtensionTest Team", text: "ExtensionTest Team" },
                { id: "Test", text: "Test" },
                { id: "Trauma Team", text: "Trauma Team" },
              ]}
              onSelect={this.onSelectTeam}
            />
          </FormItem>
        </div>
        <div className="flex-row margin-8">
          <FormItem label="Board">
            <Dropdown
              ariaLabel="Basic"
              className="example-dropdown"
              placeholder="Select a Team Board"
              items={[
                { id: "Microsoft.RequirementCategory", text: "Requirements2" },
                { id: "Microsoft.FeatureCategory", text: "Features" },
                { id: "Microsoft.EpicCategory", text: "Epics" },
              ]}
              onSelect={this.onSelectBacklog}
            />
          </FormItem>
        </div>
        <div className="flex-row margin-8">
          <FormItem label="Column">
            <Dropdown
              ariaLabel="Basic"
              className="example-dropdown"
              placeholder="Select a Board Column to Reorder"
              items={[
                { id: "Proposed", text: "Proposed" },
                { id: "Active", text: "Active" },
                { id: "Resolved", text: "Resolved" },
              ]}
              onSelect={this.onSelectColumn}
            />
          </FormItem>
        </div>
        <div className="flex-row margin-8">
          <RadioButtonGroup
            onSelect={(selectedId) =>
              (this.sortDirection.value = selectedId)
            }
            selectedButtonId={this.sortDirection}
            text={"Sort direction"}
          >
            <RadioButton id="asc" text="Ascending" key="asc" />
            <RadioButton id="desc" text="Descending" key="desc" />
          </RadioButtonGroup>
        </div>
        <div className="flex-row margin-8">
          <Button
            text="Reorder Work Items"
            primary={true}
            onClick={this.onReorderClick}
          />
        </div>
      </div>
    );
  }

  private onSelectTeam = (
    event: React.SyntheticEvent<HTMLElement>,
    item: IListBoxItem<{}>
  ) => {
    this.team.value = item.text || "";
  };

  private onSelectBacklog = (
    event: React.SyntheticEvent<HTMLElement>,
    item: IListBoxItem<{}>
  ) => {
    this.backlog.value = { id: item.id, name: item.text || "" };
  };

  private onSelectColumn = (
    event: React.SyntheticEvent<HTMLElement>,
    item: IListBoxItem<{}>
  ) => {
    this.column.value = item.text || "";
  };

  private onReorderClick = async () => {
    const stateMapping = this.boardColumns.value.get(this.column.value);

    if (!stateMapping) {
      return;
    }

    console.log("State mapping", stateMapping);

    const backlogItems = await getBacklogWorkItems(
      this.project.value,
      this.team.value,
      this.backlog.value.id
    );

    const workItemIds = await getWorkItemsByState({
      project: this.project.value,
      team: this.team.value,
      workItemIds: backlogItems,
      stateMapping: stateMapping,
      sortBy: fieldNames.createdDate,
      sortDirection: this.sortDirection.value,
    });

    console.log("Work items to Reorder", workItemIds);

    await reorderBacklogWorkItems(workItemIds, this.project.value, this.team.value);
  };
}

showRootComponent(<ReorderBacklogWorkItems />);
