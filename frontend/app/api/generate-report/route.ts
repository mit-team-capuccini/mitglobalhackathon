import { NextResponse } from 'next/server';
import { generateReportText } from '@/app/services/reportService'; // Use absolute path alias
import type { ReservoirLevel } from '@/app/components/GoogleMapCard'; // Import type

// MOCK DATA (mimicking data fetching for the API)
const mockEventTitle = "Valencia Flooding";
const mockEventDescription = "Severe flooding following heavy rainfall impacts multiple districts. Road closures, infrastructure damage, and high reservoir levels reported.";
const mockEventSeverity = "High";
const mockAffectedPopulation = 45000;
const mockInfraStatus = "Partially Degraded";
const mockInfraOperational = 18;
const mockInfraDamaged = 5;
const mockInfraOffline = 2;
const roadClosuresCount = 2;
const mockRoadClosureTypes = ['Construction', 'Event'];
const reservoirLevels: ReservoirLevel[] = [
  { reservoir_name: "Alarcón Reservoir", reservoir_location: [-1.874, 39.708], reservoir_levels: 43.5 },
  { reservoir_name: "Contreras Reservoir", reservoir_location: [-1.978, 39.406], reservoir_levels: 38.9 },
];
const mockAlerts = [
  "Flood warning for Turia river extended.",
  "Power outages reported in El Carmen district."
];
const articlesCount = 46; // Example count

export async function GET() {
  try {
    // In a real app, fetch necessary counts and data here instead of using mocks
    const reportData = {
      eventTitle: mockEventTitle,
      eventDescription: mockEventDescription,
      eventSeverity: mockEventSeverity,
      mockAffectedPopulation: mockAffectedPopulation,
      mockInfraStatus: mockInfraStatus,
      mockInfraOperational: mockInfraOperational,
      mockInfraDamaged: mockInfraDamaged,
      mockInfraOffline: mockInfraOffline,
      roadClosuresCount: roadClosuresCount,
      mockRoadClosureTypes: mockRoadClosureTypes,
      reservoirLevels: reservoirLevels,
      mockAlerts: mockAlerts,
      articlesCount: articlesCount
    };

    const reportText = generateReportText(reportData);

    return NextResponse.json({ report: reportText });

  } catch (e) {
    console.error(e);
    const error = e as Error;
    return NextResponse.json({ error: 'Failed to generate report', message: error.message }, { status: 500 });
  }
} 