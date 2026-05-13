import { AboutPageContent } from "./about-page-content";
import {
  buildAgencyAboutMetadata,
  getAgencyAboutPath,
} from "../agency-seo.logic";

export const metadata = {
  ...buildAgencyAboutMetadata("en"),
  alternates: {
    canonical: getAgencyAboutPath("en"),
    languages: {
      de: getAgencyAboutPath("de"),
      en: getAgencyAboutPath("en"),
      "x-default": getAgencyAboutPath("de"),
    },
  },
};

export default function AboutPage() {
  return <AboutPageContent language="en" />;
}
