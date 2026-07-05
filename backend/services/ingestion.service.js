import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ChromaClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// 1. getEmbedder()
export async function getEmbedder() {
  try {
    if (!global._embedder) {
      const { pipeline } = await import('@xenova/transformers');
      global._embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }
    return global._embedder;
  } catch (error) {
    console.error("Error in getEmbedder:", error);
    throw error;
  }
}

// 2. embedTexts(textsArray)
export async function embedTexts(textsArray) {
  try {
    const embedder = await getEmbedder();
    const batchSize = 50;
    const embeddings = [];

    for (let i = 0; i < textsArray.length; i += batchSize) {
      const batch = textsArray.slice(i, i + batchSize);
      
      // Process 50 at a time
      const batchOutputs = await Promise.all(
        batch.map(async (text) => {
          const output = await embedder(text, { pooling: 'mean', normalize: true });
          return Array.from(output.data);
        })
      );
      
      embeddings.push(...batchOutputs);
    }

    return embeddings;
  } catch (error) {
    console.error("Error in embedTexts:", error);
    throw error;
  }
}

// 3. extractText(filepath)
export async function extractText(filepath) {
  try {
    const ext = path.extname(filepath).toLowerCase();
    
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filepath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filepath });
      return result.value;
    } else if (ext === '.txt' || ext === '.csv') {
      return fs.readFileSync(filepath, 'utf-8');
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  } catch (error) {
    console.error(`Error in extractText for ${filepath}:`, error);
    throw error;
  }
}

// 4. chunkText(text, chunkSize=800, overlap=150)
export function chunkText(text, chunkSize = 800, overlap = 150) {
  try {
    const chunks = [];
    let startIndex = 0;
    const textLength = text.length;

    if (chunkSize <= overlap) {
      throw new Error("chunkSize must be greater than overlap");
    }

    while (startIndex < textLength) {
      let endIndex = startIndex + chunkSize;
      if (endIndex > textLength) {
        endIndex = textLength;
      }

      const chunk = text.slice(startIndex, endIndex);
      
      // Filter out chunks shorter than 50 chars
      if (chunk.length >= 50) {
        chunks.push(chunk);
      }

      startIndex += (chunkSize - overlap);
    }

    return chunks;
  } catch (error) {
    console.error("Error in chunkText:", error);
    throw error;
  }
}

// 5. detectDocType(filename)
export function detectDocType(filename) {
  try {
    const nameLower = filename.toLowerCase();
    
    if (nameLower.includes('sop') || nameLower.includes('procedure') || nameLower.includes('instruction')) {
      return 'SOP';
    } else if (nameLower.includes('maintenance') || nameLower.includes('work order') || nameLower.includes('repair')) {
      return 'MAINTENANCE';
    } else if (nameLower.includes('oisd') || nameLower.includes('factory act') || nameLower.includes('regulation') || nameLower.includes('dgms') || nameLower.includes('peso')) {
      return 'REGULATION';
    } else if (nameLower.includes('pid') || nameLower.includes('p&id') || nameLower.includes('drawing')) {
      return 'PID';
    } else if (nameLower.includes('inspection') || nameLower.includes('audit') || nameLower.includes('checklist')) {
      return 'INSPECTION';
    } else {
      return 'GENERAL';
    }
  } catch (error) {
    console.error(`Error in detectDocType for ${filename}:`, error);
    return 'GENERAL';
  }
}

// 6. getCollection()
export async function getCollection() {
  try {
    if (!global._chromaCollection) {
      const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
      const client = new ChromaClient({ path: chromaUrl });
      
      global._chromaCollection = await client.getOrCreateCollection({
        name: "plantmind_docs",
      });
    }
    return global._chromaCollection;
  } catch (error) {
    console.error("Error in getCollection:", error);
    throw error;
  }
}

// 7. ingestDocument(filepath, originalFilename, metadata={})
export async function ingestDocument(filepath, originalFilename, metadata = {}) {
  try {
    const text = await extractText(filepath);
    const chunks = chunkText(text);
    
    if (chunks.length === 0) {
      throw new Error("No text chunks could be generated (file may be empty or chunks too small).");
    }

    const docType = detectDocType(originalFilename);
    const embeddings = await embedTexts(chunks);
    const collection = await getCollection();
    
    const docId = metadata.doc_id || uuidv4();
    const uploadedBy = metadata.uploaded_by || 'system';

    const ids = chunks.map((_, i) => `${docId}-chunk-${i}`);
    const metadatas = chunks.map((_, i) => ({
      doc_id: docId,
      doc_name: originalFilename,
      doc_type: docType,
      chunk_index: i,
      uploaded_by: uploadedBy
    }));

    await collection.add({
      ids: ids,
      embeddings: embeddings,
      metadatas: metadatas,
      documents: chunks
    });

    return {
      success: true,
      doc_id: docId,
      doc_name: originalFilename,
      doc_type: docType,
      chunks_created: chunks.length
    };
  } catch (error) {
    console.error(`Error in ingestDocument for ${originalFilename}:`, error);
    // Return error object instead of throwing to prevent crashing callers
    return {
      success: false,
      error: error.message || error.toString()
    };
  }
}

// 8. getDocumentList()
export async function getDocumentList() {
  try {
    const collection = await getCollection();
    
    // Fetch from ChromaDB. By default, it might limit results, 
    // but without parameters it generally returns all or a large default.
    const results = await collection.get({
      include: ["metadatas"]
    });

    const docMap = new Map();

    if (results.metadatas && results.metadatas.length > 0) {
      for (const meta of results.metadatas) {
        if (!meta) continue;
        
        const { doc_id, doc_name, doc_type } = meta;
        
        if (!docMap.has(doc_id)) {
          docMap.set(doc_id, {
            doc_id,
            doc_name,
            doc_type,
            chunk_count: 1
          });
        } else {
          docMap.get(doc_id).chunk_count += 1;
        }
      }
    }

    return Array.from(docMap.values());
  } catch (error) {
    console.error("Error in getDocumentList:", error);
    throw error;
  }
}
