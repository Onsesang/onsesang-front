import type { Preference, TactileSource } from "./api/types";

// The API returns English enum-ish values; the UI and screen readers get Korean.
// Unknown values fall through unchanged so new backend values never break the screen.

const CATEGORY: Record<string, string> = {
  top: "상의", shirt: "셔츠", blouse: "블라우스", tshirt: "티셔츠", "t-shirt": "티셔츠",
  sweater: "니트", knit: "니트", cardigan: "가디건", hoodie: "후드", sweatshirt: "맨투맨",
  outer: "아우터", outerwear: "아우터", jacket: "재킷", coat: "코트", vest: "조끼",
  bottom: "하의", pants: "바지", jeans: "청바지", shorts: "반바지", skirt: "치마", leggings: "레깅스",
  dress: "원피스", jumpsuit: "점프수트", suit: "정장", activewear: "운동복", sleepwear: "잠옷",
  underwear: "속옷", swimwear: "수영복", socks: "양말", shoes: "신발", bag: "가방",
  accessory: "액세서리", accessories: "액세서리", hat: "모자", scarf: "머플러",
};

export function categoryLabel(category: string | null | undefined) {
  if (!category) return "전체";
  return CATEGORY[category.toLowerCase()] ?? category;
}

// Tactile classes (spec 상품 API) plus the noun forms preferences use (softness, thinness…).
const TACTILE: Record<string, string> = {
  soft: "부드러움", softness: "부드러움",
  firm: "탄탄함", firmness: "탄탄함",
  smooth: "매끄러움", smoothness: "매끄러움",
  rough: "거칠·까슬함", roughness: "거칠·까슬함", scratchiness: "까슬함",
  non_elastic: "신축성 없음",
  elastic: "신축성", elasticity: "신축성", stretch: "신축성",
  thin: "얇음", thinness: "얇음",
  thick: "두꺼움", thickness: "두꺼움",
  flexible: "유연함", flexibility: "유연함",
  stiff: "뻣뻣함", stiffness: "뻣뻣함",
  warm: "따뜻함", warmth: "따뜻함",
  cool: "시원함", coolness: "시원함",
  spongy: "폭신함", sponginess: "폭신함",
  crisp: "각 잡힌 느낌", crispness: "각 잡힌 느낌",
};

const COLOR: Record<string, string> = {
  black: "검은색", white: "흰색", gray: "회색", grey: "회색", navy: "남색", blue: "파란색",
  red: "빨간색", pink: "분홍색", beige: "베이지", brown: "갈색", green: "초록색",
  yellow: "노란색", purple: "보라색", orange: "주황색", ivory: "아이보리",
};

export function attributeLabel(type: string, attribute: string) {
  const key = attribute.toLowerCase();
  if (type === "tactile") return TACTILE[key] ?? attribute;
  if (type === "color") return COLOR[key] ?? attribute;
  return attribute;
}

const ATTRIBUTE_TYPE: Record<string, string> = { tactile: "촉감", color: "색상", style: "스타일" };

export function preferenceLabel(p: Preference) {
  const attr = attributeLabel(p.attribute_type, p.attribute);
  const phrase = {
    more: `${attr} 더`,
    less: `${attr} 덜`,
    avoid: `${attr} 피하기`,
    must_have: `${attr} 꼭 있어야 함`,
  }[p.direction] ?? attr;
  return `${categoryLabel(p.scope_category)} · ${phrase}`;
}

export function preferenceMeta(p: Preference) {
  const type = ATTRIBUTE_TYPE[p.attribute_type] ?? p.attribute_type;
  // onboarding picks and anything else not learned from chat count as 직접 설정.
  const source = p.source === "chat_auto" ? "대화에서 자동 저장" : "직접 설정";
  const date = p.updated_at ? new Date(p.updated_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) : "";
  return [type, source, date].filter(Boolean).join(" · ");
}

/** "방금", "5분 전", "3시간 전", then a date — for conversation lists. */
export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "방금";
  if (diff < 60) return `${Math.floor(diff)}분 전`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}시간 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export function tactileSourceLabel(source: TactileSource | undefined) {
  if (source === "review_grounded_overlay") return "리뷰 근거 있음";
  if (source === "image_predicted_last2") return "이미지로 예측";
  return null;
}
