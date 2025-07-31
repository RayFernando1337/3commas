import { ChartAreaInteractive } from "@/app/dashboard/chart-area-interactive"
import { DataTable } from "@/app/dashboard/data-table"
import { SectionCards } from "@/app/dashboard/section-cards"

import data from "./data.json"

export default function Page() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  )
}
