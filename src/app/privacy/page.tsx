export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 text-gray-800 leading-relaxed min-h-screen bg-white">
      <h1 className="text-3xl font-bold mb-8">개인정보 처리방침</h1>
      <p className="mb-6 font-medium text-gray-600">성균관대학교 학생 전용 택시 동승 매칭 서비스 '가치타(GACHITA)'(이하 ‘서비스’)는 이용자의 개인정보를 소중하게 다룹니다.</p>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">제1조 (목적)</h2>
        <p>본 방침은 서비스가 이용자의 개인정보를 어떻게 수집, 이용, 보호하는지 안내하기 위해 작성되었습니다.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">제2조 (수집 항목)</h2>
        <p>필수: 성명(닉네임), 학교 이메일, 접속 로그<br/>선택: 정산용 계좌번호, 프로필 사진</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">제3조 (이용 목적)</h2>
        <p>사용자 식별, 매칭 서비스 제공, 정산 지원 및 부정 이용 방지를 위해 사용됩니다.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">제4조 (파기)</h2>
        <p>회원 탈퇴 시 즉시 파기하는 것을 원칙으로 합니다.</p>
      </section>

      <footer className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-400">
        시행일자: 2026년 5월 14일
      </footer>
    </div>
  );
}
