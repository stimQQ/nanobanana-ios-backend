/**
 * Message utilities for localized success/error messages
 */

export interface LocalizedMessage {
  en: string;
  cn: string;
  jp: string;
  kr: string;
  de: string;
  fr: string;
}

// Success messages for image generation
export const generationSuccessMessages: LocalizedMessage = {
  en: 'Great! Your image has been successfully modified!',
  cn: '太好了，图片已为您修改成功！',
  jp: '素晴らしい！画像が正常に修正されました！',
  kr: '좋습니다! 이미지가 성공적으로 수정되었습니다!',
  de: 'Großartig! Ihr Bild wurde erfolgreich geändert!',
  fr: 'Génial! Votre image a été modifiée avec succès!',
};

// Welcome messages
export const welcomeMessages: LocalizedMessage = {
  en: "Hi! I'm your AI image generation assistant. Describe what you'd like to create!",
  cn: '您好！我是您的AI图像生成助手。请描述您想创建什么！',
  jp: 'こんにちは！AI画像生成アシスタントです。作りたいものを説明してください！',
  kr: '안녕하세요! AI 이미지 생성 도우미입니다. 만들고 싶은 것을 설명해주세요!',
  de: 'Hallo! Ich bin Ihr KI-Bildgenerierungsassistent. Beschreiben Sie, was Sie erstellen möchten!',
  fr: "Salut! Je suis votre assistant de génération d'images IA. Décrivez ce que vous souhaitez créer!",
};

// New chat messages
export const newChatMessages: LocalizedMessage = {
  en: 'New chat started! What would you like to create?',
  cn: '新对话已开始！您想创建什么？',
  jp: '新しいチャットを開始しました！何を作りたいですか？',
  kr: '새 채팅이 시작되었습니다! 무엇을 만들고 싶으신가요?',
  de: 'Neuer Chat gestartet! Was möchten Sie erstellen?',
  fr: 'Nouveau chat commencé! Que souhaitez-vous créer?',
};

// Error messages
export const errorMessages: LocalizedMessage = {
  en: "Sorry, I couldn't generate the image.",
  cn: '抱歉，无法生成图像。',
  jp: '申し訳ありません、画像を生成できませんでした。',
  kr: '죄송합니다, 이미지를 생성할 수 없습니다.',
  de: 'Entschuldigung, ich konnte das Bild nicht generieren.',
  fr: "Désolé, je n'ai pas pu générer l'image.",
};

// Processing messages
export const processingMessages: LocalizedMessage = {
  en: 'Creating your masterpiece...',
  cn: '正在创建您的杰作...',
  jp: '傑作を作成中...',
  kr: '걸작을 만들고 있습니다...',
  de: 'Erstelle dein Meisterwerk...',
  fr: 'Création de votre chef-d\'œuvre...',
};

/**
 * Get localized message based on language preference
 * @param messages - Object containing messages in different languages
 * @param language - Language code (en, cn, jp, kr, de, fr)
 * @returns Localized message string
 */
export function getLocalizedMessage(
  messages: LocalizedMessage,
  language: string = 'en'
): string {
  const supportedLanguages = ['en', 'cn', 'jp', 'kr', 'de', 'fr'];
  const lang = supportedLanguages.includes(language) ? language : 'en';
  return messages[lang as keyof LocalizedMessage] || messages.en;
}

/**
 * Get the user's language preference from browser or storage
 * @returns Language code
 */
export function getUserLanguage(): string {
  if (typeof window === 'undefined') return 'en';

  // Check localStorage for saved preference
  const savedLang = localStorage.getItem('user_language');
  if (savedLang) return savedLang;

  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh') || browserLang.startsWith('cn')) return 'cn';
  if (browserLang.startsWith('ja') || browserLang.startsWith('jp')) return 'jp';
  if (browserLang.startsWith('ko') || browserLang.startsWith('kr')) return 'kr';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('fr')) return 'fr';

  return 'en';
}