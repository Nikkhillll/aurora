"use client";

import { useState } from "react";

import PageHeader from "@/components/station/PageHeader";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import { useStation } from "@/components/station/StationProvider";
import { SimulationChart } from "@/components/station/charts";
import type { Scenario } from "@/lib/simulationClient";

export default function SimulatePage() {
  const { key, station } = useStation();
  const [severity, setSeverity] = useState(30);
  const [scenario, setScenario] = useState<Scenario>("storm");

  return (
    <>
      <PageHeader
        title="What-if simulator"
        description={`Test a scenario against ${station.name}'s current conditions.`}
      />
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <WhatIfSimulator
            station={key}
            onSeverityChange={setSeverity}
            onScenarioChange={setScenario}
          />
        </div>
        <SimulationChart severity={severity} scenario={scenario} station={key} />
      </div>
    </>
  );
}