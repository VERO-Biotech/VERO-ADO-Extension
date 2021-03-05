import * as SDK from "azure-devops-extension-sdk";
import { Button } from "azure-devops-ui/Button";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { FormItem } from "azure-devops-ui/FormItem";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Observer } from "azure-devops-ui/Observer";
import { Page } from "azure-devops-ui/Page";
import { RadioButton, RadioButtonGroup } from "azure-devops-ui/RadioButton";
import { GroupedItemProvider } from "azure-devops-ui/Utilities/GroupedItemProvider";
import * as React from "react";
import { fieldNames, getProjectService } from "../Common";
import { showRootComponent } from "../CommonReact";
import "./ReorderBacklogWorkItems.css";
import {
  Backlog,
  getBacklogs,
  getBacklogWorkItems,
  getBoardColumns,
  getTeams,
  getWorkItemsByState,
  reorderBacklogWorkItems,
  StateMapping,
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

  private teamsProvider = new GroupedItemProvider([], [], false);
  private backlogsProvider = new GroupedItemProvider([], [], false);
  private columnsProvider = new GroupedItemProvider([], [], false);

  constructor(prop: {} | Readonly<{}>) {
    super(prop);

    SDK.init().then(async () => {
      const projectService = await getProjectService();
      const projectInfo = await projectService.getProject();

      if (!projectInfo) {
        return;
      }
      this.project.value = projectInfo.name;

      await this.reloadTeams();
    });
  }

  public render(): JSX.Element {
    return (
      <Page className="reorder-items-page">
        <Header
          title="Reorder Board Work Items"
          titleSize={TitleSize.Large}
          className="header"
        />
        <div className="page-content">
          <div className="flex-column margin-vertical-8">
            <div className="flex-row margin-vertical-8">
              <FormItem label="Team">
                <Dropdown
                  ariaLabel="Basic"
                  className="example-dropdown"
                  placeholder="Select the Team that owns the Board"
                  items={this.teamsProvider}
                  onSelect={this.onSelectTeam}
                />
              </FormItem>
            </div>
            <div className="flex-row margin-vertical-8">
              <FormItem label="Board">
                <Dropdown
                  ariaLabel="Basic"
                  className="example-dropdown"
                  placeholder="Select a Team Board"
                  items={this.backlogsProvider}
                  onSelect={this.onSelectBacklog}
                />
              </FormItem>
            </div>
            <div className="flex-row margin-vertical-8">
              <FormItem label="Column">
                <Dropdown
                  ariaLabel="Basic"
                  className="example-dropdown"
                  placeholder="Select a Board Column to reorder"
                  items={this.columnsProvider}
                  onSelect={this.onSelectColumn}
                />
              </FormItem>
            </div>
            <div className="flex-row margin-vertical-8">
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
            <div className="flex-row margin-vertical-8">
              <Observer
                team={this.team}
                backlog={this.backlog}
                column={this.column}
              >
                {(props: {
                  team: string;
                  backlog: Backlog;
                  column: string;
                }) => {
                  return (
                    <Button
                      text="Reorder Work Items"
                      primary={true}
                      onClick={this.onReorderClick}
                      disabled={
                        props.team.length === 0 ||
                        props.backlog.id.length === 0 ||
                        props.column.length === 0
                      }
                    />
                  );
                }}
              </Observer>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  private onSelectTeam = async (
    event: React.SyntheticEvent<HTMLElement>,
    item: IListBoxItem<{}>
  ) => {
    this.team.value = item.text || "";
    await this.reloadBacklogs();
  };

  private onSelectBacklog = async (
    event: React.SyntheticEvent<HTMLElement>,
    item: IListBoxItem<{}>
  ) => {
    this.backlog.value = { id: item.id, name: item.text || "" };
    await this.reloadColumns();
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

    const backlogItems = await getBacklogWorkItems(
      this.project.value,
      this.team.value,
      this.backlog.value.id
    );

    if (backlogItems.length === 0) {
      return;
    }

    const workItemIds = await getWorkItemsByState({
      project: this.project.value,
      team: this.team.value,
      workItemIds: backlogItems,
      stateMapping: stateMapping,
      sortBy: fieldNames.createdDate,
      sortDirection: this.sortDirection.value,
    });

    if (workItemIds.length === 0) {
      return;
    }

    await reorderBacklogWorkItems(
      workItemIds,
      this.project.value,
      this.team.value
    );
  };

  private reloadTeams = async () => {
    const teams = await getTeams(this.project.value);
    this.team.value = "";

    this.teamsProvider.removeAll();
    this.backlogsProvider.removeAll();
    this.columnsProvider.removeAll();

    teams.forEach((x) => {
      this.teamsProvider.push({ id: x, text: x });
    });
  };

  private reloadBacklogs = async () => {
    const backlogs = await getBacklogs(this.project.value, this.team.value);
    this.backlog.value = { id: "", name: "" };

    this.backlogsProvider.removeAll();
    this.columnsProvider.removeAll();

    backlogs.forEach((x) => {
      this.backlogsProvider.push({ id: x.id, text: x.name });
    });
  };

  private reloadColumns = async () => {
    const boardCols = await getBoardColumns(
      this.project.value,
      this.team.value,
      this.backlog.value.name
    );

    this.boardColumns.value = boardCols;
    this.column.value = "";

    this.columnsProvider.removeAll();

    boardCols.forEach((_stateMapping, column) => {
      this.columnsProvider.push({ id: column, text: column });
    });
  };
}

showRootComponent(<ReorderBacklogWorkItems />);
