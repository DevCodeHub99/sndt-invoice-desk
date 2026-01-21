const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoicedesk';

// Admin credentials
const ADMIN_EMAIL = 'admin@sndt.com';
const ADMIN_PASSWORD = 'Admin@123';

console.log('\n🔐 Admin Credentials:');
console.log('   Email:', ADMIN_EMAIL);
console.log('   Password:', ADMIN_PASSWORD);
console.log('');

// Helper: Get state from GSTIN
function getStateFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  const stateCode = gstin.substring(0, 2);
  const stateCodes = {
    '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
    '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
    '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
    '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra',
    '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
    '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh',
  };
  return stateCodes[stateCode] || null;
}

// Helper: Get state code from state name
function getStateCode(stateName) {
  const codes = {
    'Maharashtra': '27', 'Karnataka': '29', 'Haryana': '06',
    'Uttar Pradesh': '09', 'Tamil Nadu': '33', 'Telangana': '36',
    'Delhi': '07', 'Gujarat': '24', 'Rajasthan': '08',
    'West Bengal': '19', 'Kerala': '32', 'Punjab': '03',
  };
  return codes[stateName] || '27';
}

// Comprehensive Products (50 items covering various industries)
const seedProducts = [
  // Construction Services
  { id: uuidv4(), name: 'RCC Concrete Work', description: 'Reinforced cement concrete work per cubic meter', price: 8500, hsnSac: '9406', createdAt: new Date() },
  { id: uuidv4(), name: 'Steel Reinforcement', description: 'TMT steel bars and reinforcement per ton', price: 65000, hsnSac: '7213', createdAt: new Date() },
  { id: uuidv4(), name: 'Brick Masonry', description: 'Red brick masonry work per 1000 bricks', price: 12000, hsnSac: '6904', createdAt: new Date() },
  { id: uuidv4(), name: 'Plumbing Installation', description: 'Complete plumbing system with fixtures', price: 45000, hsnSac: '9406', createdAt: new Date() },
  { id: uuidv4(), name: 'Electrical Wiring', description: 'Electrical wiring and installation per point', price: 3500, hsnSac: '9406', createdAt: new Date() },
  { id: uuidv4(), name: 'Interior Painting', description: 'Premium interior painting per sq ft', price: 250, hsnSac: '9406', createdAt: new Date() },
  { id: uuidv4(), name: 'Ceramic Tile Flooring', description: 'Vitrified ceramic tile flooring per sq ft', price: 350, hsnSac: '6908', createdAt: new Date() },
  { id: uuidv4(), name: 'Structural Design', description: 'Structural engineering design and consultation', price: 150000, hsnSac: '9406', createdAt: new Date() },
  { id: uuidv4(), name: 'Italian Marble Flooring', description: 'Premium Italian marble flooring per sq ft', price: 1200, hsnSac: '2515', createdAt: new Date() },
  { id: uuidv4(), name: 'Glass Partition System', description: 'Frameless tempered glass partition', price: 850, hsnSac: '7007', createdAt: new Date() },
  
  // HVAC & MEP
  { id: uuidv4(), name: 'Central AC System', description: 'VRF central air conditioning system', price: 125000, hsnSac: '8415', createdAt: new Date() },
  { id: uuidv4(), name: 'Fire Safety System', description: 'Automatic fire detection and suppression', price: 95000, hsnSac: '8424', createdAt: new Date() },
  { id: uuidv4(), name: 'Waterproofing Treatment', description: 'Chemical waterproofing per sq ft', price: 180, hsnSac: '3208', createdAt: new Date() },
  { id: uuidv4(), name: 'Scaffolding Rental', description: 'Temporary scaffolding per sq ft per month', price: 45, hsnSac: '7326', createdAt: new Date() },
  { id: uuidv4(), name: 'Excavation Work', description: 'Earth excavation and removal per cubic meter', price: 2500, hsnSac: '9406', createdAt: new Date() },
  
  // IT Services
  { id: uuidv4(), name: 'Website Development', description: 'Custom responsive website development', price: 85000, hsnSac: '998314', createdAt: new Date() },
  { id: uuidv4(), name: 'Mobile App Development', description: 'Native iOS/Android app development', price: 250000, hsnSac: '998314', createdAt: new Date() },
  { id: uuidv4(), name: 'Cloud Hosting', description: 'AWS cloud hosting per month', price: 15000, hsnSac: '998314', createdAt: new Date() },
  { id: uuidv4(), name: 'SEO Services', description: 'Search engine optimization monthly package', price: 25000, hsnSac: '998314', createdAt: new Date() },
  { id: uuidv4(), name: 'Digital Marketing', description: 'Social media and PPC campaign management', price: 35000, hsnSac: '998314', createdAt: new Date() },
  
  // Professional Services
  { id: uuidv4(), name: 'Legal Consultation', description: 'Corporate legal advisory per hour', price: 5000, hsnSac: '998212', createdAt: new Date() },
  { id: uuidv4(), name: 'Accounting Services', description: 'Monthly bookkeeping and accounting', price: 18000, hsnSac: '998213', createdAt: new Date() },
  { id: uuidv4(), name: 'Tax Filing', description: 'Annual income tax return filing', price: 12000, hsnSac: '998213', createdAt: new Date() },
  { id: uuidv4(), name: 'GST Compliance', description: 'Monthly GST return filing and compliance', price: 8000, hsnSac: '998213', createdAt: new Date() },
  { id: uuidv4(), name: 'Business Consulting', description: 'Strategic business consulting per day', price: 25000, hsnSac: '998212', createdAt: new Date() },
  
  // Manufacturing Products
  { id: uuidv4(), name: 'Industrial Machinery', description: 'CNC milling machine', price: 1500000, hsnSac: '8459', createdAt: new Date() },
  { id: uuidv4(), name: 'Packaging Material', description: 'Corrugated boxes per 1000 units', price: 8500, hsnSac: '4819', createdAt: new Date() },
  { id: uuidv4(), name: 'Raw Material Supply', description: 'Industrial grade plastic granules per kg', price: 120, hsnSac: '3901', createdAt: new Date() },
  { id: uuidv4(), name: 'Quality Testing', description: 'Product quality testing and certification', price: 15000, hsnSac: '998212', createdAt: new Date() },
  { id: uuidv4(), name: 'Logistics Services', description: 'Transportation and warehousing per ton', price: 3500, hsnSac: '996511', createdAt: new Date() },
  
  // Office Supplies
  { id: uuidv4(), name: 'Office Furniture Set', description: 'Ergonomic desk and chair combo', price: 35000, hsnSac: '9403', createdAt: new Date() },
  { id: uuidv4(), name: 'Computer System', description: 'Desktop computer with monitor', price: 55000, hsnSac: '8471', createdAt: new Date() },
  { id: uuidv4(), name: 'Printer & Scanner', description: 'Multifunction laser printer', price: 28000, hsnSac: '8443', createdAt: new Date() },
  { id: uuidv4(), name: 'Stationery Package', description: 'Complete office stationery monthly supply', price: 5000, hsnSac: '4820', createdAt: new Date() },
  { id: uuidv4(), name: 'Networking Equipment', description: 'Enterprise router and switches', price: 45000, hsnSac: '8517', createdAt: new Date() },
  
  // Training & Education
  { id: uuidv4(), name: 'Corporate Training', description: 'Employee skill development program per day', price: 35000, hsnSac: '999293', createdAt: new Date() },
  { id: uuidv4(), name: 'Technical Workshop', description: 'Hands-on technical workshop per participant', price: 8000, hsnSac: '999293', createdAt: new Date() },
  { id: uuidv4(), name: 'Online Course', description: 'E-learning course subscription per user', price: 12000, hsnSac: '999293', createdAt: new Date() },
  { id: uuidv4(), name: 'Certification Exam', description: 'Professional certification examination', price: 15000, hsnSac: '999293', createdAt: new Date() },
  { id: uuidv4(), name: 'Study Material', description: 'Printed training manuals and guides', price: 2500, hsnSac: '4901', createdAt: new Date() },
  
  // Maintenance Services
  { id: uuidv4(), name: 'AMC - HVAC', description: 'Annual maintenance contract for AC systems', price: 45000, hsnSac: '998819', createdAt: new Date() },
  { id: uuidv4(), name: 'AMC - Electrical', description: 'Annual electrical maintenance contract', price: 35000, hsnSac: '998819', createdAt: new Date() },
  { id: uuidv4(), name: 'AMC - Plumbing', description: 'Annual plumbing maintenance contract', price: 25000, hsnSac: '998819', createdAt: new Date() },
  { id: uuidv4(), name: 'Pest Control', description: 'Quarterly pest control service', price: 8000, hsnSac: '998819', createdAt: new Date() },
  { id: uuidv4(), name: 'Housekeeping', description: 'Monthly housekeeping services', price: 18000, hsnSac: '998819', createdAt: new Date() },
  
  // Security Services
  { id: uuidv4(), name: 'CCTV Installation', description: '16 channel HD CCTV system with DVR', price: 75000, hsnSac: '8525', createdAt: new Date() },
  { id: uuidv4(), name: 'Access Control System', description: 'Biometric access control installation', price: 95000, hsnSac: '8525', createdAt: new Date() },
  { id: uuidv4(), name: 'Security Guard', description: 'Security personnel per month', price: 22000, hsnSac: '998212', createdAt: new Date() },
  { id: uuidv4(), name: 'Alarm System', description: 'Intrusion detection alarm system', price: 35000, hsnSac: '8525', createdAt: new Date() },
  { id: uuidv4(), name: 'Cybersecurity Audit', description: 'IT security assessment and penetration testing', price: 125000, hsnSac: '998314', createdAt: new Date() },
];

