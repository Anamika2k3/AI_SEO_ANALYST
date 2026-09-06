import type { IndustryId } from "@/config/industries";

export interface IndustrySelection {
  industry: IndustryId;
  category?: string;
}
