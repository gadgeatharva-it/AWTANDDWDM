import api from './api';

export const exportService = {
  executiveSummaryCsv() {
    return api.get('/export/executive-summary', { responseType: 'blob' });
  },
};

