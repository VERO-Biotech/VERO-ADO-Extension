export interface IVerificationInfo {
  verifiedBy: string;
  status: string;
  dateOfVerification: string;
  details: string;
}

export const verificationHistory: IVerificationInfo[] = [
  {
    verifiedBy: "Byron Benitez",
    status: "Passed",
    dateOfVerification: "12/22/2020 12:00 AM",
    details: "This validation item has passed, verified success",
  },
  {
    verifiedBy: "Byron Benitez",
    status: "Failed",
    dateOfVerification: "12/21/2020 12:00 AM",
    details: "This validation item failed",
  },
  {
    verifiedBy: "Byron Benitez",
    status: "Passed",
    dateOfVerification: "12/20/2020 12:00 AM",
    details: "This validation item has passed, verified!",
  },
  {
    verifiedBy: "Byron Benitez",
    status: "Passed",
    dateOfVerification: "12/19/2020 12:00 AM",
    details: "This validation item has passed, verified!",
  },
  {
    verifiedBy: "Byron Benitez",
    status: "Passed",
    dateOfVerification: "12/18/2020 12:00 AM",
    details: "This validation item has passed, verified!",
  },
  {
    verifiedBy: "Byron Benitez",
    status: "Passed",
    dateOfVerification: "12/17/2020 12:00 AM",
    details: "This validation item has passed, verified!",
  },
];
