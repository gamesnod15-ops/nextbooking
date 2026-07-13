const fs = require('fs');
const R = '\uFFFD';

function fix(content, replacements) {
  for (const [from, to] of replacements) content = content.split(from).join(to);
  return content;
}

// ─── CookieConsent.tsx ────────────────────────────────────────
{
  const f = 'frontend/apps/web/src/components/CookieConsent.tsx';
  let c = fs.readFileSync(f, 'utf8');
  // Remove leading FFFD (corrupted BOM/first char)
  if (c.startsWith(R)) c = c.slice(1);
  c = fix(c, [
    [R + '!erez', 'Çerez'],
    ['çalı' + R + 'xması', 'çalışması'],
    ['sa' + R + 'xlar', 'sağlar'],
    ['Ki' + R + 'xiselle' + R + 'xtirilmi' + R + 'x', 'Kişiselleştirilmiş'],
    ['iyile' + R + 'xtirmek', 'iyileştirmek'],
  ]);
  fs.writeFileSync(f, c, 'utf8');
  console.log('✓ CookieConsent.tsx fixed');
}

// ─── Navbar.tsx ───────────────────────────────────────────────
{
  const f = 'frontend/apps/web/src/components/Navbar.tsx';
  let c = fs.readFileSync(f, 'utf8');
  c = fix(c, [
    ['İ' + R + 'xletmeler', 'İşletmeler'],
    [R + '\x13zellikler', 'Özellikler'],
    ['İleti' + R + 'xim', 'İletişim'],
    [R + '!ıkı' + R + 'x', 'Çıkış'],
    ['Giri' + R + 'x Yap', 'Giriş Yap'],
    [R + 'Scretsiz Ba' + R + 'xla', 'Ücretsiz Başla'],
    [R + 'Scretsiz ba' + R + 'xla', 'Ücretsiz başla'],
  ]);
  fs.writeFileSync(f, c, 'utf8');
  console.log('✓ Navbar.tsx fixed');
}

// ─── HeroSection.tsx ──────────────────────────────────────────
{
  const f = 'frontend/apps/web/src/components/HeroSection.tsx';
  let c = fs.readFileSync(f, 'utf8');
  // Fix leading FFFD
  if (c.startsWith(R)) c = c.slice(1);

  // Rewrite CATEGORIES array (emojis are all corrupted) — array ends with \n] not ];
  const newCats = [
    "  { label: 'Kuaför',          emoji: '✂️' },",
    "  { label: 'Güzellik Salonu', emoji: '💄' },",
    "  { label: 'Diş Kliniği',     emoji: '🦷' },",
    "  { label: 'Fizyoterapi',     emoji: '🏃' },",
    "  { label: 'Spor Salonu',     emoji: '💪' },",
    "  { label: 'Spa & Masaj',     emoji: '🧘' },",
    "  { label: 'Tırnak Salonu',   emoji: '💅' },",
    "  { label: 'Dövme Stüdyosu',  emoji: '🎨' },",
    "  { label: 'Veteriner',       emoji: '🐾' },",
    "  { label: 'Klinik',          emoji: '🏥' },",
    "  { label: 'Yoga & Pilates',  emoji: '🧘' },",
    "  { label: 'Kişisel Antrenör',emoji: '💪' },",
    "  { label: 'Beslenme Uzmanı', emoji: '🥗' },",
    "  { label: 'Psikolog',        emoji: '🧠' },",
    "  { label: 'Fotoğrafçı',      emoji: '📸' },",
    "  { label: 'Oto Servis',      emoji: '🔧' },",
    "  { label: 'Danışmanlık',     emoji: '💼' },",
    "  { label: 'Özel Ders',       emoji: '📚' },",
  ].join('\n');
  c = c.replace(
    /const CATEGORIES = \[[\s\S]*?\n\]/,
    'const CATEGORIES = [\n' + newCats + '\n]'
  );

  c = fix(c, [
    ['Her İ' + R + 'xletmeye', 'Her İşletmeye'],
    ['di' + R + 'x klini' + R + 'xi', 'diş kliniği'],
    ['tasarlanmı' + R + 'x', 'tasarlanmış'],
    ['Mü' + R + 'xterileriniz', 'Müşterileriniz'],
    ['i' + R + 'xinize', 'işinize'],
    [R + 'Scretsiz', 'Ücretsiz'],
    ['İ' + R + 'xletmeleri Ke' + R + 'xfet', 'İşletmeleri Keşfet'],
    ['kolaylı' + R + 'xı', 'kolaylığı'],
    [R + '!ar' + R + 'xamba', 'Çarşamba'],
    ['Per' + R + 'xembe', 'Perşembe'],
    ['category marquee ' + R + '\x1d', 'category marquee —'],
  ]);
  fs.writeFileSync(f, c, 'utf8');
  console.log('✓ HeroSection.tsx fixed');
}

