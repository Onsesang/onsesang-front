// Static copy that is not served by the API. Products, cart, preferences and chat
// all come from the backend (lib/api).

export type StepOption = { id: string; label: string; note: string };
export type StepKey = "gender" | "categories" | "tactile" | "voice";
/** `key` names the answer group sent to PUT /onboarding; `single` steps keep one pick. */
export type Step = { key: StepKey; title: string; desc: string; options: StepOption[]; single?: boolean };

// Onboarding picks are saved per user with PUT /onboarding (option ids, grouped by step);
// tactile step ids are Last2 tactile classes and the server adds them to 내 취향 as 직접 설정;
// the gender step (women / men / any) filters the product list and search results.
// Preferences the agent learns from chat are saved server-side automatically (see 내 취향).
export const STEPS: Step[] = [
  { key: "gender", single: true, title: "누구의 옷을 주로 찾으세요?", desc: "상품 목록과 추천에 기본으로 적용할게요. 대화에서 \"남편 셔츠\"처럼 말하면 그때는 말한 대로 찾아요.",
    options: [{ id: "women", label: "여성 옷", note: "여성용 위주" }, { id: "men", label: "남성 옷", note: "남성용 위주" }, { id: "any", label: "상관없음", note: "모두 보기" }] },
  { key: "categories", title: "어떤 옷을 자주 보세요?", desc: "대화를 시작할 때 참고할게요.",
    options: [{ id: "knit", label: "니트·스웨트", note: "게이지·중량" }, { id: "shirt", label: "셔츠", note: "조직·중량" }, { id: "pants", label: "팬츠", note: "신축·기장" }, { id: "outer", label: "아우터", note: "보온·발수" }, { id: "dress", label: "원피스", note: "두께·비침" }, { id: "setup", label: "셋업", note: "재킷+팬츠" }] },
  { key: "tactile", title: "촉감은 어떤 기준으로 고르세요?", desc: "대화에서 이 기준을 먼저 확인할게요.",
    options: [{ id: "soft", label: "부드러움", note: "피부에 닿는 느낌" }, { id: "thin", label: "얇음", note: "가벼운 쪽" }, { id: "elastic", label: "신축성", note: "움직이기 편하게" }, { id: "warm", label: "따뜻함", note: "겨울 대비" }, { id: "cool", label: "시원함", note: "여름 대비" }, { id: "smooth", label: "매끄러움", note: "까슬하지 않게" }] },
  { key: "voice", title: "어떻게 듣고 말할까요?", desc: "음성 설정입니다. 지금 정하지 않아도 나중에 바꿀 수 있습니다.",
    options: [{ id: "tts", label: "답변 읽어주기", note: "소리로 듣기" }, { id: "stt", label: "음성으로 질문", note: "마이크 입력" }, { id: "speed", label: "읽기 속도 1.2×", note: "조절 가능" }, { id: "sr", label: "스크린리더 우선", note: "포커스 순서" }, { id: "big", label: "큰 글씨", note: "18px 기준" }, { id: "haptic", label: "진동 피드백", note: "모바일" }] },
];

export const QUICK_PROMPTS = [
  "부드러운 니트 보여줘",
  "안 까끌한 여름 원피스 찾아줘",
  "1번 촉감 자세히 알려줘",
  "장바구니에 뭐 있어?",
];

export const GREETING = "안녕하세요. 찾는 옷의 촉감이나 입을 상황을 편하게 말씀해 주세요. 예를 들어 \"안 까끌한 여름 원피스 찾아줘\"처럼요.";
