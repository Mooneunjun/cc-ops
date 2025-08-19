"use client";

import React from "react";
import { MonthlyYearlyPivot } from "./monthly-yearly-pivot";
import { RecipientPivot } from "./recipient-pivot";

interface InsightsTabProps {
  filteredData: any[];
}

export function InsightsTab({ filteredData }: InsightsTabProps) {
  return (
    <div className="space-y-4">
      <MonthlyYearlyPivot filteredData={filteredData} />
      <RecipientPivot filteredData={filteredData} />
    </div>
  );
}