// ─── register/page.tsx ────────────────────────────────────────
{
  const f = 'frontend/apps/web/app/register/page.tsx';
  let c = fs.readFileSync(f, 'utf8');
  // Fix leading FFFD
  if (c.startsWith(R)) c = c.slice(1);

  c = fix(c, [
    // BUSINESS_CATEGORIES
    ['Di' + R + 'x Klini' + R + 'xi', 'Diş Kliniği'],
    ['Ki' + R + 'xisel Antrenör', 'Kişisel Antrenör'],
    ['Danı' + R + 'xmanlık', 'Danışmanlık'],
    [R + '\x13zel Ders', 'Özel Ders'],
    ['Foto' + R + 'xrafçı', 'Fotoğrafçı'],
    ['Di' + R + 'xer', 'Diğer'],
    // slugify function
    [R + 'x/g, \'g\'', 'ğ/g, \'g\''],
    [R + 'x/g, \'s\'', 'ş/g, \'s\''],
    // validation errors
    ['İ' + R + 'xletme adı', 'İşletme adı'],
    ['İ' + R + 'xletme kategorisi', 'İşletme kategorisi'],
    ['e' + R + 'xle' + R + 'xmiyor', 'eşleşmiyor'],
    ['yanlı' + R + 'x yanıtl', 'yanlış yanıtl'],
    // comments
    ['honeypot ' + R + '\x1d', 'honeypot —'],
    ['bots ' + R + '\x1d', 'bots —'],
    // runtime errors
    ['hata olu' + R + 'xtu', 'hata oluştu'],
    ['alınmı' + R + 'x.', 'alınmış.'],
    // success page
    ['Hesabınız Olu' + R + 'xturuldu!', 'Hesabınız Oluşturuldu!'],
    // all remaining 0x1D control chars in comments → em-dash
    [R + '\x1d', '—'],
    // content text
    ['ital i' + R + 'xletme', 'ital işletme'],
    ['İ' + R + 'xletmenizi', 'İşletmenizi'],
    ['italle' + R + 'xtirmenin', 'ştirmenin'],
    ['nda ba' + R + 'xlayın', 'nda başlayın'],
    ['mü' + R + 'xterileriniz', 'müşterileriniz'],
    ['da mü' + R + 'xteri kab', 'da müşteri kab'],
    ['analiti' + R + 'xi ve', 'analitiği ve'],
    ['trafi' + R + 'ximiz', 'trafiğimiz'],
    ['l: \'İ' + R + 'xletme\'', 'l: \'İşletme\''],
    // form UI
    ['Giri' + R + 'x Yap', 'Giriş Yap'],
    [R + 'Scretsiz Hesap Olu' + R + 'xturun', 'Ücretsiz Hesap Oluşturun'],
    [R + 'Scretsiz Hesap Olu' + R + 'xtur ', 'Ücretsiz Hesap Oluştur '],
    ['Ki' + R + 'xisel Bilgiler', 'Kişisel Bilgiler'],
    ['Ba' + R + 'xdat Cad.', 'Bağdat Cad.'],
    ['İ' + R + 'xletme Bilgileri', 'İşletme Bilgileri'],
    ['İ' + R + 'xletme Adı', 'İşletme Adı'],
    ['İ' + R + 'xletme Kategorisi', 'İşletme Kategorisi'],
    ['do' + R + 'xrulaması', 'doğrulaması'],
    ['Do' + R + 'xrulaması', 'Doğrulaması'],
    ['kar' + R + 'xı koruma', 'karşı koruma'],
    ['etmi' + R + 'x sayıl', 'etmiş sayıl'],
    ['Hesap Olu' + R + 'xturuluyor', 'Hesap Oluşturuluyor'],
    ['Olu' + R + 'xtur <', 'Oluştur <'],
    ['ya' + R + 'xıyorsunuz', 'yaşıyorsunuz'],
    // Phone flag emoji corruption
    ['x!' + R + '\x1fx!' + R + ' +90', '🇹🇷 +90'],
    // Testimonial text
    ['mü' + R + 'xterilerimiz', 'müşterilerimiz'],
  ]);
  
  // Clean up remaining FFFD sequences (decorative emojis in comments/icons)
  c = c.replace(/\uFFFD /g, '');      // FFFD + space → remove
  c = c.replace(/\uFFFD—/g, '—');     // FFFD before em-dash
  c = c.replace(/—\uFFFD/g, '—');     // em-dash + FFFD
  c = c.replace(/\uFFFD./g, '');      // any remaining FFFD + char → remove
  
  fs.writeFileSync(f, c, 'utf8');
  const rem = (c.match(/\uFFFD/g) || []).length;
  console.log('✓ register/page.tsx fixed, remaining FFFD:', rem);
}
