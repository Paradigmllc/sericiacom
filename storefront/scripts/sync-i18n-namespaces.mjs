// One-off codemod: backfill the four namespaces (hero / cookie_consent /
// coupon_banner / announcement) into every locale that was missing them.
// Each translation is hand-tuned per language (not machine-translated).
//
// Run from `storefront/`:
//   node scripts/sync-i18n-namespaces.mjs
import fs from "node:fs";
import path from "node:path";

const TRANSLATIONS = {
  fr: {
    hero: {
      eyebrow: "Drop No. 01 — Édition limitée",
      title_line_1: "Aliments artisanaux",
      title_line_2: "japonais sauvés,",
      typewriter_1: "expédiés dans le monde.",
      typewriter_2: "emballés à la main à Kyoto.",
      typewriter_3: "des artisans à votre table.",
      lede: "Chaque édition rassemble les surplus de producteurs japonais à proximité d'expiration — thé, miso, shiitake. Une fois épuisée, c'est terminé.",
      meta_kyoto: "Kyoto, Japon",
      meta_ems: "EMS dans le monde entier",
      meta_units_fmt: "{count} unités",
      cta_shop: "Acheter l'édition",
      cta_story: "Notre histoire",
      scroll_hint: "Faire défiler",
    },
    cookie_consent: {
      sr_title: "Une note discrète sur les cookies",
      body_before_link:
        "Les cookies essentiels conservent votre panier, votre connexion et votre région ; les cookies analytiques sont optionnels — refusez à tout moment. Voir notre",
      privacy_link: "politique de confidentialité",
      decline: "Refuser optionnel",
      accept: "Tout accepter",
    },
    coupon_banner: {
      region_label: "Promotion de lancement",
      prefix: "Offre de lancement —",
      discount_fmt: "{percent}% de réduction sur votre première commande",
      with_code: "avec le code",
      dismiss_label: "Fermer l'offre de lancement",
    },
    announcement: {
      aria_label: "Annonces",
      free_ems: "EMS gratuit dans le monde entier",
      hand_packed: "Emballé à la main à Kyoto",
      ships_48h: "Expédié sous 48 heures",
      small_batch: "Petites séries, éditions limitées",
      countries_23: "23+ pays",
      tracked: "Livraison suivie",
    },
  },
  es: {
    hero: {
      eyebrow: "Drop No. 01 — Edición limitada",
      title_line_1: "Alimentos artesanales",
      title_line_2: "japoneses rescatados,",
      typewriter_1: "enviados al mundo.",
      typewriter_2: "empaquetados a mano en Kioto.",
      typewriter_3: "de artesanos a tu mesa.",
      lede: "Cada edición es un paquete curado de excedentes de productores japoneses cerca de su caducidad — té, miso, shiitake. Cuando se agota, se acabó.",
      meta_kyoto: "Kioto, Japón",
      meta_ems: "EMS al mundo",
      meta_units_fmt: "{count} unidades",
      cta_shop: "Comprar la edición",
      cta_story: "Nuestra historia",
      scroll_hint: "Desplazar",
    },
    cookie_consent: {
      sr_title: "Una nota discreta sobre las cookies",
      body_before_link:
        "Las cookies esenciales mantienen tu carrito, sesión y región; las analíticas son opcionales — puedes rechazar en cualquier momento. Consulta nuestra",
      privacy_link: "política de privacidad",
      decline: "Rechazar opcionales",
      accept: "Aceptar todas",
    },
    coupon_banner: {
      region_label: "Promoción de lanzamiento",
      prefix: "Oferta de lanzamiento —",
      discount_fmt: "{percent}% de descuento en tu primer pedido",
      with_code: "con el código",
      dismiss_label: "Cerrar oferta de lanzamiento",
    },
    announcement: {
      aria_label: "Anuncios",
      free_ems: "EMS gratis al mundo",
      hand_packed: "Empaquetado a mano en Kioto",
      ships_48h: "Envío en 48 horas",
      small_batch: "Pequeños lotes, ediciones limitadas",
      countries_23: "23+ países",
      tracked: "Envío con seguimiento",
    },
  },
  it: {
    hero: {
      eyebrow: "Drop No. 01 — Edizione limitata",
      title_line_1: "Cibo artigianale",
      title_line_2: "giapponese salvato,",
      typewriter_1: "spedito in tutto il mondo.",
      typewriter_2: "confezionato a mano a Kyoto.",
      typewriter_3: "dagli artigiani alla tua tavola.",
      lede: "Ogni edizione riunisce le eccedenze di produttori giapponesi prossimi alla scadenza — tè, miso, shiitake. Quando finisce, è finita.",
      meta_kyoto: "Kyoto, Giappone",
      meta_ems: "EMS in tutto il mondo",
      meta_units_fmt: "{count} unità",
      cta_shop: "Acquista l'edizione",
      cta_story: "La nostra storia",
      scroll_hint: "Scorri",
    },
    cookie_consent: {
      sr_title: "Una nota discreta sui cookie",
      body_before_link:
        "I cookie essenziali mantengono il carrello, l'accesso e la regione; quelli analitici sono opzionali — puoi rifiutare in qualsiasi momento. Consulta la nostra",
      privacy_link: "informativa sulla privacy",
      decline: "Rifiuta opzionali",
      accept: "Accetta tutti",
    },
    coupon_banner: {
      region_label: "Promozione di lancio",
      prefix: "Offerta di lancio —",
      discount_fmt: "{percent}% sul primo ordine",
      with_code: "con il codice",
      dismiss_label: "Chiudi offerta di lancio",
    },
    announcement: {
      aria_label: "Annunci",
      free_ems: "EMS gratuito in tutto il mondo",
      hand_packed: "Confezionato a mano a Kyoto",
      ships_48h: "Spedito entro 48 ore",
      small_batch: "Piccoli lotti, edizioni limitate",
      countries_23: "Oltre 23 paesi",
      tracked: "Consegna tracciata",
    },
  },
  "zh-TW": {
    hero: {
      eyebrow: "Drop No. 01 — 限定發售",
      title_line_1: "拯救日本",
      title_line_2: "工藝食品，",
      typewriter_1: "運送至全世界。",
      typewriter_2: "在京都手工包裝。",
      typewriter_3: "從匠人到您的餐桌。",
      lede: "每一波都是日本生產者臨期庫存的精選 — 茶、味噌、椎茸。售完即止。",
      meta_kyoto: "京都，日本",
      meta_ems: "EMS 全球配送",
      meta_units_fmt: "{count} 件限量",
      cta_shop: "選購本期",
      cta_story: "我們的故事",
      scroll_hint: "向下滾動",
    },
    cookie_consent: {
      sr_title: "關於 Cookie 的小提示",
      body_before_link:
        "必要 Cookie 用於保留購物車、登入狀態和地區設定；分析 Cookie 為選用 — 隨時可拒絕。詳見我們的",
      privacy_link: "隱私政策",
      decline: "拒絕選用",
      accept: "全部接受",
    },
    coupon_banner: {
      region_label: "上市優惠",
      prefix: "上市優惠 —",
      discount_fmt: "首次訂單享 {percent}% 折扣",
      with_code: "輸入代碼",
      dismiss_label: "關閉上市優惠",
    },
    announcement: {
      aria_label: "公告",
      free_ems: "全球 EMS 免運",
      hand_packed: "京都手工包裝",
      ships_48h: "48 小時內出貨",
      small_batch: "小批量限定發售",
      countries_23: "23 個以上國家",
      tracked: "可追蹤配送",
    },
  },
  ru: {
    hero: {
      eyebrow: "Drop No. 01 — Лимитированная серия",
      title_line_1: "Спасённые японские",
      title_line_2: "крафтовые продукты,",
      typewriter_1: "доставка по всему миру.",
      typewriter_2: "ручная упаковка в Киото.",
      typewriter_3: "от мастеров на ваш стол.",
      lede: "Каждая партия — кураторская подборка излишков японских производителей с подходящим сроком годности: чай, мисо, шиитаке. Как только закончится, серии больше не будет.",
      meta_kyoto: "Киото, Япония",
      meta_ems: "EMS по всему миру",
      meta_units_fmt: "{count} единиц",
      cta_shop: "Купить серию",
      cta_story: "Наша история",
      scroll_hint: "Прокрутить",
    },
    cookie_consent: {
      sr_title: "Тихая заметка о cookie",
      body_before_link:
        "Необходимые cookie сохраняют корзину, вход и регион; аналитические — по желанию, можно отказаться в любой момент. См. нашу",
      privacy_link: "политику конфиденциальности",
      decline: "Отклонить",
      accept: "Принять все",
    },
    coupon_banner: {
      region_label: "Промо к запуску",
      prefix: "Спецпредложение к запуску —",
      discount_fmt: "{percent}% скидка на первый заказ",
      with_code: "с кодом",
      dismiss_label: "Закрыть промо",
    },
    announcement: {
      aria_label: "Объявления",
      free_ems: "Бесплатная доставка EMS",
      hand_packed: "Ручная упаковка в Киото",
      ships_48h: "Отгрузка за 48 часов",
      small_batch: "Малые партии, лимитированные релизы",
      countries_23: "23+ стран",
      tracked: "Отслеживаемая доставка",
    },
  },
  ar: {
    hero: {
      eyebrow: "Drop No. 01 — إصدار محدود",
      title_line_1: "أطعمة حرفية",
      title_line_2: "يابانية مُنقذة،",
      typewriter_1: "تُشحَن إلى العالم.",
      typewriter_2: "تُعبَّأ يدويًا في كيوتو.",
      typewriter_3: "من الحرفيين إلى مائدتك.",
      lede: "كل إصدار هو مجموعة مختارة من الفائض الياباني قرب انتهاء صلاحيته — شاي، ميسو، شيتاكي. ينتهي بمجرد نفاد الكمية.",
      meta_kyoto: "كيوتو، اليابان",
      meta_ems: "EMS حول العالم",
      meta_units_fmt: "{count} وحدة",
      cta_shop: "تسوق الإصدار",
      cta_story: "قصتنا",
      scroll_hint: "مرر للأسفل",
    },
    cookie_consent: {
      sr_title: "ملاحظة هادئة حول ملفات تعريف الارتباط",
      body_before_link:
        "ملفات تعريف الارتباط الأساسية تحفظ سلتك وتسجيل دخولك ومنطقتك؛ ملفات التحليل اختيارية — يمكنك الرفض في أي وقت. راجع",
      privacy_link: "سياسة الخصوصية",
      decline: "رفض الاختياري",
      accept: "قبول الكل",
    },
    coupon_banner: {
      region_label: "عرض الإطلاق",
      prefix: "عرض الإطلاق —",
      discount_fmt: "خصم {percent}% على طلبك الأول",
      with_code: "مع الرمز",
      dismiss_label: "إغلاق عرض الإطلاق",
    },
    announcement: {
      aria_label: "إعلانات",
      free_ems: "شحن EMS مجاني عالميًا",
      hand_packed: "تعبئة يدوية في كيوتو",
      ships_48h: "الشحن خلال 48 ساعة",
      small_batch: "دفعات صغيرة، إصدارات محدودة",
      countries_23: "أكثر من 23 دولة",
      tracked: "شحن مع تتبع",
    },
  },
};

