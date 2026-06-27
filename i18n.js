/* AURA — translations & content data (AR / EN) */

const I18N = {
  ar: {
    nav_daily: "طاقة اليوم", nav_cards: "كروت الطاقة", nav_courses: "الكورسات",
    nav_masters: "الأساتذة", nav_support: "الدعم",
    hero_sub: "منصّتك اليومية للطاقة والروحانيات",
    hero_desc: "اكشف طاقة يومك، اسحب كروتك، تعلّم من أساتذة متخصصين، واحجز جلستك الخاصة.",
    hero_btn: "ابدأ رحلتك",
    install_app: "ثبّت التطبيق على موبايلك",
    install_banner: "ثبّت تطبيق AURA على موبايلك ✨", install_now: "ثبّت",
    daily_title: "🔮 طاقة اليوم",
    daily_lead: "افتح كل يوم لتكشف رسالتك ورقمك ولونك وعنصرك.",
    reveal_btn: "اكشف طاقتي", streak_label: "أيام متتالية:",
    stat_number: "رقم الحظ", stat_color: "لون اليوم", stat_element: "العنصر",
    daily_note: "ارجع غداً لطاقة جديدة 🌙",
    cards_title: "🃏 كروت الطاقة",
    cards_lead: "ركّز على سؤالك بقلبك، ثم اسحب كرتك.",
    reshuffle: "اسحب من جديد",
    courses_title: "📚 الكورسات المسجّلة",
    courses_lead: "تعلّم في وقتك من كورسات معدّة بعناية.",
    masters_title: "👩‍🏫 الأساتذة والحجوزات",
    masters_lead: "احجز جلستك المباشرة مع أستاذ متخصّص.",
    support_title: "💬 الدعم والدفع", support_lead: "نحن هنا لمساعدتك في أي وقت.",
    pay_title: "الدفع", pay_desc: "ادفع بأمان عبر PayPal. شام كاش قريباً.",
    sham_soon: "شام كاش (قريباً)",
    wa_title: "واتساب", wa_desc: "تواصل معنا مباشرة للحجز أو الاستفسار.", wa_btn: "راسلنا على واتساب",
    tech_title: "الدعم الفني", tech_desc: "واجهت مشكلة؟ فريق الدعم بخدمتك.", tech_btn: "تواصل مع الدعم",
    footer_tag: "طاقتك تبدأ من هنا 🌙", rights: "جميع الحقوق محفوظة.",
    subscribe: "اشترك الآن", book: "احجز جلسة",
    modal_wa: "احجز عبر واتساب", modal_pay: "ادفع عبر PayPal",
    course_modal_title: "اشتراك في كورس", master_modal_title: "حجز جلسة",
    course_modal_body: "ممتاز! تواصل معنا لإتمام اشتراكك في",
    master_modal_body: "ممتاز! اختر موعدك وأكمل الحجز مع",
    wa_course_msg: "مرحباً AURA، أرغب بالاشتراك في كورس:",
    wa_master_msg: "مرحباً AURA، أرغب بحجز جلسة مع:",
    wa_general_msg: "مرحباً AURA، لدي استفسار 🌙",
    wa_tech_msg: "مرحباً AURA، أحتاج مساعدة من الدعم الفني."
  },
  en: {
    nav_daily: "Daily Energy", nav_cards: "Energy Cards", nav_courses: "Courses",
    nav_masters: "Masters", nav_support: "Support",
    hero_sub: "Your daily energy & spirituality platform",
    hero_desc: "Reveal your daily energy, draw your cards, learn from expert masters, and book your private session.",
    hero_btn: "Begin your journey",
    install_app: "Install the app on your phone",
    install_banner: "Install the AURA app on your phone ✨", install_now: "Install",
    daily_title: "🔮 Daily Energy",
    daily_lead: "Open every day to reveal your message, number, color and element.",
    reveal_btn: "Reveal my energy", streak_label: "Day streak:",
    stat_number: "Lucky number", stat_color: "Color of the day", stat_element: "Element",
    daily_note: "Come back tomorrow for new energy 🌙",
    cards_title: "🃏 Energy Cards",
    cards_lead: "Focus on your question, then draw your card.",
    reshuffle: "Draw again",
    courses_title: "📚 Recorded Courses",
    courses_lead: "Learn at your own pace from carefully crafted courses.",
    masters_title: "👩‍🏫 Masters & Bookings",
    masters_lead: "Book your live session with a specialized master.",
    support_title: "💬 Support & Payment", support_lead: "We're here to help you anytime.",
    pay_title: "Payment", pay_desc: "Pay securely via PayPal. Sham Cash coming soon.",
    sham_soon: "Sham Cash (soon)",
    wa_title: "WhatsApp", wa_desc: "Reach us directly for booking or questions.", wa_btn: "Message us on WhatsApp",
    tech_title: "Technical Support", tech_desc: "Having an issue? Our team is here.", tech_btn: "Contact support",
    footer_tag: "Your energy starts here 🌙", rights: "All rights reserved.",
    subscribe: "Subscribe now", book: "Book a session",
    modal_wa: "Book via WhatsApp", modal_pay: "Pay via PayPal",
    course_modal_title: "Course subscription", master_modal_title: "Session booking",
    course_modal_body: "Great! Contact us to complete your subscription to",
    master_modal_body: "Great! Pick your time and complete your booking with",
    wa_course_msg: "Hello AURA, I'd like to subscribe to the course:",
    wa_master_msg: "Hello AURA, I'd like to book a session with:",
    wa_general_msg: "Hello AURA, I have a question 🌙",
    wa_tech_msg: "Hello AURA, I need help from technical support."
  }
};

