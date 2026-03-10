import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function BugReport({ customer, onBack }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadBugs();
  }, [customer.id]);

  const loadBugs = async () => {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBugs(data || []);
    } catch (error) {
      console.error('Load bugs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setMessage({ text: '제목을 입력해주세요.', type: 'error' });
      return;
    }

    if (!description.trim()) {
      setMessage({ text: '내용을 입력해주세요.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('bug_reports')
        .insert({
          customer_id: customer.id,
          phone_number: customer.phone_number,
          title: title.trim(),
          description: description.trim(),
          status: 'pending'
        });

      if (error) throw error;

      setMessage({ text: '✅ 버그가 접수되었습니다!', type: 'success' });
      setTitle('');
      setDescription('');
      setShowForm(false);
      loadBugs();
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ text: '접수 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '대기중';
      case 'in_progress':
        return '처리중';
      case 'resolved':
        return '완료';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffa500';
      case 'in_progress':
        return '#2196f3';
      case 'resolved':
        return '#4caf50';
      default:
        return '#e0b0ff';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bug-report-view">
      <div className="bug-header">
        <button className="btn-back" onClick={onBack}>
          ← 돌아가기
        </button>
        <h1>🐛 버그 리포트</h1>
        <p className="subtitle">불편사항을 알려주세요</p>
      </div>

      {!showForm && (
        <button 
          className="btn btn-primary btn-report"
          onClick={() => setShowForm(true)}
        >
          + 새 버그 접수하기
        </button>
      )}

      {showForm && (
        <div className="bug-form">
          <div className="form-header">
            <h3>버그 접수</h3>
            <button 
              className="btn-close"
              onClick={() => {
                setShowForm(false);
                setTitle('');
                setDescription('');
                setMessage({ text: '', type: '' });
              }}
            >
              ✕
            </button>
          </div>

          <div className="input-group">
            <label>제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 카드 선택이 안돼요"
              maxLength="100"
              disabled={submitting}
            />
          </div>

          <div className="input-group">
            <label>상세 내용 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="발생한 문제를 자세히 설명해주세요"
              rows="6"
              maxLength="1000"
              disabled={submitting}
            />
            <div className="char-count">{description.length}/1000</div>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '접수 중...' : '접수하기'}
          </button>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      )}

      <div className="bug-list-section">
        <h3>내 버그 리포트</h3>
        
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : bugs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>접수된 버그가 없습니다</h3>
            <p>불편사항이 있으시면 언제든 알려주세요</p>
          </div>
        ) : (
          <div className="bug-list">
            {bugs.map((bug) => (
              <div key={bug.id} className="bug-card">
                <div className="bug-card-header">
                  <div className="bug-title">{bug.title}</div>
                  <div 
                    className="bug-status"
                    style={{ 
                      background: `${getStatusColor(bug.status)}33`,
                      border: `2px solid ${getStatusColor(bug.status)}`,
                      color: getStatusColor(bug.status)
                    }}
                  >
                    {getStatusText(bug.status)}
                  </div>
                </div>
                
                <div className="bug-description">{bug.description}</div>
                
                <div className="bug-footer">
                  <div className="bug-date">
                    접수일: {formatDate(bug.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BugReport;