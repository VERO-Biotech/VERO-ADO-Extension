import { getClient } from "azure-devops-extension-api";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { IWorkItemFieldChangedArgs } from "azure-devops-extension-api/WorkItemTracking";
import { fieldNames, getProjectService, getWorkItemService } from "../Common";
import { reorderBacklogWorkItems } from "../ReorderBacklogWorkItems/ReorderBacklogWorkItems.Logic";

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
  const workItemIds = [id];

  try {
    await reorderBacklogWorkItems(
      workItemIds,
      project.name,
      teamProject.defaultTeam.name
    );
  } catch (err) {
    // If we don't have an update, then it could have failed because the team is not the default project team
    // In this case, retry while getting it from the area path
    const teamFromAreaPath = await getTeamFromAreaPath(id);

    if (teamFromAreaPath) {
      await reorderBacklogWorkItems(
        workItemIds,
        project.name,
        teamFromAreaPath
      );
    }
  }
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
