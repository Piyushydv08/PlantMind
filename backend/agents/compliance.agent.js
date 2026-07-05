import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { queryKnowledgeBase, buildContext, buildCitations } from '../services/rag.service.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * checkCompliance
 * Checks industrial compliance by retrieving both regulation documents and specific procedure records simultaneously.
 *
 * @param {string} procedure - The procedure or task to check.
 * @param {string|null} equipmentId - The ID or name of the equipment (optional).
 * @param {string|null} regulationType - The specific regulation focus (optional).
 * @returns {Promise<Object>} An object containing the JSON compliance report and citations.
 */
export async function checkCompliance(procedure, equipmentId = null, regulationType = null) {
  try {
    // 1. Run TWO parallel queries using Promise.all
    const query1 = `${procedure} ${regulationType || 'OISD Factory Act safety'} requirements compliance`.trim();
    const query2 = `${equipmentId || ''} ${procedure} current procedure inspection record`.trim();

    const [chunks1, chunks2] = await Promise.all([
      queryKnowledgeBase(query1, { doc_type: 'REGULATION' }, 6),
      queryKnowledgeBase(query2, {}, 4)
    ]);

    // 2. Merge and deduplicate results by content
    const allChunks = [...chunks1, ...chunks2];
    const uniqueChunksMap = new Map();

    for (const chunk of allChunks) {
      if (!uniqueChunksMap.has(chunk.content)) {
        uniqueChunksMap.set(chunk.content, chunk);
      }
    }
    
    const mergedChunks = Array.from(uniqueChunksMap.values());
    const context = buildContext(mergedChunks);

    // 3. Call Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are PlantMind Compliance Intelligence for an Indian industrial facility.
Check compliance against Indian industrial regulations (OISD, Factory Act, DGMS, PESO).
Respond ONLY with valid JSON. No text outside the JSON block.
Use this exact structure:
{
  "compliance_status": "compliant|partial|non-compliant|unknown",
  "applicable_regulations": [
    { "regulation": "string", "section": "string", "requirement": "string" }
  ],
  "compliance_gaps": [
    { 
      "gap": "string", 
      "severity": "critical|major|minor", 
      "regulation_reference": "string", 
      "corrective_action": "string" 
    }
  ],
  "audit_evidence_required": ["string"],
  "risk_level": "high|medium|low",
  "deadline_for_compliance": "string",
  "recommendations": ["string"]
}`
        },
        {
          role: 'user',
          content: `Procedure to check: ${procedure}
Equipment: ${equipmentId || 'General facility'}
Regulation focus: ${regulationType || 'All applicable'}

Knowledge base context:
${context}`
        }
      ],
      max_tokens: 2048,
      temperature: 0.0,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0].message.content;
    let report;

    // 4. Parse JSON safely with try/catch
    try {
      report = JSON.parse(text);
    } catch (e1) {
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          report = JSON.parse(match[0]);
        } else {
          report = { raw_report: text };
        }
      } catch (e2) {
        report = { raw_report: text };
      }
    }

    // 5. Return report and citations
    return {
      report,
      citations: buildCitations(mergedChunks)
    };

  } catch (error) {
    console.error("Error in checkCompliance:", error);
    throw error;
  }
}

/**
 * getComplianceCalendar
 * Generates a structured monthly compliance calendar as JSON text based on RAG context.
 *
 * @param {string} facilityType - Type of industrial facility.
 * @returns {Promise<string>} The raw JSON text of the schedule.
 */
export async function getComplianceCalendar(facilityType = 'oil_refinery') {
  try {
    const query = `${facilityType} inspection schedule compliance calendar OISD annual`.trim();
    const chunks = await queryKnowledgeBase(query, {}, 8);
    const context = buildContext(chunks);

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are PlantMind Compliance Intelligence.
Based on the provided context, generate a structured monthly compliance calendar for the facility type.
Respond ONLY with valid JSON. No text outside the JSON block. Format as a JSON object mapping months (or timeframes) to task arrays.`
        },
        {
          role: 'user',
          content: `Facility Type: ${facilityType}

Context from knowledge base:
${context}`
        }
      ],
      max_tokens: 2048,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error in getComplianceCalendar:", error);
    throw error;
  }
}
