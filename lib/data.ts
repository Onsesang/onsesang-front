export type Spec = { k: string; v: string };

export type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  rating: string;
  reviews: string;
  material: string;
  group: string[];
  specs: Spec[];
  note: string;
};

export const PRODUCTS: Product[] = [
  { id: "p01", brand: "세컨드플로어", name: "램스울 크루넥 니트", price: 128000, rating: "4.7", reviews: "312", material: "램스울 80% · 460g", group: ["knit", "warm"],
    specs: [{ k: "소재", v: "램스울 80%, 나일론 20%" }, { k: "중량", v: "460g" }, { k: "게이지", v: "7게이지" }, { k: "세탁", v: "드라이클리닝" }],
    note: "표면 잔털이 짧아 보풀이 늦게 올라옵니다. 안에 셔츠를 겹쳐 입어도 목선이 늘어지지 않습니다." },
  { id: "p02", brand: "노운", name: "코튼 옥스퍼드 셔츠", price: 79000, rating: "4.5", reviews: "1,024", material: "면 100% · 옥스퍼드", group: ["shirt", "cotton", "under100"],
    specs: [{ k: "소재", v: "면 100%" }, { k: "조직", v: "옥스퍼드" }, { k: "중량", v: "140g/㎡" }, { k: "세탁", v: "찬물 기계세탁" }],
    note: "빨수록 조직이 부드러워집니다. 첫 세탁에서 2% 안팎 수축한다는 후기가 많습니다." },
  { id: "p03", brand: "플레인", name: "헤비 스웨트셔츠", price: 96000, rating: "4.8", reviews: "856", material: "코튼 100% · 480g", group: ["knit", "cotton", "under100"],
    specs: [{ k: "소재", v: "코튼 100%" }, { k: "중량", v: "480g" }, { k: "기모", v: "없음" }, { k: "세탁", v: "찬물 기계세탁" }],
    note: "기모가 없어 눌리지 않습니다. 세로 수축을 막는 후가공이 들어가 있습니다." },
  { id: "p04", brand: "로우엔드", name: "워시드 데님 팬츠", price: 118000, rating: "4.4", reviews: "2,118", material: "데님 13oz", group: ["pants"],
    specs: [{ k: "소재", v: "코튼 99%, 폴리우레탄 1%" }, { k: "중량", v: "13oz" }, { k: "가공", v: "원워시" }, { k: "세탁", v: "단독 세탁 권장" }],
    note: "신축성이 거의 없어 처음엔 뻣뻣합니다. 두세 번 입으면 무릎이 자리를 잡습니다." },
  { id: "p05", brand: "하이랜드", name: "메리노 터틀넥", price: 156000, rating: "4.6", reviews: "437", material: "메리노 100% · 18.5미크론", group: ["knit", "warm"],
    specs: [{ k: "소재", v: "메리노 울 100%" }, { k: "섬도", v: "18.5미크론" }, { k: "중량", v: "320g" }, { k: "세탁", v: "울 코스" }],
    note: "18.5미크론이면 목에 직접 닿아도 따갑다는 후기가 드뭅니다. 얇아서 겉옷 안에 들어갑니다." },
  { id: "p06", brand: "오브젝트", name: "나일론 코치 재킷", price: 142000, rating: "4.3", reviews: "289", material: "나일론 100% · 발수", group: ["outer"],
    specs: [{ k: "소재", v: "나일론 100%" }, { k: "가공", v: "발수 코팅" }, { k: "안감", v: "메시" }, { k: "세탁", v: "손세탁" }],
    note: "가벼운 비는 막지만 방수는 아닙니다. 접으면 가방 안에서 자리를 거의 차지하지 않습니다." },
  { id: "p07", brand: "세컨드플로어", name: "리넨 블렌드 셋업", price: 189000, rating: "4.2", reviews: "176", material: "리넨 55% · 레이온 45%", group: ["outer", "pants"],
    specs: [{ k: "소재", v: "리넨 55%, 레이온 45%" }, { k: "구성", v: "재킷 + 팬츠" }, { k: "안감", v: "없음" }, { k: "세탁", v: "드라이클리닝" }],
    note: "레이온이 섞여 리넨 특유의 구김이 덜합니다. 대신 순리넨보다 통기는 떨어집니다." },
  { id: "p08", brand: "플레인", name: "플리스 집업", price: 89000, rating: "4.6", reviews: "1,530", material: "폴리 플리스 280g", group: ["outer", "warm", "under100"],
    specs: [{ k: "소재", v: "폴리에스터 100%" }, { k: "파일", v: "280g 셰르파" }, { k: "포켓", v: "지퍼 2" }, { k: "세탁", v: "기계세탁" }],
    note: "파일이 길어 보온은 좋지만 먼지가 잘 붙습니다. 정전기 방지 가공이 들어갔습니다." },
  { id: "p09", brand: "노운", name: "트윌 치노 팬츠", price: 84000, rating: "4.5", reviews: "964", material: "코튼 트윌", group: ["pants", "cotton", "under100"],
    specs: [{ k: "소재", v: "코튼 97%, 스판 3%" }, { k: "조직", v: "트윌" }, { k: "중량", v: "280g/㎡" }, { k: "세탁", v: "기계세탁" }],
    note: "스판이 조금 섞여 앉았을 때 당기지 않습니다. 밑단 수선 여유가 4cm 있습니다." },
  { id: "p10", brand: "하이랜드", name: "캐시미어 머플러", price: 112000, rating: "4.9", reviews: "208", material: "캐시미어 100%", group: ["warm"],
    specs: [{ k: "소재", v: "캐시미어 100%" }, { k: "크기", v: "180 × 32cm" }, { k: "중량", v: "110g" }, { k: "세탁", v: "드라이클리닝" }],
    note: "두 겹으로 감아도 부피가 크지 않습니다. 마찰이 잦은 목 뒤쪽에 보풀이 먼저 생깁니다." },
  { id: "p11", brand: "오브젝트", name: "퀼팅 베스트", price: 134000, rating: "4.4", reviews: "312", material: "나일론 · 필파워 650", group: ["outer", "warm"],
    specs: [{ k: "소재", v: "겉감 나일론, 충전재 덕다운" }, { k: "필파워", v: "650" }, { k: "충전량", v: "90g" }, { k: "세탁", v: "손세탁" }],
    note: "니트 위에 겹쳐 입어도 어깨가 뜨지 않는 진동 둘레입니다." },
  { id: "p12", brand: "로우엔드", name: "브러시드 체크 셔츠", price: 72000, rating: "4.1", reviews: "688", material: "코튼 플란넬", group: ["shirt", "cotton", "under100"],
    specs: [{ k: "소재", v: "코튼 100%" }, { k: "조직", v: "플란넬, 양면 기모" }, { k: "중량", v: "180g/㎡" }, { k: "세탁", v: "찬물 기계세탁" }],
    note: "기모가 짧아 세탁 후에도 잘 눕지 않습니다. 첫 세탁에서 이염될 수 있어 단독 세탁을 권합니다." },
];

