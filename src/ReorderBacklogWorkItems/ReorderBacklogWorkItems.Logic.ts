import { getClient } from "azure-devops-extension-api";
import { CoreRestClient, TeamContext } from "azure-devops-extension-api/Core";
import {
  BacklogType,
  ReorderOperation,
  WorkRestClient,
} from "azure-devops-extension-api/Work";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

export interface Backlog {
  id: string;
  name: string;
}

export interface StateMapping {
  [workItemType: string]: string;
}

export interface GetWorkItemsParams {
  stateMapping: StateMapping;
  sortBy: string;
  sortDirection: string;
  project: string;
  team: string;
  workItemIds: number[];
}

const getTeamContext = (project: string, team: string): TeamContext => {
  return {
    projectId: "",
    project: project,
    teamId: "",
    team: team,
  };
};

export const getBacklogs = async (project: string, team: string) => {
  const workClient = getClient(WorkRestClient);
  const teamContext = getTeamContext(project, team);
  const allTeamBacklogs = await workClient.getBacklogs(teamContext);

  const backlogs = allTeamBacklogs
    .filter((x) => !x.isHidden && x.type !== BacklogType.Task)
    .map((x) => <Backlog>{ id: x.id, name: x.name });

  console.log("getBacklogs", backlogs);

  return backlogs;
};

export const getBoardColumns = async (
  project: string,
  team: string,
  backlog: string
) => {
  const workClient = getClient(WorkRestClient);
  const teamContext = getTeamContext(project, team);
  const board = await workClient.getBoard(teamContext, backlog);

  console.log("getBoard", board);

  const columns: Map<string, StateMapping> = new Map();

  board.columns.forEach((x) => columns.set(x.name, x.stateMappings));

  console.log(columns);

  return columns;
};

export const getTeams = async (project: string) => {
  const coreClient = getClient(CoreRestClient);
  const teams = await coreClient.getTeams(project, true);

  console.log("getTeams", teams);

  return teams.map((x) => x.name);
};

export const getBacklogWorkItems = async (
  project: string,
  team: string,
  backlogId: string
) => {
  const workClient = getClient(WorkRestClient);
  const teamContext = getTeamContext(project, team);

  const result = await workClient.getBacklogLevelWorkItems(
    teamContext,
    backlogId
  );

  console.log("getBacklogWorkItems", result);

  return result.workItems.map((x) => x.target.id);
};

export const getWorkItemsByState = async (params: GetWorkItemsParams) => {
  const stateWiql = Object.entries(params.stateMapping)
    .map(
      ([workItemType, state]) =>
        `([State] = '${state}' AND [System.WorkItemType] = '${workItemType}')`
    )
    .join(" OR ");

  const query = `
      SELECT [Id]
      FROM WorkItems
      WHERE ${stateWiql} AND [Id] IN (${params.workItemIds.join(",")})
      ORDER BY ${params.sortBy} ${params.sortDirection}
      `;
  return await getWorkItemsByWiql(query, params.project, params.team);
};

const getWorkItemsByWiql = async (
  query: string,
  project: string,
  team: string
) => {
  const workItemTrackingClient = getClient(WorkItemTrackingRestClient);

  const result = await workItemTrackingClient.queryByWiql(
    { query: query },
    project,
    team
  );

  console.log("Work Items", result.workItems);

  return result.workItems.map((x) => x.id);
};

export const reorderBacklogWorkItems = async (
  ids: number[],
  project: string,
  team: string
) => {
  const workClient = getClient(WorkRestClient);
  const context = getTeamContext(project, team);

  const reorderOp: ReorderOperation = {
    ids: ids,
    iterationPath: "",
    previousId: 0,
    nextId: -1,
    parentId: 0,
  };

  return await workClient.reorderBacklogWorkItems(reorderOp, context);
};
