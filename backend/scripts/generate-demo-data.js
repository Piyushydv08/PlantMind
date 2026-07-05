import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ingestDocument } from '../services/ingestion.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEMO_DOCS_DIR = path.join(__dirname, '../demo-docs');

if (!fs.existsSync(DEMO_DOCS_DIR)) {
  fs.mkdirSync(DEMO_DOCS_DIR, { recursive: true });
}

const docs = [
  {
    filename: 'maintenance_log_pump_p201.txt',
    content: `MAINTENANCE WORK ORDER LOG
Equipment: P-201 (Centrifugal Feed Pump)
Plant: Crude Distillation Unit (CDU), BPCL Mumbai Refinery

WO#: 458921 | Date: 2023-01-12
Reported by: Ramesh Kumar | Technician: S. Patel
Symptoms: Minor seal leak noticed during routine round.
Actions taken: Tightened gland packing. Monitored for 4 hours.
Parts replaced: None
Hours taken: 2.5
Status: Closed

WO#: 459104 | Date: 2023-03-15
Reported by: System Alarm | Technician: V. Singh
Symptoms: High bearing temperature (88°C) on DE bearing.
Actions taken: Pump decoupled, DE bearing housing opened. Found severe pitting on bearing race. Replaced bearing. Realigned pump.
Parts replaced: DE Bearing (SKF 7312)
Hours taken: 8.0
Status: Closed

WO#: 460223 | Date: 2023-05-18
Reported by: Plant Operator | Technician: K. Rao
Symptoms: Low discharge pressure (6.5 bar).
Actions taken: Checked suction strainer. Cleaned debris. Pressure restored to 8.5 bar.
Parts replaced: Strainer mesh
Hours taken: 3.0
Status: Closed

WO#: 461550 | Date: 2023-07-22
Reported by: Inspection Team | Technician: M. Joshi
Symptoms: Product dripping from mechanical seal, 20 drops/min.
Actions taken: Isolated pump, drained casing. Removed and replaced mechanical seal. Pressure tested up to 10 bar.
Parts replaced: Mechanical Seal Assembly (John Crane Type 8B1)
Hours taken: 12.0
Status: Closed

WO#: 463991 | Date: 2023-11-05
Reported by: Vibration Monitoring System | Technician: S. Patel
Symptoms: Vibration approaching alarm limit (4.2 mm/s).
Actions taken: Greased bearings, verified alignment. Condition stabilized.
Parts replaced: Grease (Lithium complex)
Hours taken: 2.0
Status: Closed

WO#: 465102 | Date: 2024-01-10
Reported by: Reliability Engg | Technician: V. Singh
Symptoms: Persistent high vibration (5.1 mm/s) at 1X RPM. Unbalance suspected.
Actions taken: Removed rotor, sent for dynamic balancing. Reinstalled. Vibration dropped to 1.8 mm/s.
Parts replaced: None (Balancing weights added)
Hours taken: 16.0
Status: Closed

WO#: 466881 | Date: 2024-04-01
Reported by: Planning Dept | Technician: Inspection Team
Symptoms: Preventive Maintenance - Annual Overhaul (OISD-116 compliance).
Actions taken: Complete teardown. DPT done on impeller. Clearances measured. Replaced all wear rings and bearings.
Parts replaced: Wear rings, Bearings, Gaskets, O-rings
Hours taken: 48.0
Status: Closed

WO#: 467905 | Date: 2024-06-15
Reported by: Field Operator | Technician: K. Rao
Symptoms: Abnormal noise from motor NDE side.
Actions taken: Inspected motor cooling fan. Found loose fan cover. Tightened bolts.
Parts replaced: None
Hours taken: 1.5
Status: Closed

WO#: 469220 | Date: 2024-08-20
Reported by: Operations | Technician: M. Joshi
Symptoms: Pump unable to meet rated flow (max 95 m3/hr).
Actions taken: Opened casing, inspected impeller. Found significant cavitation damage and impeller wear. Replaced impeller.
Parts replaced: Impeller (SS 316)
Hours taken: 24.0
Status: Closed

WO#: 471015 | Date: 2024-11-12
Reported by: Ramesh Kumar | Technician: S. Patel
Symptoms: Coupling guard loose.
Actions taken: Secured coupling guard with new fasteners.
Parts replaced: 4x M8 Bolts
Hours taken: 0.5
Status: Closed
`
  },
  {
    filename: 'sop_centrifugal_pump_startup.txt',
    content: `STANDARD OPERATING PROCEDURE (SOP)
Title: Centrifugal Pump Startup Procedure
Document ID: SOP-MECH-042
Revision: 3.0

1. Purpose and Scope
This procedure outlines the safe and correct steps for the startup of horizontal centrifugal pumps in the refinery complex. Applicable to feed pumps, transfer pumps, and reflux pumps.

2. Safety Precautions
- Personal Protective Equipment (PPE) mandatory: Hard hat, safety goggles, ear protection, FR coveralls, safety shoes, and heavy-duty gloves.
- Ensure valid Hot Work or Cold Work permit is available if maintenance was just completed.
- Follow Energy Isolation (Lockout-Tagout - LOTO) removal procedures before attempting startup.
- Verify fire extinguishers and eye wash stations in the vicinity are accessible.

3. Pre-startup Checks
[ ] Verify LOTO has been officially removed and tags signed off.
[ ] Check coupling guard is securely installed.
[ ] Ensure all maintenance tools and debris are cleared from the area.
[ ] Verify oil level in the bearing housing is visible at the center of the bullseye sight glass.
[ ] Ensure mechanical seal flushing lines (Plan 11/52/53) are open and pressurized.
[ ] Check that cooling water lines to bearing housing (if applicable) are open.
[ ] Verify local pressure gauges are installed and valves open.
[ ] Ensure the pump discharge valve is 100% CLOSED.
[ ] Ensure the pump suction valve is 100% OPEN.
[ ] Open the casing vent valve to bleed trapped air until a steady stream of fluid appears (Priming).
[ ] Close the casing vent valve securely.
[ ] Verify the motor is electrically racked in and ready to start from the local panel.
[ ] Inform the DCS board operator that the pump is ready for startup.
[ ] Ensure area is clear of non-essential personnel.
[ ] Conduct a final visual walkaround of the skid.

4. Startup Procedure
1. Confirm with DCS operator to start the motor.
2. Press the local START button (or have DCS start it).
3. Immediately observe the discharge pressure gauge. It should rise to the shut-off head pressure within 3-5 seconds.
4. Listen for any abnormal rubbing, cavitation, or rattling noises.
5. Visually check for leaks at the casing joints, flanges, and mechanical seal.
6. Check bearing housing temperature by hand (cautiously) or with an IR gun.
7. If pressure does not build up, immediately press STOP and re-prime the pump.
8. Once shut-off pressure is stable, slowly crack open the discharge valve.
9. Gradually open the discharge valve to 100% while monitoring the motor amperage to ensure it does not exceed the rated limit.
10. Verify flow meter (if installed) shows the expected flow rate.
11. Monitor bearing temperatures and vibration levels for the next 15 minutes.
12. Notify the DCS operator that the pump is online and running normally.

5. Normal Operating Parameters
- Suction pressure: 2.5 bar
- Discharge pressure: 8.5 bar
- Flow rate: 120 m3/hr
- Motor current: 45A max
- Bearing temperature: <75°C
- Vibration (velocity): <4.5 mm/s

6. Alarm and Trip Settings
- High Vibration Alarm: 7.0 mm/s
- High-High Vibration Trip: 9.0 mm/s
- High Bearing Temp Alarm: 85°C
- High-High Bearing Temp Trip: 95°C
- Low Suction Pressure Trip: 1.0 bar
- High Motor Amp Trip: 50A (time delayed)

7. Emergency Shutdown Procedure
In case of heavy seal leakage, visible smoke, severe vibration, or fire:
1. Hit the local Emergency Stop (E-Stop) button immediately.
2. Close the suction and discharge valves to isolate the pump.
3. Alert the DCS operator and shift supervisor.
4. If fire is present, activate the nearest manual call point.

8. References
- OISD-116: Standard for Operating Procedures in Petroleum Installations
- Factory Act 1948, Section 36 (Precautions against dangerous fumes)
- OEM Pump Manual (Flowserve/Goulds)
`
  },
  {
    filename: 'oisd_standard_116_extract.txt',
    content: `OISD-STANDARD-116 (EXTRACT)
OPERATING STANDARDS FOR PETROLEUM INSTALLATIONS

1. Scope
This standard applies to the safe operation, maintenance, and inspection of rotating and static equipment in petroleum refineries, oil terminals, and gas processing plants in India.

2. Inspection Intervals
To ensure mechanical integrity, the following minimum inspection frequencies shall be strictly adhered to:

Pumps (Centrifugal and Positive Displacement):
- Monthly: Visual inspection for leaks, abnormal noise, and oil levels.
- Quarterly: Vibration signature analysis and thermal imaging of bearings.
- Annual: Complete mechanical overhaul, clearance checks, and seal inspection.

Compressors (Centrifugal and Reciprocating):
- Weekly: Lube oil sampling and analysis.
- Monthly: Performance mapping and valve temperature checks.
- Bi-annual: Internal inspection of valves, riders, and intercoolers.

Heat Exchangers:
- Quarterly: Fouling factor calculation and thermal performance review.
- Annual: Tube bundle extraction, cleaning, and hydro test.

3. Permit-to-Work (PTW) Requirements
No maintenance or inspection work shall commence without a valid PTW.
- Hot Work Permit: Required for any activity generating heat or sparks (welding, grinding) in hazardous zones. Requires continuous gas monitoring (LEL < 1%).
- Confined Space Entry: Required for entering vessels, tanks, or deep trenches. Requires oxygen level > 19.5%, H2S < 10 ppm, and a standby man.
- Cold Work Permit: Required for routine mechanical work not generating sparks.

4. Documentation Requirements
All inspections and maintenance activities must be logged in the Computerized Maintenance Management System (CMMS) within 24 hours of completion. The root cause analysis (RCA) is mandatory for any equipment failure causing >4 hours of downtime.

5. Emergency Procedures
Every facility shall have a site-specific Disaster Management Plan (DMP). Operators must be trained on emergency shutdown (ESD) systems. Mock drills shall be conducted quarterly.

6. Statutory Compliance
All operations must comply with:
- The Petroleum Act, 1934 and Petroleum Rules, 2002.
- The Factories Act, 1948.
- Guidelines issued by the Petroleum and Explosives Safety Organization (PESO) and Directorate General of Mines Safety (DGMS).
`
  },
  {
    filename: 'compliance_checklist_refinery_2024.txt',
    content: `ANNUAL COMPLIANCE CHECKLIST - 2024
Facility: Mumbai Refinery Complex

Category: Factory Act Compliance
1. Safety committee meetings held monthly | Status: Compliant | Checked: 2024-11-01 | Officer: R. Sharma
2. Hoists and lifts examined every 6 months | Status: Compliant | Checked: 2024-10-15 | Officer: V. Gupta
3. Pressure plant tested as per Section 31 | Status: Compliant | Checked: 2024-09-20 | Officer: M. Singh
4. Adequate lighting and ventilation maintained | Status: Compliant | Checked: 2024-11-05 | Officer: S. Patel
5. Drinking water points clearly marked | Status: Compliant | Checked: 2024-11-05 | Officer: S. Patel
6. First aid boxes equipped and accessible | Status: Partial (Box at CDU missing burn cream) | Checked: 2024-11-10 | Officer: Dr. A. Kumar
7. Canteens maintained for >250 workers | Status: Compliant | Checked: 2024-08-01 | Officer: HR Dept
8. Firefighting equipment inspected | Status: Partial (Extinguisher at pump bay expired) | Checked: 2024-11-12 | Officer: Fire Chief
9. Worker health checkups completed | Status: Compliant | Checked: 2024-06-30 | Officer: Dr. A. Kumar
10. Hazardous process disclosure to workers | Status: Compliant | Checked: 2024-01-15 | Officer: R. Sharma

Category: OISD Standards Compliance
11. OISD-116 Operating procedures updated | Status: Partial (Compressor SOP pending update) | Checked: 2024-10-10 | Officer: V. Gupta
12. OISD-144 Permit to work system audited | Status: Compliant | Checked: 2024-09-05 | Officer: R. Sharma
13. OISD-129 Electrical installations inspected | Status: Non-compliant (Earth pit resistance high at Substation A) | Checked: 2024-11-02 | Officer: E. Raj
14. OISD-117 Fire protection facilities tested | Status: Compliant | Checked: 2024-10-25 | Officer: Fire Chief
15. OISD-156 Fire rolling shutters operational | Status: Compliant | Checked: 2024-07-18 | Officer: M. Singh

Category: PESO Regulations
16. Storage tank licenses renewed | Status: Compliant | Checked: 2024-03-10 | Officer: R. Sharma
17. Safety relief valves calibrated yearly | Status: Partial (V-102 SRV calibration overdue by 1 week) | Checked: 2024-11-15 | Officer: V. Gupta
18. Flame arrestors cleaned and inspected | Status: Compliant | Checked: 2024-08-22 | Officer: M. Singh

Category: Environmental Norms
19. Effluent treatment plant discharge limits | Status: Compliant | Checked: 2024-11-01 | Officer: Env. Eng
20. Stack emission monitoring continuous | Status: Non-compliant (Analyzer at Stack 2 offline) | Checked: 2024-11-14 | Officer: Env. Eng
`
  },
  {
    filename: 'equipment_register_plant_a.txt',
    content: `EQUIPMENT REGISTER - PLANT A (CRUDE DISTILLATION UNIT)

Tag | Description | Capacity | Fluid handled | Installation date | Last inspection | Next due | Condition
P-101 | Crude Charge Pump | 350 m3/hr | Crude Oil | 2015-05-10 | 2024-02-15 | 2025-02-15 | Good
P-102 | Crude Charge Pump (Standby) | 350 m3/hr | Crude Oil | 2015-05-10 | 2024-02-16 | 2025-02-16 | Good
P-201 | Feed Pump | 120 m3/hr | Naphtha | 2018-11-20 | 2024-08-20 | 2025-08-20 | Requires Monitoring (Recent impeller change)
P-202 | Reflux Pump | 85 m3/hr | Kerosene | 2016-03-05 | 2024-01-10 | 2025-01-10 | Good
P-203 | Bottoms Transfer Pump | 210 m3/hr | Heavy Fuel Oil | 2017-09-12 | 2023-11-05 | 2024-11-05 | Overdue for inspection
P-204 | Sour Water Pump | 45 m3/hr | Sour Water | 2019-07-22 | 2024-06-30 | 2025-06-30 | Fair
P-205 | Amine Circulation Pump | 90 m3/hr | Lean Amine | 2016-08-14 | 2024-04-12 | 2025-04-12 | Good

HE-101 | Crude Pre-heater 1 | 5.5 MW | Crude / Residue | 2015-05-15 | 2023-12-01 | 2024-12-01 | Fouled, scheduled for cleaning
HE-102 | Crude Pre-heater 2 | 5.5 MW | Crude / Residue | 2015-05-15 | 2023-12-05 | 2024-12-05 | Fair
HE-103 | Overhead Condenser | 8.2 MW | Naphtha Vapor / CW | 2016-02-20 | 2024-03-15 | 2025-03-15 | Good
HE-104 | Product Cooler | 3.1 MW | Kerosene / CW | 2017-10-10 | 2024-05-20 | 2025-05-20 | Minor tube leaks repaired

C-301 | Recycle Gas Compressor | 1500 Nm3/hr | Hydrogen mix | 2018-01-25 | 2024-07-10 | 2025-07-10 | Excellent
C-302 | Flare Gas Recovery Compressor | 500 Nm3/hr | Flare Gas | 2019-04-18 | 2024-09-05 | 2025-09-05 | Good

V-101 | Crude Desalter | 1200 m3 | Crude Oil / Water | 2015-06-01 | 2022-10-15 | 2027-10-15 | Good
V-102 | Reflux Drum | 45 m3 | Naphtha / Water | 2016-02-25 | 2021-11-20 | 2026-11-20 | Good

E-201 | P-201 Drive Motor | 75 kW | N/A | 2018-11-20 | 2024-06-15 | 2025-06-15 | Good
`
  }
];

