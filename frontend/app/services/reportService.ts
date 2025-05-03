// import type { InfrastructurePlace, RoadClosure, ReservoirLevel } from './GoogleMapCard'; // Removed unused
// import type { SocialMediaPost } from './socialMediaTypes'; // Removed unused (assuming)
import type { ReservoirLevel } from '../components/GoogleMapCard'; // Re-added used import

interface ReportData {
    eventTitle: string;
    eventDescription: string;
    eventSeverity: string;
    mockAffectedPopulation: number;
    mockInfraStatus: string;
    mockInfraOperational: number;
    mockInfraDamaged: number;
    mockInfraOffline: number;
    roadClosuresCount: number;
    mockRoadClosureTypes: string[];
    reservoirLevels: ReservoirLevel[]; // Pass full level data
    mockAlerts: string[];
    articlesCount: number;
}

export function generateReportText(data: ReportData): string {
    // Find specific reservoir levels
    const alarconLevel = data.reservoirLevels.find(r => r.reservoir_name === "Alarcón Reservoir")?.reservoir_levels || 'N/A';
    const contrerasLevel = data.reservoirLevels.find(r => r.reservoir_name === "Contreras Reservoir")?.reservoir_levels || 'N/A';

    // Format recommendations
    const recommendations = [
        "Continue monitoring river levels and weather forecasts.",
        "Prioritize power restoration in affected districts.",
        "Assess critical infrastructure damage and plan repairs.",
        "Advise residents in low-lying areas to remain vigilant.",
        "Coordinate resource allocation for displaced persons."
    ];

    return `**${data.eventTitle} Event Summary - ${new Date().toLocaleDateString()}**\n\n` +
           `**Severity:** ${data.eventSeverity}\n\n` +
           `**Situation Overview:**\n${data.eventDescription}\n\n` +
           `**Key Metrics:**\n` +
           `- Est. Affected Population: ${data.mockAffectedPopulation.toLocaleString()}\n` +
           `- Infrastructure Status: ${data.mockInfraStatus} (Operational: ${data.mockInfraOperational}, Damaged: ${data.mockInfraDamaged}, Offline: ${data.mockInfraOffline})\n` +
           `- Active Road Closures: ${data.roadClosuresCount} (Types: ${data.mockRoadClosureTypes.join(', ') || 'N/A'})\n` +
           `- Reservoir Levels: Alarcón ${alarconLevel}%, Contreras ${contrerasLevel}%\n` +
           `- Active Alerts: ${data.mockAlerts.length}\n` +
           `- Related News Articles: ${data.articlesCount}\n\n` +
           `**Recommendations:**\n` +
           recommendations.map(rec => `- ${rec}`).join('\n') + '\n\n' +
           `*This is an auto-generated summary based on available data.*`;
} 