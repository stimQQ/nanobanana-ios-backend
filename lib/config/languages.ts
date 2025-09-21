export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  cn: {
    code: 'cn',
    name: 'Chinese',
    nativeName: '中文',
  },
  jp: {
    code: 'jp',
    name: 'Japanese',
    nativeName: '日本語',
  },
  kr: {
    code: 'kr',
    name: 'Korean',
    nativeName: '한국어',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
  },
};

export const DEFAULT_LANGUAGE = 'en';

export const getLanguage = (code: string): LanguageConfig => {
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
};

// Translation keys for API responses
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'auth.success': 'Authentication successful',
    'auth.failed': 'Authentication failed',
    'auth.invalid_token': 'Invalid authentication token',
    'credits.insufficient': 'Insufficient credits',
    'generation.success': 'Great! Your image has been successfully modified!',
    'generation.failed': 'Image generation failed',
    'subscription.success': 'Subscription activated successfully',
    'subscription.failed': 'Subscription activation failed',
    'upload.success': 'Image uploaded successfully',
    'upload.failed': 'Image upload failed',
    'error.server': 'Internal server error',
  },
  cn: {
    'auth.success': '认证成功',
    'auth.failed': '认证失败',
    'auth.invalid_token': '无效的认证令牌',
    'credits.insufficient': '积分不足',
    'generation.success': '太好了，图片已为您修改成功！',
    'generation.failed': '图像生成失败',
    'subscription.success': '订阅激活成功',
    'subscription.failed': '订阅激活失败',
    'upload.success': '图片上传成功',
    'upload.failed': '图片上传失败',
    'error.server': '服务器内部错误',
  },
  jp: {
    'auth.success': '認証成功',
    'auth.failed': '認証失敗',
    'auth.invalid_token': '無効な認証トークン',
    'credits.insufficient': 'クレジット不足',
    'generation.success': '素晴らしい！画像が正常に修正されました！',
    'generation.failed': '画像生成失敗',
    'subscription.success': 'サブスクリプション有効化成功',
    'subscription.failed': 'サブスクリプション有効化失敗',
    'upload.success': '画像アップロード成功',
    'upload.failed': '画像アップロード失敗',
    'error.server': 'サーバー内部エラー',
  },
  kr: {
    'auth.success': '인증 성공',
    'auth.failed': '인증 실패',
    'auth.invalid_token': '유효하지 않은 인증 토큰',
    'credits.insufficient': '크레딧 부족',
    'generation.success': '좋습니다! 이미지가 성공적으로 수정되었습니다!',
    'generation.failed': '이미지 생성 실패',
    'subscription.success': '구독 활성화 성공',
    'subscription.failed': '구독 활성화 실패',
    'upload.success': '이미지 업로드 성공',
    'upload.failed': '이미지 업로드 실패',
    'error.server': '서버 내부 오류',
  },
  de: {
    'auth.success': 'Authentifizierung erfolgreich',
    'auth.failed': 'Authentifizierung fehlgeschlagen',
    'auth.invalid_token': 'Ungültiges Authentifizierungstoken',
    'credits.insufficient': 'Unzureichende Credits',
    'generation.success': 'Großartig! Ihr Bild wurde erfolgreich geändert!',
    'generation.failed': 'Bildgenerierung fehlgeschlagen',
    'subscription.success': 'Abonnement erfolgreich aktiviert',
    'subscription.failed': 'Abonnementaktivierung fehlgeschlagen',
    'upload.success': 'Bild erfolgreich hochgeladen',
    'upload.failed': 'Bild-Upload fehlgeschlagen',
    'error.server': 'Interner Serverfehler',
  },
  fr: {
    'auth.success': 'Authentification réussie',
    'auth.failed': 'Échec de l\'authentification',
    'auth.invalid_token': 'Jeton d\'authentification invalide',
    'credits.insufficient': 'Crédits insuffisants',
    'generation.success': 'Génial! Votre image a été modifiée avec succès!',
    'generation.failed': 'Échec de la génération d\'image',
    'subscription.success': 'Abonnement activé avec succès',
    'subscription.failed': 'Échec de l\'activation de l\'abonnement',
    'upload.success': 'Image téléchargée avec succès',
    'upload.failed': 'Échec du téléchargement de l\'image',
    'error.server': 'Erreur interne du serveur',
  },
};

export const translate = (key: string, language: string = DEFAULT_LANGUAGE): string => {
  const lang = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
  return lang[key] || key;
};