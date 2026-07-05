import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { queryKnowledgeBase, buildContext, buildCitations } from '../services/rag.service.js';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * answerQuery
 * Uses RAG (Retrieval-Augmented Generation) to answer a user's question based on the knowledge base.
 *
 * @param {string} question - The user's query.
 * @param {string|null} docTypeFilter - Optional filter for document types (e.g., 'SOP', 'REGULATION').
 * @returns {Promise<Object>} An object containing the answer, citations, and confidence level.
 */
export async function answerQuery(question, docTypeFilter = null) {
  try {
    // 1. Query Knowledge Base
    const filters = docTypeFilter ? { doc_type: docTypeFilter } : {};
    const chunks = await queryKnowledgeBase(question, filters, 8);

    // 2. If no chunks found
    if (!chunks || chunks.length === 0) {
      return { 
        answer: "I could not find relevant information in the knowledge base. Please upload relevant documents first.", 
        citations: [], 
        confidence: 'low' 
      };
    }

    // 3. Build context
    const context = buildContext(chunks);

    // 4. Call Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are PlantMind, an expert industrial knowledge assistant for Indian manufacturing and energy plants.
Answer technical queries about maintenance, operations, safety, compliance.
Rules:
- Answer ONLY from the provided context
- Be precise and actionable for field technicians  
- Reference source documents by name explicitly
- Use metric units and Indian regulatory references (OISD, Factory Act, DGMS, PESO)
- Format with clear numbered steps when procedure is involved
- If context is insufficient, say so honestly
- Never fabricate information not present in context`
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`
        }
      ],
      max_tokens: 1024,
      temperature: 0.1
    });

    // 5. Extract answer
    const answer = response.choices[0].message.content;

    // 6. Compute confidence
    let confidence = 'low';
    const topScore = chunks[0].score;
    
    if (topScore > 0.7) {
      confidence = 'high';
    } else if (topScore > 0.5) {
      confidence = 'medium';
    }

    // 7. Return payload
    const citations = buildCitations(chunks);
    
    return { 
      answer, 
      citations, 
      confidence 
    };

  } catch (error) {
    console.error("Error in answerQuery:", error);
    throw error;
  }
}
