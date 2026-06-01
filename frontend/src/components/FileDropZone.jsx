import { useRef, useState } from 'react';

const ACCEPT_RESUME = '.pdf,.doc,.docx';
const ACCEPT_JD     = '.pdf,.doc,.docx,.txt';

export default function FileDropZone({
  onFiles,
  multiple = true,
  label = 'Upload Files',
  hint = 'PDF, DOC, DOCX',
  icon = '📄',
  accept,
  className = '',
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const acceptStr = accept || (multiple ? ACCEPT_RESUME : ACCEPT_JD);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = filterFiles(Array.from(e.dataTransfer.files), acceptStr);
    if (files.length) onFiles(files);
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) onFiles(files);
    e.target.value = '';  // reset so same file can be re-selected
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed
        p-8 text-center transition-all duration-200 select-none
        ${dragging
          ? 'border-accent bg-accent/8 scale-[1.01]'
          : 'border-border bg-surface hover:border-accent/40 hover:bg-accent/4'
        }
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-white font-semibold font-display text-sm mb-1">{label}</p>
      <p className="text-white/30 text-xs">{hint} · Drag & drop or click to browse</p>

      {dragging && (
        <div className="absolute inset-0 rounded-2xl border-2 border-accentHi bg-accent/10 flex items-center justify-center">
          <span className="text-accentHi font-semibold text-sm">Drop files here</span>
        </div>
      )}
    </div>
  );
}

function filterFiles(files, accept) {
  const exts = accept.split(',').map((e) => e.trim().toLowerCase());
  return files.filter((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    return exts.includes(ext);
  });
}
