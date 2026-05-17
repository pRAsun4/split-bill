/**
 * i18n.ts
 * ───────
 * All user-facing UI strings live here.
 * Adding a new language = adding one block to STRINGS.
 *
 * Usage:
 *   const t = useI18n();
 *   <Text>{t.home.pendingBills}</Text>
 */

import { LanguageCode, usePrefsStore } from "../store/usePrefsStore";

// ─── String definitions ───────────────────────────────────────────────────────

type Strings = {
    common: {
        settledUp: string;
        youAreOwed: string;
        youOwe: string;
        viewAll: string;
        save: string;
        cancel: string;
        confirm: string;
        loading: string;
        noData: string;
        total: string;
        members: string;
        expense: string;
        expenses: string;
        groups: string;
        friends: string;
        back: string;
        settle: string;
        addExpense: string;
        notInvolved: string;
        paid: string;
        youPaid: string;
    };
    home: {
        title: string;
        pendingBills: string;
        owesYou: string;
        youOweLabel: string;
    };
    groups: {
        title: string;
        subtitle: (n: number) => string;
        noGroups: string;
        newGroup: string;
        groupIcon: string;
        groupName: string;
        addFriends: string;
        createGroup: string;
        membersIn: string;
    };
    groupDetail: {
        settleUp: string;
        whoOwesWhom: string;
        noExpenses: string;
        addFirst: string;
    };
    transactions: {
        title: string;
        subtitle: (n: number) => string;
        paidOut: string;
        youOwe: string;
        search: string;
        all: string;
        youPaid: string;
        youOweTab: string;
        noTransactions: string;
    };
    settle: {
        title: string;
        allSettled: string;
        allSettledSub: string;
        youNeedToPay: string;
        youWillReceive: string;
        betweenOthers: string;
        confirmPayment: string;
        owes: string;
        confirmSettle: (from: string, to: string, amount: string) => string;
        settled: string;
        settledMsg: string;
    };
    profile: {
        title: string;
        editProfile: string;
        editSub: string;
        notifications: string;
        notifSub: string;
        currency: string;
        theme: string;
        language: string;
        privacyPolicy: string;
        helpSupport: string;
        signOut: string;
        signOutConfirm: string;
        signOutMsg: string;
        owedToYou: string;
        youOwe: string;
        account: string;
        preferences: string;
        more: string;
        version: string;
    };
    auth: {
        welcomeBack: string;
        signInSub: string;
        signIn: string;
        createAccount: string;
        createAccountSub: string;
        forgotPassword: string;
        forgotSub: string;
        sendResetLink: string;
        checkInbox: string;
        emailLabel: string;
        passwordLabel: string;
        nameLabel: string;
        confirmPasswordLabel: string;
        continueWithGoogle: string;
        noAccount: string;
        haveAccount: string;
        backToSignIn: string;
        forgotLink: string;
    };
};

// ─── Language packs ───────────────────────────────────────────────────────────

