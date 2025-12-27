// CardSelectionScreen.js의 handleSubmit 함수에 로그 추가
const handleSubmit = async () => {
  console.log('=== 카드 저장 시작 ===');
  console.log('visitId:', visitId);
  console.log('selectedCard:', selectedCard);
  console.log('review:', review);

  const { error } = await visitService.updateVisit(visitId, {
    selected_card: selectedCard.name,
    card_review: review || null,
  });

  console.log('저장 결과 error:', error);
  // ... 나머지 코드
};