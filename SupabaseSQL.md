-- ==========================================
-- 1. 초기화 및 확장 모듈
-- ==========================================
DROP VIEW IF EXISTS customer_details;
DROP TABLE IF EXISTS vote_responses, votes, bug_reports, notices, coupon_history, visit_history, customers, app_configs CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. 테이블 생성
-- ==========================================

-- [고객 테이블]
CREATE TABLE public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
    phone_number varchar(13) NOT NULL,
    nickname varchar(20),
    password text NOT NULL DEFAULT crypt('1234', gen_salt('bf')), -- 비밀번호 필드 추가 (기본값 '1234'의 해시값)
    birthday date,
    
    current_stamps integer DEFAULT 0 CHECK (current_stamps >= 0),
    total_stamps integer DEFAULT 0 CHECK (total_stamps >= 0),
    coupons integer DEFAULT 0 CHECK (coupons >= 0),
    
    visit_count integer DEFAULT 0 CHECK (visit_count >= 0),
    last_visit timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW(),
    deleted_at timestamptz,
    
    CONSTRAINT chk_phone_format CHECK (phone_number ~ '^\d{3}-\d{3,4}-\d{4}$')
);

-- 유니크 인덱스 (활성 유저 중 중복 번호 방지)
CREATE UNIQUE INDEX idx_customers_phone_active ON customers(phone_number) WHERE deleted_at IS NULL;

-- [방문 및 스탬프 적립 이력]
CREATE TABLE public.visit_history (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    visit_date timestamptz DEFAULT NOW(),
    is_deleted boolean DEFAULT FALSE
);

-- [쿠폰 이력]
CREATE TABLE public.coupon_history (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    issued_at timestamptz DEFAULT NOW(),
    coupon_code varchar(50) NOT NULL UNIQUE,
    valid_until timestamptz,
    is_used boolean DEFAULT false,
    used_at timestamptz,
    -- used_at이 있으면 is_used는 반드시 true여야 함
    CONSTRAINT chk_coupon_status CHECK ( (used_at IS NULL AND is_used = false) OR (used_at IS NOT NULL AND is_used = true) )
);

-- [공지사항]
CREATE TABLE public.notices (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title varchar(100) NOT NULL,
    content text NOT NULL,
    is_pinned boolean DEFAULT false,
    is_published boolean DEFAULT true,
    created_at timestamptz DEFAULT NOW()
);

-- [버그 리포트]
CREATE TABLE public.bug_reports (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
    title varchar(100) NOT NULL,
    description text NOT NULL,
    report_type varchar(30) NOT NULL,
    status varchar(10) DEFAULT '접수' CHECK (status IN ('접수', '확인중', '완료', '보류')),
    created_at timestamptz DEFAULT NOW(),
    device_info jsonb DEFAULT '{}'::jsonb,
    admin_response text DEFAULT ''
);

-- [투표 기능]
CREATE TABLE public.votes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title varchar(200) NOT NULL,
    description text,
    options jsonb NOT NULL, 
    allow_multiple boolean DEFAULT false,
    max_selections smallint DEFAULT 1,
    is_anonymous boolean DEFAULT true,
    is_active boolean DEFAULT true,
    starts_at timestamptz DEFAULT NOW(),
    ends_at timestamptz,
    created_at timestamptz DEFAULT NOW()
);

-- [투표 응답]
CREATE TABLE public.vote_responses (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vote_id integer NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    selected_options integer[] NOT NULL,
    voted_at timestamptz DEFAULT NOW(),
    UNIQUE(vote_id, customer_id)
);

-- ==========================================
-- 4. 인덱스 설정 (최적화)
-- ==========================================
CREATE INDEX idx_visit_history_customer ON visit_history(customer_id);
CREATE INDEX idx_coupon_history_customer ON coupon_history(customer_id);
CREATE INDEX idx_bug_reports_customer ON bug_reports(customer_id);
CREATE INDEX idx_vote_responses_customer ON vote_responses(customer_id);
CREATE INDEX idx_notices_pinned_published ON notices(is_pinned, is_published) WHERE is_published = true;

-- ==========================================
-- 5. RLS (Row Level Security) 활성화
-- ==========================================
-- 모든 테이블에 대해 RLS를 켭니다. 이제 정책(Policy) 없이는 아무도 접근 못합니다.
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_responses ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. RLS 정책 설정 (Policies)
-- ==========================================

-- [1] Customers (고객 정보)
CREATE POLICY "Customers SELECT" ON customers FOR SELECT USING (true);
CREATE POLICY "Customers INSERT" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers UPDATE" ON customers FOR UPDATE USING (true);