/* Daily energy content pools */
const DAILY = {
  messages: {
    ar: [
      "طاقتك اليوم تجذب الفرص، افتح قلبك لها.",
      "ثق بحدسك، فهو بوصلتك الحقيقية اليوم.",
      "ابتسامتك اليوم تفتح أبواباً لم تتوقعها.",
      "اترك ما يثقلك، اليوم يومُ خفّة وصفاء.",
      "كل نفَس تأخذه يعيد توازنك، تنفّس بعمق.",
      "النور بداخلك أقوى من أي ظلّ، اسطع.",
      "اليوم مناسب لبداية جديدة طال انتظارها.",
      "امنح نفسك لطفاً، فأنت تستحق السلام.",
      "صوتك مسموع في الكون، اطلب بثقة.",
      "الامتنان اليوم يضاعف كل ما تملك."
    ],
    en: [
      "Your energy attracts opportunity today—open your heart to it.",
      "Trust your intuition; it's your true compass today.",
      "Your smile today opens doors you didn't expect.",
      "Release what weighs you down—today is lightness and clarity.",
      "Every breath restores your balance—breathe deeply.",
      "The light within you is stronger than any shadow—shine.",
      "Today is perfect for a long-awaited fresh start.",
      "Be gentle with yourself; you deserve peace.",
      "The universe hears you—ask with confidence.",
      "Gratitude today multiplies everything you have."
    ]
  },
  colors: {
    ar: [["بنفسجي","#9b5cff"],["ذهبي","#f5c451"],["فيروزي","#34d3c4"],["وردي","#ff7eb6"],["كحلي","#3a4cff"],["أخضر زمردي","#37d67a"]],
    en: [["Violet","#9b5cff"],["Gold","#f5c451"],["Turquoise","#34d3c4"],["Rose","#ff7eb6"],["Indigo","#3a4cff"],["Emerald","#37d67a"]]
  },
  elements: {
    ar: ["نار 🔥","ماء 💧","هواء 🌬️","تراب 🌱","أثير ✦"],
    en: ["Fire 🔥","Water 💧","Air 🌬️","Earth 🌱","Aether ✦"]
  }
};

/* Tarot / energy cards */
const CARDS = [
  { sym: "☀️", name: { ar: "الشمس", en: "The Sun" }, meaning: { ar: "نجاح وفرح ووضوح. مرحلة مشرقة قادمة إليك.", en: "Success, joy and clarity. A bright phase is coming to you." } },
  { sym: "🌙", name: { ar: "القمر", en: "The Moon" }, meaning: { ar: "حدسك مرتفع، اصغِ لأحلامك ومشاعرك الخفيّة.", en: "Your intuition is high—listen to your dreams and hidden feelings." } },
  { sym: "⭐", name: { ar: "النجمة", en: "The Star" }, meaning: { ar: "أمل وشفاء. الكون يفتح لك طريق التجدّد.", en: "Hope and healing. The universe opens a path of renewal." } },
  { sym: "🌹", name: { ar: "العاشق", en: "The Lovers" }, meaning: { ar: "انسجام وروابط قلبية. قرار من القلب ينتظرك.", en: "Harmony and heartfelt bonds. A decision from the heart awaits." } },
  { sym: "🗝️", name: { ar: "المفتاح", en: "The Key" }, meaning: { ar: "حلّ قريب لما يشغلك. الباب الذي تبحث عنه ينفتح.", en: "A solution is near. The door you seek is opening." } },
  { sym: "🔥", name: { ar: "القوة", en: "Strength" }, meaning: { ar: "شجاعة هادئة بداخلك. ثق بقدرتك على التجاوز.", en: "A quiet courage within you. Trust your power to overcome." } },
  { sym: "🎴", name: { ar: "العجلة", en: "The Wheel" }, meaning: { ar: "تغيّر إيجابي وحظ يدور لصالحك. تقبّل الجديد.", en: "Positive change and luck turning your way. Welcome the new." } },
  { sym: "🕊️", name: { ar: "السلام", en: "Peace" }, meaning: { ar: "هدوء داخلي وصفاء. حان وقت الراحة والتصالح.", en: "Inner calm and clarity. Time to rest and reconcile." } },
  { sym: "💎", name: { ar: "الوفرة", en: "Abundance" }, meaning: { ar: "خير قادم ونمو. افتح يديك لاستقبال العطاء.", en: "Abundance and growth coming. Open your hands to receive." } },
  { sym: "🌿", name: { ar: "النمو", en: "Growth" }, meaning: { ar: "بذرة تزرعها اليوم تثمر قريباً. استمر بثبات.", en: "A seed you plant today will soon bloom. Keep steady." } }
];
