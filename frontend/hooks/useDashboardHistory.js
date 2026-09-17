import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
export default function useDashboardHistory() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('loading');
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    api.get('/api/data', { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const rows = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(rows)) throw new Error('Unexpected history response');
      setRecords(rows.filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r?.date || '')));
      setStatus('ready');
    }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [version]);
  return { records, status, refresh };
}
