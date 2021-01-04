export interface IVerificationInfo {
  verifiedBy: string;
  status: string;
  dateOfVerification: Date;
  details: string;
}

export const verificationHistory: IVerificationInfo[] = [
  {
    verifiedBy: "",
    status: "",
    dateOfVerification: new Date(),
    details: "",
  },

  /*{
    verifiedBy: "Byron Benitez <byron.benitez@vero-biotech.com>",
    status: "Passed",
    dateOfVerification: new Date(2020, 12, 22, 12, 0),
    details: "This validation item has passed, verified success",
  },
  {
    verifiedBy: "Byron Benitez <byron.benitez@vero-biotech.com>",
    status: "Failed",
    dateOfVerification: new Date(2020, 12, 21, 12, 0),
    details: "This validation item failed",
  },
  {
    verifiedBy: "Byron Benitez <byron.benitez@vero-biotech.com>",
    status: "Passed",
    dateOfVerification: new Date(2020, 12, 20, 12, 0),
    details: "This validation item has passed, verified!",
  },
  {
    verifiedBy: "Byron Benitez <byron.benitez@vero-biotech.com>",
    status: "Passed",
    dateOfVerification: new Date(2020, 12, 19, 12, 0),
    details: "This validation item has passed, verified!",
  },
  {
    verifiedBy: "Byron Benitez <byron.benitez@vero-biotech.com>",
    status: "Passed",
    dateOfVerification: new Date(2020, 12, 18, 12, 0),
    details: "This validation item has passed, verified!",
  },
  {
    verifiedBy: "Byron Benitez <byron.benitez@vero-biotech.com>",
    status: "Passed",
    dateOfVerification: new Date(2020, 12, 17, 12, 0),
    details: "This validation item has passed, verified!",
  },*/
];
