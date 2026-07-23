import { db } from '../src/lib/db';

async function main() {
  console.log('🗑️  Deleting all existing data...');

  await db.suspect.deleteMany();
  await db.victim.deleteMany();
  await db.link.deleteMany();
  await db.fir.deleteMany();
  await db.person.deleteMany();
  await db.station.deleteMany();
  await db.prediction.deleteMany();

  console.log('✅ All existing data deleted.');

  // ─── Stations ───────────────────────────────────────────────
  console.log('📍 Creating stations...');
  const stations = await db.station.createMany({
    data: [
      { name: 'Koramangala Police Station', district: 'Bengaluru Urban', latitude: 12.9352, longitude: 77.6245, officers: 28 },
      { name: 'Whitefield Police Station', district: 'Bengaluru Urban', latitude: 12.9698, longitude: 77.7500, officers: 22 },
      { name: 'HSR Layout Police Station', district: 'Bengaluru Urban', latitude: 12.9116, longitude: 77.6389, officers: 24 },
      { name: 'JP Nagar Police Station', district: 'Bengaluru Urban', latitude: 12.8930, longitude: 77.5850, officers: 20 },
      { name: 'Bengaluru Rural SP Office', district: 'Bengaluru Rural', latitude: 12.9716, longitude: 77.5946, officers: 15 },
      { name: 'Mysuru City Police Station', district: 'Mysuru', latitude: 12.2958, longitude: 76.6394, officers: 32 },
      { name: 'Hubballi-Dharwad Police Commissionerate', district: 'Hubballi-Dharwad', latitude: 15.3647, longitude: 75.1240, officers: 35 },
      { name: 'Mangaluru City Police Station', district: 'Mangaluru', latitude: 12.9141, longitude: 74.8560, officers: 26 },
    ],
  });
  console.log(`  Created ${stations.count} stations.`);

  // ─── Persons ────────────────────────────────────────────────
  console.log('👤 Creating persons...');
  const personData = [
    { name: 'Ravi Shankar Gupta', age: 34, address: 'No. 42, 4th Cross, Koramangala 5th Block, Bengaluru', phone: '+91-9845012345', aadhaar: '5678-9012-3456' },
    { name: 'Priya Venkatesh', age: 28, address: 'Flat 301, Prestige Shantiniketan, Whitefield, Bengaluru', phone: '+91-9886023456', aadhaar: '6789-0123-4567' },
    { name: 'Mohammed Irfan Ali', age: 42, address: 'No. 78, Circle Mysore Road, Bengaluru', phone: '+91-9745034567', aadhaar: '7890-1234-5678' },
    { name: 'Kiran Naidu', age: 26, address: '2nd Floor, HSR Layout Sector 2, Bengaluru', phone: '+91-9664045678', aadhaar: '8901-2345-6789' },
    { name: 'Lakshmi Devi Sharma', age: 55, address: 'No. 15, JP Nagar 7th Phase, Bengaluru', phone: '+91-9823056789', aadhaar: '9012-3456-7890' },
    { name: 'Suresh Babu Reddy', age: 38, address: 'D.No. 3-56, Anekal Taluk, Bengaluru Rural', phone: '+91-9445067890', aadhaar: '0123-4567-8901' },
    { name: 'Anand Kumar Mehta', age: 31, address: 'Plot 12, Gokulam 3rd Stage, Mysuru', phone: '+91-9866078901', aadhaar: '1234-5678-9012' },
    { name: 'Geetha Narasimha', age: 45, address: 'No. 89, Sayyaji Rao Road, Mysuru', phone: '+91-9789089012', aadhaar: '2345-6789-0123' },
    { name: 'Prabhakar Joshi', age: 50, address: 'Vidyanagar, Hubballi-580030', phone: '+91-9484090123', aadhaar: '3456-7890-1234' },
    { name: 'Farooq Ahmed Sheikh', age: 29, address: 'No. 23, Cutchery Road, Mangaluru', phone: '+91-9745001234', aadhaar: '4567-8901-2345' },
    { name: 'Deepa Rajesh Kumar', age: 33, address: 'Navalur Layout, Shivamogga', phone: '+91-9886012345', aadhaar: '5678-9012-1234' },
    { name: 'Vikram Singh Rathore', age: 37, address: 'Fort Road, Belagavi-590001', phone: '+91-9664023456', aadhaar: '6789-0123-1234' },
    { name: 'Nandini Prasad', age: 24, address: 'MG Road, Bengaluru-560001', phone: '+91-9823034567', aadhaar: '7890-1234-1234' },
    { name: 'Arjun Mahadevappa', age: 40, address: 'Kuvempu Nagar, Shivamogga-577201', phone: '+91-9445045678', aadhaar: '8901-2345-1234' },
    { name: 'Reshma Begum', age: 27, address: 'Hampankatta, Mangaluru-575001', phone: '+91-9866056789', aadhaar: '9012-3456-1234' },
    { name: 'Karthik Raman', age: 35, address: 'Jayanagar 4th Block, Bengaluru', phone: '+91-9789067890', aadhaar: '0123-4567-2345' },
    { name: 'Sunitha Krishnamurthy', age: 48, address: 'Basavanagudi, Bengaluru-560004', phone: '+91-9484078901', aadhaar: '1234-5678-2345' },
  ];

  const persons: Record<string, string> = {};
  for (const p of personData) {
    const created = await db.person.create({ data: p });
    persons[p.name] = created.id;
  }
  console.log(`  Created ${personData.length} persons.`);

  // ─── FIRs ────────────────────────────────────────────────────
  console.log('📋 Creating FIRs...');
  const firData = [
    {
      firNumber: 'FIR/BLR/KRM/2024/001',
      date: new Date('2024-01-15'),
      district: 'Bengaluru Urban', station: 'Koramangala Police Station',
      crimeType: 'Theft', description: 'Burglary at a residence in Koramangala 5th Block during nighttime. Gold jewelry worth ₹8.5 lakhs and cash ₹45,000 stolen. Entry through rear window. Fingerprints recovered from window sill.',
      status: 'Open', severity: 'High', latitude: 12.9352, longitude: 77.6245,
    },
    {
      firNumber: 'FIR/BLR/WF/2024/002',
      date: new Date('2024-01-22'),
      district: 'Bengaluru Urban', station: 'Whitefield Police Station',
      crimeType: 'Vehicle Theft', description: 'Honda City sedan (KA-05-MX-1234) stolen from apartment parking in Whitefield between 11 PM and 6 AM. CCTV footage shows two suspects.',
      status: 'Closed', severity: 'Medium', latitude: 12.9698, longitude: 77.7500,
    },
    {
      firNumber: 'FIR/BLR/HSR/2024/003',
      date: new Date('2024-02-03'),
      district: 'Bengaluru Urban', station: 'HSR Layout Police Station',
      crimeType: 'Cybercrime', description: 'Online UPI fraud victim lost ₹2.3 lakhs through fake lottery scheme. Multiple transactions made over 3 days before victim realized.',
      status: 'Under Investigation', severity: 'Medium', latitude: 12.9116, longitude: 77.6389,
    },
    {
      firNumber: 'FIR/BLR/JPN/2024/004',
      date: new Date('2024-02-10'),
      district: 'Bengaluru Urban', station: 'JP Nagar Police Station',
      crimeType: 'Chain Snatching', description: 'Gold chain worth ₹1.2 lakhs snatched by bike-borne miscreants near JP Nagar bus stand at 8:30 PM. Victim sustained minor injuries.',
      status: 'Open', severity: 'Low', latitude: 12.8930, longitude: 77.5850,
    },
    {
      firNumber: 'FIR/BLR/KRM/2024/005',
      date: new Date('2024-02-18'),
      district: 'Bengaluru Urban', station: 'Koramangala Police Station',
      crimeType: 'Assault', description: 'Assault on a software engineer near Forum Mall following a road rage incident. Victim hospitalized with fractures. Two accused arrested.',
      status: 'Closed', severity: 'High', latitude: 12.9352, longitude: 77.6245,
    },
    {
      firNumber: 'FIR/BLR-RURAL/2024/006',
      date: new Date('2024-03-01'),
      district: 'Bengaluru Rural', station: 'Bengaluru Rural SP Office',
      crimeType: 'Drug Trafficking', description: 'Narcotics seizure of 15 kg ganja and 500 gm MDMA from a farmhouse in Anekal Taluk. Three persons arrested. Vehicle impounded.',
      status: 'Closed', severity: 'Critical', latitude: 12.9716, longitude: 77.5946,
    },
    {
      firNumber: 'FIR/BLR/WF/2024/007',
      date: new Date('2024-03-12'),
      district: 'Bengaluru Urban', station: 'Whitefield Police Station',
      crimeType: 'Robbery', description: 'Armed robbery at a petrol bunk on Whitefield-Hoskote road. ₹3.2 lakhs in cash looted. Security guard injured. Three armed assailants.',
      status: 'Open', severity: 'Critical', latitude: 12.9698, longitude: 77.7500,
    },
    {
      firNumber: 'FIR/MYS/2024/008',
      date: new Date('2024-03-20'),
      district: 'Mysuru', station: 'Mysuru City Police Station',
      crimeType: 'Murder', description: 'Murder of a businessman in Gokulam area. Body found with multiple stab wounds. Business rivalry suspected. Forensic evidence collected.',
      status: 'Under Investigation', severity: 'Critical', latitude: 12.2958, longitude: 76.6394,
    },
    {
      firNumber: 'FIR/BLR/HSR/2024/009',
      date: new Date('2024-04-05'),
      district: 'Bengaluru Urban', station: 'HSR Layout Police Station',
      crimeType: 'Fraud', description: 'Real estate fraud where accused sold same plot to multiple buyers. Total fraud amount estimated at ₹1.5 crores. Seven victims identified.',
      status: 'Under Investigation', severity: 'High', latitude: 12.9116, longitude: 77.6389,
    },
    {
      firNumber: 'FIR/HBL/2024/010',
      date: new Date('2024-04-15'),
      district: 'Hubballi-Dharwad', station: 'Hubballi-Dharwad Police Commissionerate',
      crimeType: 'Theft', description: 'Theft of copper wiring and electrical equipment from under-construction site in Vidyanagar worth ₹12 lakhs.',
      status: 'Open', severity: 'Medium', latitude: 15.3647, longitude: 75.1240,
    },
    {
      firNumber: 'FIR/MNG/2024/011',
      date: new Date('2024-04-22'),
      district: 'Mangaluru', station: 'Mangaluru City Police Station',
      crimeType: 'Cybercrime', description: 'Credit card cloning fraud at multiple POS terminals in Mangaluru city. 42 victims identified. Total loss ₹28 lakhs.',
      status: 'Open', severity: 'High', latitude: 12.9141, longitude: 74.8560,
    },
    {
      firNumber: 'FIR/BLR/KRM/2024/012',
      date: new Date('2024-05-03'),
      district: 'Bengaluru Urban', station: 'Koramangala Police Station',
      crimeType: 'Kidnapping', description: 'Kidnapping of a 7-year-old child from school bus stop in Koramangala. Ransom demand of ₹50 lakhs received. Anti-terrorism squad alerted.',
      status: 'Under Investigation', severity: 'Critical', latitude: 12.9352, longitude: 77.6245,
    },
    {
      firNumber: 'FIR/BLR/WF/2024/013',
      date: new Date('2024-05-10'),
      district: 'Bengaluru Urban', station: 'Whitefield Police Station',
      crimeType: 'Burglary', description: 'Series of burglaries in ITPL area apartments. 6 apartments targeted in 2 weeks. Total theft ₹18 lakhs including electronics and jewelry.',
      status: 'Open', severity: 'High', latitude: 12.9698, longitude: 77.7500,
    },
    {
      firNumber: 'FIR/SHM/2024/014',
      date: new Date('2024-05-18'),
      district: 'Shivamogga', station: 'Mangaluru City Police Station',
      crimeType: 'Assault', description: 'Group assault during a temple festival in Shivamogga. Three persons seriously injured. Communal tension reported. Section 144 imposed.',
      status: 'Closed', severity: 'High', latitude: 13.9299, longitude: 75.5726,
    },
    {
      firNumber: 'FIR/BLR/JPN/2024/015',
      date: new Date('2024-05-25'),
      district: 'Bengaluru Urban', station: 'JP Nagar Police Station',
      crimeType: 'Theft', description: 'Laptop and mobile phones stolen from co-working space in JP Nagar during lunch hours. 4 devices worth ₹2.8 lakhs.',
      status: 'Closed', severity: 'Low', latitude: 12.8930, longitude: 77.5850,
    },
    {
      firNumber: 'FIR/BLG/2024/016',
      date: new Date('2024-06-02'),
      district: 'Belagavi', station: 'Hubballi-Dharwad Police Commissionerate',
      crimeType: 'Robbery', description: 'Dacoity at a jewelry shop in Belagavi Fort area. Loot worth ₹45 lakhs. 5 armed robbers. One robber injured in exchange of fire.',
      status: 'Under Investigation', severity: 'Critical', latitude: 15.8522, longitude: 74.4985,
    },
    {
      firNumber: 'FIR/MYS/2024/017',
      date: new Date('2024-06-10'),
      district: 'Mysuru', station: 'Mysuru City Police Station',
      crimeType: 'Vehicle Theft', description: 'Royal Enfield Bullet (KA-09-MM-5678) and TVS Apache (KA-19-NR-9012) stolen from Mysore palace parking during Dasara event.',
      status: 'Open', severity: 'Low', latitude: 12.2958, longitude: 76.6394,
    },
    {
      firNumber: 'FIR/BLR/HSR/2024/018',
      date: new Date('2024-06-15'),
      district: 'Bengaluru Urban', station: 'HSR Layout Police Station',
      crimeType: 'Cybercrime', description: 'Phishing attack targeting senior citizens in HSR Layout. 12 victims collectively lost ₹45 lakhs through fake banking URLs.',
      status: 'Open', severity: 'High', latitude: 12.9116, longitude: 77.6389,
    },
    {
      firNumber: 'FIR/BLR-RURAL/2024/019',
      date: new Date('2024-06-22'),
      district: 'Bengaluru Rural', station: 'Bengaluru Rural SP Office',
      crimeType: 'Fraud', description: 'Agricultural loan fraud involving fake land documents. Syndicate operated from Bengaluru Rural district. 23 farmers affected, ₹3.2 crores.',
      status: 'Under Investigation', severity: 'Critical', latitude: 12.9716, longitude: 77.5946,
    },
    {
      firNumber: 'FIR/HBL/2024/020',
      date: new Date('2024-07-01'),
      district: 'Hubballi-Dharwad', station: 'Hubballi-Dharwad Police Commissionerate',
      crimeType: 'Assault', description: 'Assault on a journalist covering local corruption story. Victim admitted to KIMS hospital. Press association protests.',
      status: 'Open', severity: 'High', latitude: 15.3647, longitude: 75.1240,
    },
    {
      firNumber: 'FIR/MNG/2024/021',
      date: new Date('2024-07-10'),
      district: 'Mangaluru', station: 'Mangaluru City Police Station',
      crimeType: 'Murder', description: 'Honor killing in Mangaluru. Inter-caste couple attacked. Husband killed, wife critically injured. Three family members arrested.',
      status: 'Closed', severity: 'Critical', latitude: 12.9141, longitude: 74.8560,
    },
    {
      firNumber: 'FIR/BLR/KRM/2024/022',
      date: new Date('2024-07-18'),
      district: 'Bengaluru Urban', station: 'Koramangala Police Station',
      crimeType: 'Fraud', description: 'Cryptocurrency investment scam through Telegram group. 85 investors from Bengaluru defrauded of ₹12 crores. Foreign links suspected.',
      status: 'Under Investigation', severity: 'Critical', latitude: 12.9352, longitude: 77.6245,
    },
    {
      firNumber: 'FIR/BLR/WF/2024/023',
      date: new Date('2024-07-25'),
      district: 'Bengaluru Urban', station: 'Whitefield Police Station',
      crimeType: 'Chain Snatching', description: 'Two chain snatching incidents in ITPL vicinity within 24 hours. Same modus operandi - bike-borne, helmet-clad suspects.',
      status: 'Open', severity: 'Medium', latitude: 12.9698, longitude: 77.7500,
    },
    {
      firNumber: 'FIR/SHM/2024/024',
      date: new Date('2024-08-02'),
      district: 'Shivamogga', station: 'Mangaluru City Police Station',
      crimeType: 'Theft', description: 'Temple idol theft from ancient Venkataramana temple in Shivamogga. 12th-century bronze idol worth ₹5 crores. Heritage crime squad involved.',
      status: 'Open', severity: 'High', latitude: 13.9299, longitude: 75.5726,
    },
    {
      firNumber: 'FIR/BLR/JPN/2024/025',
      date: new Date('2024-08-10'),
      district: 'Bengaluru Urban', station: 'JP Nagar Police Station',
      crimeType: 'Drug Trafficking', description: 'Inter-state drug trafficking network busted. 2 kg heroin seized from a flat in JP Nagar. Three arrested with Nigerian national.',
      status: 'Closed', severity: 'Critical', latitude: 12.8930, longitude: 77.5850,
    },
    {
      firNumber: 'FIR/BLR/KRM/2024/026',
      date: new Date('2024-08-15'),
      district: 'Bengaluru Urban', station: 'Koramangala Police Station',
      crimeType: 'Burglary', description: 'Office break-in at a tech startup in Koramangala. Servers and laptops worth ₹25 lakhs stolen. Data breach suspected.',
      status: 'Under Investigation', severity: 'High', latitude: 12.9352, longitude: 77.6245,
    },
    {
      firNumber: 'FIR/MYS/2024/027',
      date: new Date('2024-08-22'),
      district: 'Mysuru', station: 'Mysuru City Police Station',
      crimeType: 'Cybercrime', description: 'Social media blackmail ring targeting college students in Mysuru. 15 victims. ₹8 lakhs extorted through morphed photographs.',
      status: 'Open', severity: 'High', latitude: 12.2958, longitude: 76.6394,
    },
    {
      firNumber: 'FIR/BLR/HSR/2024/028',
      date: new Date('2024-09-01'),
      district: 'Bengaluru Urban', station: 'HSR Layout Police Station',
      crimeType: 'Robbery', description: 'ATM robbery at HSR Layout BDA complex. CCTV tampered. Cash cassette stolen. Estimated loss ₹12 lakhs.',
      status: 'Open', severity: 'High', latitude: 12.9116, longitude: 77.6389,
    },
    {
      firNumber: 'FIR/HBL/2024/029',
      date: new Date('2024-09-10'),
      district: 'Hubballi-Dharwad', station: 'Hubballi-Dharwad Police Commissionerate',
      crimeType: 'Vehicle Theft', description: 'Luxury car theft ring busted. 4 stolen cars recovered from Dharwad industrial area. Interstate gang of 5 members arrested.',
      status: 'Closed', severity: 'High', latitude: 15.3647, longitude: 75.1240,
    },
    {
      firNumber: 'FIR/BLR-RURAL/2024/030',
      date: new Date('2024-09-18'),
      district: 'Bengaluru Rural', station: 'Bengaluru Rural SP Office',
      crimeType: 'Kidnapping', description: 'Kidnapping of a minor girl from Anekal village. Child recovered within 48 hours from neighboring district. Accused known to family.',
      status: 'Closed', severity: 'Critical', latitude: 12.9716, longitude: 77.5946,
    },
    {
      firNumber: 'FIR/MNG/2024/031',
      date: new Date('2024-09-25'),
      district: 'Mangaluru', station: 'Mangaluru City Police Station',
      crimeType: 'Theft', description: 'Shoplifting ring at City Centre Mall, Mangaluru. Luxury goods worth ₹15 lakhs stolen over 2 months using diversion tactics.',
      status: 'Under Investigation', severity: 'Medium', latitude: 12.9141, longitude: 74.8560,
    },
    {
      firNumber: 'FIR/BLR/KRM/2024/032',
      date: new Date('2024-10-02'),
      district: 'Bengaluru Urban', station: 'Koramangala Police Station',
      crimeType: 'Assault', description: 'Drunken brawl at a pub in Koramangala escalated into stabbing. One person critically injured, two arrested on the spot.',
      status: 'Closed', severity: 'Medium', latitude: 12.9352, longitude: 77.6245,
    },
    {
      firNumber: 'FIR/BLG/2024/033',
      date: new Date('2024-10-10'),
      district: 'Belagavi', station: 'Hubballi-Dharwad Police Commissionerate',
      crimeType: 'Fraud', description: 'Government job recruitment scam in Belagavi. Fake RTO officer collected ₹50,000 each from 200 candidates. Total ₹1 crore.',
      status: 'Under Investigation', severity: 'High', latitude: 15.8522, longitude: 74.4985,
    },
    {
      firNumber: 'FIR/BLR/WF/2024/034',
      date: new Date('2024-10-15'),
      district: 'Bengaluru Urban', station: 'Whitefield Police Station',
      crimeType: 'Cybercrime', description: 'Ransomware attack on a healthcare startup in Whitefield. Patient data encrypted. Bitcoin ransom of 5 BTC demanded.',
      status: 'Open', severity: 'Critical', latitude: 12.9698, longitude: 77.7500,
    },
    {
      firNumber: 'FIR/SHM/2024/035',
      date: new Date('2024-10-22'),
      district: 'Shivamogga', station: 'Mangaluru City Police Station',
      crimeType: 'Drug Trafficking', description: 'MDMA lab raided in Shivamogga rural area. Equipment and chemicals seized. 2 kg synthetic drugs recovered. Two arrested.',
      status: 'Closed', severity: 'Critical', latitude: 13.9299, longitude: 75.5726,
    },
    {
      firNumber: 'FIR/BLR/JPN/2024/036',
      date: new Date('2024-10-28'),
      district: 'Bengaluru Urban', station: 'JP Nagar Police Station',
      crimeType: 'Burglary', description: 'Daytime burglary at a house in JP Nagar 6th Phase while occupants were at work. Jewelry and cash worth ₹4 lakhs.',
      status: 'Open', severity: 'Medium', latitude: 12.8930, longitude: 77.5850,
    },
    {
      firNumber: 'FIR/MYS/2024/037',
      date: new Date('2024-11-05'),
      district: 'Mysuru', station: 'Mysuru City Police Station',
      crimeType: 'Robbery', description: 'Highway robbery on Mysuru-Nanjangud road. Truck loaded with electronics looted. Driver tied up. Loss estimated at ₹35 lakhs.',
      status: 'Open', severity: 'High', latitude: 12.2958, longitude: 76.6394,
    },
    {
      firNumber: 'FIR/BLR/HSR/2024/038',
      date: new Date('2024-11-12'),
      district: 'Bengaluru Urban', station: 'HSR Layout Police Station',
      crimeType: 'Theft', description: 'Auto-rickshaw driver robbed by passengers posing as IT workers near HSR BDA complex. ₹5,000 cash and phone stolen.',
      status: 'Closed', severity: 'Low', latitude: 12.9116, longitude: 77.6389,
    },
    {
      firNumber: 'FIR/BLR-RURAL/2024/039',
      date: new Date('2024-11-20'),
      district: 'Bengaluru Rural', station: 'Bengaluru Rural SP Office',
      crimeType: 'Assault', description: 'Land dispute led to violent clash between two families in Bengaluru Rural. 8 persons injured. 4 arrested. Situation tense.',
      status: 'Closed', severity: 'Medium', latitude: 12.9716, longitude: 77.5946,
    },
    {
      firNumber: 'FIR/HBL/2024/040',
      date: new Date('2024-11-28'),
      district: 'Hubballi-Dharwad', station: 'Hubballi-Dharwad Police Commissionerate',
      crimeType: 'Cybercrime', description: 'Online job fraud targeting unemployed youth in Hubballi. 50 victims paid ₹2,000 each for fake work-from-home jobs.',
      status: 'Open', severity: 'Medium', latitude: 15.3647, longitude: 75.1240,
    },
    {
      firNumber: 'FIR/MNG/2024/041',
      date: new Date('2024-12-02'),
      district: 'Mangaluru', station: 'Mangaluru City Police Station',
      crimeType: 'Kidnapping', description: 'Attempted kidnapping of a school child near Hampankatta. Child escaped. Sketch of suspect released. Public alerted.',
      status: 'Open', severity: 'High', latitude: 12.9141, longitude: 74.8560,
    },
    {
      firNumber: 'FIR/BLR/KRM/2024/042',
      date: new Date('2024-12-08'),
      district: 'Bengaluru Urban', station: 'Koramangala Police Station',
      crimeType: 'Murder', description: 'Murder of a senior citizen in Koramangala. Body found in apartment. Robbery as motive. Domestic help interrogated.',
      status: 'Under Investigation', severity: 'Critical', latitude: 12.9352, longitude: 77.6245,
    },
    {
      firNumber: 'FIR/BLR/WF/2024/043',
      date: new Date('2024-12-12'),
      district: 'Bengaluru Urban', station: 'Whitefield Police Station',
      crimeType: 'Fraud', description: 'Insurance fraud involving staged accidents. Three persons staged 7 accidents across Bengaluru. Claims worth ₹22 lakhs filed.',
      status: 'Under Investigation', severity: 'Medium', latitude: 12.9698, longitude: 77.7500,
    },
  ];

  const firs: Record<string, string> = {};
  for (const f of firData) {
    const created = await db.fir.create({ data: f });
    firs[f.firNumber] = created.id;
  }
  console.log(`  Created ${firData.length} FIRs.`);

  // ─── Suspects & Victims ─────────────────────────────────────
  console.log('🔗 Creating suspect/victim relations...');

  // suspects: person -> fir
  const suspectLinks = [
    ['Mohammed Irfan Ali', 'FIR/BLR/KRM/2024/001'],
    ['Kiran Naidu', 'FIR/BLR/KRM/2024/001'],
    ['Kiran Naidu', 'FIR/BLR/WF/2024/002'],
    ['Mohammed Irfan Ali', 'FIR/BLR/WF/2024/002'],
    ['Ravi Shankar Gupta', 'FIR/BLR/HSR/2024/003'],
    ['Kiran Naidu', 'FIR/BLR/JPN/2024/004'],
    ['Mohammed Irfan Ali', 'FIR/BLR/JPN/2024/004'],
    ['Vikram Singh Rathore', 'FIR/BLR/KRM/2024/005'],
    ['Prabhakar Joshi', 'FIR/BLR-RURAL/2024/006'],
    ['Anand Kumar Mehta', 'FIR/BLR-RURAL/2024/006'],
    ['Farooq Ahmed Sheikh', 'FIR/BLR-RURAL/2024/006'],
    ['Prabhakar Joshi', 'FIR/BLR/WF/2024/007'],
    ['Vikram Singh Rathore', 'FIR/BLR/WF/2024/007'],
    ['Anand Kumar Mehta', 'FIR/MYS/2024/008'],
    ['Ravi Shankar Gupta', 'FIR/BLR/HSR/2024/009'],
    ['Prabhakar Joshi', 'FIR/HBL/2024/010'],
    ['Farooq Ahmed Sheikh', 'FIR/MNG/2024/011'],
    ['Arjun Mahadevappa', 'FIR/BLR/KRM/2024/012'],
    ['Kiran Naidu', 'FIR/BLR/WF/2024/013'],
    ['Arjun Mahadevappa', 'FIR/SHM/2024/014'],
    ['Mohammed Irfan Ali', 'FIR/BLR/JPN/2024/015'],
    ['Vikram Singh Rathore', 'FIR/BLG/2024/016'],
    ['Anand Kumar Mehta', 'FIR/BLG/2024/016'],
    ['Farooq Ahmed Sheikh', 'FIR/MYS/2024/017'],
    ['Ravi Shankar Gupta', 'FIR/BLR/HSR/2024/018'],
    ['Prabhakar Joshi', 'FIR/BLR-RURAL/2024/019'],
    ['Arjun Mahadevappa', 'FIR/HBL/2024/020'],
    ['Reshma Begum', 'FIR/MNG/2024/021'],
    ['Ravi Shankar Gupta', 'FIR/BLR/KRM/2024/022'],
    ['Mohammed Irfan Ali', 'FIR/BLR/WF/2024/023'],
    ['Kiran Naidu', 'FIR/BLR/WF/2024/023'],
    ['Arjun Mahadevappa', 'FIR/SHM/2024/024'],
    ['Farooq Ahmed Sheikh', 'FIR/BLR/JPN/2024/025'],
    ['Kiran Naidu', 'FIR/BLR/KRM/2024/026'],
    ['Ravi Shankar Gupta', 'FIR/MYS/2024/027'],
    ['Vikram Singh Rathore', 'FIR/BLR/HSR/2024/028'],
    ['Prabhakar Joshi', 'FIR/HBL/2024/029'],
    ['Anand Kumar Mehta', 'FIR/HBL/2024/029'],
    ['Reshma Begum', 'FIR/BLR-RURAL/2024/030'],
    ['Reshma Begum', 'FIR/MNG/2024/031'],
    ['Mohammed Irfan Ali', 'FIR/BLR/KRM/2024/032'],
    ['Vikram Singh Rathore', 'FIR/BLG/2024/033'],
    ['Ravi Shankar Gupta', 'FIR/BLR/WF/2024/034'],
    ['Anand Kumar Mehta', 'FIR/SHM/2024/035'],
    ['Farooq Ahmed Sheikh', 'FIR/SHM/2024/035'],
    ['Kiran Naidu', 'FIR/BLR/JPN/2024/036'],
    ['Prabhakar Joshi', 'FIR/MYS/2024/037'],
    ['Arjun Mahadevappa', 'FIR/BLR/HSR/2024/038'],
    ['Vikram Singh Rathore', 'FIR/BLR-RURAL/2024/039'],
    ['Reshma Begum', 'FIR/HBL/2024/040'],
    ['Farooq Ahmed Sheikh', 'FIR/MNG/2024/041'],
    ['Ravi Shankar Gupta', 'FIR/BLR/KRM/2024/042'],
    ['Mohammed Irfan Ali', 'FIR/BLR/WF/2024/043'],
  ];

  for (const [personName, firNumber] of suspectLinks) {
    await db.suspect.create({
      data: { firId: firs[firNumber], personId: persons[personName] },
    });
  }

  // victims: person -> fir
  const victimLinks = [
    ['Lakshmi Devi Sharma', 'FIR/BLR/KRM/2024/001'],
    ['Priya Venkatesh', 'FIR/BLR/WF/2024/002'],
    ['Sunitha Krishnamurthy', 'FIR/BLR/HSR/2024/003'],
    ['Nandini Prasad', 'FIR/BLR/JPN/2024/004'],
    ['Karthik Raman', 'FIR/BLR/KRM/2024/005'],
    ['Suresh Babu Reddy', 'FIR/BLR-RURAL/2024/006'],
    ['Geetha Narasimha', 'FIR/BLR/WF/2024/007'],
    ['Suresh Babu Reddy', 'FIR/MYS/2024/008'],
    ['Deepa Rajesh Kumar', 'FIR/BLR/HSR/2024/009'],
    ['Lakshmi Devi Sharma', 'FIR/HBL/2024/010'],
    ['Sunitha Krishnamurthy', 'FIR/MNG/2024/011'],
    ['Nandini Prasad', 'FIR/BLR/KRM/2024/012'],
    ['Priya Venkatesh', 'FIR/BLR/WF/2024/013'],
    ['Deepa Rajesh Kumar', 'FIR/SHM/2024/014'],
    ['Karthik Raman', 'FIR/BLR/JPN/2024/015'],
    ['Lakshmi Devi Sharma', 'FIR/BLG/2024/016'],
    ['Geetha Narasimha', 'FIR/MYS/2024/017'],
    ['Sunitha Krishnamurthy', 'FIR/BLR/HSR/2024/018'],
    ['Suresh Babu Reddy', 'FIR/BLR-RURAL/2024/019'],
    ['Prabhakar Joshi', 'FIR/HBL/2024/020'],
    ['Reshma Begum', 'FIR/MNG/2024/021'],
    ['Deepa Rajesh Kumar', 'FIR/BLR/KRM/2024/022'],
    ['Nandini Prasad', 'FIR/BLR/WF/2024/023'],
    ['Karthik Raman', 'FIR/SHM/2024/024'],
    ['Lakshmi Devi Sharma', 'FIR/BLR/JPN/2024/025'],
    ['Priya Venkatesh', 'FIR/BLR/KRM/2024/026'],
    ['Geetha Narasimha', 'FIR/MYS/2024/027'],
    ['Sunitha Krishnamurthy', 'FIR/BLR/HSR/2024/028'],
    ['Suresh Babu Reddy', 'FIR/HBL/2024/029'],
    ['Deepa Rajesh Kumar', 'FIR/BLR-RURAL/2024/030'],
    ['Karthik Raman', 'FIR/MNG/2024/031'],
    ['Nandini Prasad', 'FIR/BLR/KRM/2024/032'],
    ['Geetha Narasimha', 'FIR/BLG/2024/033'],
    ['Lakshmi Devi Sharma', 'FIR/BLR/WF/2024/034'],
    ['Priya Venkatesh', 'FIR/SHM/2024/035'],
    ['Suresh Babu Reddy', 'FIR/BLR/JPN/2024/036'],
    ['Deepa Rajesh Kumar', 'FIR/MYS/2024/037'],
    ['Karthik Raman', 'FIR/BLR/HSR/2024/038'],
    ['Sunitha Krishnamurthy', 'FIR/BLR-RURAL/2024/039'],
    ['Reshma Begum', 'FIR/HBL/2024/040'],
    ['Nandini Prasad', 'FIR/MNG/2024/041'],
    ['Geetha Narasimha', 'FIR/BLR/KRM/2024/042'],
    ['Lakshmi Devi Sharma', 'FIR/BLR/WF/2024/043'],
  ];

  for (const [personName, firNumber] of victimLinks) {
    await db.victim.create({
      data: { firId: firs[firNumber], personId: persons[personName] },
    });
  }

  console.log(`  Created ${suspectLinks.length} suspect links and ${victimLinks.length} victim links.`);

  // ─── Links (person-to-person relations) ──────────────────────
  console.log('🔗 Creating person-to-person links...');
  const linkData = [
    { source: 'Mohammed Irfan Ali', target: 'Kiran Naidu', relation: 'associate_of', strength: 0.9 },
    { source: 'Kiran Naidu', target: 'Mohammed Irfan Ali', relation: 'associate_of', strength: 0.9 },
    { source: 'Ravi Shankar Gupta', target: 'Kiran Naidu', relation: 'called', strength: 0.7 },
    { source: 'Kiran Naidu', target: 'Ravi Shankar Gupta', relation: 'called', strength: 0.7 },
    { source: 'Anand Kumar Mehta', target: 'Prabhakar Joshi', relation: 'family_of', strength: 1.0 },
    { source: 'Prabhakar Joshi', target: 'Anand Kumar Mehta', relation: 'family_of', strength: 1.0 },
    { source: 'Farooq Ahmed Sheikh', target: 'Anand Kumar Mehta', relation: 'associate_of', strength: 0.6 },
    { source: 'Anand Kumar Mehta', target: 'Farooq Ahmed Sheikh', relation: 'associate_of', strength: 0.6 },
    { source: 'Vikram Singh Rathore', target: 'Arjun Mahadevappa', relation: 'linked_to_same_fir', strength: 0.5 },
    { source: 'Arjun Mahadevappa', target: 'Vikram Singh Rathore', relation: 'linked_to_same_fir', strength: 0.5 },
    { source: 'Reshma Begum', target: 'Farooq Ahmed Sheikh', relation: 'family_of', strength: 0.8 },
    { source: 'Farooq Ahmed Sheikh', target: 'Reshma Begum', relation: 'family_of', strength: 0.8 },
    { source: 'Ravi Shankar Gupta', target: 'Farooq Ahmed Sheikh', relation: 'linked_to_same_fir', strength: 0.4 },
    { source: 'Farooq Ahmed Sheikh', target: 'Ravi Shankar Gupta', relation: 'linked_to_same_fir', strength: 0.4 },
    { source: 'Prabhakar Joshi', target: 'Vikram Singh Rathore', relation: 'linked_to_same_fir', strength: 0.6 },
    { source: 'Vikram Singh Rathore', target: 'Prabhakar Joshi', relation: 'linked_to_same_fir', strength: 0.6 },
    { source: 'Mohammed Irfan Ali', target: 'Ravi Shankar Gupta', relation: 'owns_vehicle', strength: 0.5 },
    { source: 'Anand Kumar Mehta', target: 'Kiran Naidu', relation: 'linked_to_same_fir', strength: 0.3 },
    { source: 'Kiran Naidu', target: 'Anand Kumar Mehta', relation: 'linked_to_same_fir', strength: 0.3 },
    { source: 'Reshma Begum', target: 'Arjun Mahadevappa', relation: 'associate_of', strength: 0.45 },
    { source: 'Arjun Mahadevappa', target: 'Reshma Begum', relation: 'associate_of', strength: 0.45 },
    { source: 'Ravi Shankar Gupta', target: 'Vikram Singh Rathore', relation: 'called', strength: 0.55 },
    { source: 'Vikram Singh Rathore', target: 'Ravi Shankar Gupta', relation: 'called', strength: 0.55 },
  ];

  for (const l of linkData) {
    await db.link.create({
      data: {
        sourceId: persons[l.source],
        targetId: persons[l.target],
        relation: l.relation,
        strength: l.strength,
      },
    });
  }
  console.log(`  Created ${linkData.length} links.`);

  // ─── Predictions ─────────────────────────────────────────────
  console.log('🔮 Creating predictions...');
  const predictionData = [
    { district: 'Bengaluru Urban', crimeType: 'Cybercrime', riskScore: 87, factors: JSON.stringify(["6-month trend: +32%", "High complaint volume", "Pattern match with previous spike"]) , month: '2024-12' },
    { district: 'Bengaluru Urban', crimeType: 'Theft', riskScore: 74, factors: JSON.stringify(["Seasonal increase in Nov-Dec", "Multiple burglary series active", "Staff shortage at patrol units"]) , month: '2024-12' },
    { district: 'Bengaluru Urban', crimeType: 'Vehicle Theft', riskScore: 65, factors: JSON.stringify(["Festival season vehicle movement", "Parking lot vulnerability", "Recovery rate declining"]) , month: '2024-12' },
    { district: 'Mysuru', crimeType: 'Robbery', riskScore: 72, factors: JSON.stringify(["Highway robbery pattern detected", "Dasara aftermath effect", "Limited highway patrol"]) , month: '2024-12' },
    { district: 'Mysuru', crimeType: 'Cybercrime', riskScore: 68, factors: JSON.stringify(["Student population target", "Social media blackmail trend", "Previous month spike"]) , month: '2024-12' },
    { district: 'Hubballi-Dharwad', crimeType: 'Assault', riskScore: 61, factors: JSON.stringify(["Political tensions rising", "Election-related incidents", "Repeat offender activity"]) , month: '2024-12' },
    { district: 'Hubballi-Dharwad', crimeType: 'Theft', riskScore: 58, factors: JSON.stringify(["Construction site thefts", "Metal scrappers network active", "Night patrol gaps"]) , month: '2024-12' },
    { district: 'Mangaluru', crimeType: 'Kidnapping', riskScore: 79, factors: JSON.stringify(["School zone vulnerability", "Recent attempt pattern", "CCTV coverage gaps"]) , month: '2024-12' },
    { district: 'Mangaluru', crimeType: 'Cybercrime', riskScore: 71, factors: JSON.stringify(["Financial fraud hub", "Coastal trading vulnerability", "Cross-state networks"]) , month: '2024-12' },
    { district: 'Shivamogga', crimeType: 'Drug Trafficking', riskScore: 83, factors: JSON.stringify(["Forest route utilization", "Goa-Mangalore corridor", "Recent lab bust indicates network"]) , month: '2024-12' },
    { district: 'Shivamogga', crimeType: 'Theft', riskScore: 55, factors: JSON.stringify(["Temple theft pattern", "Heritage crime target", "Seasonal tourist traffic"]) , month: '2024-12' },
    { district: 'Belagavi', crimeType: 'Fraud', riskScore: 77, factors: JSON.stringify(["Job scam network expanding", "Border district vulnerability", "Multiple complaints cluster"]) , month: '2024-12' },
    { district: 'Belagavi', crimeType: 'Robbery', riskScore: 70, factors: JSON.stringify(["Interstate highway corridor", "Dacoity history in region", "Firearms recovery uptick"]) , month: '2024-12' },
    { district: 'Bengaluru Rural', crimeType: 'Fraud', riskScore: 69, factors: JSON.stringify(["Land document fraud pattern", "Rural banking vulnerability", "Agricultural loan scams"]) , month: '2024-12' },
    { district: 'Bengaluru Rural', crimeType: 'Kidnapping', riskScore: 52, factors: JSON.stringify(["Child safety incidents", "Farm labor trafficking", "Inter-district movement"]) , month: '2024-12' },
    { district: 'Bengaluru Urban', crimeType: 'Murder', riskScore: 45, factors: JSON.stringify(["Declining trend from Q2", "Domestic violence related", "Gang rivalry reduced"]) , month: '2024-12' },
    { district: 'Mangaluru', crimeType: 'Murder', riskScore: 63, factors: JSON.stringify(["Honor killing pattern", "Inter-caste tensions", "Organized crime links"]) , month: '2024-12' },
  ];

  await db.prediction.createMany({ data: predictionData });
  console.log(`  Created ${predictionData.length} predictions.`);

  console.log('\n✨ Seed completed successfully!');
  console.log(`  Stations: 8`);
  console.log(`  Persons: ${personData.length}`);
  console.log(`  FIRs: ${firData.length}`);
  console.log(`  Suspect links: ${suspectLinks.length}`);
  console.log(`  Victim links: ${victimLinks.length}`);
  console.log(`  Person links: ${linkData.length}`);
  console.log(`  Predictions: ${predictionData.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