// Comprehensive Clients (25 clients from different states and industries)
const seedClients = [
  // Maharashtra Clients (Same State)
  {
    id: uuidv4(), companyName: 'Prestige Constructions Ltd', taxId: '27AABCT1111H1Z0',
    email: 'billing@prestigeconstructions.com', phone: '+91 98765 11111',
    billingAddress: '456 Business Park, Bandra', billingCity: 'Mumbai',
    billingState: 'Maharashtra', billingZipCode: '400050', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Lodha Group', taxId: '27AABCT4444H4Z3',
    email: 'finance@lodhagroup.com', phone: '+91 98765 44444',
    billingAddress: '123 Lodha Tower, Mahalaxmi', billingCity: 'Mumbai',
    billingState: 'Maharashtra', billingZipCode: '400034', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Oberoi Realty', taxId: '27AABCT5555H5Z4',
    email: 'billing@oberoi.com', phone: '+91 98765 55555',
    billingAddress: '999 Oberoi Center, Andheri', billingCity: 'Mumbai',
    billingState: 'Maharashtra', billingZipCode: '400072', billingCountry: 'India',
    shippingSameAsBilling: false,
    shippingAddress: '777 Oberoi Site, Goregaon', shippingCity: 'Mumbai',
    shippingState: 'Maharashtra', shippingZipCode: '400063', shippingCountry: 'India',
    createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Reliance Industries Ltd', taxId: '27AAACR5055K1Z4',
    email: 'accounts@ril.com', phone: '+91 22 3555 5000',
    billingAddress: 'Maker Chambers IV, Nariman Point', billingCity: 'Mumbai',
    billingState: 'Maharashtra', billingZipCode: '400021', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Karnataka Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'Godrej Properties', taxId: '29AABCT2222H2Z1',
    email: 'accounts@godrejproperties.com', phone: '+91 98765 22222',
    billingAddress: '789 Tech Park, Whitefield', billingCity: 'Bengaluru',
    billingState: 'Karnataka', billingZipCode: '560066', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Infosys Technologies', taxId: '29AAACI1681G1ZK',
    email: 'billing@infosys.com', phone: '+91 80 2852 0261',
    billingAddress: 'Electronics City, Hosur Road', billingCity: 'Bengaluru',
    billingState: 'Karnataka', billingZipCode: '560100', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Wipro Limited', taxId: '29AAACW3775F000',
    email: 'finance@wipro.com', phone: '+91 80 2844 0011',
    billingAddress: 'Doddakannelli, Sarjapur Road', billingCity: 'Bengaluru',
    billingState: 'Karnataka', billingZipCode: '560035', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Delhi/NCR Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'DLF Limited', taxId: '06AABCT3333H3Z2',
    email: 'billing@dlf.com', phone: '+91 98765 33333',
    billingAddress: 'DLF Center, Sector 26', billingCity: 'Gurgaon',
    billingState: 'Haryana', billingZipCode: '122001', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'HCL Technologies', taxId: '07AAACH1263H1Z5',
    email: 'accounts@hcltech.com', phone: '+91 120 4386000',
    billingAddress: 'Plot 3A, Sector 126', billingCity: 'Noida',
    billingState: 'Uttar Pradesh', billingZipCode: '201303', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Maruti Suzuki India Ltd', taxId: '06AAACM0230B1ZY',
    email: 'billing@marutisuzuki.com', phone: '+91 124 4884000',
    billingAddress: 'Maruti Suzuki India Limited, Gurgaon', billingCity: 'Gurgaon',
    billingState: 'Haryana', billingZipCode: '122015', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Tamil Nadu Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'L&T Construction', taxId: '33AABCT8888H8Z7',
    email: 'accounts@ltconstruction.com', phone: '+91 98765 88888',
    billingAddress: '456 Tech Park, Guindy', billingCity: 'Chennai',
    billingState: 'Tamil Nadu', billingZipCode: '600032', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'TCS - Tata Consultancy Services', taxId: '33AAACT2727Q1ZW',
    email: 'billing@tcs.com', phone: '+91 44 2254 0000',
    billingAddress: 'Taramani Road, Taramani', billingCity: 'Chennai',
    billingState: 'Tamil Nadu', billingZipCode: '600113', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Ashok Leyland Ltd', taxId: '33AAACA3834M1ZT',
    email: 'accounts@ashokleyland.com', phone: '+91 44 2220 0200',
    billingAddress: '1 Sardar Patel Road, Guindy', billingCity: 'Chennai',
    billingState: 'Tamil Nadu', billingZipCode: '600032', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Telangana Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'Shapoorji Pallonji Group', taxId: '36AABCT9999H9Z8',
    email: 'billing@shapoorji.com', phone: '+91 98765 99999',
    billingAddress: '789 Business District, Hyderabad', billingCity: 'Hyderabad',
    billingState: 'Telangana', billingZipCode: '500032', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Tech Mahindra Ltd', taxId: '36AAACT6304M1ZU',
    email: 'finance@techmahindra.com', phone: '+91 40 3061 4000',
    billingAddress: 'Raheja Mindspace, Madhapur', billingCity: 'Hyderabad',
    billingState: 'Telangana', billingZipCode: '500081', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Gujarat Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'Adani Group', taxId: '24AAACA3363R1ZM',
    email: 'accounts@adani.com', phone: '+91 79 2656 5555',
    billingAddress: 'Adani House, Nr Mithakhali Circle', billingCity: 'Ahmedabad',
    billingState: 'Gujarat', billingZipCode: '380009', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Torrent Pharmaceuticals', taxId: '24AAACT6989F1ZX',
    email: 'billing@torrentpharma.com', phone: '+91 79 2665 5555',
    billingAddress: 'Torrent House, Ashram Road', billingCity: 'Ahmedabad',
    billingState: 'Gujarat', billingZipCode: '380009', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Rajasthan Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'Birla Corporation Ltd', taxId: '08AAACB1234C1Z5',
    email: 'accounts@birlacorp.com', phone: '+91 141 2743000',
    billingAddress: 'Birla Tower, Tonk Road', billingCity: 'Jaipur',
    billingState: 'Rajasthan', billingZipCode: '302015', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // West Bengal Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'ITC Limited', taxId: '19AAACI1681G1Z0',
    email: 'billing@itcportal.com', phone: '+91 33 2288 9371',
    billingAddress: 'Virginia House, 37 JL Nehru Road', billingCity: 'Kolkata',
    billingState: 'West Bengal', billingZipCode: '700071', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Emami Limited', taxId: '19AAACE1234F1Z9',
    email: 'accounts@emami.com', phone: '+91 33 6613 6264',
    billingAddress: '687 Anandapur, EM Bypass', billingCity: 'Kolkata',
    billingState: 'West Bengal', billingZipCode: '700107', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Kerala Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'Federal Bank Ltd', taxId: '32AAACF1234B1Z3',
    email: 'billing@federalbank.co.in', phone: '+91 484 2623000',
    billingAddress: 'Federal Towers, Aluva', billingCity: 'Kochi',
    billingState: 'Kerala', billingZipCode: '683101', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Punjab Clients (Inter-State)
  {
    id: uuidv4(), companyName: 'Hero MotoCorp Ltd', taxId: '03AAACH0812R1ZN',
    email: 'accounts@heromotocorp.com', phone: '+91 1762 503200',
    billingAddress: 'The Grand Plaza, Plot No 2', billingCity: 'Ludhiana',
    billingState: 'Punjab', billingZipCode: '141001', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  
  // Small Business (No GSTIN)
  {
    id: uuidv4(), companyName: 'Local Retail Store', taxId: '',
    email: 'owner@localretail.com', phone: '+91 98765 00000',
    billingAddress: 'Shop 12, Market Complex', billingCity: 'Mumbai',
    billingState: 'Maharashtra', billingZipCode: '400001', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
  {
    id: uuidv4(), companyName: 'Freelance Consultant', taxId: '',
    email: 'consultant@freelance.com', phone: '+91 98765 00001',
    billingAddress: '45 Residential Complex', billingCity: 'Pune',
    billingState: 'Maharashtra', billingZipCode: '411001', billingCountry: 'India',
    shippingSameAsBilling: true, shippingAddress: '', shippingCity: '',
    shippingState: '', shippingZipCode: '', shippingCountry: '', createdAt: new Date(),
  },
];

// Generate comprehensive invoices covering all scenarios
function generateComprehensiveInvoices(products, clients) {
  const invoices = [];
  const businessGSTIN = '27AABCT6789H6Z5';
  const businessState = getStateFromGSTIN(businessGSTIN);
  
  // Scenario 1: Current Month Invoices (Full Access) - 15 invoices
  for (let i = 0; i < 15; i++) {
    const client = clients[i % clients.length];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - i);
    
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    
    const clientState = getStateFromGSTIN(client.taxId);
    const isInterState = businessState && clientState && businessState !== clientState;
    
    const numItems = Math.floor(Math.random() * 4) + 1;
    const items = [];
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    
    const taxRates = [18, 12, 5, 0];
    const statuses = ['paid', 'pending', 'paid'];
    const notes = [
      'Thank you for your business! Payment terms: Net 30 days.',
      'GST invoice as per applicable rates. For queries, contact accounts@invoicedesk.com',
      'Payment due within 30 days from invoice date. Late payment charges applicable.',
      'This is a computer-generated invoice and does not require physical signature.',
      '',
    ];
    
    for (let j = 0; j < numItems; j++) {
      const product = products[(i * 3 + j) % products.length];
      const quantity = Math.floor(Math.random() * 10) + 1;
      const taxRate = taxRates[j % taxRates.length];
      const itemSubtotal = product.price * quantity;
      
      let itemTotal = itemSubtotal;
      
      if (isInterState) {
        const itemIgst = itemSubtotal * (taxRate / 100);
        itemTotal = itemSubtotal + itemIgst;
        totalIgst += itemIgst;
      } else {
        const itemCgst = itemSubtotal * (taxRate / 200);
        const itemSgst = itemSubtotal * (taxRate / 200);
        itemTotal = itemSubtotal + itemCgst + itemSgst;
        totalCgst += itemCgst;
        totalSgst += itemSgst;
      }
      
      items.push({
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        description: product.description,
        hsnSac: product.hsnSac,
        quantity,
        unitPrice: product.price,
        taxRate,
        total: itemTotal,
      });
      
      subtotal += itemSubtotal;
    }
    
    const totalTax = totalCgst + totalSgst + totalIgst;
    const total = subtotal + totalTax;
    const roundOff = Math.round(total) - total;
    
    invoices.push({
      id: uuidv4(),
      invoiceNumber: `INV-2026-${String(1000 + i).padStart(4, '0')}`,
      clientId: client.id,
      clientName: client.companyName,
      clientAddress: `${client.billingAddress}, ${client.billingCity}, ${client.billingState} ${client.billingZipCode}`,
      clientGstin: client.taxId || '',
      clientState: client.billingState,
      placeOfSupply: client.taxId ? `${client.billingState} - ${getStateCode(client.billingState)}` : client.billingState,
      isInterState: isInterState || false,
      items,
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      roundOff,
      total: Math.round(total),
      status: statuses[i % statuses.length],
      notes: notes[i % notes.length],
      createdAt,
      dueDate,
    });
  }
  
  // Scenario 2: Last Month Invoices (Archive) - 20 invoices
  for (let i = 0; i < 20; i++) {
    const client = clients[(i + 5) % clients.length];
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - 1);
    createdAt.setDate(Math.floor(Math.random() * 28) + 1);
    
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    
    const clientState = getStateFromGSTIN(client.taxId);
    const isInterState = businessState && clientState && businessState !== clientState;
    
    const numItems = Math.floor(Math.random() * 5) + 2;
    const items = [];
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    
    const taxRates = [18, 12, 5, 0];
    const statuses = ['paid', 'paid', 'paid', 'pending'];
    
    for (let j = 0; j < numItems; j++) {
      const product = products[(i * 2 + j + 10) % products.length];
      const quantity = Math.floor(Math.random() * 8) + 1;
      const taxRate = taxRates[j % taxRates.length];
      const itemSubtotal = product.price * quantity;
      
      let itemTotal = itemSubtotal;
      
      if (isInterState) {
        const itemIgst = itemSubtotal * (taxRate / 100);
        itemTotal = itemSubtotal + itemIgst;
        totalIgst += itemIgst;
      } else {
        const itemCgst = itemSubtotal * (taxRate / 200);
        const itemSgst = itemSubtotal * (taxRate / 200);
        itemTotal = itemSubtotal + itemCgst + itemSgst;
        totalCgst += itemCgst;
        totalSgst += itemSgst;
      }
      
      items.push({
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        description: product.description,
        hsnSac: product.hsnSac,
        quantity,
        unitPrice: product.price,
        taxRate,
        total: itemTotal,
      });
      
      subtotal += itemSubtotal;
    }
    
    const totalTax = totalCgst + totalSgst + totalIgst;
    const total = subtotal + totalTax;
    const roundOff = Math.round(total) - total;
    
    invoices.push({
      id: uuidv4(),
      invoiceNumber: `INV-2025-${String(9000 + i).padStart(4, '0')}`,
      clientId: client.id,
      clientName: client.companyName,
      clientAddress: `${client.billingAddress}, ${client.billingCity}, ${client.billingState} ${client.billingZipCode}`,
      clientGstin: client.taxId || '',
      clientState: client.billingState,
      placeOfSupply: client.taxId ? `${client.billingState} - ${getStateCode(client.billingState)}` : client.billingState,
      isInterState: isInterState || false,
      items,
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      roundOff,
      total: Math.round(total),
      status: statuses[i % statuses.length],
      notes: 'Thank you for your business!',
      createdAt,
      dueDate,
    });
  }
  
  // Scenario 3: Edge Cases - Special invoices
  
  // 3a. Zero tax invoice (Exempt goods)
  const zeroTaxClient = clients[0];
  const zeroTaxDate = new Date();
  zeroTaxDate.setDate(zeroTaxDate.getDate() - 2);
  invoices.push({
    id: uuidv4(),
    invoiceNumber: 'INV-2026-1100',
    clientId: zeroTaxClient.id,
    clientName: zeroTaxClient.companyName,
    clientAddress: `${zeroTaxClient.billingAddress}, ${zeroTaxClient.billingCity}, ${zeroTaxClient.billingState} ${zeroTaxClient.billingZipCode}`,
    clientGstin: zeroTaxClient.taxId,
    clientState: zeroTaxClient.billingState,
    placeOfSupply: `${zeroTaxClient.billingState} - ${getStateCode(zeroTaxClient.billingState)}`,
    isInterState: false,
    items: [{
      id: uuidv4(),
      productId: products[0].id,
      productName: 'Tax Exempt Service',
      description: 'Educational training service (GST exempt)',
      hsnSac: '999293',
      quantity: 1,
      unitPrice: 50000,
      taxRate: 0,
      total: 50000,
    }],
    subtotal: 50000,
    cgst: 0,
    sgst: 0,
    igst: 0,
    roundOff: 0,
    total: 50000,
    status: 'pending',
    notes: 'GST Exempt service as per notification 12/2017',
    createdAt: zeroTaxDate,
    dueDate: new Date(zeroTaxDate.getTime() + 30 * 24 * 60 * 60 * 1000),
  });
  
  // 3b. High-value invoice (Large project)
  const highValueClient = clients[4];
  const highValueDate = new Date();
  highValueDate.setDate(highValueDate.getDate() - 5);
  invoices.push({
    id: uuidv4(),
    invoiceNumber: 'INV-2026-1101',
    clientId: highValueClient.id,
    clientName: highValueClient.companyName,
    clientAddress: `${highValueClient.billingAddress}, ${highValueClient.billingCity}, ${highValueClient.billingState} ${highValueClient.billingZipCode}`,
    clientGstin: highValueClient.taxId,
    clientState: highValueClient.billingState,
    placeOfSupply: `${highValueClient.billingState} - ${getStateCode(highValueClient.billingState)}`,
    isInterState: true,
    items: [
      {
        id: uuidv4(),
        productId: products[15].id,
        productName: 'Enterprise Software Development',
        description: 'Custom ERP system development and implementation',
        hsnSac: '998314',
        quantity: 1,
        unitPrice: 5000000,
        taxRate: 18,
        total: 5900000,
      },
      {
        id: uuidv4(),
        productId: products[17].id,
        productName: 'Cloud Infrastructure Setup',
        description: 'AWS enterprise cloud setup and migration',
        hsnSac: '998314',
        quantity: 1,
        unitPrice: 1500000,
        taxRate: 18,
        total: 1770000,
      },
    ],
    subtotal: 6500000,
    cgst: 0,
    sgst: 0,
    igst: 1170000,
    roundOff: 0,
    total: 7670000,
    status: 'paid',
    notes: 'Project milestone payment. Thank you for your business!',
    createdAt: highValueDate,
    dueDate: new Date(highValueDate.getTime() + 45 * 24 * 60 * 60 * 1000),
  });
  
  // 3c. Multiple tax rates in single invoice
  const mixedTaxClient = clients[10];
  const mixedTaxDate = new Date();
  mixedTaxDate.setDate(mixedTaxDate.getDate() - 3);
  const mixedItems = [
    { product: products[0], qty: 5, rate: 18 },
    { product: products[5], qty: 10, rate: 12 },
    { product: products[10], qty: 2, rate: 5 },
    { product: products[38], qty: 1, rate: 0 },
  ];
  
  let mixedSubtotal = 0;
  let mixedCgst = 0;
  let mixedSgst = 0;
  const mixedInvoiceItems = mixedItems.map(item => {
    const itemSubtotal = item.product.price * item.qty;
    const itemCgst = itemSubtotal * (item.rate / 200);
    const itemSgst = itemSubtotal * (item.rate / 200);
    const itemTotal = itemSubtotal + itemCgst + itemSgst;
    
    mixedSubtotal += itemSubtotal;
    mixedCgst += itemCgst;
    mixedSgst += itemSgst;
    
    return {
      id: uuidv4(),
      productId: item.product.id,
      productName: item.product.name,
      description: item.product.description,
      hsnSac: item.product.hsnSac,
      quantity: item.qty,
      unitPrice: item.product.price,
      taxRate: item.rate,
      total: itemTotal,
    };
  });
  
  const mixedTotal = mixedSubtotal + mixedCgst + mixedSgst;
  const mixedRoundOff = Math.round(mixedTotal) - mixedTotal;
  
  invoices.push({
    id: uuidv4(),
    invoiceNumber: 'INV-2026-1102',
    clientId: mixedTaxClient.id,
    clientName: mixedTaxClient.companyName,
    clientAddress: `${mixedTaxClient.billingAddress}, ${mixedTaxClient.billingCity}, ${mixedTaxClient.billingState} ${mixedTaxClient.billingZipCode}`,
    clientGstin: mixedTaxClient.taxId,
    clientState: mixedTaxClient.billingState,
    placeOfSupply: `${mixedTaxClient.billingState} - ${getStateCode(mixedTaxClient.billingState)}`,
    isInterState: true,
    items: mixedInvoiceItems,
    subtotal: mixedSubtotal,
    cgst: 0,
    sgst: 0,
    igst: mixedCgst + mixedSgst,
    roundOff: mixedRoundOff,
    total: Math.round(mixedTotal),
    status: 'pending',
    notes: 'Mixed tax rates as per HSN/SAC classification',
    createdAt: mixedTaxDate,
    dueDate: new Date(mixedTaxDate.getTime() + 30 * 24 * 60 * 60 * 1000),
  });
  
  // 3d. Client without GSTIN (Small business)
  const noGstClient = clients[clients.length - 1];
  const noGstDate = new Date();
  noGstDate.setDate(noGstDate.getDate() - 1);
  invoices.push({
    id: uuidv4(),
    invoiceNumber: 'INV-2026-1103',
    clientId: noGstClient.id,
    clientName: noGstClient.companyName,
    clientAddress: `${noGstClient.billingAddress}, ${noGstClient.billingCity}, ${noGstClient.billingState} ${noGstClient.billingZipCode}`,
    clientGstin: '',
    clientState: noGstClient.billingState,
    placeOfSupply: noGstClient.billingState,
    isInterState: false,
    items: [{
      id: uuidv4(),
      productId: products[33].id,
      productName: products[33].name,
      description: products[33].description,
      hsnSac: products[33].hsnSac,
      quantity: 2,
      unitPrice: products[33].price,
      taxRate: 18,
      total: products[33].price * 2 * 1.18,
    }],
    subtotal: products[33].price * 2,
    cgst: products[33].price * 2 * 0.09,
    sgst: products[33].price * 2 * 0.09,
    igst: 0,
    roundOff: 0,
    total: Math.round(products[33].price * 2 * 1.18),
    status: 'pending',
    notes: 'Client not registered under GST',
    createdAt: noGstDate,
    dueDate: new Date(noGstDate.getTime() + 15 * 24 * 60 * 60 * 1000),
  });
  
  return invoices;
}

// Define schemas
const businessDetailsSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  taxId: String,
  registrationNumber: String,
  municipalTradeCertificate: String,
  email: { type: String, required: true },
  phones: [String],
  billingAddress: { type: String, required: true },
  billingCity: { type: String, required: true },
  billingState: { type: String, required: true },
  billingZipCode: { type: String, required: true },
  billingCountry: { type: String, required: true },
  website: String,
  defaultTaxRate: { type: Number, default: 18 },
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  accountHolderName: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessDetails: businessDetailsSchema,
  isSetupComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  id: String,
  userId: { type: String, required: true, index: true }, // User isolation
  name: String,
  description: String,
  price: Number,
  hsnSac: String,
  createdAt: Date,
});

