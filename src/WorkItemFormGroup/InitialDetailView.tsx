import { Card } from "azure-devops-ui/Card";
import { ScreenSize } from "azure-devops-ui/Core/Util/Screen";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { MasterDetailsContext } from "azure-devops-ui/MasterDetailsContext";
import { Page } from "azure-devops-ui/Page";
import { ScreenSizeObserver } from "azure-devops-ui/Utilities/ScreenSize";
import * as React from "react";
import ReactHtmlParser from "react-html-parser";
import Moment from "react-moment";
import { dateFormat } from "./Common";
import { IVerificationInfo } from "./VerificationInfo";

export const InitialDetailView: React.FunctionComponent<{
  detailItem: IVerificationInfo;
}> = (props) => {
  const { detailItem } = props;

  if (detailItem === undefined) {
    return <div></div>;
  } else {
    return (
      <Page className="context-details">
        <Header
          description={
            <div>
              Verified by {detailItem.verifiedBy} on{" "}
              <Moment
                date={detailItem.dateOfVerification}
                format={dateFormat}
              />
            </div>
          }
          descriptionClassName="description-primary-text margin-bottom-8"
          title={`${detailItem.status}: ${detailItem.build || ""}`}
          titleClassName="details-view-title margin-bottom-8"
          titleSize={TitleSize.Large}
        />
        <div className="page-content page-content-top">
          <Card contentProps={{ className: "card-body-description" }}>
            {ReactHtmlParser(detailItem.details)}
          </Card>
        </div>
      </Page>
    );
  }
};
