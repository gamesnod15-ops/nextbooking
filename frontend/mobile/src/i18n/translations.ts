/**
 * Translation catalogue.
 *
 * Turkish is the source language, so `tr` is always complete and `en` is
 * checked against it by the `Translations` type — a missing English key is a
 * compile error rather than a silent fallback.
 */

export const tr = {
  common: {
    cancel: 'Vazgeç',
    save: 'Kaydet',
    delete: 'Sil',
    retry: 'Tekrar Dene',
    close: 'Kapat',
    next: 'İleri',
    skip: 'Atla',
    apply: 'Uygula',
    clear: 'Temizle',
    search: 'Ara',
    all: 'Tümü',
    seeAll: 'Tümünü Gör',
    today: 'Bugün',
    loading: 'Yükleniyor…',
    offline: 'İnternet bağlantısı yok',
    errorGeneric: 'Bir şeyler ters gitti',
    errorLoading: 'Yüklenirken bir hata oluştu.',
  },
  onboarding: {
    slide1Title: 'Randevunu saniyeler içinde al',
    slide1Text: 'Yakınındaki işletmeleri keşfet, uygun saati seç ve randevunu anında oluştur.',
    slide2Title: 'İşletmeni tek yerden yönet',
    slide2Text: 'Randevularını, müşterilerini, personelini ve gelirini cebinden takip et.',
    slide3Title: 'Hiçbir şeyi kaçırma',
    slide3Text: 'Hatırlatmalar, favori işletmeler ve kampanyalarla her zaman güncel kal.',
    start: 'Hemen Başla',
  },
  businesses: {
    title: 'İşletmeler',
    discover: 'Keşfedin',
    subtitle: 'Hizmet almak istediğin işletmeyi\nkeşfet, randevunu kolayca al.',
    searchPlaceholder: 'İşletme adı veya kategori ara...',
    nearby: 'Yakındaki İşletmeler',
    allBusinesses: 'Tüm İşletmeler',
    notFound: 'İşletme bulunamadı',
    byLocation: 'Konumuna göre',
    book: 'Randevu Al',
    noReviews: 'Henüz değerlendirme yok',
  },
  location: {
    seeNearby: 'Yakınındakileri gör',
    prompt: 'Konumunu paylaş, sana en yakın işletmeleri mesafeye göre sıralayalım.',
    denied: 'Konum izni reddedildi. Ayarlardan izin vererek en yakın işletmeleri sıralayabilirsin.',
    servicesOff: 'Konum servisi kapalı',
    servicesOffText: 'Cihazının konum servisini açtıktan sonra tekrar dene.',
    unavailable: 'Konum alınamadı. Tekrar denemek ister misin?',
    enable: 'Konumu Aç',
    openSettings: 'Ayarları Aç',
  },
  settings: {
    title: 'Ayarlar',
    preferences: 'Tercihler',
    security: 'Güvenlik',
    data: 'Veri',
    about: 'Hakkında',
    appLock: 'Uygulama Kilidi',
    appVersion: 'Uygulama Sürümü',
    resetData: 'Verilerimi Sıfırla',
    language: 'Dil',
    theme: 'Görünüm',
  },
  update: {
    required: 'Güncelleme gerekli',
    text: "Bu sürüm artık desteklenmiyor. Devam etmek için JetRandevu'yu güncellemen gerekiyor.",
    action: 'Güncelle',
  },
};

/**
 * English must mirror the Turkish shape exactly.
 * Not `as const` — values stay `string` so other locales can supply their own
 * text while the key structure is still enforced.
 */
export type Translations = typeof tr;

export const en: Translations = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    retry: 'Retry',
    close: 'Close',
    next: 'Next',
    skip: 'Skip',
    apply: 'Apply',
    clear: 'Clear',
    search: 'Search',
    all: 'All',
    seeAll: 'See all',
    today: 'Today',
    loading: 'Loading…',
    offline: 'No internet connection',
    errorGeneric: 'Something went wrong',
    errorLoading: 'Something went wrong while loading.',
  },
  onboarding: {
    slide1Title: 'Book in seconds',
    slide1Text: 'Discover businesses near you, pick a time and book instantly.',
    slide2Title: 'Run your business in one place',
    slide2Text: 'Track appointments, customers, staff and revenue from your pocket.',
    slide3Title: 'Never miss a thing',
    slide3Text: 'Stay up to date with reminders, favourites and campaigns.',
    start: 'Get started',
  },
  businesses: {
    title: 'Businesses',
    discover: 'Discover',
    subtitle: 'Find the business you need\nand book in a couple of taps.',
    searchPlaceholder: 'Search business or category...',
    nearby: 'Nearby businesses',
    allBusinesses: 'All businesses',
    notFound: 'No businesses found',
    byLocation: 'By your location',
    book: 'Book',
    noReviews: 'No reviews yet',
  },
  location: {
    seeNearby: 'See what is nearby',
    prompt: 'Share your location and we will sort the closest businesses by distance.',
    denied: 'Location permission denied. Allow it in settings to sort by distance.',
    servicesOff: 'Location services are off',
    servicesOffText: 'Turn on location services on your device and try again.',
    unavailable: 'Could not read your location. Try again?',
    enable: 'Enable location',
    openSettings: 'Open settings',
  },
  settings: {
    title: 'Settings',
    preferences: 'Preferences',
    security: 'Security',
    data: 'Data',
    about: 'About',
    appLock: 'App lock',
    appVersion: 'App version',
    resetData: 'Reset my data',
    language: 'Language',
    theme: 'Appearance',
  },
  update: {
    required: 'Update required',
    text: 'This version is no longer supported. Please update JetRandevu to continue.',
    action: 'Update',
  },
};

export const translations = { tr, en };
export type Locale = keyof typeof translations;
