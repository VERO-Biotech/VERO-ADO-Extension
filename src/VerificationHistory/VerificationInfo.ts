export interface IVerificationInfo {
  verifiedBy: string;
  status: string;
  dateOfVerification: Date;
  details: string;
  build: string;
  dateAdded: Date;
  index: number;
}

export const emptyVerificationInfo: IVerificationInfo[] = [];
