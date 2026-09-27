// Response shapes from the shopping agent backend (API spec v1.2).
// Debug-only fields (recommendation_reason, last2_predictions, score_breakdown, intent,
// routing, provenance…) are intentionally left out so nothing renders them by accident.

export type User = {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
};

export type AuthResponse = {
  status: "authenticated";
  user: User;
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
};

export type TactileSource = "image_predicted_last2" | "review_grounded_overlay" | (string & {});

export type Product = {
  product_id: string;
  title: string;
  category: string;
  image_url?: string;
  remote_image_url?: string | null;
  tactile_target_source?: TactileSource;
};

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
};

export type TactileStrongest = { class: string; label_ko: string; probability: number };

export type ProductDetail = {
  product: Product;
  tactile_profile: {
    source: TactileSource;
    strongest: TactileStrongest[];
    review_grounded_evidence_available: boolean;
    note?: string;
  } | null;
  tactile_concerns: unknown[];
  related: Product[];
};

export type Session = {
  session_id: string;
  created_at: string;
  updated_at: string;
  messages?: { role: string; content: string; created_at: string }[];
};

/** One row of GET /sessions: conversations with at least one message, newest first. */
export type SessionListItem = {
  session_id: string;
  title: string;
  last_message: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

/** Option ids picked on each onboarding step (ids are defined in lib/data.ts). */
export type OnboardingAnswers = { categories: string[]; tactile: string[]; voice: string[] };

export type Onboarding = {
  answers: OnboardingAnswers;
  completed: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type AgentAction =
  | "search_products"
  | "get_product_detail"
  | "compare_products"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "respond"
  | "respond_greeting"
  | "respond_out_of_scope"
  | (string & {});

export type AgentReply = {
  status: "complete" | "insufficient_results" | (string & {});
  action: AgentAction;
  session_id: string;
  message: string;
  products: Product[];
  cart_updated?: boolean;
  preferences_saved?: Preference[];
};

export type PreferenceDirection = "more" | "less" | "avoid" | "must_have";

export type Preference = {
  preference_id: string;
  scope_category: string | null;
  attribute_type: "tactile" | "color" | "style" | (string & {});
  attribute: string;
  direction: PreferenceDirection;
  active?: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
};

export type CartItem = {
  product_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  product: Product;
};

export type Cart = { items: CartItem[]; checkout_enabled: boolean };

export type EventType =
  | "product_impression"
  | "product_click"
  | "product_dwell"
  | "image_zoom"
  | "similar_product_click"
  | "favorite_add"
  | "favorite_remove"
  | "explicit_like"
  | "explicit_dislike"
  | "recommendation_skip";
