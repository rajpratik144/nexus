import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Trash2, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api'; // FIX: Use the secured api service

const FileVault = ({ isOpen, onClose }) => {
  // FIX: Always initialize as an empty array
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchFiles();
  }, [isOpen]);

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files/');
      // FIX: Double check it's an array before setting state
      if (Array.isArray(res.data)) {
        setFiles(res.data);
      } else {
        setFiles([]);
      }
    } catch (err) { 
      console.error("Failed to fetch files", err);
      setFiles([]); // Set to empty array on error to prevent crash
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/files/upload', formData);
      fetchFiles();
    } catch (err) { 
      alert("Upload failed. Ensure backend is running."); 
    } finally { 
      setUploading(false); 
    }
  };

  const deleteFile = async (docId) => {
    try {
      await api.delete(`/files/${docId}`);
      fetchFiles();
    } catch (err) { 
      alert("Delete failed"); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <FileText className="text-blue-600" size={24} /> Knowledge Vault
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="dark:text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              <label className="group relative w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all mb-8">
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <span className="text-sm font-bold text-blue-600">Analyzing Document...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="text-slate-400 group-hover:text-blue-500 mb-2" size={32} />
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center px-4">
                        Click to add PDF or TXT to your Intelligence Engine
                    </span>
                  </>
                )}
              </label>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {/* FIX: Use safety check before mapping */}
                {Array.isArray(files) && files.length > 0 ? (
                  files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                          <CheckCircle size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold dark:text-white truncate max-w-[200px]">{file.file_name}</div>
                          <div className="text-xs text-slate-400">{new Date(file.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button onClick={() => deleteFile(file.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500 text-sm italic">
                    Your vault is currently empty.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FileVault;