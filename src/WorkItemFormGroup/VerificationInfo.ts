export interface IVerificationInfo {
  verifiedBy: string;
  status: string;
  dateOfVerification: Date;
  details: string;
  build: string;
}

export const emptyVerificationInfo: IVerificationInfo[] = [
  /*{
    verifiedBy: "",
    status: "",
    dateOfVerification: new Date(),
    details: "",
    build: "",
  },*/
];