async function main() {
  try {
    console.log("Generating demo documents...");
    for (const doc of docs) {
      const filePath = path.join(DEMO_DOCS_DIR, doc.filename);
      fs.writeFileSync(filePath, doc.content, 'utf8');
      console.log(`Created: ${doc.filename}`);
    }

    console.log("\nStarting ingestion into ChromaDB...");
    
    for (const doc of docs) {
      const filePath = path.join(DEMO_DOCS_DIR, doc.filename);
      try {
        const result = await ingestDocument(filePath, doc.filename);
        if (result.success) {
          console.log(`✓ Ingested: ${doc.filename} (${result.chunks_created} chunks created)`);
        } else {
          console.error(`✗ Failed to ingest ${doc.filename}: ${result.error}`);
        }
      } catch (err) {
        console.error(`✗ Exception ingesting ${doc.filename}:`, err.message || err);
      }
    }

    console.log("\nDemo data ready! PlantMind knowledge base loaded.");
  } catch (error) {
    console.error("An error occurred during demo data generation:");
    console.error(error.message || error);
    if (error.message && (error.message.includes("fetch") || error.message.includes("ECONNREFUSED"))) {
      console.error("\nPLEASE ENSURE CHROMADB IS RUNNING ON PORT 8000.");
    }
  }
}

main();
