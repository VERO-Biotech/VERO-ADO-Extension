import { getClient } from "azure-devops-extension-api";
import { CoreRestClient, TeamContext } from "azure-devops-extension-api/Core";
import {
  ReorderOperation,
  WorkRestClient,
} from "azure-devops-extension-api/Work";
import { IWorkItemFieldChangedArgs } from "azure-devops-extension-api/WorkItemTracking";
import { fieldNames, getProjectService, getWorkItemService } from "../Common";

export const reorderNewWorkItem = async (args: IWorkItemFieldChangedArgs) => {
  if (args.changedFields[fieldNames.id]) {
    try {
      await reorderWorkItemToTheTop(args.id);
    } catch (err) {
      console.error(
        "Error reordering the new Work Item to the top of the Backlog",
        err
      );
    }
  }
};

const reorderWorkItemToTheTop = async (id: number) => {
  const projectService = await getProjectService();
  const project = await projectService.getProject();

  if (!project) {
    return;
  }

  const coreClient = getClient(CoreRestClient);
  const teamProject = await coreClient.getProject(project.id);

  try {
    const result = await reorderWorkItem(
      id,
      project.name,
      teamProject.defaultTeam.name
    );
  } catch (err) {
    // If we don't have an update, then it could have failed because the team is not the default project team
    // In this case, retry while getting it from the area path
    const teamFromAreaPath = await getTeamFromAreaPath(id);

    if (teamFromAreaPath) {
      const retryResult = await reorderWorkItem(
        id,
        project.name,
        teamFromAreaPath
      );
    }
  }
};

const reorderWorkItem = async (id: number, project: string, team: string) => {
  const workClient = getClient(WorkRestClient);

  const context: TeamContext = {
    projectId: "",
    project: project,
    teamId: "",
    team: team,
  };

  const reorderOp: ReorderOperation = {
    ids: [id],
    iterationPath: "",
    previousId: 0,
    nextId: -1,
    parentId: 0,
  };

  return await workClient.reorderBacklogWorkItems(reorderOp, context);
};

const teamInAreaRegex = /\\([^\\]+)\\?/g;

const getTeamFromAreaPath = async (id: number) => {
  const workItemService = await getWorkItemService();
  const areaPath = <string>await workItemService.getFieldValue(
    fieldNames.areaPath,
    {
      returnOriginalValue: false,
    }
  );

  const teamMatch = areaPath.match(teamInAreaRegex);

  if (teamMatch && teamMatch.length > 0) {
    return teamMatch[0];
  } else {
    return undefined;
  }
};
