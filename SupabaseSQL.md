-- ==========================================
-- 1. 초기화 및 확장 모듈
-- ==========================================
DROP VIEW IF EXISTS customer_details;
DROP TABLE IF EXISTS vote_responses, votes, bug_reports, notices, coupon_history, visit_history, customers CASCADE;

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
    visit_date timestamptz DEFAULT NOW()
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
    device_info jsonb DEFAULT '{}'::jsonb
    admin_response text NOT NULL
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
-- 조회: 앱에서 내 정보를 불러와야 하므로 허용 (현재 세션이 없으므로 전체 허용)
CREATE POLICY "Allow Select for All" ON customers 
FOR SELECT USING (true);

-- 수정/삭제: 오직 관리자(Service Role)나 RPC 함수를 통해서만 가능하도록 차단
-- (정책을 만들지 않으면 기본적으로 차단됩니다)


-- [2] Notices (공지사항)
-- 조회: 누구나 공지사항을 볼 수 있음
CREATE POLICY "Public Read Notices" ON notices 
FOR SELECT USING (true);


-- [3] Visit & Coupon History (방문 및 쿠폰 기록)
-- 조회: 앱에서 기록을 확인해야 하므로 허용
CREATE POLICY "Allow Select Visits" ON visit_history 
FOR SELECT USING (true);

CREATE POLICY "Allow Select Coupons" ON coupon_history 
FOR SELECT USING (true);

CREATE POLICY "Allow Update Visits" ON visit_history 
FOR UPDATE USING (true) WITH CHECK (true);

-- [4] Bug Reports (버그 제보)
-- 삽입: 누구나 버그를 제보(INSERT)할 수 있어야 함
CREATE POLICY "Allow Insert Bug Reports" ON bug_reports 
FOR INSERT WITH CHECK (true);

-- 조회: 내 제보 내역 확인용 (일단 허용)
CREATE POLICY "Allow Select Bug Reports" ON bug_reports 
FOR SELECT USING (true);


-- [5] Votes (투표)
-- 조회: 투표 주제는 누구나 볼 수 있음
CREATE POLICY "Public Read Votes" ON votes 
FOR SELECT USING (true);

-- 투표 응답(INSERT): 누구나 투표에 참여할 수 있음
CREATE POLICY "Allow Insert Vote Responses" ON vote_responses 
FOR INSERT WITH CHECK (true);

-- 투표 수정(Update) 권한 추가
CREATE POLICY "Allow Update Vote Responses" ON vote_responses 
FOR UPDATE USING (true);

-- (혹시 투표 취소도 필요하다면) 삭제(Delete) 권한 추가
CREATE POLICY "Allow Delete Vote Responses" ON vote_responses 
FOR DELETE USING (true);

-- 투표 결과 조회: 누구나 결과 확인 가능
CREATE POLICY "Allow Select Vote Responses" ON vote_responses 
FOR SELECT USING (true);

-- ==========================================
-- 7. 개인정보 수정/삭제용 RPC 함수 (RLS 우회)
-- ==========================================

-- [기능 1] 닉네임 변경
CREATE OR REPLACE FUNCTION update_my_nickname(
    p_id uuid,       -- 내 UUID (앱에서 보냄)
    p_new_nickname text -- 바꿀 닉네임
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한으로 실행
SET search_path = public
AS $$
BEGIN
    -- 내 ID와 일치하는 행만 수정
    UPDATE customers
    SET nickname = p_new_nickname
    WHERE id = p_id;

    -- 수정된 줄이 있으면 true, 없으면 false 반환
    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- [기능 2] 회원 탈퇴 (Soft Delete)
-- 실제로 데이터를 지우기보다(deleted_at) 마킹하는 것이 안전함
CREATE OR REPLACE FUNCTION delete_my_account(
    p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 내 ID와 일치하는 행만 '삭제된 상태'로 변경
    UPDATE customers
    SET deleted_at = NOW(),
        phone_number = phone_number || '_deleted_' || substring(md5(random()::text) from 1 for 5) -- 재가입 방지 및 번호 해제
    WHERE id = p_id;

    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

CREATE POLICY "Allow Update Visits" ON visit_history 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow Update Coupon History" ON coupon_history 
FOR UPDATE USING (true) WITH CHECK (true);

-- 방문 횟수를 안전하게 1 증가시키는 함수
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