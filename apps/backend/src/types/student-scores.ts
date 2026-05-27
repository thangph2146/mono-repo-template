export interface YearAverage {
  yearStudy: string
  averageScore10: number | null
  averageScore4: number | null
  averageGatherScore10: number | null
  averageGatherScore4: number | null
  updateDate: string
}

export interface TermAverage {
  yearStudy: string
  termID: string
  orderTerm: number | null
  averageScore10: number | null
  averageScore4: number | null
  averageGatherScore10: number | null
  averageGatherScore4: number | null
  updateDate: string
}

export interface OverallAverage {
  averageScore10: number | null
  averageScore4: number | null
  averageGatherScore10: number | null
  averageGatherScore4: number | null
  isModified: boolean | null
  updateStaff: string | null
  updateDate: string
}

export interface DetailedScore {
  studyUnitID: string
  studyUnitAlias: string
  curriculumID: string
  curriculumName: string
  yearStudy: string
  termID: string
  classStudentID: string
  classStudentName: string
  studyProgramID: string
  studyProgramName: string
  studyTypeID: string
  studyTypeName: string
  mark10: number | null
  mark4: number | null
  markLetter: string | null
}

export type StudentYearAveragesResponse = YearAverage[]
export type StudentTermAveragesResponse = TermAverage[]
export type StudentOverallAverageResponse = OverallAverage
export type StudentScoresResponse = DetailedScore[]
