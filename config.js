/* =========================================================================
   AURA — ملف الإعدادات (عدّلي القيم هنا فقط)
   AURA — configuration file (edit your real data here only)
   -------------------------------------------------------------------------
   ✏️ غيّري رقم الواتساب، رابط PayPal، أسماء الأساتذة، الكورسات والأسعار.
      Change WhatsApp number, PayPal link, masters, courses and prices.
   ========================================================================= */

const AURA_CONFIG = {
  /* رقم الواتساب بصيغة دولية بدون + أو أصفار. مثال: 9639XXXXXXXX
     WhatsApp number, international format, no + or leading zeros. */
  whatsapp: "9639XXXXXXXX",

  /* رابط PayPal الخاص بك (paypal.me أو رابط دفع).
     Your PayPal link (paypal.me or a checkout link). */
  paypal: "https://www.paypal.com/paypalme/YOUR_LINK",

  /* ---------------------------------------------------------------------
     Supabase — نظام الحجز الحقيقي (اختياري). اتركيه فارغاً وسيعمل الحجز
     عبر واتساب فقط. لتفعيله: أنشئي مشروع Supabase وشغّلي ملف
     supabase-schema.sql ثم ضعي الرابط والمفتاح العام هنا.
     Leave empty to use WhatsApp-only booking. To enable DB booking,
     create a Supabase project, run supabase-schema.sql, then fill these.
     --------------------------------------------------------------------- */
  supabase: {
    url: "",       // https://YOUR-PROJECT.supabase.co
    anonKey: ""    // public anon key
  },

  /* ---------------------------------------------------------------------
     Google AdSense — الإعلانات (اختياري). اتركيه فارغاً ولن تظهر إعلانات.
     لتفعيلها: سجّلي في AdSense وضعي معرّف العميل ومعرّفات الوحدات.
     Leave empty to hide ads. Fill after AdSense approval.
     --------------------------------------------------------------------- */
  adsense: {
    client: "",        // ca-pub-XXXXXXXXXXXXXXXX
    slotTop: "",       // ad unit id
    slotBottom: ""     // ad unit id
  },

  /* أوقات الجلسات المتاحة للحجز — Available session time slots */
  timeSlots: ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],

  /* الكورسات المسجّلة — Recorded courses */
  courses: [
    {
      id: "c1",
      icon: "🌗",
      title: { ar: "أساسيات الطاقة", en: "Energy Foundations" },
      desc:  { ar: "مدخلك لفهم الطاقة وموازنتها في حياتك اليومية.",
               en: "Your gateway to understanding and balancing energy in daily life." },
      price: { ar: "٤٩ $", en: "$49" }
    },
    {
      id: "c2",
      icon: "🃏",
      title: { ar: "قراءة التاروت للمبتدئين", en: "Tarot Reading for Beginners" },
      desc:  { ar: "تعلّم رموز الكروت وكيفية قراءتها بثقة.",
               en: "Learn the card symbols and how to read them with confidence." },
      price: { ar: "٥٩ $", en: "$59" }
    },
    {
      id: "c3",
      icon: "🧘‍♀️",
      title: { ar: "اليوغا وتنفّس الطاقة", en: "Yoga & Energy Breathing" },
      desc:  { ar: "تمارين عملية لتهدئة العقل وتنشيط طاقتك.",
               en: "Practical exercises to calm the mind and activate your energy." },
      price: { ar: "٣٩ $", en: "$39" }
    },
    {
      id: "c4",
      icon: "✨",
      title: { ar: "الشفاء الذاتي بالطاقة", en: "Self-Healing with Energy" },
      desc:  { ar: "أدوات لإعادة التوازن الداخلي والشفاء العاطفي.",
               en: "Tools for inner rebalancing and emotional healing." },
      price: { ar: "٦٩ $", en: "$69" }
    }
  ],

  /* الأساتذة — Masters / Teachers */
  masters: [
    {
      id: "m1",
      avatar: "🌙",
      name:      { ar: "الأستاذة الأولى", en: "Master One" },
      specialty: { ar: "ماسترة طاقة وشفاء", en: "Energy & Healing Master" },
      services:  { ar: "جلسات طاقة • توازن الشاكرات", en: "Energy sessions • Chakra balancing" }
    },
    {
      id: "m2",
      avatar: "🔮",
      name:      { ar: "الأستاذة الثانية", en: "Master Two" },
      specialty: { ar: "ماسترة تاروت", en: "Tarot Master" },
      services:  { ar: "جلسات تاروت • قراءة طاقة", en: "Tarot sessions • Energy reading" }
    },
    {
      id: "m3",
      avatar: "🧘",
      name:      { ar: "الأستاذة الثالثة", en: "Master Three" },
      specialty: { ar: "ماسترة يوغا وتأمّل", en: "Yoga & Meditation Master" },
      services:  { ar: "جلسات يوغا • تأمّل موجّه", en: "Yoga sessions • Guided meditation" }
    }
  ]
};
