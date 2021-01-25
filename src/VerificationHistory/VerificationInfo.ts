export interface IVerificationInfo {
  verifiedBy: string;
  status: string;
  dateOfVerification: Date;
  details: string;
  build: string;
  dateAdded: Date;
}

export const emptyVerificationInfo: IVerificationInfo[] = [];
