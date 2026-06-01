import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE,
  timeout: 120_000,   // 2 min — AI analysis can take a moment
});

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession() {
  const { data } = await api.post('/api/sessions');
  return data.session;
}

export async function getSession(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}`);
  return data;
}

export async function setJobDescription(sessionId, jdText, jdFilename = null) {
  const { data } = await api.post(`/api/sessions/${sessionId}/jd`, {
    jdText,
    jdFilename,
  });
  return data.session;
}

export async function deleteSession(sessionId) {
  await api.delete(`/api/sessions/${sessionId}`);
}

// ── Resumes ───────────────────────────────────────────────────────────────────

export async function uploadResumes(sessionId, files, onProgress) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('resumes', file);
  }

  const { data } = await api.post(`/api/sessions/${sessionId}/resumes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}

export async function deleteResume(sessionId, candidateId) {
  await api.delete(`/api/sessions/${sessionId}/resumes/${candidateId}`);
}

// ── Analysis ──────────────────────────────────────────────────────────────────

export async function analyzeSession(sessionId) {
  const { data } = await api.post(`/api/sessions/${sessionId}/analyze`);
  return data;
}

// ── Results ───────────────────────────────────────────────────────────────────

export async function getResults(sessionId, { search = '', sort = 'desc' } = {}) {
  const { data } = await api.get(`/api/sessions/${sessionId}/results`, {
    params: { search, sort },
  });
  return data;
}

export function exportCSVUrl(sessionId) {
  return `${BASE}/api/sessions/${sessionId}/export`;
}
