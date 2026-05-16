import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Exchange Skills": "Exchange Skills.",
      "Grow Together": "Grow Together.",
      "Hero Description": "A peer-to-peer ecosystem where you teach what you know and learn what you don't. Connect with mentors globally, earn credits, and level up your skills!",
      "Explore Skills": "Explore Skills",
      "Join the Community": "Join the Community",
      "Barter Skills": "Barter Skills",
      "Barter Desc": "Teach coding, learn guitar. Exchange what you know for what you need.",
      "Live Video": "Live Video Sessions",
      "Video Desc": "Real-time video calls with screen sharing and in-app chat.",
      "Earn Grow": "Earn & Grow",
      "Earn Desc": "Earn credits, badges, and climb the leaderboard as you help others.",
      "Search": "Search...",
      "Explore": "Explore",
      "Dashboard": "Dashboard",
      "Sessions": "Sessions",
      "Chat": "Chat",
      "Rankings": "Rankings",
      "Community": "Community",
      "Sign In": "Sign In",
      "Get Started": "Get Started",
      "Profile": "Profile",
      "Logout": "Logout",
    }
  },
  hi: {
    translation: {
      "Exchange Skills": "कौशल का आदान-प्रदान करें।",
      "Grow Together": "एक साथ बढ़ें।",
      "Hero Description": "एक पीयर-टू-पीयर इकोसिस्टम जहां आप वह सिखाते हैं जो आप जानते हैं और वह सीखते हैं जो आप नहीं जानते। विश्व स्तर पर मेंटर्स से जुड़ें, क्रेडिट कमाएं, और अपने कौशल को बेहतर बनाएं!",
      "Explore Skills": "कौशल खोजें",
      "Join the Community": "समुदाय में शामिल हों",
      "Barter Skills": "वस्तु विनिमय कौशल",
      "Barter Desc": "कोडिंग सिखाएं, गिटार सीखें। जो आप जानते हैं उसे उसके बदले में बदलें जिसकी आपको आवश्यकता है।",
      "Live Video": "लाइव वीडियो सत्र",
      "Video Desc": "स्क्रीन शेयरिंग और इन-ऐप चैट के साथ रीयल-टाइम वीडियो कॉल।",
      "Earn Grow": "कमाएं और बढ़ें",
      "Earn Desc": "क्रेडिट, बैज अर्जित करें और दूसरों की मदद करते हुए लीडरबोर्ड पर चढ़ें।",
      "Search": "खोजें...",
      "Explore": "खोजें",
      "Dashboard": "डैशबोर्ड",
      "Sessions": "सत्र",
      "Chat": "चैट",
      "Rankings": "रैंकिंग",
      "Community": "समुदाय",
      "Sign In": "साइन इन",
      "Get Started": "शुरू करें",
      "Profile": "प्रोफ़ाइल",
      "Logout": "लॉग आउट",
    }
  },
  es: {
    translation: {
      "Exchange Skills": "Intercambiar Habilidades.",
      "Grow Together": "Crecer Juntos.",
      "Hero Description": "Un ecosistema de igual a igual donde enseñas lo que sabes y aprendes lo que no. ¡Conéctate con mentores globalmente, gana créditos y mejora tus habilidades!",
      "Explore Skills": "Explorar Habilidades",
      "Join the Community": "Únete a la Comunidad",
      "Barter Skills": "Habilidades de Trueque",
      "Barter Desc": "Enseña programación, aprende guitarra. Intercambia lo que sabes por lo que necesitas.",
      "Live Video": "Sesiones de Video en Vivo",
      "Video Desc": "Videollamadas en tiempo real con uso compartido de pantalla y chat en la aplicación.",
      "Earn Grow": "Gana y Crece",
      "Earn Desc": "Gana créditos, insignias y sube en la clasificación mientras ayudas a otros.",
      "Search": "Buscar...",
      "Explore": "Explorar",
      "Dashboard": "Panel",
      "Sessions": "Sesiones",
      "Chat": "Chat",
      "Rankings": "Clasificaciones",
      "Community": "Comunidad",
      "Sign In": "Iniciar Sesión",
      "Get Started": "Empezar",
      "Profile": "Perfil",
      "Logout": "Cerrar sesión",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

export default i18n;
