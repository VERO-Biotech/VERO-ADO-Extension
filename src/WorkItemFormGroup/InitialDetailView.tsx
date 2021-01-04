import { Card } from "azure-devops-ui/Card";
import { ScreenSize } from "azure-devops-ui/Core/Util/Screen";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { MasterDetailsContext } from "azure-devops-ui/MasterDetailsContext";
import { Page } from "azure-devops-ui/Page";
import { ScreenSizeObserver } from "azure-devops-ui/Utilities/ScreenSize";
import * as React from "react";
import { IVerificationInfo } from "./Data";
import ReactHtmlParser from "react-html-parser";

export const InitialDetailView: React.FunctionComponent<{
  detailItem: IVerificationInfo;
}> = (props) => {
  const masterDetailsContext = React.useContext(MasterDetailsContext);
  const { detailItem } = props;

  return (
    <Page className="context-details">
      <ScreenSizeObserver>
        {(screenSizeProps: { screenSize: ScreenSize }) => {
          const showBackButton = screenSizeProps.screenSize <= ScreenSize.small;
          return (
            <Header
              description={`Verified by ${
                detailItem.verifiedBy
              } on ${detailItem.dateOfVerification.toLocaleString()}`}
              descriptionClassName="description-primary-text margin-bottom-8"
              title={detailItem.status}
              titleClassName="details-view-title margin-bottom-8"
              titleSize={TitleSize.Large}
              backButtonProps={
                showBackButton
                  ? {
                      onClick: () =>
                        masterDetailsContext.setDetailsPanelVisbility(false),
                    }
                  : undefined
              }
            />
          );
        }}
      </ScreenSizeObserver>
      <div className="page-content page-content-top">
        <Card>{ReactHtmlParser(detailItem.details)}</Card>
      </div>
    </Page>
  );
};
