import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Services
import { ingestDocument, getDocumentList, extractText } from '../services/ingestion.service.js';
import { queryKnowledgeBase } from '../services/rag.service.js';

// Agents
import { answerQuery } from '../agents/copilot.agent.js';
import { analyzeFailure, getPredictiveSchedule } from '../agents/maintenance.agent.js';
import { checkCompliance, getComplianceCalendar } from '../agents/compliance.agent.js';

const router = express.Router();

// Middleware for logging
router.use((req, res, next) => {
  console.log("[API]", req.method, req.path);
  next();
});

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOCX, TXT, and CSV are allowed."));
    }
  }
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date() });
});

// GET /api/dashboard/stats
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const demoDocsDir = path.join(process.cwd(), 'demo-docs');
    if (!fs.existsSync(demoDocsDir)) {
      fs.mkdirSync(demoDocsDir, { recursive: true });
    }

    let safetyIndex = 98.4;
    let complianceLevel = 'Grade A';
    let activeAlarmsCount = 0;
    let alarmDetails = [];
    let recentActivities = [];

    let totalEq = 0;
    let scoreSum = 0;
    let compStats = { compliant: 0, partial: 0, nonCompliant: 0 };

    const files = fs.readdirSync(demoDocsDir);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const filePath = path.join(demoDocsDir, file);
      const ext = path.extname(file).toLowerCase();

      if (ext === '.json') {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item.anomaly_flag) {
                alarmDetails.push({
                  tag: item.equipment_id || 'SPEC',
                  name: item.category || 'Specification Deviation',
                  issue: item.vendor_submittal?.anomaly_reason || 'Spec mismatch detected',
                  severity: 'critical',
                  source: `Spec submittal file (${file})`
                });
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing JSON file: ${file}`, e);
        }
      } else if (['.txt', '.csv', '.pdf', '.docx'].includes(ext)) {
        try {
          const text = await extractText(filePath);
          const lines = text.split('\n');

          // Detect file context based on contents
          const isEquipmentRegister = text.toLowerCase().includes('equipment register') || text.includes('Tag | Description');
          const isComplianceChecklist = text.toLowerCase().includes('compliance checklist') || text.includes('Status:');
          const isScheduleDelays = text.includes('Activity ID') || text.toLowerCase().includes('critical path?');

          if (isEquipmentRegister) {
            for (const line of lines) {
              if (!line.includes('|') || line.startsWith('Tag |') || line.toLowerCase().includes('equipment register')) continue;
              const parts = line.split('|').map(p => p.trim());
              if (parts.length < 7) continue;

              const tag = parts[0];
              const name = parts[1];
              const condition = parts[parts.length - 1];

              totalEq++;
              let score = 100;
              const condLower = condition.toLowerCase();
              if (condLower.includes('excellent')) score = 100;
              else if (condLower.includes('good')) score = 95;
              else if (condLower.includes('fair')) score = 80;
              else if (condLower.includes('monitor') || condLower.includes('minor') || condLower.includes('leak') || condLower.includes('wear')) {
                score = 60;
                alarmDetails.push({
                  tag,
                  name,
                  issue: condition,
                  severity: 'warning',
                  source: `Equipment Register (${file})`
                });
              } else if (condLower.includes('overdue') || condLower.includes('fouled')) {
                score = 30;
                alarmDetails.push({
                  tag,
                  name,
                  issue: condition,
                  severity: 'critical',
                  source: `Equipment Register (${file})`
                });
              }
              scoreSum += score;
            }
          }

          if (isComplianceChecklist) {
            for (const line of lines) {
              if (!line.includes('|')) continue;
              const statusMatch = line.match(/Status:\s*([a-zA-Z-\s()]+)/i);
              if (statusMatch) {
                const status = statusMatch[1].trim().toLowerCase();
                if (status.includes('non')) {
                  compStats.nonCompliant++;
                  const textMatch = line.match(/^\d+\.\s*(.*?)\s*\|/);
                  const detail = textMatch ? textMatch[1] : 'Non-compliant checklist item';
                  alarmDetails.push({
                    tag: 'COMP',
                    name: 'Regulatory Check',
                    issue: detail,
                    severity: 'critical',
                    source: `Compliance Checklist (${file})`
                  });
                } else if (status.includes('partial')) {
                  compStats.partial++;
                  const textMatch = line.match(/^\d+\.\s*(.*?)\s*\|/);
                  const detail = textMatch ? textMatch[1] : 'Partially compliant checklist item';
                  alarmDetails.push({
                    tag: 'COMP',
                    name: 'Regulatory Check',
                    issue: detail,
                    severity: 'warning',
                    source: `Compliance Checklist (${file})`
                  });
                } else {
                  compStats.compliant++;
                }
              }
            }
          }

          if (isScheduleDelays) {
            for (const line of lines) {
              if (line.startsWith('Activity ID') || !line.trim()) continue;
              const parts = line.split(',').map(p => p.trim());
              if (parts.length < 7) continue;

              const [activityId, taskName, duration, status, criticalPath, riskTrigger, expectedDelay] = parts;
              if (expectedDelay && expectedDelay !== '0' && expectedDelay !== 'None') {
                alarmDetails.push({
                  tag: activityId,
                  name: taskName,
                  issue: `${riskTrigger} (Delay: ${expectedDelay})`,
                  severity: criticalPath.toLowerCase() === 'yes' ? 'critical' : 'warning',
                  source: `Schedule Delays (${file})`
                });
              }
            }
          }
        } catch (err) {
          console.error(`Error parsing file ${file}:`, err);
        }
      }
    }

    // Safety Index calculation
    if (totalEq > 0) {
      safetyIndex = parseFloat((scoreSum / totalEq).toFixed(1));
    }

    // Compliance level calculation
    const totalComp = compStats.compliant + compStats.partial + compStats.nonCompliant;
    if (totalComp > 0) {
      const compScore = (compStats.compliant * 100 + compStats.partial * 50) / totalComp;
      if (compScore >= 90) complianceLevel = 'Grade A';
      else if (compScore >= 75) complianceLevel = 'Grade B';
      else complianceLevel = 'Grade C';
    }

    activeAlarmsCount = alarmDetails.length;

    recentActivities = [
      { id: 1, type: 'system', text: 'System health check passed — All AI models online', time: 'Just now' },
      { id: 2, type: 'compliance', text: `Compliance audit: ${compStats.compliant} checked, ${compStats.partial + compStats.nonCompliant} flagged`, time: '10m ago' },
      { id: 3, type: 'maintenance', text: `Equipment registers parsed: ${totalEq} items monitored. Safety Index calculated.`, time: '1h ago' }
    ];

    res.json({
      safetyIndex,
      complianceLevel,
      activeAlarmsCount,
      alarmDetails,
      recentActivities
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded (fieldname must be 'file')" });
    }
    
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Save a copy to demo-docs so the dashboard stats parser scans it reactively
    const demoDocsDir = path.join(process.cwd(), 'demo-docs');
    if (!fs.existsSync(demoDocsDir)) {
      fs.mkdirSync(demoDocsDir, { recursive: true });
    }
    const destPath = path.join(demoDocsDir, originalName);
    fs.copyFileSync(filePath, destPath);

    const result = await ingestDocument(filePath, originalName);

    // Delete temp file after ingestion
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json(result);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// GET /api/documents
router.get('/documents', async (req, res, next) => {
  try {
    const documents = await getDocumentList();
    res.json({ documents, count: documents.length });
  } catch (error) {
    next(error);
  }
});

// POST /api/query
router.post('/query', async (req, res, next) => {
  try {
    const { question, doc_type } = req.body;
    if (!question || typeof question !== 'string' || question.length < 3) {
      return res.status(400).json({ error: "question is required and must be at least 3 characters long" });
    }
    
    const result = await answerQuery(question, doc_type);
    res.json({ ...result, timestamp: new Date() });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance/analyze
router.post('/maintenance/analyze', async (req, res, next) => {
  try {
    const { symptoms, equipment_id } = req.body;
    if (!symptoms) {
      return res.status(400).json({ error: "symptoms field is required" });
    }

    const result = await analyzeFailure(symptoms, equipment_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/maintenance/schedule/:equipmentId
router.get('/maintenance/schedule/:equipmentId', async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    const schedule = await getPredictiveSchedule(equipmentId);
    res.json({ schedule, equipment_id: equipmentId });
  } catch (error) {
    next(error);
  }
});

// POST /api/compliance/check
router.post('/compliance/check', async (req, res, next) => {
  try {
    const { procedure, equipment_id, regulation_type } = req.body;
    if (!procedure) {
      return res.status(400).json({ error: "procedure field is required" });
    }

    const result = await checkCompliance(procedure, equipment_id, regulation_type);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/compliance/calendar
router.get('/compliance/calendar', async (req, res, next) => {
  try {
    const facilityType = req.query.facility_type || 'oil_refinery';
    const calendar = await getComplianceCalendar(facilityType);
    res.json({ calendar });
  } catch (error) {
    next(error);
  }
});

// POST /api/graph
router.post('/graph', async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "query field is required" });
    }

    const chunks = await queryKnowledgeBase(query, {}, 15);
    
    const nodesMap = new Map();
    const linksMap = new Map();
    
    const queryNodeId = 'query';
    nodesMap.set(queryNodeId, { id: queryNodeId, label: query.substring(0, 30), type: 'query', group: 0 });

    const tagRegex = /\b[A-Z]{1,3}-?\d{3,4}\b/g;

    chunks.forEach(chunk => {
      const docId = chunk.metadata?.doc_id || 'unknown';
      const docName = chunk.metadata?.doc_name || 'Unknown Document';
      const score = chunk.score || 0;

      // Add document node
      if (!nodesMap.has(docId)) {
        nodesMap.set(docId, { id: docId, label: docName, type: 'document', group: 1 });
        
        // Link query to document
        const linkId = `${queryNodeId}->${docId}`;
        linksMap.set(linkId, { source: queryNodeId, target: docId, value: score * 10 });
      } else {
        // If we found another chunk for the same document with a higher score, update the edge weight
        const linkId = `${queryNodeId}->${docId}`;
        const existingLink = linksMap.get(linkId);
        if (existingLink && (score * 10) > existingLink.value) {
          existingLink.value = score * 10;
        }
      }

      // Extract equipment tags
      const content = chunk.content || '';
      const tags = content.match(tagRegex) || [];
      const uniqueTags = [...new Set(tags)];

      uniqueTags.forEach(tag => {
        if (!nodesMap.has(tag)) {
          nodesMap.set(tag, { id: tag, label: tag, type: 'equipment', group: 2 });
        }
        
        // Link document to tag
        const linkId = `${docId}->${tag}`;
        if (!linksMap.has(linkId)) {
          linksMap.set(linkId, { source: docId, target: tag, value: 5 });
        }
      });
    });

    const nodes = Array.from(nodesMap.values());
    const links = Array.from(linksMap.values());

    res.json({ nodes, links, query });
  } catch (error) {
    next(error);
  }
});

export default router;
