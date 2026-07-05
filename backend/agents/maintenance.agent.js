import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { queryKnowledgeBase, buildContext, buildCitations } from '../services/rag.service.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * analyzeFailure
 * Uses the knowledge base to analyze equipment failures and output a structured Root Cause Analysis in JSON format.
 *
 * @param {string} symptomDescription - The symptoms of the failure.
 * @param {string|null} equipmentId - The ID or name of the equipment.
 * @returns {Promise<Object>} An object containing the JSON analysis, citations, equipment ID, and symptoms.
 */
export async function analyzeFailure(symptomDescription, equipmentId = null) {
  try {
    // 1. Query the KB
    const query = `${equipmentId || ''} ${symptomDescription} failure root cause maintenance repair`.trim();
    const chunks = await queryKnowledgeBase(query, {}, 10);
    const context = buildContext(chunks);

    // 2. Call Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are PlantMind Maintenance Intelligence for an Indian industrial plant.
Analyze equipment failures and provide structured RCA.
Respond ONLY with valid JSON. No text outside the JSON block.
Use this exact structure:
{
  "probable_causes": [
    { "cause": "string", "likelihood": "high|medium|low", "explanation": "string" }
  ],
  "immediate_actions": ["string"],
  "root_cause_analysis": {
    "primary_cause": "string",
    "contributing_factors": ["string"],
    "why_chain": [
      "Why 1: ...",
      "Why 2: ...",
      "Why 3: ...",
      "Why 4: ...",
      "Why 5: ..."
    ]
  },
  "recommended_maintenance": {
    "short_term": ["string"],
    "long_term": ["string"],
    "preventive_schedule": "string"
  },
  "safety_precautions": ["string"],
  "regulatory_references": ["string"],
  "estimated_downtime": "string",
  "spare_parts_needed": ["string"]
}`
        },
        {
          role: 'user',
          content: `Equipment: ${equipmentId || 'Unknown'}
Symptoms: ${symptomDescription}

Context from knowledge base:
${context}`
        }
      ],
      max_tokens: 2048,
      temperature: 0.0,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0].message.content;
    let analysis;

    // 3. Parse JSON from response
    try {
      // Try directly parsing the text
      analysis = JSON.parse(text);
    } catch (e1) {
      try {
        // Fallback: Try extracting with regex if LLM added surrounding markdown or text
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          analysis = JSON.parse(match[0]);
        } else {
          analysis = { raw_analysis: text };
        }
      } catch (e2) {
        // Ultimate fallback
        analysis = { raw_analysis: text };
      }
    }

    // 4. Return formatted response
    return {
      analysis,
      citations: buildCitations(chunks),
      equipment_id: equipmentId,
      symptoms: symptomDescription
    };

  } catch (error) {
    console.error("Error in analyzeFailure:", error);
    throw error;
  }
}

/**
 * getPredictiveSchedule
 * Generates a structured predictive maintenance schedule based on RAG context.
 *
 * @param {string} equipmentId - The ID or name of the equipment.
 * @returns {Promise<string>} The structured maintenance schedule text.
 */
export async function getPredictiveSchedule(equipmentId) {
  try {
    // 1. Query KB
    const query = `${equipmentId} inspection schedule maintenance frequency`;
    const chunks = await queryKnowledgeBase(query, {}, 8);
    const context = buildContext(chunks);

    // 2. Call Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are PlantMind Maintenance Intelligence for an Indian industrial plant.
Based on the provided context, generate a structured predictive maintenance and inspection schedule for the specified equipment. 
Be concise and use clear markdown formatting.`
        },
        {
          role: 'user',
          content: `Equipment: ${equipmentId}

Context from knowledge base:
${context}`
        }
      ],
      max_tokens: 1024,
      temperature: 0.2
    });

    // 3. Return as text
    return response.choices[0].message.content;

  } catch (error) {
    console.error("Error in getPredictiveSchedule:", error);
    throw error;
  }
}