const messagesDir = "messages";
const NAMESPACES = ["coupon_banner", "announcement", "hero", "cookie_consent"];

let touched = 0;
for (const [locale, ns] of Object.entries(TRANSLATIONS)) {
  const file = path.join(messagesDir, `${locale}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  let added = 0;
  for (const name of NAMESPACES) {
    if (json[name]) {
      console.log(`  ${locale}.json: '${name}' already present — skipping`);
      continue;
    }
    json[name] = ns[name];
    added += Object.keys(ns[name] ?? {}).length;
  }
  // Reorder keys so the structure mirrors en.json (nav, coupon_banner,
  // announcement, hero, cookie_consent, footer, home, products, ...).
  const ENGLISH_ORDER = [
    "nav", "coupon_banner", "announcement", "hero", "cookie_consent",
    "footer", "home", "products", "cart", "checkout", "auth", "account",
    "thank_you", "locale_switcher", "tokushoho",
  ];
  const reordered = {};
  for (const key of ENGLISH_ORDER) {
    if (json[key] !== undefined) reordered[key] = json[key];
  }
  for (const key of Object.keys(json)) {
    if (!(key in reordered)) reordered[key] = json[key];
  }
  fs.writeFileSync(file, JSON.stringify(reordered, null, 2) + "\n", "utf8");
  console.log(`✓ ${locale}.json: added ${added} keys (${NAMESPACES.length} namespaces)`);
  touched++;
}
console.log(`\nTotal: ${touched} locale files updated`);