const clientSchema = new mongoose.Schema({
  id: String,
  userId: { type: String, required: true, index: true }, // User isolation
  companyName: String,
  taxId: String,
  email: String,
  phone: String,
  billingAddress: String,
  billingCity: String,
  billingState: String,
  billingZipCode: String,
  billingCountry: String,
  shippingSameAsBilling: Boolean,
  shippingAddress: String,
  shippingCity: String,
  shippingState: String,
  shippingZipCode: String,
  shippingCountry: String,
  createdAt: Date,
});

const invoiceSchema = new mongoose.Schema({
  id: String,
  userId: { type: String, required: true, index: true }, // User isolation
  invoiceNumber: String,
  clientId: String,
  clientName: String,
  clientAddress: String,
  clientGstin: String,
  clientState: String,
  placeOfSupply: String,
  isInterState: Boolean,
  items: Array,
  subtotal: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  roundOff: Number,
  total: Number,
  status: String,
  notes: String,
  createdAt: Date,
  dueDate: Date,
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seed...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create models
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
    const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
    const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Client.deleteMany({});
    await Invoice.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create admin user with complete profile
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    const adminUser = {
      id: uuidv4(),
      email: ADMIN_EMAIL,
      password: hashedPassword,
      isSetupComplete: true,
      businessDetails: {
        companyName: 'InvoiceDesk Solutions Pvt Ltd',
        taxId: '27AABCT6789H6Z5',
        registrationNumber: 'UDYAM-MH-04-0057906',
        municipalTradeCertificate: 'MTC-MH-2024-123456',
        email: 'billing@invoicedesk.com',
        phones: ['+91 98765 43210', '+91 98765 43211'],
        billingAddress: '123 Business Tower, Andheri East',
        billingCity: 'Mumbai',
        billingState: 'Maharashtra',
        billingZipCode: '400069',
        billingCountry: 'India',
        website: 'https://invoicedesk.com',
        defaultTaxRate: 18,
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'InvoiceDesk Solutions Pvt Ltd',
      },
      createdAt: new Date(),
    };

    const createdUser = await User.create(adminUser);
    const adminUserId = createdUser.id;
    console.log('✅ Admin user created');

    // Insert products with userId
    console.log('📦 Inserting products...');
    const productsWithUserId = seedProducts.map(product => ({
      ...product,
      userId: adminUserId,
    }));
    await Product.insertMany(productsWithUserId);
    console.log(`✅ Inserted ${seedProducts.length} products`);

    // Insert clients with userId
    console.log('🏢 Inserting clients...');
    const clientsWithUserId = seedClients.map(client => ({
      ...client,
      userId: adminUserId,
    }));
    await Client.insertMany(clientsWithUserId);
    console.log(`✅ Inserted ${seedClients.length} clients`);

    // Generate and insert invoices with userId
    console.log('📄 Generating comprehensive invoices...');
    const invoices = generateComprehensiveInvoices(seedProducts, seedClients);
    const invoicesWithUserId = invoices.map(invoice => ({
      ...invoice,
      userId: adminUserId,
    }));
    await Invoice.insertMany(invoicesWithUserId);
    console.log(`✅ Inserted ${invoices.length} invoices`);

    // Calculate statistics
    const currentMonthInvoices = invoices.filter(inv => {
      const now = new Date();
      const invDate = new Date(inv.createdAt);
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    });
    
    const lastMonthInvoices = invoices.filter(inv => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const invDate = new Date(inv.createdAt);
      return invDate.getMonth() === lastMonth.getMonth() && invDate.getFullYear() === lastMonth.getFullYear();
    });
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    const interStateInvoices = invoices.filter(inv => inv.isInterState);
    const intraStateInvoices = invoices.filter(inv => !inv.isInterState);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Comprehensive Summary:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   👤 Admin User: 1 (ID: ${adminUserId})`);
    console.log(`   📦 Products: ${seedProducts.length} (covering multiple industries)`);
    console.log(`   🏢 Clients: ${seedClients.length} (from ${new Set(seedClients.map(c => c.billingState)).size} states)`);
    console.log(`   📄 Total Invoices: ${invoices.length}`);
    console.log('');
    console.log('📅 Invoice Distribution:');
    console.log(`   ✅ Current Month: ${currentMonthInvoices.length} (Full Access)`);
    console.log(`   📦 Last Month: ${lastMonthInvoices.length} (Archive - CSV Download)`);
    console.log(`   🗑️  Older: 0 (Auto-deleted after 3 months)`);
    console.log('');
    console.log('📈 Invoice Status:');
    console.log(`   💰 Paid: ${paidInvoices.length} invoices`);
    console.log(`   ⏱️  Pending: ${pendingInvoices.length} invoices`);
    console.log('');
    console.log('💵 Revenue Statistics:');
    console.log(`   ✅ Total Revenue (Paid): ₹${totalRevenue.toLocaleString('en-IN')}`);
    console.log(`   ⏳ Pending Revenue (Sent): ₹${pendingRevenue.toLocaleString('en-IN')}`);
    console.log('');
    console.log('🌍 GST Distribution:');
    console.log(`   🔄 Inter-State (IGST): ${interStateInvoices.length} invoices`);
    console.log(`   🏠 Intra-State (CGST+SGST): ${intraStateInvoices.length} invoices`);
    console.log('');
    console.log('🎯 Feature Coverage:');
    console.log('   ✅ Multiple tax rates (0%, 5%, 12%, 18%)');
    console.log('   ✅ Inter-state and intra-state transactions');
    console.log('   ✅ Clients with and without GSTIN');
    console.log('   ✅ Different shipping addresses');
    console.log('   ✅ Various HSN/SAC codes');
    console.log('   ✅ High-value invoices (₹50L+)');
    console.log('   ✅ Zero-tax invoices (exempt goods)');
    console.log('   ✅ Multiple items per invoice');
    console.log('   ✅ Round-off calculations');
    console.log('   ✅ Current month + Archive invoices');
    console.log('');
    console.log('🏭 Industries Covered:');
    console.log('   • Construction & Real Estate');
    console.log('   • IT Services & Software');
    console.log('   • Professional Services (Legal, Accounting)');
    console.log('   • Manufacturing & Logistics');
    console.log('   • Training & Education');
    console.log('   • Maintenance & Security');
    console.log('   • Office Supplies & Equipment');
    console.log('');
    console.log('🔐 Admin Login Credentials:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   📧 Email: ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Login with admin credentials');
    console.log('   4. Explore all features!');
    console.log('');
    console.log('� Security Features:');
    console.log('   ✅ User isolation - All data scoped to admin user');
    console.log('   ✅ Input validation and sanitization');
    console.log('   ✅ Rate limiting on all endpoints');
    console.log('   ✅ JWT-based authentication with refresh tokens');
    console.log('   ✅ HTTP-only secure cookies');
    console.log('');
    console.log('📚 Test Scenarios Available:');
    console.log('   • Create new invoices with different clients');
    console.log('   • Download PDF invoices');
    console.log('   • Update invoice status (Draft → Sent → Paid)');
    console.log('   • Search and filter invoices');
    console.log('   • Download archive CSV (last month)');
    console.log('   • Add/edit products and clients');
    console.log('   • Update business settings');
    console.log('   • Test GST calculations (CGST/SGST/IGST)');
    console.log('   • Test pagination on large datasets');
    console.log('');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