-- [2] Visit History (방문 기록)
CREATE POLICY "Visit History SELECT" ON visit_history FOR SELECT USING (true);
CREATE POLICY "Visit History INSERT" ON visit_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Visit History UPDATE" ON visit_history FOR UPDATE USING (true);
CREATE POLICY "Visit History DELETE" ON visit_history FOR DELETE USING (true);

-- [3] Coupon History (쿠폰 기록)
CREATE POLICY "Coupon History SELECT" ON coupon_history FOR SELECT USING (true);
CREATE POLICY "Coupon History INSERT" ON coupon_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Coupon History UPDATE" ON coupon_history FOR UPDATE USING (true);
CREATE POLICY "Coupon History DELETE" ON coupon_history FOR DELETE USING (true);

-- [4] Notices (공지사항)
CREATE POLICY "Notices SELECT" ON notices FOR SELECT USING (true);
CREATE POLICY "Notices INSERT" ON notices FOR INSERT WITH CHECK (true);
CREATE POLICY "Notices UPDATE" ON notices FOR UPDATE USING (true);
CREATE POLICY "Notices DELETE" ON notices FOR DELETE USING (true);

-- [5] Bug Reports (버그 제보 / 매장 제안)
CREATE POLICY "Bug Reports SELECT" ON bug_reports FOR SELECT USING (true);
CREATE POLICY "Bug Reports INSERT" ON bug_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Bug Reports UPDATE" ON bug_reports FOR UPDATE USING (true);
CREATE POLICY "Bug Reports DELETE" ON bug_reports FOR DELETE USING (true);

-- [6] Votes (투표 주제)
CREATE POLICY "Votes SELECT" ON votes FOR SELECT USING (true);
CREATE POLICY "Votes INSERT" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Votes UPDATE" ON votes FOR UPDATE USING (true);
CREATE POLICY "Votes DELETE" ON votes FOR DELETE USING (true);

-- [7] Vote Responses (투표 응답)
CREATE POLICY "Vote Responses SELECT" ON vote_responses FOR SELECT USING (true);
CREATE POLICY "Vote Responses INSERT" ON vote_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Vote Responses UPDATE" ON vote_responses FOR UPDATE USING (true);
CREATE POLICY "Vote Responses DELETE" ON vote_responses FOR DELETE USING (true);

-- ==========================================
-- 7. RPC 함수 (Security Definer)
-- ==========================================

-- [기능 1] 닉네임 변경
CREATE OR REPLACE FUNCTION update_my_nickname(
    p_id uuid,
    p_new_nickname text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE customers SET nickname = p_new_nickname WHERE id = p_id;
    RETURN FOUND;
END;
$$;

-- [기능 2] 회원 탈퇴 (Soft Delete)
CREATE OR REPLACE FUNCTION delete_my_account(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE customers
    SET deleted_at = NOW(),
        phone_number = phone_number || '_deleted_' || substring(md5(random()::text) from 1 for 5)
    WHERE id = p_id;
    RETURN FOUND;
END;
$$;

-- [기능 3] 방문 횟수 증가
CREATE OR REPLACE FUNCTION increment_visit_count(target_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET 
    visit_count = COALESCE(visit_count, 0) + 1,
    last_visit = NOW()
  WHERE id = target_customer_id;
END;
$$;

-- [기능 4] 관리자 비밀번호 검증 (해시 비교 방식)
CREATE OR REPLACE FUNCTION verify_admin_password(p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_hashed_password TEXT;
BEGIN
  SELECT value INTO v_hashed_password FROM app_configs WHERE key = 'admin_password';
  RETURN v_hashed_password = crypt(p_password, v_hashed_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [기능 5] 관리자 비밀번호 변경
CREATE OR REPLACE FUNCTION update_admin_password(p_old_password TEXT, p_new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_hashed_password TEXT;
BEGIN
  SELECT value INTO v_hashed_password FROM app_configs WHERE key = 'admin_password';
  IF v_hashed_password = crypt(p_old_password, v_hashed_password) THEN
    UPDATE app_configs 
    SET value = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE key = 'admin_password';
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. 환경 설정 및 초기 데이터
-- ==========================================

-- [환경 설정 테이블]
CREATE TABLE IF NOT EXISTS app_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화 및 정책 추가
ALTER TABLE app_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Read Configs" ON app_configs FOR SELECT USING (true);

-- 관리자 비밀번호 로드 (초기값: p1o2m3n4를 해시화하여 저장)
INSERT INTO app_configs (key, value, description)
VALUES ('admin_password', crypt('p1o2m3n4', gen_salt('bf')), '관리자 인증용 비밀번호 (해시저장)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;