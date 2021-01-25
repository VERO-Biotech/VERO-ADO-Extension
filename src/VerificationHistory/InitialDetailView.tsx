import { Card } from "azure-devops-ui/Card";
import {
  CustomHeader,
  HeaderDescription,
  HeaderIcon,
  HeaderTitle,
  HeaderTitleArea,
  HeaderTitleRow,
  TitleSize,
} from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { Status, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import ReactHtmlParser from "react-html-parser";
import Moment from "react-moment";
import { dateFormat, mapStatus } from "../Common";
import { IVerificationInfo } from "./VerificationInfo";

export const InitialDetailView: React.FunctionComponent<{
  detailItem: IVerificationInfo;
}> = (props) => {
  const { detailItem } = props;

  const renderStatus = (className?: string) => {
    return (
      <Status
        {...mapStatus(detailItem.status)}
        className={className}
        size={StatusSize.l}
      />
    );
  };

  if (detailItem === undefined) {
    return <div></div>;
  } else {
    return (
      <Page className="context-details">
        <CustomHeader className="bolt-header-with-commandbar">
          <HeaderIcon
            className="bolt-table-status-icon-large"
            iconProps={{ render: renderStatus }}
            titleSize={TitleSize.Large}
          />
          <HeaderTitleArea>
            <HeaderTitleRow>
              <HeaderTitle
                className="text-ellipsis"
                titleSize={TitleSize.Large}
              >
                {detailItem.status}:{" "}
                {detailItem.build || "Build or version not available"}
              </HeaderTitle>
            </HeaderTitleRow>
            <HeaderDescription>
              Validated by {detailItem.verifiedBy.trim()}:{" "}
              <Moment
                date={detailItem.dateOfVerification}
                fromNow
                withTitle
                titleFormat={dateFormat}
              />
            </HeaderDescription>
          </HeaderTitleArea>
        </CustomHeader>

        <div className="page-content page-content-top">
          <Card
            titleProps={{
              text: "Verification of change",
              size: TitleSize.Large,
            }}
            contentProps={{ className: "card-body-description" }}
          >
            {ReactHtmlParser(detailItem.details)}
          </Card>
        </div>
      </Page>
    );
  }
};