export const BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export type ScriptEntry = { user: string; reply: string; ids: string[]; filter: string[] };

export const SCRIPT: ScriptEntry[] = [
  { user: "출퇴근에 매일 입을 니트를 찾고 있어요",
    reply: "매일 입으실 거면 보풀과 목선 늘어짐이 먼저 걸립니다. 잔털이 짧은 램스울과 얇은 메리노 두 가지를 남겼습니다.",
    ids: ["p01", "p05"], filter: ["p01", "p05", "p03", "p10"] },
  { user: "10만원 아래 면 소재만 보여주세요",
    reply: "면 100% 또는 면 혼방 중 10만원 아래인 네 개입니다. 세탁 방법이 모두 기계세탁입니다.",
    ids: ["p02", "p03"], filter: ["p02", "p03", "p09", "p12"] },
  { user: "보풀이 늦게 생기는 걸로만 좁혀줘",
    reply: "후기에서 보풀 언급 비율이 낮은 순으로 정렬했습니다. 기모가 없는 조직이 대체로 유리했습니다.",
    ids: ["p03", "p09"], filter: ["p03", "p09", "p02", "p04"] },
];

export type StepOption = { id: string; label: string; note: string };
export type Step = { title: string; desc: string; options: StepOption[] };

export const STEPS: Step[] = [
  { title: "어떤 옷을 자주 보세요?", desc: "고른 항목이 상품 목록의 기본 정렬이 됩니다.",
    options: [{ id: "knit", label: "니트·스웨트", note: "게이지·중량" }, { id: "shirt", label: "셔츠", note: "조직·중량" }, { id: "pants", label: "팬츠", note: "신축·기장" }, { id: "outer", label: "아우터", note: "보온·발수" }, { id: "acc", label: "액세서리", note: "머플러·모자" }, { id: "setup", label: "셋업", note: "재킷+팬츠" }] },
  { title: "소재는 어떤 기준으로 고르세요?", desc: "대화에서 이 기준을 먼저 확인하고 답변 순서를 맞춥니다.",
    options: [{ id: "pill", label: "보풀", note: "오래 입기" }, { id: "weight", label: "무게", note: "가벼운 쪽" }, { id: "care", label: "관리", note: "기계세탁" }, { id: "warm", label: "보온", note: "겨울 대비" }, { id: "skin", label: "촉감", note: "따갑지 않게" }, { id: "price", label: "가격", note: "예산 우선" }] },
  { title: "어떻게 듣고 말할까요?", desc: "음성 설정입니다. 지금 정하지 않아도 나중에 바꿀 수 있습니다.",
    options: [{ id: "tts", label: "답변 읽어주기", note: "소리로 듣기" }, { id: "stt", label: "음성으로 질문", note: "마이크 입력" }, { id: "speed", label: "읽기 속도 1.2×", note: "조절 가능" }, { id: "sr", label: "스크린리더 우선", note: "포커스 순서" }, { id: "big", label: "큰 글씨", note: "18px 기준" }, { id: "haptic", label: "진동 피드백", note: "모바일" }] },
];

export const SESSIONS = [
  { id: "s_8c41", title: "출퇴근용 니트", time: "12분 전" },
  { id: "s_7b02", title: "10만원 아래 면 셔츠", time: "어제" },
  { id: "s_6a95", title: "보풀 적은 소재", time: "9월 17일" },
  { id: "s_5f30", title: "환절기 아우터", time: "9월 14일" },
];
