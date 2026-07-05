/* =========================================================================
   AURA — ملف الإعدادات (عدّلي القيم هنا فقط)
   AURA — configuration file (edit your real data here only)
   -------------------------------------------------------------------------
   ✏️ لكل منتج رقمي (كورس/كتاب/اشتراك) حقل "buy": ضعي فيه رابط Payhip.
      إذا تركتِه فارغاً، يعمل الزر عبر واتساب مؤقتاً.
      For each digital product set "buy" to its Payhip link; leave empty
      to fall back to WhatsApp.
   ========================================================================= */

const AURA_CONFIG = {
  /* رقم الواتساب بصيغة دولية بدون + أو أصفار. مثال: 9639XXXXXXXX */
  whatsapp: "9639XXXXXXXX",

  /* العنوان العام للموقع (روابط المشاركة). */
  site: "https://souad-ch.github.io/auraapp/",

  /* رابط PayPal الاحتياطي (paypal.me). */
  paypal: "https://www.paypal.com/paypalme/YOUR_LINK",
  paypalClientId: "",
  currency: "USD",

  /* رابط متجر Payhip العام (اختياري، لزر "زيارة المتجر"). */
  payhipStore: "",

  supabase: {
    url: "https://qwpccrznxidehtbbbwyq.supabase.co",
    anonKey: "sb_publishable_UDA6gH82b6FjX4bYLm5o_A_n5OWL24V"
  },

  adsense: { client: "", slotTop: "", slotBottom: "" },

  timeSlots: ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],

  /* رابط شراء/اشتراك الباقة على Payhip (اتركيه فارغاً ليعمل عبر واتساب). */
  subscribeUrl: "",

  /* =========================================================================
     الكورسات المسجّلة — Recorded courses (buy once)
     buy = رابط Payhip للكورس
     ========================================================================= */
  courses: [
    { id: "reiki1", icon: "🌱", buy: "",
      title: { ar: "ريكي — الجزء الأول", en: "Reiki — Part 1" },
      desc:  { ar: "أساسيات الريكي وتوجيه طاقة الشفاء.", en: "Reiki foundations and channeling healing energy." },
      price: { ar: "٤٩ $", en: "$49" }, amount: 49 },
    { id: "reiki2", icon: "🌿", buy: "",
      title: { ar: "ريكي — الجزء الثاني", en: "Reiki — Part 2" },
      desc:  { ar: "مستوى متقدّم في الريكي وتطبيقاته العملية.", en: "Advanced Reiki level and practical applications." },
      price: { ar: "٥٩ $", en: "$59" }, amount: 59 },
    { id: "theta", icon: "💫", buy: "",
      title: { ar: "ثيتا هيلينغ", en: "Theta Healing" },
      desc:  { ar: "تقنيات علاج الثيتا وإعادة برمجة المعتقدات.", en: "Theta healing techniques and belief reprogramming." },
      price: { ar: "٦٩ $", en: "$69" }, amount: 69 },
    { id: "sound", icon: "🔔", buy: "",
      title: { ar: "المعالجة بالصوت", en: "Sound Healing" },
      desc:  { ar: "الشفاء بالترددات والأصوات لتوازن الطاقة.", en: "Healing with frequencies and sound for energy balance." },
      price: { ar: "٥٥ $", en: "$55" }, amount: 55 }
  ],

  /* =========================================================================
     مكتبة الكتب — Digital books (paid download via Payhip)
     ========================================================================= */
  books: [
    { id: "b1", cover: "📖", buy: "",
      title: { ar: "كتاب الطاقة الأول", en: "Energy Book One" },
      desc:  { ar: "دليلك لفهم الطاقة والشفاء الذاتي.", en: "Your guide to energy and self-healing." },
      price: { ar: "١٥ $", en: "$15" }, amount: 15 },
    { id: "b2", cover: "📗", buy: "",
      title: { ar: "كتاب التاروت", en: "Tarot Book" },
      desc:  { ar: "مرجع مبسّط لرموز التاروت وقراءتها.", en: "A simple reference to tarot symbols and reading." },
      price: { ar: "١٨ $", en: "$18" }, amount: 18 },
    { id: "b3", cover: "📘", buy: "",
      title: { ar: "كتاب التأمّل", en: "Meditation Book" },
      desc:  { ar: "تمارين تأمّل وتنفّس لصفاء يومي.", en: "Meditation and breathing exercises for daily clarity." },
      price: { ar: "١٢ $", en: "$12" }, amount: 12 }
  ],

  /* =========================================================================
     الأساتذة — Masters (live sessions = booking; some also recorded)
     type: "live" حجز جلسة | "both" لايف + مسجّل
     ========================================================================= */
  masters: [
    { id: "tarot", avatar: "🃏", type: "live", sessionPrice: 35,
      name:      { ar: "أستاذ التاروت", en: "Tarot Master" },
      specialty: { ar: "قراءة التاروت", en: "Tarot Reading" },
      services:  { ar: "جلسة تاروت مباشرة", en: "Live tarot session" } },
    { id: "theta", avatar: "💫", type: "live", sessionPrice: 45,
      name:      { ar: "أستاذ ثيتا هيلينغ", en: "Theta Healing Master" },
      specialty: { ar: "علاج الثيتا هيلينغ", en: "Theta Healing" },
      services:  { ar: "جلسة علاج ثيتا مباشرة", en: "Live theta healing session" } },
    { id: "consult", avatar: "🗝️", type: "live", sessionPrice: 40,
      name:      { ar: "أستاذ الاستشارات", en: "Consultations Master" },
      specialty: { ar: "استشارات أسبوعية", en: "Weekly Consultations" },
      services:  { ar: "استشارة روحية أسبوعية", en: "Weekly spiritual consultation" } },
    { id: "meditation", avatar: "🧘", type: "both", sessionPrice: 30,
      name:      { ar: "أستاذ الميديتيشن", en: "Meditation Master" },
      specialty: { ar: "التأمّل والاسترخاء", en: "Meditation & Relaxation" },
      services:  { ar: "تأمّل مباشر + تأمّلات مسجّلة", en: "Live meditation + recorded meditations" } },
    { id: "reading", avatar: "🔮", type: "live", sessionPrice: 45,
      name:      { ar: "أستاذ القراءة الشخصية", en: "Personal Reading Master" },
      specialty: { ar: "قراءة شخصية وقياس الشاكرات", en: "Personal Reading & Chakra Scan" },
      services:  { ar: "قراءة شخصية • قياس الشاكرات", en: "Personal reading • Chakra measurement" } }
  ]
};
