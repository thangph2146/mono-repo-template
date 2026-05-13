"use client";

import dynamic from "next/dynamic";
import { TypographyH1 } from "@ui/components/typography";
import { OverviewSection } from "./sub-sections/overview-section";
import { AboutHubSection } from "./sub-sections/about-hub-section";

const HistorySection = dynamic(() => import("./sub-sections/history-section").then((mod) => mod.HistorySection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});
const VisionMissionSection = dynamic(() => import("./sub-sections/vision-mission-section").then((mod) => mod.VisionMissionSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});
const CoreValuesSection = dynamic(() => import("./sub-sections/core-values-section").then((mod) => mod.CoreValuesSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});
const EducationPhilosophySection = dynamic(() => import("./sub-sections/education-philosophy-section").then((mod) => mod.EducationPhilosophySection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});
const OrganizationStructureSection = dynamic(() => import("./sub-sections/organization-structure-section").then((mod) => mod.OrganizationStructureSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});
const DepartmentsSection = dynamic(() => import("./sub-sections/departments-section").then((mod) => mod.DepartmentsSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});
const FacilitiesSection = dynamic(() => import("./sub-sections/facilities-section").then((mod) => mod.FacilitiesSection), {
  loading: () => <div className="min-h-[600px] w-full animate-pulse bg-muted/20" />,
});
const FacultyScientistsSection = dynamic(() => import("./sub-sections/faculty-scientists-section").then((mod) => mod.FacultyScientistsSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});
const LeadersSection = dynamic(() => import("./sub-sections/leaders-section").then((mod) => mod.LeadersSection), {
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-muted/20" />,
});

const aboutSections = [
  { key: "overview", Section: OverviewSection },
  { key: "about-hub", Section: AboutHubSection },
  { key: "history", Section: HistorySection },
  { key: "vision-mission", Section: VisionMissionSection },
  { key: "core-values", Section: CoreValuesSection },
  { key: "education-philosophy", Section: EducationPhilosophySection },
  { key: "organization-structure", Section: OrganizationStructureSection },
  { key: "departments", Section: DepartmentsSection },
  { key: "facilities", Section: FacilitiesSection },
  { key: "faculty-scientists", Section: FacultyScientistsSection },
  { key: "leaders", Section: LeadersSection },
] as const;

export const AboutClient = () => (
  <div className="isolate bg-background">
    <div className="sr-only">
      <TypographyH1>Giới thiệu về HUB - Trường Đại học Ngân hàng TP.HCM</TypographyH1>
    </div>
    {aboutSections.map(({ key, Section }) => (
      <Section key={key} />
    ))}
  </div>
);
