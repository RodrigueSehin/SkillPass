/** Dates are ISO calendar dates ("YYYY-MM-DD") so DTOs stay serializable across the server/client boundary. */
export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  organization: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  repositoryUrl: string | null;
  url: string | null;
  /** Names of the demonstrated skills. */
  skills: string[];
}

export interface ExperienceDTO {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  contractType: string | null;
  workMode: string | null;
  domain: string | null;
  startDate: string;
  endDate: string | null;
  skills: string[];
}

export type CertificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "EXPIRED";

export interface CertificationDTO {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  category: string | null;
  level: string | null;
  description: string | null;
  /** Original file name of the uploaded proof, if any (the file itself is served by the API). */
  documentName: string | null;
  documentSize: number | null;
  skills: string[];
  verificationStatus: CertificationStatus;
}
