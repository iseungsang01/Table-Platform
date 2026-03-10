import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function Notice({ onBack, customer, onNoticeRead }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);
  const [myReports, setMyReports] = useState([]);
  
  // 버그 리포트 폼 상태
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    report_type: '어플 버그',
    category: 'app' // 'app' 또는 'store'
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadNotices();
    if (customer) {
      loadMyReports();
      markNoticesAsRead();
    }
  }, [customer]);

  // 내 접수 내역을 볼 때 자동으로 읽음 처리
  useEffect(() => {
    if (showMyReports && customer) {
      markReportsAsRead();
    }
  }, [showMyReports]);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Load notices error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNoticesAsRead = async () => {
    if (!customer) return;

    try {
      const { data: allNotices, error: noticesError } = await supabase
        .from('notices')
        .select('id')
        .eq('is_published', true);

      if (noticesError) throw noticesError;

      for (const notice of allNotices || []) {
        await supabase
          .from('notice_reads')
          .insert({
            customer_id: customer.id,
            notice_id: notice.id
          })
          .select();
      }

      if (onNoticeRead) {
        onNoticeRead();
      }
    } catch (error) {
      if (error.code !== '23505') {
        console.error('Mark notices as read error:', error);
      }
    }
  };

  const loadMyReports = async () => {
    if (!customer) return;
    
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyReports(data || []);
    } catch (error) {
      console.error('Load my reports error:', error);
    }
  };

  const markReportsAsRead = async () => {
    if (!customer) return;
    
    try {
      // 답변이 있고 읽지 않은 모든 리포트를 읽음 처리
      const unreadReports = myReports.filter(
        report => report.admin_response && !report.response_read
      );

      if (unreadReports.length === 0) return;

      for (const report of unreadReports) {
        await supabase
          .from('bug_reports')
          .update({ response_read: true })
          .eq('id', report.id);
      }

      // 업데이트 후 다시 로드
      await loadMyReports();
      
      // 상위 컴포넌트에 알림
      if (onNoticeRead) {
        onNoticeRead();
      }
    } catch (error) {
      console.error('Mark reports as read error:', error);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportData.title.trim()) {
      setMessage({ text: '제목을 입력해주세요.', type: 'error' });
      return;
    }

    if (!reportData.description.trim()) {
      setMessage({ text: '내용을 입력해주세요.', type: 'error' });
      return;
    }

    if (reportData.description.length > 500) {
      setMessage({ text: '내용은 500자 이내로 작성해주세요.', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('bug_reports')
        .insert({
          customer_id: customer?.id || null,
          customer_phone: customer?.phone_number || null,
          customer_nickname: customer?.nickname || '익명',
          title: reportData.title.trim(),
          description: reportData.description.trim(),
          report_type: reportData.report_type,
          category: reportData.category,
          status: '접수',
          response_read: false
        });

      if (error) throw error;

      setMessage({ text: '✅ 접수되었습니다. 빠른 시일 내에 확인하겠습니다.', type: 'success' });
      
      // 폼 초기화
      setReportData({
        title: '',
        description: '',
        report_type: '어플 버그',
        category: 'app'
      });

      // 내 버그 리포트 새로고침
      loadMyReports();

      // 2초 후 폼 닫기
      setTimeout(() => {
        setShowReportForm(false);
        setMessage({ text: '', type: '' });
      }, 2000);

    } catch (error) {
      console.error('Submit report error:', error);
      setMessage({ text: '접수 중 오류가 발생했습니다: ' + error.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryChange = (category) => {
    setReportData({
      ...reportData,
      category,
      report_type: category === 'app' ? '어플 버그' : '가게 불편사항'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      '접수': '접수',
      '처리중': '처리중',
      '완료': '완료',
      '보류': '보류'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      '접수': '#ffa500',
      '처리중': '#2196f3',
      '완료': '#4caf50',
      '보류': '#9e9e9e'
    };
    return colorMap[status] || '#e0b0ff';
  };

  const getCategoryBadge = (category) => {
    if (category === 'app') {
      return { text: '📱 어플', color: '#9370db' };
    } else {
      return { text: '🏪 가게', color: '#ff6b6b' };
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
    <div className="notice-view">
      <div className="notice-header">
        <button className="btn-back" onClick={onBack}>
          ← 돌아가기
        </button>
        <h1>📢 공지사항</h1>
        <p className="subtitle">매장의 새로운 소식을 확인하세요</p>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className="btn-report"
            onClick={() => {
              setShowReportForm(!showReportForm);
              setShowMyReports(false);
            }}
          >
            {showReportForm ? '✖ 닫기' : '🛠 버그/불편사항 접수'}
          </button>
          
          <button 
            className="btn-report"
            style={{ 
              background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              borderColor: '#2196f3'
            }}
            onClick={() => {
              setShowMyReports(!showMyReports);
              setShowReportForm(false);
            }}
          >
            {showMyReports ? '✖ 닫기' : `📋 내 접수 내역 (${myReports.length})`}
          </button>
        </div>
      </div>

      {/* 내 버그 리포트 목록 */}
      {showMyReports && (
        <div className="bug-report-form" style={{ borderColor: '#2196f3' }}>
          <h2 style={{ color: '#2196f3' }}>📋 내 접수 내역</h2>
          <p className="form-description">
            접수하신 버그 및 불편사항의 처리 상태를 확인할 수 있습니다.
          </p>

          {myReports.length === 0 ? (
            <div className="empty-state" style={{ margin: '20px 0' }}>
              <div className="empty-icon">🔭</div>
              <h3>접수된 내역이 없습니다</h3>
              <p>불편사항이 있으시면 언제든 접수해주세요</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {myReports.map((report) => {
                const categoryBadge = getCategoryBadge(report.category);
                
                return (
                  <div 
                    key={report.id} 
                    style={{
                      background: 'rgba(138, 43, 226, 0.1)',
                      border: '2px solid #8a2be2',
                      borderRadius: '10px',
                      padding: '15px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <span style={{
                          background: `${categoryBadge.color}33`,
                          color: categoryBadge.color,
                          border: `2px solid ${categoryBadge.color}`,
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginRight: '8px'
                        }}>
                          {categoryBadge.text}
                        </span>
                        <span style={{
                          background: 'rgba(138, 43, 226, 0.3)',
                          color: '#e0b0ff',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          marginRight: '8px'
                        }}>
                          {report.report_type}
                        </span>
                        <span style={{ color: 'gold', fontWeight: '700', fontSize: '16px' }}>
                          {report.title}
                        </span>
                      </div>
                      <div 
                        style={{
                          background: `${getStatusColor(report.status)}33`,
                          border: `2px solid ${getStatusColor(report.status)}`,
                          color: getStatusColor(report.status),
                          padding: '4px 10px',
                          borderRadius: '15px',
                          fontSize: '12px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {getStatusText(report.status)}
                      </div>
                    </div>
                    
                    <div style={{ 
                      color: 'white', 
                      fontSize: '14px', 
                      marginBottom: '10px',
                      lineHeight: '1.5'
                    }}>
                      {report.description}
                    </div>
                    
                    {report.admin_response && (
                      <div style={{
                        background: 'rgba(76, 175, 80, 0.1)',
                        border: '2px solid #4caf50',
                        borderRadius: '8px',
                        padding: '10px',
                        marginTop: '10px'
                      }}>
                        <div style={{ 
                          color: '#4caf50', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          marginBottom: '5px'
                        }}>
                          💬 관리자 답변
                        </div>
                        <div style={{ color: 'white', fontSize: '14px', lineHeight: '1.5' }}>
                          {report.admin_response}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ 
                      color: '#e0b0ff', 
                      fontSize: '12px', 
                      opacity: 0.8,
                      marginTop: '10px'
                    }}>
                      접수일: {formatDate(report.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 버그 리포트 폼 */}
      {showReportForm && (
        <div className="bug-report-form">
          <h2>🛠 버그 및 불편사항 접수</h2>
          <p className="form-description">
            앱 사용 중 불편하신 점이나 버그를 발견하셨다면 알려주세요.<br />
            소중한 의견을 반영하여 더 나은 서비스를 제공하겠습니다.
          </p>

          {/* 카테고리 선택 */}
          <div className="input-group">
            <label>분류 선택</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleCategoryChange('app')}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '10px',
                  border: reportData.category === 'app' ? '3px solid #9370db' : '2px solid #8a2be2',
                  background: reportData.category === 'app' ? 'rgba(147, 112, 219, 0.3)' : 'rgba(138, 43, 226, 0.1)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                📱 어플 불편사항
              </button>
              <button
                onClick={() => handleCategoryChange('store')}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '10px',
                  border: reportData.category === 'store' ? '3px solid #ff6b6b' : '2px solid #8a2be2',
                  background: reportData.category === 'store' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(138, 43, 226, 0.1)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🏪 가게 불편사항
              </button>
            </div>
          </div>

          {/* 세부 유형 선택 */}
          <div className="input-group">
            <label>세부 유형</label>
            <select
              value={reportData.report_type}
              onChange={(e) => setReportData({...reportData, report_type: e.target.value})}
              disabled={submitting}
            >
              {reportData.category === 'app' ? (
                <>
                  <option value="어플 버그">🐛 어플 버그</option>
                  <option value="어플 불편사항">😕 어플 불편사항</option>
                  <option value="어플 개선 건의">💡 어플 개선 건의</option>
                </>
              ) : (
                <>
                  <option value="가게 불편사항">😔 가게 불편사항</option>
                  <option value="서비스 개선 요청">✨ 서비스 개선 요청</option>
                  <option value="기타 문의">❓ 기타 문의</option>
                </>
              )}
            </select>
          </div>

          <div className="input-group">
            <label>제목</label>
            <input
              type="text"
              value={reportData.title}
              onChange={(e) => setReportData({...reportData, title: e.target.value})}
              placeholder="간단한 제목을 입력하세요"
              maxLength="100"
              disabled={submitting}
            />
          </div>

          <div className="input-group">
            <label>상세 내용</label>
            <textarea
              value={reportData.description}
              onChange={(e) => setReportData({...reportData, description: e.target.value})}
              placeholder={reportData.category === 'app' 
                ? "발생한 문제나 불편한 점을 자세히 설명해주세요"
                : "매장 이용 중 불편했던 점이나 개선 사항을 자세히 알려주세요"}
              maxLength="500"
              rows="6"
              disabled={submitting}
            />
            <div className="char-count">{reportData.description.length}/500</div>
          </div>

          <button 
            className="btn btn-primary btn-submit-report"
            onClick={handleSubmitReport}
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

      {/* 공지사항 목록 */}
      {!showReportForm && !showMyReports && (
        <>
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : notices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔭</div>
              <h3>등록된 공지사항이 없습니다</h3>
            </div>
          ) : (
            <div className="notice-list">
              {notices.map((notice) => (
                <div 
                  key={notice.id} 
                  className={`notice-card ${notice.is_pinned ? 'pinned' : ''}`}
                >
                  {notice.is_pinned && (
                    <div className="pin-badge">📌 고정</div>
                  )}
                  <div className="notice-title">{notice.title}</div>
                  <div className="notice-date">{formatDate(notice.created_at)}</div>
                  <div 
                    className="notice-content"
                    dangerouslySetInnerHTML={{ 
                      __html: notice.content.replace(
                        /\[([^\]]+)\]\(([^)]+)\)/g, 
                        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: gold; text-decoration: underline;">$1</a>'
                      )
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Notice;