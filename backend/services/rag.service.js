import { getCollection, embedTexts } from './ingestion.service.js';

/**
 * 1. queryKnowledgeBase
 * Embeds a query, searches ChromaDB, filters by threshold, and returns chunks.
 */
export async function queryKnowledgeBase(query, filters = {}, topK = 8) {
  try {
    const collection = await getCollection();
    
    // Check if the collection is empty
    const count = await collection.count();
    if (count === 0) {
      return [];
    }

    // Embed the query
    const queryEmbeddings = await embedTexts([query]);
    const queryEmbedding = queryEmbeddings[0];

    // Prepare where clause if filters are provided
    const where = Object.keys(filters).length > 0 ? filters : undefined;

    // Search ChromaDB
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: where,
      include: ["metadatas", "documents", "distances"]
    });

    const formattedResults = [];

    if (results.documents && results.documents.length > 0 && results.documents[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        const content = results.documents[0][i];
        const metadata = results.metadatas[0][i];
        const distance = results.distances[0][i];
        
        // Convert distance to a similarity score 
        // (Assuming Xenova outputs normalized vectors, Chroma default L2 squared distance is 2*(1-cos(θ)))
        // Cosine similarity = 1 - (distance / 2) -> Score from 0 to 1
        const score = 1 - (distance / 2);

        // Filter out results with score < 0.3
        if (score >= 0.3) {
          formattedResults.push({
            content,
            metadata,
            score
          });
        }
      }
    }

    // Return array sorted by relevance (score descending)
    return formattedResults.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error in queryKnowledgeBase:", error);
    return [];
  }
}

/**
 * 2. buildContext
 * Formats chunks as numbered source blocks.
 */
export function buildContext(chunks) {
  try {
    if (!chunks || chunks.length === 0) return "";
    
    const formatted = chunks.map((chunk, index) => {
      const docName = chunk.metadata?.doc_name || 'Unknown Document';
      const docType = chunk.metadata?.doc_type || 'GENERAL';
      return `[Source ${index + 1} | ${docName} — ${docType}]\n${chunk.content}\n---`;
    });
    
    return formatted.join('\n\n');
  } catch (error) {
    console.error("Error in buildContext:", error);
    return "";
  }
}

/**
 * 3. buildCitations
 * Deduplicates the chunks by doc_name and builds a citations array.
 */
export function buildCitations(chunks) {
  try {
    if (!chunks || chunks.length === 0) return [];
    
    const uniqueDocs = new Map();
    
    chunks.forEach(chunk => {
      const docName = chunk.metadata?.doc_name || 'Unknown Document';
      const docType = chunk.metadata?.doc_type || 'GENERAL';
      
      // Map score from 0-1 to 0-100 percentage
      const relevance = Math.round((chunk.score || 0) * 100);
      
      if (!uniqueDocs.has(docName)) {
        uniqueDocs.set(docName, {
          document: docName,
          type: docType,
          relevance: relevance
        });
      } else {
        // Update relevance if this chunk has a higher score than a previously seen chunk for the same doc
        const existing = uniqueDocs.get(docName);
        if (relevance > existing.relevance) {
          existing.relevance = relevance;
        }
      }
    });
    
    // Return array sorted by relevance descending
    return Array.from(uniqueDocs.values()).sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error("Error in buildCitations:", error);
    return [];
  }
}
