import React, { useEffect, useState } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InboxIcon from '@mui/icons-material/Inbox';
import { getHistory } from './db';
import './HistorySection.css';

interface HistoryEntry {
  id: string;
  action: string;
  studentId: string;
  timestamp: string;
  before?: any;
  after?: any;
  details?: any;
}

const HistorySection: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then((data: HistoryEntry[]) => {
      const sortedData = data.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setHistory(sortedData);
      setFilteredHistory(sortedData);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!actionFilter) {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(h => h.action === actionFilter));
    }
  }, [actionFilter, history]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('admission') || action.includes('add')) return 'admission';
    if (action.includes('update')) return 'update';
    if (action.includes('delete')) return 'delete';
    if (action.includes('fee') || action.includes('payment')) return 'fee';
    return 'update';
  };

  const formatActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDetails = (data: any, compareData?: any) => {
    if (!data || typeof data !== 'object') {
      return <p style={{ color: '#6B778C', fontStyle: 'italic' }}>No details available</p>;
    }

    return Object.entries(data).map(([key, value]) => {
      const oldValue = compareData ? compareData[key] : undefined;
      const isChanged = compareData && JSON.stringify(value) !== JSON.stringify(oldValue);

      return (
        <div key={key} className="history-detail-item">
          <span className="history-detail-key">{key.replace(/_/g, ' ')}</span>
          <span className={`history-detail-value ${isChanged ? 'changed' : ''}`}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      );
    });
  };

  const uniqueActions = [...new Set(history.map(h => h.action))];

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <h1 className="history-title">
          <HistoryIcon />
          Activity Log
        </h1>
        <p className="history-subtitle">Track all changes and activities in the system</p>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="history-filter-field">
          <label className="history-filter-label">Filter by Action</label>
          <select
            className="history-filter-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {formatActionLabel(action)}
              </option>
            ))}
          </select>
        </div>
        <div className="history-stats">
          Showing {filteredHistory.length} of {history.length} entries
        </div>
      </div>

      {/* Table */}
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}></th>
              <th>Action</th>
              <th>Student ID</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>
                  Loading history...
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="history-empty">
                    <InboxIcon />
                    <p>No history records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredHistory.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr>
                    <td>
                      <button
                        className="history-expand-btn"
                        onClick={() => toggleRow(entry.id)}
                      >
                        {expandedRows.has(entry.id) ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </button>
                    </td>
                    <td>
                      <span className={`history-action-badge ${getActionBadgeClass(entry.action)}`}>
                        {formatActionLabel(entry.action)}
                      </span>
                    </td>
                    <td>{entry.studentId || entry.details?.studentId || '-'}</td>
                    <td>{formatDate(entry.timestamp)}</td>
                  </tr>
                  {expandedRows.has(entry.id) && (
                    <tr className="history-detail-row">
                      <td colSpan={4}>
                        <div className="history-detail-content">
                          <div className="history-detail-section">
                            <h4 className="history-detail-title">Before</h4>
                            {entry.before ? renderDetails(entry.before) : (
                              <p style={{ color: '#6B778C', fontStyle: 'italic' }}>No previous data</p>
                            )}
                          </div>
                          <div className="history-detail-section">
                            <h4 className="history-detail-title">After / Details</h4>
                            {renderDetails(entry.after || entry.details, entry.before)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorySection;