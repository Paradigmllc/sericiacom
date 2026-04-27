// Adds passwordless-login + guest-checkout i18n keys to all 10 locale files.
// One-shot script — re-running is safe (it only adds missing keys, won't overwrite existing ones).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "../messages");

// New auth.* keys, native translations for each locale.
// Order matches LoginForm.tsx + login/page.tsx usage.
const AUTH_KEYS = {
  en: {
    eyebrow_sign_in: "Sign in",
    welcome_back: "Welcome back.",
    welcome_back_lede:
      "Sign in to check orders, update addresses, and see new drops first.",
    loading: "Loading…",
    email_address_label: "Email address",
    email_placeholder: "you@example.com",
    send_link: "Send sign-in link",
    sending: "Sending…",
    no_password_explainer_line1:
      "No password needed. We'll email you a secure one-tap sign-in link.",
    no_password_explainer_line2:
      "First time? Just enter your email — your account is created automatically.",
    check_email_eyebrow: "Check your email",
    we_sent_link_to: "We sent a sign-in link to {email}",
    click_link_explainer:
      "Click the link in the email to finish signing in. You can close this tab — the link will open a new session on any device.",
    use_different_email: "Use a different email",
    email_required_toast: "Please enter an email address.",
    link_sent_toast: "Sign-in link sent.",
    link_sent_toast_desc: "Check your inbox to finish signing in.",
  },
  ja: {
    eyebrow_sign_in: "ログイン",
    welcome_back: "おかえりなさい。",
    welcome_back_lede:
      "ご注文の確認、住所の更新、新しいドロップの先行アクセスにはログインが必要です。",
    loading: "読み込み中…",
    email_address_label: "メールアドレス",
    email_placeholder: "you@example.com",
    send_link: "ログインリンクを送信",
    sending: "送信中…",
    no_password_explainer_line1:
      "パスワードは不要です。安全なワンタップログインリンクをメールでお送りします。",
    no_password_explainer_line2:
      "初めてのご利用ですか？メールアドレスを入力するだけで、アカウントが自動で作成されます。",
    check_email_eyebrow: "メールをご確認ください",
    we_sent_link_to: "{email} にログインリンクを送信しました。",
    click_link_explainer:
      "メール内のリンクをクリックしてサインインを完了してください。このタブは閉じていただいて構いません。リンクからは任意のデバイスで新しいセッションが開きます。",
    use_different_email: "別のメールアドレスを使う",
    email_required_toast: "メールアドレスを入力してください。",
    link_sent_toast: "ログインリンクを送信しました。",
    link_sent_toast_desc: "受信トレイをご確認のうえ、サインインを完了してください。",
  },
  de: {
    eyebrow_sign_in: "Anmelden",
    welcome_back: "Willkommen zurück.",
    welcome_back_lede:
      "Melden Sie sich an, um Bestellungen einzusehen, Adressen zu aktualisieren und neue Drops als Erste zu erhalten.",
    loading: "Lädt…",
    email_address_label: "E-Mail-Adresse",
    email_placeholder: "sie@beispiel.com",
    send_link: "Anmelde-Link senden",
    sending: "Senden…",
    no_password_explainer_line1:
      "Kein Passwort erforderlich. Wir senden Ihnen einen sicheren Anmelde-Link per E-Mail.",
    no_password_explainer_line2:
      "Zum ersten Mal hier? Geben Sie einfach Ihre E-Mail ein — Ihr Konto wird automatisch erstellt.",
    check_email_eyebrow: "Prüfen Sie Ihre E-Mails",
    we_sent_link_to: "Wir haben einen Anmelde-Link an {email} gesendet",
    click_link_explainer:
      "Klicken Sie auf den Link in der E-Mail, um sich anzumelden. Sie können diesen Tab schließen — der Link öffnet eine neue Sitzung auf jedem Gerät.",
    use_different_email: "Andere E-Mail verwenden",
    email_required_toast: "Bitte geben Sie eine E-Mail-Adresse ein.",
    link_sent_toast: "Anmelde-Link gesendet.",
    link_sent_toast_desc: "Prüfen Sie Ihren Posteingang, um sich anzumelden.",
  },
  fr: {
    eyebrow_sign_in: "Se connecter",
    welcome_back: "Bon retour.",
    welcome_back_lede:
      "Connectez-vous pour consulter vos commandes, mettre à jour vos adresses et accéder en avant-première aux nouveaux drops.",
    loading: "Chargement…",
    email_address_label: "Adresse e-mail",
    email_placeholder: "vous@exemple.com",
    send_link: "Envoyer le lien de connexion",
    sending: "Envoi…",
    no_password_explainer_line1:
      "Aucun mot de passe requis. Nous vous enverrons un lien de connexion sécurisé par e-mail.",
    no_password_explainer_line2:
      "Première visite ? Saisissez simplement votre e-mail — votre compte est créé automatiquement.",
    check_email_eyebrow: "Vérifiez votre e-mail",
    we_sent_link_to: "Nous avons envoyé un lien de connexion à {email}",
    click_link_explainer:
      "Cliquez sur le lien dans l'e-mail pour terminer la connexion. Vous pouvez fermer cet onglet — le lien ouvrira une nouvelle session sur n'importe quel appareil.",
    use_different_email: "Utiliser un autre e-mail",
    email_required_toast: "Veuillez saisir une adresse e-mail.",
    link_sent_toast: "Lien de connexion envoyé.",
    link_sent_toast_desc: "Consultez votre boîte de réception pour terminer la connexion.",
  },
  es: {
    eyebrow_sign_in: "Iniciar sesión",
    welcome_back: "Bienvenido de nuevo.",
    welcome_back_lede:
      "Inicia sesión para revisar pedidos, actualizar direcciones y acceder primero a nuevos drops.",
    loading: "Cargando…",
    email_address_label: "Correo electrónico",
    email_placeholder: "tu@ejemplo.com",
    send_link: "Enviar enlace de acceso",
    sending: "Enviando…",
    no_password_explainer_line1:
      "Sin contraseña. Te enviaremos un enlace de acceso seguro por correo.",
    no_password_explainer_line2:
      "¿Primera vez? Solo introduce tu correo — tu cuenta se crea automáticamente.",
    check_email_eyebrow: "Revisa tu correo",
    we_sent_link_to: "Hemos enviado un enlace de acceso a {email}",
    click_link_explainer:
      "Haz clic en el enlace del correo para completar el acceso. Puedes cerrar esta pestaña — el enlace abrirá una nueva sesión en cualquier dispositivo.",
    use_different_email: "Usar otro correo",
    email_required_toast: "Introduce una dirección de correo.",
    link_sent_toast: "Enlace de acceso enviado.",
    link_sent_toast_desc: "Revisa tu bandeja de entrada para completar el acceso.",
  },
  it: {
    eyebrow_sign_in: "Accedi",
    welcome_back: "Bentornato.",
    welcome_back_lede:
      "Accedi per consultare gli ordini, aggiornare gli indirizzi e accedere in anteprima ai nuovi drop.",
    loading: "Caricamento…",
    email_address_label: "Indirizzo email",
    email_placeholder: "tu@esempio.com",
    send_link: "Invia link di accesso",
    sending: "Invio in corso…",
    no_password_explainer_line1:
      "Nessuna password richiesta. Ti invieremo un link di accesso sicuro via email.",
    no_password_explainer_line2:
      "È la prima volta? Inserisci semplicemente la tua email — il tuo account verrà creato automaticamente.",
    check_email_eyebrow: "Controlla la tua email",
    we_sent_link_to: "Abbiamo inviato un link di accesso a {email}",
    click_link_explainer:
      "Fai clic sul link nell'email per completare l'accesso. Puoi chiudere questa scheda — il link aprirà una nuova sessione su qualsiasi dispositivo.",
    use_different_email: "Usa un'altra email",
    email_required_toast: "Inserisci un indirizzo email.",
    link_sent_toast: "Link di accesso inviato.",
    link_sent_toast_desc: "Controlla la tua casella di posta per completare l'accesso.",
  },
  ko: {
    eyebrow_sign_in: "로그인",
    welcome_back: "다시 오신 것을 환영합니다.",
    welcome_back_lede:
      "주문을 확인하고 주소를 업데이트하며 새로운 드롭을 가장 먼저 받아보려면 로그인하세요.",
    loading: "로딩 중…",
    email_address_label: "이메일 주소",
    email_placeholder: "you@example.com",
    send_link: "로그인 링크 보내기",
    sending: "전송 중…",
    no_password_explainer_line1:
      "비밀번호가 필요 없습니다. 안전한 원탭 로그인 링크를 이메일로 보내드립니다.",
    no_password_explainer_line2:
      "처음이신가요? 이메일만 입력하시면 계정이 자동으로 생성됩니다.",
    check_email_eyebrow: "이메일을 확인하세요",
    we_sent_link_to: "{email} (으)로 로그인 링크를 보냈습니다",
    click_link_explainer:
      "이메일의 링크를 클릭하여 로그인을 완료하세요. 이 탭은 닫으셔도 됩니다. 링크는 어떤 기기에서든 새 세션을 엽니다.",
    use_different_email: "다른 이메일 사용",
    email_required_toast: "이메일 주소를 입력해 주세요.",
    link_sent_toast: "로그인 링크를 보냈습니다.",
    link_sent_toast_desc: "받은편지함을 확인하여 로그인을 완료하세요.",
  },
  "zh-TW": {
    eyebrow_sign_in: "登入",
    welcome_back: "歡迎回來。",
    welcome_back_lede:
      "登入以查看訂單、更新地址,並搶先獲得最新限量上架資訊。",
    loading: "載入中…",
    email_address_label: "電子郵件地址",
    email_placeholder: "you@example.com",
    send_link: "傳送登入連結",
    sending: "傳送中…",
    no_password_explainer_line1:
      "無需密碼。我們會透過電子郵件傳送安全的一鍵登入連結。",
    no_password_explainer_line2:
      "第一次造訪嗎?只需輸入電子郵件 — 系統會自動為您建立帳戶。",
    check_email_eyebrow: "請查看您的電子郵件",
    we_sent_link_to: "我們已將登入連結傳送至 {email}",
    click_link_explainer:
      "點擊電子郵件中的連結以完成登入。您可以關閉此分頁 — 連結會在任何裝置上開啟新的工作階段。",
    use_different_email: "使用其他電子郵件",
    email_required_toast: "請輸入電子郵件地址。",
    link_sent_toast: "登入連結已傳送。",
    link_sent_toast_desc: "請查看收件匣以完成登入。",
  },
  ru: {
    eyebrow_sign_in: "Войти",
    welcome_back: "С возвращением.",
    welcome_back_lede:
      "Войдите, чтобы посмотреть заказы, обновить адреса и первым получать новые дропы.",
    loading: "Загрузка…",
    email_address_label: "Электронная почта",
    email_placeholder: "you@example.com",
    send_link: "Отправить ссылку для входа",
    sending: "Отправка…",
    no_password_explainer_line1:
      "Пароль не нужен. Мы отправим вам безопасную ссылку для входа в один клик.",
    no_password_explainer_line2:
      "Впервые здесь? Просто введите вашу почту — аккаунт создаётся автоматически.",
    check_email_eyebrow: "Проверьте почту",
    we_sent_link_to: "Мы отправили ссылку для входа на {email}",
    click_link_explainer:
      "Нажмите ссылку в письме, чтобы завершить вход. Эту вкладку можно закрыть — ссылка откроет новую сессию на любом устройстве.",
    use_different_email: "Использовать другую почту",
    email_required_toast: "Пожалуйста, введите адрес электронной почты.",
    link_sent_toast: "Ссылка для входа отправлена.",
    link_sent_toast_desc: "Проверьте входящие, чтобы завершить вход.",
  },
  ar: {
    eyebrow_sign_in: "تسجيل الدخول",
    welcome_back: "مرحبًا بعودتك.",
    welcome_back_lede:
      "سجّل الدخول لمراجعة الطلبات وتحديث العناوين والحصول على أحدث الإطلاقات أولاً.",
    loading: "جارٍ التحميل…",
    email_address_label: "البريد الإلكتروني",
    email_placeholder: "you@example.com",
    send_link: "إرسال رابط الدخول",
    sending: "جارٍ الإرسال…",
    no_password_explainer_line1:
      "لا حاجة لكلمة مرور. سنرسل لك رابط دخول آمنًا بنقرة واحدة عبر البريد الإلكتروني.",
    no_password_explainer_line2:
      "أول مرة؟ فقط أدخل بريدك الإلكتروني — سيتم إنشاء حسابك تلقائيًا.",
    check_email_eyebrow: "تحقق من بريدك الإلكتروني",
    we_sent_link_to: "أرسلنا رابط الدخول إلى {email}",
    click_link_explainer:
      "اضغط على الرابط في البريد الإلكتروني لإكمال تسجيل الدخول. يمكنك إغلاق هذا التبويب — سيفتح الرابط جلسة جديدة على أي جهاز.",
    use_different_email: "استخدم بريدًا إلكترونيًا آخر",
    email_required_toast: "يرجى إدخال عنوان البريد الإلكتروني.",
    link_sent_toast: "تم إرسال رابط الدخول.",
    link_sent_toast_desc: "تحقق من صندوق الوارد لإكمال تسجيل الدخول.",
  },
};

// Guest checkout gate — adds keys to checkout namespace.
const CHECKOUT_GATE_KEYS = {
  en: {
    gate_eyebrow: "How would you like to continue?",
    gate_title: "Sign in or check out as guest.",
    gate_lede:
      "Signed-in customers see saved addresses, order history, and faster repeat checkout. Guest checkout is fine too — we'll email order updates either way.",
    gate_sign_in_title: "Sign in",
    gate_sign_in_lede: "Use your saved address and order history.",
    gate_sign_in_cta: "Sign in",
    gate_guest_title: "Check out as guest",
    gate_guest_lede: "Enter your details just for this order.",
    gate_guest_cta: "Continue as guest",
    gate_signed_in_as: "Signed in as {email}",
    gate_not_you: "Not you?",
    gate_sign_out: "Sign out",
  },
  ja: {
    gate_eyebrow: "次のステップ",
    gate_title: "ログインまたはゲスト購入",
    gate_lede:
      "ログインすると保存済みの住所・注文履歴・スムーズなリピート購入をご利用いただけます。ゲスト購入でもご注文確認メールはお届けします。",
    gate_sign_in_title: "ログイン",
    gate_sign_in_lede: "保存済みの住所と注文履歴をそのまま利用",
    gate_sign_in_cta: "ログインする",
    gate_guest_title: "ゲストとして購入",
    gate_guest_lede: "今回のご注文だけ情報を入力",
    gate_guest_cta: "ゲストとして続ける",
    gate_signed_in_as: "{email} としてログイン中",
    gate_not_you: "別のアカウントで?",
    gate_sign_out: "ログアウト",
  },
  de: {
    gate_eyebrow: "Wie möchten Sie fortfahren?",
    gate_title: "Anmelden oder als Gast bestellen.",
    gate_lede:
      "Angemeldete Kund:innen sehen gespeicherte Adressen, Bestellverlauf und kommen schneller durch die Kasse. Gast-Bestellung ist auch in Ordnung — wir senden Updates per E-Mail.",
    gate_sign_in_title: "Anmelden",
    gate_sign_in_lede: "Mit gespeicherter Adresse und Bestellhistorie.",
    gate_sign_in_cta: "Anmelden",
    gate_guest_title: "Als Gast bestellen",
    gate_guest_lede: "Nur für diese Bestellung Details eingeben.",
    gate_guest_cta: "Als Gast fortfahren",
    gate_signed_in_as: "Angemeldet als {email}",
    gate_not_you: "Nicht Sie?",
    gate_sign_out: "Abmelden",
  },
  fr: {
    gate_eyebrow: "Comment souhaitez-vous continuer ?",
    gate_title: "Se connecter ou commander en tant qu'invité.",
    gate_lede:
      "Les clients connectés voient leurs adresses enregistrées, l'historique des commandes et passent plus vite à la caisse. La commande en tant qu'invité est aussi possible — nous enverrons les mises à jour par e-mail.",
    gate_sign_in_title: "Se connecter",
    gate_sign_in_lede: "Avec votre adresse enregistrée et votre historique.",
    gate_sign_in_cta: "Se connecter",
    gate_guest_title: "Commander en invité",
    gate_guest_lede: "Saisissez vos coordonnées uniquement pour cette commande.",
    gate_guest_cta: "Continuer en invité",
    gate_signed_in_as: "Connecté en tant que {email}",
    gate_not_you: "Ce n'est pas vous ?",
    gate_sign_out: "Se déconnecter",
  },
  es: {
    gate_eyebrow: "¿Cómo deseas continuar?",
    gate_title: "Iniciar sesión o continuar como invitado.",
    gate_lede:
      "Los clientes registrados ven direcciones guardadas, historial de pedidos y un pago más rápido. El pago como invitado también está bien — enviaremos actualizaciones por correo en ambos casos.",
    gate_sign_in_title: "Iniciar sesión",
    gate_sign_in_lede: "Con tu dirección guardada e historial.",
    gate_sign_in_cta: "Iniciar sesión",
    gate_guest_title: "Continuar como invitado",
    gate_guest_lede: "Introduce tus datos solo para este pedido.",
    gate_guest_cta: "Continuar como invitado",
    gate_signed_in_as: "Sesión iniciada como {email}",
    gate_not_you: "¿No eres tú?",
    gate_sign_out: "Cerrar sesión",
  },
  it: {
    gate_eyebrow: "Come desideri continuare?",
    gate_title: "Accedi o continua come ospite.",
    gate_lede:
      "I clienti registrati vedono indirizzi salvati, cronologia ordini e checkout più rapido. Anche il checkout come ospite va bene — invieremo aggiornamenti via email in entrambi i casi.",
    gate_sign_in_title: "Accedi",
    gate_sign_in_lede: "Con il tuo indirizzo salvato e la cronologia.",
    gate_sign_in_cta: "Accedi",
    gate_guest_title: "Continua come ospite",
    gate_guest_lede: "Inserisci i dati solo per questo ordine.",
    gate_guest_cta: "Continua come ospite",
    gate_signed_in_as: "Connesso come {email}",
    gate_not_you: "Non sei tu?",
    gate_sign_out: "Esci",
  },
  ko: {
    gate_eyebrow: "어떻게 진행하시겠습니까?",
    gate_title: "로그인 또는 비회원 결제",
    gate_lede:
      "로그인 회원은 저장된 주소, 주문 내역, 빠른 재구매 결제를 이용할 수 있습니다. 비회원 결제도 가능하며, 주문 업데이트는 어느 쪽이든 이메일로 보내드립니다.",
    gate_sign_in_title: "로그인",
    gate_sign_in_lede: "저장된 주소와 주문 내역 사용",
    gate_sign_in_cta: "로그인하기",
    gate_guest_title: "비회원 결제",
    gate_guest_lede: "이번 주문에만 정보를 입력",
    gate_guest_cta: "비회원으로 계속",
    gate_signed_in_as: "{email} (으)로 로그인 중",
    gate_not_you: "본인이 아니신가요?",
    gate_sign_out: "로그아웃",
  },
  "zh-TW": {
    gate_eyebrow: "您希望如何繼續?",
    gate_title: "登入或以訪客身分結帳。",
    gate_lede:
      "登入會員可查看已儲存的地址、訂單記錄,並享有更快的回購結帳。訪客結帳也沒問題 — 兩種方式我們都會以電子郵件寄送訂單更新。",
    gate_sign_in_title: "登入",
    gate_sign_in_lede: "使用已儲存的地址與訂單記錄。",
    gate_sign_in_cta: "登入",
    gate_guest_title: "以訪客身分結帳",
    gate_guest_lede: "僅為此次訂單輸入資料。",
    gate_guest_cta: "以訪客繼續",
    gate_signed_in_as: "已登入為 {email}",
    gate_not_you: "不是您?",
    gate_sign_out: "登出",
  },
  ru: {
    gate_eyebrow: "Как продолжить?",
    gate_title: "Войдите или продолжите как гость.",
    gate_lede:
      "У авторизованных клиентов сохранены адреса, история заказов и быстрое повторное оформление. Гостевое оформление тоже подходит — обновления по заказу мы пришлём на почту в любом случае.",
    gate_sign_in_title: "Войти",
    gate_sign_in_lede: "С сохранённым адресом и историей заказов.",
    gate_sign_in_cta: "Войти",
    gate_guest_title: "Оформить как гость",
    gate_guest_lede: "Введите данные только для этого заказа.",
    gate_guest_cta: "Продолжить как гость",
    gate_signed_in_as: "Вы вошли как {email}",
    gate_not_you: "Это не вы?",
    gate_sign_out: "Выйти",
  },
  ar: {
    gate_eyebrow: "كيف تود المتابعة؟",
    gate_title: "تسجيل الدخول أو الشراء كضيف.",
    gate_lede:
      "العملاء المسجلون يرون العناوين المحفوظة وسجل الطلبات وإتمام الدفع بشكل أسرع. الدفع كضيف ممكن أيضًا — سنرسل تحديثات الطلب بالبريد الإلكتروني في كلتا الحالتين.",
    gate_sign_in_title: "تسجيل الدخول",
    gate_sign_in_lede: "باستخدام عنوانك المحفوظ وسجل الطلبات.",
    gate_sign_in_cta: "تسجيل الدخول",
    gate_guest_title: "الشراء كضيف",
    gate_guest_lede: "أدخل بياناتك لهذا الطلب فقط.",
    gate_guest_cta: "المتابعة كضيف",
    gate_signed_in_as: "تم تسجيل الدخول باسم {email}",
    gate_not_you: "أنت لست المعني؟",
    gate_sign_out: "تسجيل الخروج",
  },
};

const LOCALES = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru", "ar"];

let added = 0;
let skipped = 0;

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);

  json.auth ??= {};
  for (const [key, value] of Object.entries(AUTH_KEYS[locale])) {
    if (json.auth[key] !== undefined) {
      skipped++;
      continue;
    }
    json.auth[key] = value;
    added++;
  }

  json.checkout ??= {};
  for (const [key, value] of Object.entries(CHECKOUT_GATE_KEYS[locale])) {
    if (json.checkout[key] !== undefined) {
      skipped++;
      continue;
    }
    json.checkout[key] = value;
    added++;
  }

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`[i18n] ${locale}.json updated`);
}

console.log(`[i18n] done — added ${added} keys, skipped ${skipped} pre-existing`);
