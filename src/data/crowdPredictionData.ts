export interface CrowdData {
    month: string;
    avgFootfall: number; // Last year's average daily footfall
    crowdLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    score: number; // 0-100 crowd density score
    majorEvents?: string[];
    weatherImpact: 'Positive' | 'Neutral' | 'Negative'; // How weather affected numbers last year
}

export interface DestinationCrowdProfile {
    id: string;
    name: string;
    region: string;
    yearlyVisitorCount: number;
    monthlyData: Record<string, CrowdData>;
}

export const crowdPredictionDatabase: DestinationCrowdProfile[] = [
    {
        id: 'DST001',
        name: 'Manali, Himachal Pradesh',
        region: 'North',
        yearlyVisitorCount: 3500000,
        monthlyData: {
            'January': { avgFootfall: 4500, crowdLevel: 'High', score: 85, majorEvents: ['New Year', 'Snow Season'], weatherImpact: 'Positive' },
            'February': { avgFootfall: 3200, crowdLevel: 'Moderate', score: 60, weatherImpact: 'Positive' },
            'March': { avgFootfall: 2800, crowdLevel: 'Low', score: 40, weatherImpact: 'Neutral' },
            'April': { avgFootfall: 5000, crowdLevel: 'High', score: 75, majorEvents: ['Summer Start'], weatherImpact: 'Neutral' },
            'May': { avgFootfall: 12000, crowdLevel: 'Critical', score: 95, majorEvents: ['Peak Summer'], weatherImpact: 'Neutral' },
            'June': { avgFootfall: 15000, crowdLevel: 'Critical', score: 98, majorEvents: ['Summer Vacation'], weatherImpact: 'Negative' },
            'July': { avgFootfall: 6000, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Negative' },
            'August': { avgFootfall: 5500, crowdLevel: 'Moderate', score: 50, weatherImpact: 'Negative' },
            'September': { avgFootfall: 4000, crowdLevel: 'Low', score: 35, weatherImpact: 'Neutral' },
            'October': { avgFootfall: 8000, crowdLevel: 'High', score: 70, majorEvents: ['Dussehra'], weatherImpact: 'Positive' },
            'November': { avgFootfall: 5000, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Neutral' },
            'December': { avgFootfall: 10000, crowdLevel: 'Critical', score: 92, majorEvents: ['Christmas', 'New Year'], weatherImpact: 'Positive' },
        }
    },
    {
        id: 'DST002',
        name: 'Goa (North)',
        region: 'West',
        yearlyVisitorCount: 8000000,
        monthlyData: {
            'January': { avgFootfall: 25000, crowdLevel: 'Critical', score: 95, majorEvents: ['New Year Aftermath', 'Sunburn'], weatherImpact: 'Positive' },
            'February': { avgFootfall: 18000, crowdLevel: 'High', score: 80, majorEvents: ['Carnival'], weatherImpact: 'Positive' },
            'March': { avgFootfall: 12000, crowdLevel: 'Moderate', score: 60, weatherImpact: 'Neutral' },
            'April': { avgFootfall: 8000, crowdLevel: 'Low', score: 40, weatherImpact: 'Negative' },
            'May': { avgFootfall: 6000, crowdLevel: 'Low', score: 30, weatherImpact: 'Negative' },
            'June': { avgFootfall: 4000, crowdLevel: 'Low', score: 20, weatherImpact: 'Negative' },
            'July': { avgFootfall: 5000, crowdLevel: 'Low', score: 25, weatherImpact: 'Negative' },
            'August': { avgFootfall: 6000, crowdLevel: 'Moderate', score: 45, majorEvents: ['Independence Day Long Weekend'], weatherImpact: 'Neutral' },
            'September': { avgFootfall: 9000, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Neutral' },
            'October': { avgFootfall: 15000, crowdLevel: 'High', score: 75, weatherImpact: 'Positive' },
            'November': { avgFootfall: 20000, crowdLevel: 'High', score: 85, majorEvents: ['IFFI'], weatherImpact: 'Positive' },
            'December': { avgFootfall: 35000, crowdLevel: 'Critical', score: 99, majorEvents: ['Christmas', 'New Year', 'Sunburn'], weatherImpact: 'Positive' },
        }
    },
    {
        id: 'DST003',
        name: 'Jaipur, Rajasthan',
        region: 'North-West',
        yearlyVisitorCount: 4200000,
        monthlyData: {
            'January': { avgFootfall: 15000, crowdLevel: 'Critical', score: 90, majorEvents: ['Literature Festival'], weatherImpact: 'Positive' },
            'February': { avgFootfall: 12000, crowdLevel: 'High', score: 80, weatherImpact: 'Positive' },
            'March': { avgFootfall: 10000, crowdLevel: 'High', score: 75, majorEvents: ['Holi'], weatherImpact: 'Neutral' },
            'April': { avgFootfall: 6000, crowdLevel: 'Moderate', score: 50, weatherImpact: 'Negative' },
            'May': { avgFootfall: 3000, crowdLevel: 'Low', score: 20, weatherImpact: 'Negative' },
            'June': { avgFootfall: 2500, crowdLevel: 'Low', score: 15, weatherImpact: 'Negative' },
            'July': { avgFootfall: 3500, crowdLevel: 'Low', score: 25, weatherImpact: 'Neutral' },
            'August': { avgFootfall: 5000, crowdLevel: 'Moderate', score: 45, majorEvents: ['Teej'], weatherImpact: 'Neutral' },
            'September': { avgFootfall: 6000, crowdLevel: 'Moderate', score: 50, weatherImpact: 'Neutral' },
            'October': { avgFootfall: 11000, crowdLevel: 'High', score: 80, weatherImpact: 'Positive' },
            'November': { avgFootfall: 18000, crowdLevel: 'Critical', score: 92, majorEvents: ['Diwali'], weatherImpact: 'Positive' },
            'December': { avgFootfall: 20000, crowdLevel: 'Critical', score: 95, majorEvents: ['Winter Holidays'], weatherImpact: 'Positive' },
        }
    },
    {
        id: 'DST004',
        name: 'Ooty, Tamil Nadu',
        region: 'South',
        yearlyVisitorCount: 2800000,
        monthlyData: {
            'January': { avgFootfall: 5000, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Positive' },
            'February': { avgFootfall: 6000, crowdLevel: 'Moderate', score: 60, weatherImpact: 'Positive' },
            'March': { avgFootfall: 7000, crowdLevel: 'High', score: 70, weatherImpact: 'Positive' },
            'April': { avgFootfall: 12000, crowdLevel: 'Critical', score: 90, majorEvents: ['Flower Show Prep'], weatherImpact: 'Neutral' },
            'May': { avgFootfall: 18000, crowdLevel: 'Critical', score: 98, majorEvents: ['Flower Show', 'Summer Festival'], weatherImpact: 'Neutral' },
            'June': { avgFootfall: 10000, crowdLevel: 'High', score: 75, weatherImpact: 'Neutral' },
            'July': { avgFootfall: 4000, crowdLevel: 'Low', score: 30, weatherImpact: 'Negative' },
            'August': { avgFootfall: 3500, crowdLevel: 'Low', score: 25, weatherImpact: 'Negative' },
            'September': { avgFootfall: 5000, crowdLevel: 'Moderate', score: 45, weatherImpact: 'Neutral' },
            'October': { avgFootfall: 8000, crowdLevel: 'High', score: 70, majorEvents: ['Puja Holidays'], weatherImpact: 'Neutral' },
            'November': { avgFootfall: 4500, crowdLevel: 'Low', score: 40, weatherImpact: 'Negative' },
            'December': { avgFootfall: 9000, crowdLevel: 'High', score: 80, majorEvents: ['Winter Break'], weatherImpact: 'Positive' },
        }
    },
    {
        id: 'DST005',
        name: 'Varanasi, Uttar Pradesh',
        region: 'North',
        yearlyVisitorCount: 6500000,
        monthlyData: {
            'January': { avgFootfall: 15000, crowdLevel: 'High', score: 75, weatherImpact: 'Positive' },
            'February': { avgFootfall: 18000, crowdLevel: 'High', score: 80, majorEvents: ['Shivratri'], weatherImpact: 'Positive' },
            'March': { avgFootfall: 16000, crowdLevel: 'High', score: 78, majorEvents: ['Holi'], weatherImpact: 'Neutral' },
            'April': { avgFootfall: 10000, crowdLevel: 'Moderate', score: 60, weatherImpact: 'Negative' },
            'May': { avgFootfall: 8000, crowdLevel: 'Moderate', score: 50, weatherImpact: 'Negative' },
            'June': { avgFootfall: 7000, crowdLevel: 'Low', score: 45, weatherImpact: 'Negative' },
            'July': { avgFootfall: 12000, crowdLevel: 'Moderate', score: 65, majorEvents: ['Sawan'], weatherImpact: 'Neutral' },
            'August': { avgFootfall: 14000, crowdLevel: 'High', score: 72, majorEvents: ['Sawan'], weatherImpact: 'Neutral' },
            'September': { avgFootfall: 10000, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Neutral' },
            'October': { avgFootfall: 20000, crowdLevel: 'Critical', score: 88, majorEvents: ['Durga Puja'], weatherImpact: 'Positive' },
            'November': { avgFootfall: 35000, crowdLevel: 'Critical', score: 100, majorEvents: ['Dev Deepawali'], weatherImpact: 'Positive' },
            'December': { avgFootfall: 22000, crowdLevel: 'Critical', score: 90, weatherImpact: 'Positive' },
        }
    },
    {
        id: 'DST006',
        name: 'Leh-Ladakh',
        region: 'North',
        yearlyVisitorCount: 550000,
        monthlyData: {
            'January': { avgFootfall: 100, crowdLevel: 'Low', score: 5, majorEvents: ['Chadar Trek'], weatherImpact: 'Negative' },
            'February': { avgFootfall: 150, crowdLevel: 'Low', score: 8, weatherImpact: 'Negative' },
            'March': { avgFootfall: 500, crowdLevel: 'Low', score: 15, weatherImpact: 'Negative' },
            'April': { avgFootfall: 2000, crowdLevel: 'Moderate', score: 40, weatherImpact: 'Neutral' },
            'May': { avgFootfall: 8000, crowdLevel: 'High', score: 75, weatherImpact: 'Positive' },
            'June': { avgFootfall: 12000, crowdLevel: 'Critical', score: 95, majorEvents: ['Hemis Festival'], weatherImpact: 'Positive' },
            'July': { avgFootfall: 10000, crowdLevel: 'Critical', score: 90, weatherImpact: 'Positive' },
            'August': { avgFootfall: 9000, crowdLevel: 'High', score: 85, weatherImpact: 'Positive' },
            'September': { avgFootfall: 6000, crowdLevel: 'Moderate', score: 60, weatherImpact: 'Neutral' },
            'October': { avgFootfall: 3000, crowdLevel: 'Low', score: 35, weatherImpact: 'Negative' },
            'November': { avgFootfall: 500, crowdLevel: 'Low', score: 10, weatherImpact: 'Negative' },
            'December': { avgFootfall: 200, crowdLevel: 'Low', score: 5, weatherImpact: 'Negative' },
        }
    },
    {
        id: 'DST007',
        name: 'Munnar, Kerala',
        region: 'South',
        yearlyVisitorCount: 1800000,
        monthlyData: {
            'January': { avgFootfall: 8000, crowdLevel: 'High', score: 80, weatherImpact: 'Positive' },
            'February': { avgFootfall: 7000, crowdLevel: 'High', score: 75, weatherImpact: 'Positive' },
            'March': { avgFootfall: 5000, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Neutral' },
            'April': { avgFootfall: 9000, crowdLevel: 'Critical', score: 88, weatherImpact: 'Neutral' },
            'May': { avgFootfall: 10000, crowdLevel: 'Critical', score: 92, weatherImpact: 'Neutral' },
            'June': { avgFootfall: 3000, crowdLevel: 'Low', score: 25, weatherImpact: 'Negative' },
            'July': { avgFootfall: 2500, crowdLevel: 'Low', score: 20, weatherImpact: 'Negative' },
            'August': { avgFootfall: 4000, crowdLevel: 'Moderate', score: 45, majorEvents: ['Nehru Trophy (Nearby)'], weatherImpact: 'Negative' },
            'September': { avgFootfall: 6000, crowdLevel: 'Moderate', score: 60, weatherImpact: 'Positive' },
            'October': { avgFootfall: 7500, crowdLevel: 'High', score: 78, weatherImpact: 'Positive' },
            'November': { avgFootfall: 6500, crowdLevel: 'Moderate', score: 65, weatherImpact: 'Positive' },
            'December': { avgFootfall: 9500, crowdLevel: 'Critical', score: 90, weatherImpact: 'Positive' },
        }
    },
    {
        id: 'DST008',
        name: 'Darjeeling, West Bengal',
        region: 'East',
        yearlyVisitorCount: 1200000,
        monthlyData: {
            'January': { avgFootfall: 4000, crowdLevel: 'Moderate', score: 50, weatherImpact: 'Negative' },
            'February': { avgFootfall: 3500, crowdLevel: 'Low', score: 40, weatherImpact: 'Negative' },
            'March': { avgFootfall: 6000, crowdLevel: 'High', score: 75, weatherImpact: 'Positive' },
            'April': { avgFootfall: 8000, crowdLevel: 'Critical', score: 88, weatherImpact: 'Positive' },
            'May': { avgFootfall: 9000, crowdLevel: 'Critical', score: 95, weatherImpact: 'Positive' },
            'June': { avgFootfall: 7000, crowdLevel: 'High', score: 80, weatherImpact: 'Neutral' },
            'July': { avgFootfall: 2000, crowdLevel: 'Low', score: 25, weatherImpact: 'Negative' },
            'August': { avgFootfall: 2500, crowdLevel: 'Low', score: 30, weatherImpact: 'Negative' },
            'September': { avgFootfall: 4000, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Neutral' },
            'October': { avgFootfall: 10000, crowdLevel: 'Critical', score: 98, majorEvents: ['Durga Puja'], weatherImpact: 'Positive' },
            'November': { avgFootfall: 5000, crowdLevel: 'Moderate', score: 60, weatherImpact: 'Positive' },
            'December': { avgFootfall: 4500, crowdLevel: 'Moderate', score: 55, weatherImpact: 'Positive' },
        }
    }
];
