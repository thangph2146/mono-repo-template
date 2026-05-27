"use client"

import { useState } from "react"
import { BookOpen, Calendar, TrendingUp, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@ui/components/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs"
import { YearAveragesList } from "./year-averages-list"
import { TermAveragesList } from "./term-averages-list"
import { DetailedScoresList } from "./detailed-scores-list"
import type { DetailedScore, YearAverage, TermAverage } from "@/types/student-scores"

interface StudentScoresSectionProps {
  isActive?: boolean
  studentName?: string | null
  detailedScores?: DetailedScore[]
  isLoadingDetailed: boolean
  yearAverages?: YearAverage[]
  isLoadingYear: boolean
  termAverages?: TermAverage[]
  isLoadingTerm: boolean
}

export const StudentScoresSection = ({
  isActive = true,
  detailedScores,
  isLoadingDetailed,
  yearAverages,
  isLoadingYear,
  termAverages,
  isLoadingTerm,
}: StudentScoresSectionProps) => {
  const [activeTab, setActiveTab] = useState("detailed")

  if (!isActive) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>Vui lòng kích hoạt sinh viên để xem dữ liệu điểm số.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList variant="default" className="w-full">
        {[
          { value: "detailed", label: "Điểm chi tiết", icon: BookOpen },
          { value: "term", label: "Điểm học kỳ", icon: Calendar },
          { value: "year", label: "Điểm năm học", icon: TrendingUp },
        ].map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon className="size-3.5" />
            <span>{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-4">
        <TabsContent value="detailed">
          <DetailedScoresList scores={detailedScores} isLoading={isLoadingDetailed} />
        </TabsContent>
        <TabsContent value="term">
          <TermAveragesList averages={termAverages} isLoading={isLoadingTerm} />
        </TabsContent>
        <TabsContent value="year">
          <YearAveragesList averages={yearAverages} isLoading={isLoadingYear} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
