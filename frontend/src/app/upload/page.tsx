'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload as UploadIcon, FileText, File, RefreshCw, CheckCircle2, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-context';

type Document = {
  document_name: string;
  type: string;
  chunks: number;
};

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await axios.get('http://localhost:3001/api/documents');
      const mapped = (res.data.documents || []).map((doc: any) => ({
        document_name: doc.doc_name,
        type: doc.doc_type,
        chunks: doc.chunk_count
      }));
      setDocuments(mapped);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch documents', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const allowedExtensions = ['pdf', 'docx', 'txt', 'csv'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!ext || !allowedExtensions.includes(ext)) {
      showToast('Unsupported file type. Use PDF, DOCX, TXT, or CSV.', 'error');
      return;
    }

    setUploadFile(file);
    setUploading(true);
    setProgress(0);

    // Simulate progress animation for UX
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 70) {
          clearInterval(interval);
          return 70;
        }
        return p + 10;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await axios.post('http://localhost:3001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      clearInterval(interval);
      setProgress(100);
      showToast('File indexed successfully!', 'success');
      
      setTimeout(() => {
        setUploading(false);
        setUploadFile(null);
        setProgress(0);
        fetchDocuments();
      }, 1000);
      
    } catch (err: any) {
      clearInterval(interval);
      setUploading(false);
      setUploadFile(null);
      setProgress(0);
      showToast(err.response?.data?.error || 'Upload failed.', 'error');
    }
  };

  const getBadgeColor = (type?: string) => {
    const t = (type ?? "").toUpperCase();

    if (t.includes("PDF"))
      return "bg-red-500/20 text-red-400 border-red-500/30";

    if (t.includes("DOC"))
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";

    if (t.includes("TXT"))
      return "bg-green-500/20 text-green-400 border-green-500/30";

    if (t.includes("CSV"))
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <UploadIcon className="w-6 h-6 text-emerald-500" /> Document Ingestion
          </h2>
          <p className="text-slate-400 mt-1">Upload unstructured PDFs, Word documents, and logs to vectorize into the knowledge base.</p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden",
          isDragging ? "border-emerald-500 bg-emerald-500/5" : "border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-600",
          uploading && "pointer-events-none"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.docx,.txt,.csv"
          onChange={handleFileChange}
        />
        
        {uploading && uploadFile ? (
          <div className="flex flex-col items-center z-10 w-full max-w-md px-6">
            <File className="w-12 h-12 text-emerald-500 mb-4 animate-pulse" />
            <h3 className="text-slate-200 font-medium text-center truncate w-full mb-4">{uploadFile.name}</h3>
            
            <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {progress === 100
                ? "Chunking & Embedding..."
                : `Uploading ${progress}%`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center z-10">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
              <UploadIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-1">Drop files here or click to browse</h3>
            <p className="text-sm text-slate-500">Supports PDF, DOCX, TXT, CSV (Max 50MB)</p>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Indexed Documents
          </h3>
          <button 
            onClick={fetchDocuments}
            disabled={loadingDocs}
            className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loadingDocs && "animate-spin text-emerald-500")} />
          </button>
        </div>
        
        <div className="p-2">
          {loadingDocs ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500/50" />
              <span>Fetching index...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No documents have been indexed yet.
            </div>
          ) : (
            <div className="space-y-1">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-800/50 rounded-lg transition-colors gap-3 border border-transparent hover:border-slate-800">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <span className="text-slate-200 font-medium text-sm truncate" title={doc.document_name}>
                      {doc.document_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-13 sm:ml-0">
                    <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider", getBadgeColor(doc.type))}>
                      {doc.type}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700 font-medium">
                      {doc.chunks} chunks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