const STRINGS: Record<LanguageCode, Strings> = {
    // ── English ──────────────────────────────────────────────────────────────────
    en: {
        common: {
            settledUp: "Settled up",
            youAreOwed: "You are owed",
            youOwe: "You owe",
            viewAll: "View All",
            save: "Save",
            cancel: "Cancel",
            confirm: "Confirm",
            loading: "Loading...",
            noData: "Nothing here yet",
            total: "Total",
            members: "Members",
            expense: "expense",
            expenses: "expenses",
            groups: "Groups",
            friends: "Friends",
            back: "Back",
            settle: "Settle",
            addExpense: "Add Expense",
            notInvolved: "Not Involved",
            paid: "paid",
            youPaid: "You paid",
        },
        home: {
            title: "Splitty",
            pendingBills: "Pending Bills",
            owesYou: "Owes you",
            youOweLabel: "You Owe",
        },
        groups: {
            title: "Groups",
            subtitle: (n) => `You are in ${n} group${n !== 1 ? "s" : ""}.`,
            noGroups: "No groups yet",
            newGroup: "New Group",
            groupIcon: "Group Icon",
            groupName: "Group Name",
            addFriends: "Add Friends",
            createGroup: "Create Group",
            membersIn: "members",
        },
        groupDetail: {
            settleUp: "Settle Up",
            whoOwesWhom: "Who owes whom?",
            noExpenses: "No expenses yet",
            addFirst: "Add the first expense",
        },
        transactions: {
            title: "Activity",
            subtitle: (n) => `${n} total expenses`,
            paidOut: "Paid out",
            youOwe: "You owe",
            search: "Search expenses...",
            all: "All",
            youPaid: "You Paid",
            youOweTab: "You Owe",
            noTransactions: "No transactions found",
        },
        settle: {
            title: "Settle Up",
            allSettled: "All settled up!",
            allSettledSub: "No outstanding debts in this group.",
            youNeedToPay: "You Need To Pay",
            youWillReceive: "You Will Receive",
            betweenOthers: "Between Others",
            confirmPayment: "Confirm Payment",
            owes: "owes",
            confirmSettle: (from, to, amount) => `Record ${amount} payment from ${from} to ${to}?`,
            settled: "Settled!",
            settledMsg: "Payment recorded successfully.",
        },
        profile: {
            title: "Your Profile",
            editProfile: "Edit Profile",
            editSub: "Name, username, bio",
            notifications: "Notifications",
            notifSub: "Push alerts & reminders",
            currency: "Currency",
            theme: "Theme",
            language: "Language",
            privacyPolicy: "Privacy Policy",
            helpSupport: "Help & Support",
            signOut: "Sign Out",
            signOutConfirm: "Sign Out",
            signOutMsg: "Are you sure you want to sign out?",
            owedToYou: "Owed to you",
            youOwe: "You owe",
            account: "Account",
            preferences: "Preferences",
            more: "More",
            version: "Splitty v1.0.0",
        },
        auth: {
            welcomeBack: "Welcome back 👋",
            signInSub: "Sign in to continue splitting",
            signIn: "Sign In",
            createAccount: "Create Account",
            createAccountSub: "Start splitting expenses in seconds",
            forgotPassword: "Forgot password?",
            forgotSub: "Enter your email and we'll send a reset link.",
            sendResetLink: "Send Reset Link",
            checkInbox: "Check your inbox!",
            emailLabel: "Email address",
            passwordLabel: "Password",
            nameLabel: "Full Name",
            confirmPasswordLabel: "Confirm Password",
            continueWithGoogle: "Continue with Google",
            noAccount: "Don't have an account?",
            haveAccount: "Already have an account?",
            backToSignIn: "Back to Sign In",
            forgotLink: "Forgot password?",
        },
    },

    // ── Hindi ─────────────────────────────────────────────────────────────────────
    hi: {
        common: {
            settledUp: "चुकता हो गया",
            youAreOwed: "आपका बकाया है",
            youOwe: "आप पर बकाया है",
            viewAll: "सब देखें",
            save: "सहेजें",
            cancel: "रद्द करें",
            confirm: "पुष्टि करें",
            loading: "लोड हो रहा है...",
            noData: "अभी कुछ नहीं है",
            total: "कुल",
            members: "सदस्य",
            expense: "खर्च",
            expenses: "खर्चे",
            groups: "समूह",
            friends: "दोस्त",
            back: "वापस",
            settle: "चुकाएं",
            addExpense: "खर्च जोड़ें",
            notInvolved: "शामिल नहीं",
            paid: "भुगतान किया",
            youPaid: "आपने भुगतान किया",
        },
        home: {
            title: "Splitty",
            pendingBills: "लंबित बिल",
            owesYou: "आपका बकाया",
            youOweLabel: "आप पर बकाया",
        },
        groups: {
            title: "समूह",
            subtitle: (n) => `आप ${n} समूह में हैं।`,
            noGroups: "अभी कोई समूह नहीं",
            newGroup: "नया समूह",
            groupIcon: "समूह आइकन",
            groupName: "समूह का नाम",
            addFriends: "दोस्त जोड़ें",
            createGroup: "समूह बनाएं",
            membersIn: "सदस्य",
        },
        groupDetail: {
            settleUp: "चुकाएं",
            whoOwesWhom: "कौन किसको देता है?",
            noExpenses: "अभी कोई खर्च नहीं",
            addFirst: "पहला खर्च जोड़ें",
        },
        transactions: {
            title: "गतिविधि",
            subtitle: (n) => `कुल ${n} खर्चे`,
            paidOut: "भुगतान किया",
            youOwe: "आप पर बकाया",
            search: "खर्चे खोजें...",
            all: "सभी",
            youPaid: "आपने भुगतान किया",
            youOweTab: "आप पर बकाया",
            noTransactions: "कोई लेनदेन नहीं मिला",
        },
        settle: {
            title: "चुकाएं",
            allSettled: "सब चुकता हो गया!",
            allSettledSub: "इस समूह में कोई बकाया नहीं है।",
            youNeedToPay: "आपको देना है",
            youWillReceive: "आपको मिलेगा",
            betweenOthers: "दूसरों के बीच",
            confirmPayment: "भुगतान की पुष्टि करें",
            owes: "का बकाया है",
            confirmSettle: (from, to, amount) => `${from} से ${to} को ${amount} का भुगतान दर्ज करें?`,
            settled: "चुकता!",
            settledMsg: "भुगतान सफलतापूर्वक दर्ज किया गया।",
        },
        profile: {
            title: "आपकी प्रोफ़ाइल",
            editProfile: "प्रोफ़ाइल संपादित करें",
            editSub: "नाम, उपयोगकर्ता नाम, बायो",
            notifications: "सूचनाएं",
            notifSub: "पुश अलर्ट और रिमाइंडर",
            currency: "मुद्रा",
            theme: "थीम",
            language: "भाषा",
            privacyPolicy: "गोपनीयता नीति",
            helpSupport: "सहायता",
            signOut: "साइन आउट",
            signOutConfirm: "साइन आउट",
            signOutMsg: "क्या आप साइन आउट करना चाहते हैं?",
            owedToYou: "आपका बकाया",
            youOwe: "आप पर बकाया",
            account: "खाता",
            preferences: "प्राथमिकताएं",
            more: "और",
            version: "Splitty v1.0.0",
        },
        auth: {
            welcomeBack: "वापस आपका स्वागत है 👋",
            signInSub: "विभाजन जारी रखने के लिए साइन इन करें",
            signIn: "साइन इन करें",
            createAccount: "खाता बनाएं",
            createAccountSub: "कुछ ही सेकंड में खर्चे बाँटना शुरू करें",
            forgotPassword: "पासवर्ड भूल गए?",
            forgotSub: "अपना ईमेल दर्ज करें और हम रीसेट लिंक भेजेंगे।",
            sendResetLink: "रीसेट लिंक भेजें",
            checkInbox: "अपना इनबॉक्स देखें!",
            emailLabel: "ईमेल पता",
            passwordLabel: "पासवर्ड",
            nameLabel: "पूरा नाम",
            confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
            continueWithGoogle: "Google से जारी रखें",
            noAccount: "खाता नहीं है?",
            haveAccount: "पहले से खाता है?",
            backToSignIn: "साइन इन पर वापस जाएं",
            forgotLink: "पासवर्ड भूल गए?",
        },
    },

    // ── French ────────────────────────────────────────────────────────────────────
    fr: {
        common: {
            settledUp: "Soldé",
            youAreOwed: "On vous doit",
            youOwe: "Vous devez",
            viewAll: "Voir tout",
            save: "Enregistrer",
            cancel: "Annuler",
            confirm: "Confirmer",
            loading: "Chargement...",
            noData: "Rien ici pour l'instant",
            total: "Total",
            members: "Membres",
            expense: "dépense",
            expenses: "dépenses",
            groups: "Groupes",
            friends: "Amis",
            back: "Retour",
            settle: "Solder",
            addExpense: "Ajouter une dépense",
            notInvolved: "Non concerné",
            paid: "payé",
            youPaid: "Vous avez payé",
        },
        home: {
            title: "Splitty",
            pendingBills: "Factures en attente",
            owesYou: "Vous doit",
            youOweLabel: "Vous devez",
        },
        groups: {
            title: "Groupes",
            subtitle: (n) => `Vous êtes dans ${n} groupe${n !== 1 ? "s" : ""}.`,
            noGroups: "Pas encore de groupes",
            newGroup: "Nouveau groupe",
            groupIcon: "Icône du groupe",
            groupName: "Nom du groupe",
            addFriends: "Ajouter des amis",
            createGroup: "Créer un groupe",
            membersIn: "membres",
        },
        groupDetail: {
            settleUp: "Solder",
            whoOwesWhom: "Qui doit quoi à qui ?",
            noExpenses: "Pas encore de dépenses",
            addFirst: "Ajouter la première dépense",
        },
        transactions: {
            title: "Activité",
            subtitle: (n) => `${n} dépenses au total`,
            paidOut: "Payé",
            youOwe: "Vous devez",
            search: "Rechercher des dépenses...",
            all: "Tout",
            youPaid: "Vous avez payé",
            youOweTab: "Vous devez",
            noTransactions: "Aucune transaction trouvée",
        },
        settle: {
            title: "Solder",
            allSettled: "Tout est soldé !",
            allSettledSub: "Aucune dette en suspens dans ce groupe.",
            youNeedToPay: "Vous devez payer",
            youWillReceive: "Vous allez recevoir",
            betweenOthers: "Entre autres",
            confirmPayment: "Confirmer le paiement",
            owes: "doit",
            confirmSettle: (from, to, amount) => `Enregistrer un paiement de ${amount} de ${from} à ${to} ?`,
            settled: "Soldé !",
            settledMsg: "Paiement enregistré avec succès.",
        },
        profile: {
            title: "Votre profil",
            editProfile: "Modifier le profil",
            editSub: "Nom, pseudo, bio",
            notifications: "Notifications",
            notifSub: "Alertes push et rappels",
            currency: "Devise",
            theme: "Thème",
            language: "Langue",
            privacyPolicy: "Politique de confidentialité",
            helpSupport: "Aide & Support",
            signOut: "Se déconnecter",
            signOutConfirm: "Se déconnecter",
            signOutMsg: "Êtes-vous sûr de vouloir vous déconnecter ?",
            owedToYou: "On vous doit",
            youOwe: "Vous devez",
            account: "Compte",
            preferences: "Préférences",
            more: "Plus",
            version: "Splitty v1.0.0",
        },
        auth: {
            welcomeBack: "Bon retour 👋",
            signInSub: "Connectez-vous pour continuer",
            signIn: "Se connecter",
            createAccount: "Créer un compte",
            createAccountSub: "Commencez à partager les dépenses en quelques secondes",
            forgotPassword: "Mot de passe oublié ?",
            forgotSub: "Entrez votre email et nous vous enverrons un lien de réinitialisation.",
            sendResetLink: "Envoyer le lien",
            checkInbox: "Vérifiez votre boîte mail !",
            emailLabel: "Adresse email",
            passwordLabel: "Mot de passe",
            nameLabel: "Nom complet",
            confirmPasswordLabel: "Confirmer le mot de passe",
            continueWithGoogle: "Continuer avec Google",
            noAccount: "Pas de compte ?",
            haveAccount: "Vous avez déjà un compte ?",
            backToSignIn: "Retour à la connexion",
            forgotLink: "Mot de passe oublié ?",
        },
    },

    // ── Spanish ───────────────────────────────────────────────────────────────────
    es: {
        common: {
            settledUp: "Liquidado",
            youAreOwed: "Te deben",
            youOwe: "Debes",
            viewAll: "Ver todo",
            save: "Guardar",
            cancel: "Cancelar",
            confirm: "Confirmar",
            loading: "Cargando...",
            noData: "Nada aquí todavía",
            total: "Total",
            members: "Miembros",
            expense: "gasto",
            expenses: "gastos",
            groups: "Grupos",
            friends: "Amigos",
            back: "Atrás",
            settle: "Liquidar",
            addExpense: "Agregar gasto",
            notInvolved: "No involucrado",
            paid: "pagó",
            youPaid: "Tú pagaste",
        },
        home: {
            title: "Splitty",
            pendingBills: "Facturas pendientes",
            owesYou: "Te debe",
            youOweLabel: "Debes",
        },
        groups: {
            title: "Grupos",
            subtitle: (n) => `Estás en ${n} grupo${n !== 1 ? "s" : ""}.`,
            noGroups: "Aún no hay grupos",
            newGroup: "Nuevo grupo",
            groupIcon: "Ícono del grupo",
            groupName: "Nombre del grupo",
            addFriends: "Agregar amigos",
            createGroup: "Crear grupo",
            membersIn: "miembros",
        },
        groupDetail: {
            settleUp: "Liquidar",
            whoOwesWhom: "¿Quién le debe a quién?",
            noExpenses: "Aún no hay gastos",
            addFirst: "Agregar el primer gasto",
        },
        transactions: {
            title: "Actividad",
            subtitle: (n) => `${n} gastos en total`,
            paidOut: "Pagado",
            youOwe: "Debes",
            search: "Buscar gastos...",
            all: "Todo",
            youPaid: "Tú pagaste",
            youOweTab: "Debes",
            noTransactions: "No se encontraron transacciones",
        },
        settle: {
            title: "Liquidar",
            allSettled: "¡Todo liquidado!",
            allSettledSub: "No hay deudas pendientes en este grupo.",
            youNeedToPay: "Necesitas pagar",
            youWillReceive: "Recibirás",
            betweenOthers: "Entre otros",
            confirmPayment: "Confirmar pago",
            owes: "debe",
            confirmSettle: (from, to, amount) => `¿Registrar pago de ${amount} de ${from} a ${to}?`,
            settled: "¡Liquidado!",
            settledMsg: "Pago registrado exitosamente.",
        },
        profile: {
            title: "Tu perfil",
            editProfile: "Editar perfil",
            editSub: "Nombre, usuario, bio",
            notifications: "Notificaciones",
            notifSub: "Alertas push y recordatorios",
            currency: "Moneda",
            theme: "Tema",
            language: "Idioma",
            privacyPolicy: "Política de privacidad",
            helpSupport: "Ayuda y soporte",
            signOut: "Cerrar sesión",
            signOutConfirm: "Cerrar sesión",
            signOutMsg: "¿Estás seguro de que quieres cerrar sesión?",
            owedToYou: "Te deben",
            youOwe: "Debes",
            account: "Cuenta",
            preferences: "Preferencias",
            more: "Más",
            version: "Splitty v1.0.0",
        },
        auth: {
            welcomeBack: "Bienvenido de nuevo 👋",
            signInSub: "Inicia sesión para continuar",
            signIn: "Iniciar sesión",
            createAccount: "Crear cuenta",
            createAccountSub: "Comienza a dividir gastos en segundos",
            forgotPassword: "¿Olvidaste tu contraseña?",
            forgotSub: "Ingresa tu email y te enviaremos un enlace de restablecimiento.",
            sendResetLink: "Enviar enlace",
            checkInbox: "¡Revisa tu bandeja de entrada!",
            emailLabel: "Correo electrónico",
            passwordLabel: "Contraseña",
            nameLabel: "Nombre completo",
            confirmPasswordLabel: "Confirmar contraseña",
            continueWithGoogle: "Continuar con Google",
            noAccount: "¿No tienes cuenta?",
            haveAccount: "¿Ya tienes una cuenta?",
            backToSignIn: "Volver al inicio de sesión",
            forgotLink: "¿Olvidaste tu contraseña?",
        },
    },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n(): Strings {
    const language = usePrefsStore((s) => s.language);
    return STRINGS[language] ?? STRINGS.en;
}

// ─── Language metadata ────────────────────────────────────────────────────────

export type LangMeta = {
    code: LanguageCode;
    name: string;
    nativeName: string;
    flag: string;
    region: string;
};

export const LANGUAGES: LangMeta[] = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", region: "United States / Canada" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", region: "India" },
    { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", region: "France / Europe" },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", region: "Spain / Latin America" },
];