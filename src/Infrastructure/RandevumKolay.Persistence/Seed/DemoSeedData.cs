using System.Text;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Persistence.Seed;

/// <summary>
/// Seeds 20 fully-fledged demo businesses (one per category), each in its own
/// tenant: generated SVG logo + gallery photos, 5-7 employees, 100-200
/// customers and 20-25 appointments spread across pending / confirmed /
/// completed / cancelled / no-show (10-12 of them upcoming, so they show on
/// the calendar). Idempotent — skipped when the marker tenant already exists.
/// </summary>
public static class DemoSeedData
{
    private static readonly Random Rng = new(2026);
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;
    private const string MarkerSubdomain = "elit-guzellik-demo";

    // ── Reflection helpers (entities have private ctors/setters) ─────────────
    private static T New<T>() where T : class => (T)Activator.CreateInstance(typeof(T), nonPublic: true)!;

    private static void Set<T, TV>(T obj, string prop, TV val)
    {
        var pi = typeof(T).GetProperty(prop);
        if (pi == null) return;
        var targetType = pi.PropertyType;
        if (targetType.IsGenericType && targetType.GetGenericTypeDefinition() == typeof(Nullable<>))
            targetType = Nullable.GetUnderlyingType(targetType)!;
        var value = val is not null && targetType != typeof(TV) && targetType.IsValueType
            ? Convert.ChangeType(val, targetType)
            : (object?)val;
        pi.SetValue(obj, value);
    }

    // ── Name pools ────────────────────────────────────────────────────────────
    private static readonly string[] FirstNames =
    [
        "Ahmet","Mehmet","Ali","Mustafa","Hasan","Hüseyin","İbrahim","Yusuf","Ömer","Emre",
        "Can","Burak","Kerem","Murat","Serkan","Cem","Onur","Fatih","Volkan","Hakan",
        "Ayşe","Fatma","Zeynep","Elif","Merve","Derya","Sibel","Aslı","Büşra","Cansu",
        "Esra","Gamze","Hande","Kübra","Meltem","Özlem","Pelin","Sevgi","Tuğba","Yasemin",
        "Aylin","Bahar","Defne","Ece","Gizem","İrem","Nazlı","Selin","Deniz","Eren",
    ];

    private static readonly string[] LastNames =
    [
        "Yılmaz","Kaya","Demir","Çelik","Şahin","Arslan","Yıldız","Öztürk","Aydın","Koç",
        "Kurt","Polat","Kara","Güneş","Doğan","Özdemir","Kılıç","Aksoy","Yalçın","Köse",
        "Taş","Özkan","Tekin","Bulut","Erdoğan","Karaca","Turan","Acar","Çetin","Kaplan",
    ];

    private static readonly (string City, double Lat, double Lng)[] Cities =
    [
        ("İstanbul", 41.01, 28.98), ("Ankara", 39.93, 32.86), ("İzmir", 38.42, 27.14),
        ("Bursa", 40.19, 29.06), ("Antalya", 36.90, 30.70), ("Adana", 37.00, 35.32),
        ("Konya", 37.87, 32.49), ("Gaziantep", 37.07, 37.38), ("Mersin", 36.81, 34.64),
        ("Kayseri", 38.73, 35.48), ("Eskişehir", 39.78, 30.52), ("Trabzon", 41.00, 39.72),
    ];

    private static readonly HashSet<string> UsedPhones = [];

    private static string Phone()
    {
        string p;
        do { p = $"05{Rng.Next(532, 560)}{Rng.Next(1000000, 9999999)}"; } while (!UsedPhones.Add(p));
        return p;
    }

    private static T Pick<T>(IReadOnlyList<T> a) => a[Rng.Next(a.Count)];

    private static string Slug(string s) => s.ToLowerInvariant()
        .Replace("ı", "i").Replace("ğ", "g").Replace("ü", "u").Replace("ş", "s")
        .Replace("ö", "o").Replace("ç", "c").Replace("İ", "i").Replace(" ", "-")
        .Replace("&", "").Replace("--", "-");

    // ── Category catalog: name, glyph, palette, services, titles ─────────────
    private sealed record CatDef(
        BusinessCategory Cat, string BizName, string Glyph,
        string Color1, string Color2,
        string[] Services, string[] Titles, string Tagline);

    private static readonly CatDef[] Catalog =
    [
        new(BusinessCategory.BeautySalon,   "Elit Güzellik Merkezi",   "💅", "#EC4899", "#8B5CF6",
            ["Cilt Bakımı","Epilasyon","Kaş & Kirpik","Kalıcı Makyaj","Manikür & Pedikür","Cilt Yenileme"],
            ["Güzellik Uzmanı","Kıdemli Estetisyen","Cilt Bakım Uzmanı"], "Güzelliğinize güzellik katıyoruz"),
        new(BusinessCategory.Barbershop,    "Usta Berber",             "💈", "#0EA5E9", "#1E3A8A",
            ["Saç Kesimi","Sakal Tıraşı","Saç Boyama","Fön & Şekillendirme","Keratin Bakım","Cilt Bakımı"],
            ["Berber","Usta Berber","Stilist"], "Modern erkeğin adresi"),
        new(BusinessCategory.Clinic,        "MediPlus Sağlık Kliniği", "🏥", "#10B981", "#0369A1",
            ["Genel Muayene","Check-up","Kan Tahlili","EKG","Aşı Uygulama","Diyet Danışmanlığı"],
            ["Doktor","Uzman Doktor","Hemşire"], "Sağlığınız bizim önceliğimiz"),
        new(BusinessCategory.Dentist,       "Parlak Gülüş Diş Kliniği","🦷", "#38BDF8", "#0F766E",
            ["Diş Muayenesi","Diş Temizliği","Dolgu","Kanal Tedavisi","Diş Beyazlatma","İmplant"],
            ["Diş Hekimi","Uzman Diş Hekimi","Ortodontist"], "Gülüşünüz bizimle parlasın"),
        new(BusinessCategory.Physiotherapy, "FizyoCare Terapi Merkezi","🤸", "#F59E0B", "#DC2626",
            ["Manuel Terapi","Kuru İğneleme","Egzersiz Terapisi","Masaj Terapi","Postür Analizi","Rehabilitasyon"],
            ["Fizyoterapist","Uzman Fizyoterapist","Egzersiz Koçu"], "Hareket özgürlüğünüzü geri kazanın"),
        new(BusinessCategory.Gym,           "PowerZone Fitness",       "🏋️", "#EF4444", "#7C2D12",
            ["Bireysel Antrenman","Grup Dersi","CrossFit","Fonksiyonel Antrenman","Kardiyo Programı","Vücut Analizi"],
            ["Antrenör","Baş Antrenör","Fitness Koçu"], "Gücünüzü keşfedin"),
        new(BusinessCategory.PersonalTrainer,"FitPro Kişisel Antrenman","💪", "#F97316", "#9A3412",
            ["Birebir Antrenman","Online Koçluk","Beslenme Planı","Kilo Verme Programı","Kas Geliştirme","Esneklik Antrenmanı"],
            ["Kişisel Antrenör","Performans Koçu","Beslenme Danışmanı"], "Hedefinize birlikte ulaşalım"),
        new(BusinessCategory.Yoga,          "Zen Yoga & Pilates",      "🧘", "#8B5CF6", "#6D28D9",
            ["Hatha Yoga","Vinyasa Yoga","Yin Yoga","Reformer Pilates","Meditasyon","Nefes Çalışması"],
            ["Yoga Eğitmeni","Pilates Eğitmeni","Meditasyon Rehberi"], "İç huzurunuzu keşfedin"),
        new(BusinessCategory.Spa,           "Royal Spa & Wellness",    "🧖", "#14B8A6", "#0F766E",
            ["Klasik Masaj","Aromaterapi","Sıcak Taş Masajı","Hamam Ritüeli","Vücut Bakımı","Çift Masajı"],
            ["Masaj Terapisti","Spa Uzmanı","Wellness Danışmanı"], "Kendinizi şımartın"),
        new(BusinessCategory.NailSalon,     "Pembe Tırnak Stüdyosu",   "💎", "#F472B6", "#BE185D",
            ["Manikür","Pedikür","Kalıcı Oje","Protez Tırnak","Nail Art","El & Ayak Bakımı"],
            ["Tırnak Uzmanı","Nail Artist","Bakım Uzmanı"], "Elleriniz sanat eseri"),
        new(BusinessCategory.Tattoo,        "Mürekkep Dövme Atölyesi", "🎨", "#111827", "#7C3AED",
            ["Dövme Tasarımı","Küçük Dövme","Büyük Dövme","Cover-Up","Piercing","Dövme Silme Danışmanlığı"],
            ["Dövme Sanatçısı","Piercing Uzmanı","Tasarımcı"], "Hikayenizi tenimize işleyelim"),
        new(BusinessCategory.Veterinarian,  "Pati Dostu Veteriner",    "🐾", "#22C55E", "#15803D",
            ["Genel Muayene","Aşı Uygulama","Kısırlaştırma","Diş Bakımı","Tıraş & Bakım","Laboratuvar Testi"],
            ["Veteriner Hekim","Uzman Veteriner","Pet Bakım Uzmanı"], "Dostlarınız emin ellerde"),
        new(BusinessCategory.CarService,    "OtoUsta Servis",          "🔧", "#64748B", "#1E293B",
            ["Periyodik Bakım","Yağ Değişimi","Fren Bakımı","Lastik Değişimi","Motor Arıza Tespiti","Klima Bakımı"],
            ["Usta","Baş Teknisyen","Motor Uzmanı"], "Aracınız güvenli ellerde"),
        new(BusinessCategory.CarWash,       "Parlak Oto Yıkama",       "🚿", "#06B6D4", "#0E7490",
            ["Dış Yıkama","İç Detaylı Temizlik","Seramik Kaplama","Pasta Cila","Motor Yıkama","Koltuk Yıkama"],
            ["Detaylı Temizlik Uzmanı","Kaplama Ustası","Yıkama Görevlisi"], "Aracınız ilk günkü gibi"),
        new(BusinessCategory.RepairService, "TamirPro Teknik Servis",  "🛠️", "#F59E0B", "#B45309",
            ["Telefon Tamiri","Bilgisayar Tamiri","Ekran Değişimi","Batarya Değişimi","Veri Kurtarma","Yazılım Güncelleme"],
            ["Teknisyen","Kıdemli Teknisyen","Yazılım Uzmanı"], "Cihazlarınıza ikinci hayat"),
        new(BusinessCategory.Consultant,    "VizyonPlus Danışmanlık",  "💼", "#3B82F6", "#1E40AF",
            ["İş Planı Danışmanlığı","Dijital Dönüşüm","Pazarlama Stratejisi","Finansal Analiz","İK Danışmanlığı","E-Ticaret Kurulumu"],
            ["Danışman","Kıdemli Danışman","Strateji Uzmanı"], "İşinizi birlikte büyütelim"),
        new(BusinessCategory.Psychologist,  "İçsel Denge Psikoloji",   "🧠", "#A78BFA", "#5B21B6",
            ["Bireysel Terapi","Çift Terapisi","Aile Danışmanlığı","Çocuk & Ergen Terapisi","Online Terapi","Kaygı Yönetimi"],
            ["Psikolog","Klinik Psikolog","Aile Danışmanı"], "İyi hissetmek bir adım uzağınızda"),
        new(BusinessCategory.Nutritionist,  "Dengeli Yaşam Diyetisyen","🥗", "#84CC16", "#3F6212",
            ["Beslenme Danışmanlığı","Kilo Verme Programı","Sporcu Beslenmesi","Hamilelik Beslenmesi","Online Takip","Vücut Analizi"],
            ["Diyetisyen","Uzman Diyetisyen","Beslenme Koçu"], "Sağlıklı yaşam sofranızda başlar"),
        new(BusinessCategory.Tutor,         "Akademi Özel Ders",       "📚", "#6366F1", "#312E81",
            ["Matematik","Fizik","Kimya","İngilizce","YKS Hazırlık","LGS Hazırlık"],
            ["Öğretmen","Uzman Öğretmen","Eğitim Koçu"], "Başarıya giden yol buradan geçer"),
        new(BusinessCategory.Photographer,  "Kadraj Fotoğraf Stüdyosu","📷", "#FB7185", "#9F1239",
            ["Düğün Çekimi","Nişan Çekimi","Bebek Çekimi","Ürün Fotoğrafçılığı","Portre Çekimi","Dış Mekan Çekimi"],
            ["Fotoğrafçı","Baş Fotoğrafçı","Editör"], "Anılarınızı ölümsüzleştirin"),
    ];

    // ── SVG image generation (self-contained data URIs, no hosting needed) ───
    private static string DataUri(string svg) =>
        "data:image/svg+xml;base64," + Convert.ToBase64String(Encoding.UTF8.GetBytes(svg));

    private static string LogoSvg(CatDef d)
    {
        var initials = string.Concat(d.BizName.Split(' ').Take(2).Select(w => w[0]));
        return $"""
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
              <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="{d.Color1}"/><stop offset="100%" stop-color="{d.Color2}"/>
              </linearGradient></defs>
              <rect width="400" height="400" rx="80" fill="url(#g)"/>
              <circle cx="330" cy="70" r="90" fill="#ffffff" opacity="0.12"/>
              <circle cx="60" cy="340" r="70" fill="#ffffff" opacity="0.10"/>
              <text x="200" y="185" font-family="Segoe UI, Arial" font-size="120" font-weight="800"
                    fill="#ffffff" text-anchor="middle">{initials}</text>
              <text x="200" y="300" font-size="90" text-anchor="middle">{d.Glyph}</text>
            </svg>
            """;
    }

    private static string GallerySvg(CatDef d, int index)
    {
        // Vary each gallery shot: alternate gradient direction, accents and glyph placement
        var (x1, y1, x2, y2) = (index % 4) switch
        {
            0 => (0, 0, 1, 1), 1 => (1, 0, 0, 1), 2 => (0, 1, 1, 0), _ => (0, 0, 0, 1),
        };
        var glyphX = 160 + index * 110;
        var accent = index % 2 == 0 ? d.Color2 : d.Color1;
        return $"""
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
              <defs><linearGradient id="g" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">
                <stop offset="0%" stop-color="{d.Color1}"/><stop offset="100%" stop-color="{d.Color2}"/>
              </linearGradient></defs>
              <rect width="800" height="500" fill="url(#g)"/>
              <circle cx="{680 - index * 60}" cy="{90 + index * 40}" r="{110 + index * 15}" fill="#ffffff" opacity="0.10"/>
              <circle cx="{120 + index * 50}" cy="{420 - index * 30}" r="{70 + index * 10}" fill="#ffffff" opacity="0.08"/>
              <rect x="{-40 + index * 30}" y="{300 + index * 20}" width="300" height="300" rx="60"
                    fill="{accent}" opacity="0.25" transform="rotate({12 + index * 6} 200 400)"/>
              <text x="{glyphX}" y="290" font-size="150" text-anchor="middle" opacity="0.9">{d.Glyph}</text>
              <text x="60" y="440" font-family="Segoe UI, Arial" font-size="30" font-weight="700"
                    fill="#ffffff" opacity="0.95">{d.BizName}</text>
              <text x="60" y="472" font-family="Segoe UI, Arial" font-size="18" fill="#ffffff" opacity="0.8">{d.Tagline}</text>
            </svg>
            """;
    }

    private static string AvatarSvg(string name, string color)
    {
        var initials = string.Concat(name.Split(' ').Take(2).Select(w => w[0]));
        return $"""
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <rect width="200" height="200" rx="100" fill="{color}"/>
              <text x="100" y="128" font-family="Segoe UI, Arial" font-size="72" font-weight="700"
                    fill="#ffffff" text-anchor="middle">{initials}</text>
            </svg>
            """;
    }

    // ── Main ──────────────────────────────────────────────────────────────────
    public static async Task SeedAsync(ApplicationDbContext ctx)
    {
        // If demo tenants exist, just ensure they have admin users
        if (await ctx.Tenants.AnyAsync(t => t.Subdomain == MarkerSubdomain))
        {
            await EnsureDemoUsersExistAsync(ctx);
            return;
        }

        Console.WriteLine("  ⏳ Seeding 20 demo businesses…");

        var totalCustomers = 0;
        var totalEmployees = 0;
        var totalAppointments = 0;

        for (int bi = 0; bi < Catalog.Length; bi++)
        {
            var d = Catalog[bi];
            var (city, lat, lng) = Cities[bi % Cities.Length];
            var tenantId = Guid.NewGuid();
            var slug = bi == 0 ? MarkerSubdomain : $"{Slug(d.BizName)}-demo";

            // Tenant (one per business, mirroring real registrations)
            var tenant = New<Tenant>();
            Set(tenant, nameof(Tenant.Id), tenantId);
            Set(tenant, nameof(Tenant.Name), d.BizName);
            Set(tenant, nameof(Tenant.Subdomain), slug);
            Set(tenant, nameof(Tenant.Email), $"info@{Slug(d.BizName)}.com");
            Set(tenant, nameof(Tenant.Plan), Pick(new[] { "starter", "business", "professional" }));
            Set(tenant, nameof(Tenant.IsActive), true);
            Set(tenant, nameof(Tenant.CreatedAt), Now.AddMonths(-Rng.Next(2, 12)));
            ctx.Tenants.Add(tenant);

            // Business with generated logo + gallery
            var bizId = Guid.NewGuid();
            var biz = New<Business>();
            Set(biz, nameof(Business.Id), bizId);
            Set(biz, nameof(Business.TenantId), tenantId);
            Set(biz, nameof(Business.Name), d.BizName);
            Set(biz, nameof(Business.Category), d.Cat);
            Set(biz, nameof(Business.City), city);
            Set(biz, nameof(Business.Address), $"{Pick(new[] { "Atatürk", "Cumhuriyet", "İstiklal", "Bağdat", "Gazi" })} Cad. No:{Rng.Next(2, 120)}, {city}");
            Set(biz, nameof(Business.Phone), Phone());
            Set(biz, nameof(Business.Email), $"info@{Slug(d.BizName)}.com");
            Set(biz, nameof(Business.Description), $"{d.BizName} — {d.Tagline}. {city}'nin kalbinde, uzman kadromuzla hizmetinizdeyiz.");
            Set(biz, nameof(Business.Timezone), "Europe/Istanbul");
            Set(biz, nameof(Business.IsActive), true);
            Set(biz, nameof(Business.Latitude), lat + (Rng.NextDouble() - 0.5) * 0.04);
            Set(biz, nameof(Business.Longitude), lng + (Rng.NextDouble() - 0.5) * 0.04);
            Set(biz, nameof(Business.LogoUrl), DataUri(LogoSvg(d)));
            Set(biz, nameof(Business.GalleryImages), Enumerable.Range(0, 5).Select(i => DataUri(GallerySvg(d, i))).ToList());
            ctx.Businesses.Add(biz);

            // Main branch
            var branch = New<Branch>();
            Set(branch, nameof(Branch.Id), Guid.NewGuid());
            Set(branch, nameof(Branch.TenantId), tenantId);
            Set(branch, nameof(Branch.Name), "Merkez Şube");
            Set(branch, nameof(Branch.City), city);
            Set(branch, nameof(Branch.Phone), Phone());
            Set(branch, nameof(Branch.IsActive), true);
            Set(branch, nameof(Branch.IsMainBranch), true);
            ctx.Branches.Add(branch);

            // Services
            var services = new List<Service>();
            for (int i = 0; i < d.Services.Length; i++)
            {
                var s = New<Service>();
                Set(s, nameof(Service.Id), Guid.NewGuid());
                Set(s, nameof(Service.TenantId), tenantId);
                Set(s, nameof(Service.BusinessId), bizId);
                Set(s, nameof(Service.Name), d.Services[i]);
                Set(s, nameof(Service.DurationMinutes), Pick(new[] { 30, 45, 60, 90 }));
                Set(s, nameof(Service.Price), Rng.Next(15, 120) * 10);
                Set(s, nameof(Service.SortOrder), i);
                Set(s, nameof(Service.IsActive), true);
                ctx.Services.Add(s);
                services.Add(s);
            }

            // Employees: 5-7, each with title + generated avatar + schedule
            var employees = new List<Employee>();
            var empCount = Rng.Next(5, 8);
            var usedNames = new HashSet<string>();
            for (int i = 0; i < empCount; i++)
            {
                string name;
                do { name = $"{Pick(FirstNames)} {Pick(LastNames)}"; } while (!usedNames.Add(name));
                var e = New<Employee>();
                Set(e, nameof(Employee.Id), Guid.NewGuid());
                Set(e, nameof(Employee.TenantId), tenantId);
                Set(e, nameof(Employee.BusinessId), bizId);
                Set(e, nameof(Employee.Name), name);
                Set(e, nameof(Employee.Title), d.Titles[i % d.Titles.Length]);
                Set(e, nameof(Employee.Phone), Phone());
                Set(e, nameof(Employee.AvatarUrl), DataUri(AvatarSvg(name, i % 2 == 0 ? d.Color1 : d.Color2)));
                Set(e, nameof(Employee.IsActive), true);
                Set(e, nameof(Employee.AcceptsOnlineBookings), true);
                ctx.Employees.Add(e);
                employees.Add(e);

                // Weekly schedule Mon-Sat
                foreach (var day in new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday })
                {
                    if (day == DayOfWeek.Saturday && Rng.Next(3) == 0) continue;
                    var sch = New<Schedule>();
                    Set(sch, nameof(Schedule.Id), Guid.NewGuid());
                    Set(sch, nameof(Schedule.TenantId), tenantId);
                    Set(sch, nameof(Schedule.EmployeeId), (Guid)e.GetType().GetProperty("Id")!.GetValue(e)!);
                    Set(sch, nameof(Schedule.DayOfWeek), day);
                    Set(sch, nameof(Schedule.StartTime), new TimeOnly(9, 0));
                    Set(sch, nameof(Schedule.EndTime), new TimeOnly(18, 0));
                    Set(sch, nameof(Schedule.IsActive), true);
                    ctx.Schedules.Add(sch);
                }

                // Each employee offers 3+ of the services
                foreach (var svc in services.OrderBy(_ => Rng.Next()).Take(Rng.Next(3, services.Count + 1)))
                {
                    var es = New<EmployeeService>();
                    Set(es, nameof(EmployeeService.EmployeeId), e.GetType().GetProperty("Id")!.GetValue(e)!);
                    Set(es, nameof(EmployeeService.ServiceId), svc.GetType().GetProperty("Id")!.GetValue(svc)!);
                    ctx.EmployeeServices.Add(es);
                }
            }
            totalEmployees += empCount;

            // Customers: 100-200 per business
            var customers = new List<Customer>();
            var custCount = Rng.Next(100, 201);
            for (int i = 0; i < custCount; i++)
            {
                var fn = Pick(FirstNames);
                var ln = Pick(LastNames);
                var c = New<Customer>();
                Set(c, nameof(Customer.Id), Guid.NewGuid());
                Set(c, nameof(Customer.TenantId), tenantId);
                Set(c, nameof(Customer.Name), $"{fn} {ln}");
                Set(c, nameof(Customer.Phone), Phone());
                Set(c, nameof(Customer.Email), $"{Slug(fn)}.{Slug(ln)}{Rng.Next(1, 999)}@email.com");
                Set(c, nameof(Customer.Gender), Rng.Next(2) == 0 ? "male" : "female");
                Set(c, nameof(Customer.BirthDate), new DateOnly(Rng.Next(1965, 2006), Rng.Next(1, 13), Rng.Next(1, 29)));
                Set(c, nameof(Customer.IsBlocked), false);
                Set(c, nameof(Customer.Tags), Rng.Next(3) == 0 ? new List<string> { Pick(new[] { "VIP", "Düzenli", "Sadık" }) } : new List<string>());
                ctx.Customers.Add(c);
                customers.Add(c);
            }
            totalCustomers += custCount;

            // Appointments: 20-25 total; 10-12 upcoming (on the calendar)
            var upcoming = Rng.Next(10, 13);
            var past = Rng.Next(10, 14);

            for (int i = 0; i < upcoming + past; i++)
            {
                var isUpcoming = i < upcoming;
                var status = isUpcoming
                    ? (Rng.Next(2) == 0 ? AppointmentStatus.Pending : AppointmentStatus.Confirmed)
                    : Rng.Next(10) switch
                    {
                        <= 6 => AppointmentStatus.Completed,
                        <= 8 => AppointmentStatus.Cancelled,
                        _ => AppointmentStatus.NoShow,
                    };

                var start = isUpcoming
                    ? Now.Date.AddDays(Rng.Next(0, 11)).AddHours(Rng.Next(9, 18)).AddMinutes(Rng.Next(0, 4) * 15)
                    : Now.Date.AddDays(-Rng.Next(1, 60)).AddHours(Rng.Next(9, 18)).AddMinutes(Rng.Next(0, 4) * 15);
                if (isUpcoming && start <= Now) start = Now.Date.AddDays(1).AddHours(Rng.Next(9, 18));

                var svc = Pick(services);
                var duration = (int)svc.GetType().GetProperty("DurationMinutes")!.GetValue(svc)!;

                var a = New<Appointment>();
                Set(a, nameof(Appointment.Id), Guid.NewGuid());
                Set(a, nameof(Appointment.TenantId), tenantId);
                Set(a, nameof(Appointment.BusinessId), bizId);
                Set(a, nameof(Appointment.ServiceId), svc.GetType().GetProperty("Id")!.GetValue(svc)!);
                Set(a, nameof(Appointment.EmployeeId), Pick(employees).GetType().GetProperty("Id")!.GetValue(Pick(employees))!);
                Set(a, nameof(Appointment.CustomerId), Pick(customers).GetType().GetProperty("Id")!.GetValue(Pick(customers))!);
                Set(a, nameof(Appointment.StartTime), new DateTimeOffset(start, TimeSpan.Zero));
                Set(a, nameof(Appointment.EndTime), new DateTimeOffset(start.AddMinutes(duration), TimeSpan.Zero));
                Set(a, nameof(Appointment.Status), status);
                Set(a, nameof(Appointment.Price), svc.GetType().GetProperty("Price")!.GetValue(svc)!);
                Set(a, nameof(Appointment.Source), Pick(new[] { "web", "mobile", "whatsapp", "panel" }));
                if (status == AppointmentStatus.Cancelled)
                    Set(a, nameof(Appointment.CancellationReason), Pick(new[] { "Müşteri iptal etti", "Programım değişti", "Hastalık" }));
                ctx.Appointments.Add(a);
                totalAppointments++;
            }

            // Reviews so the public listing shows ratings
            for (int i = 0; i < Rng.Next(6, 15); i++)
            {
                var r = New<Review>();
                Set(r, nameof(Review.Id), Guid.NewGuid());
                Set(r, nameof(Review.BusinessId), bizId);
                Set(r, nameof(Review.AuthorName), $"{Pick(FirstNames)} {Pick(LastNames)}");
                Set(r, nameof(Review.Rating), Rng.Next(4, 6));
                Set(r, nameof(Review.Comment), Pick(new[]
                {
                    "Harika hizmet, çok memnun kaldım!", "Profesyonel ve güler yüzlü ekip.",
                    "Temiz, düzenli ve zamanında. Tavsiye ederim.", "Fiyat/performans mükemmel.",
                    "Randevu almak çok kolaydı, hizmet kusursuzdu.", "Kesinlikle tekrar geleceğim.",
                }));
                Set(r, nameof(Review.IsApproved), true);
                Set(r, nameof(Review.CreatedAt), Now.AddDays(-Rng.Next(1, 90)));
                ctx.Reviews.Add(r);
            }

            // Payments (for completed appointments)
            var completedAppointments = ctx.ChangeTracker.Entries<Appointment>()
                .Where(e => e.Entity.TenantId == tenantId &&
                    e.State == Microsoft.EntityFrameworkCore.EntityState.Added &&
                    e.Entity.Status == AppointmentStatus.Completed)
                .Select(e => e.Entity)
                .ToList();

            foreach (var appt in completedAppointments)
            {
                var p = New<Payment>();
                Set(p, nameof(Payment.Id), Guid.NewGuid());
                Set(p, nameof(Payment.TenantId), tenantId);
                Set(p, nameof(Payment.AppointmentId), appt.Id);
                Set(p, nameof(Payment.Provider), Pick(new[] { "iyzico", "stripe", "paytr" }));
                Set(p, nameof(Payment.Amount), appt.Price);
                Set(p, nameof(Payment.Currency), "TRY");
                Set(p, nameof(Payment.Status), PaymentStatus.Completed);
                Set(p, nameof(Payment.PaidAt), appt.EndTime);
                ctx.Payments.Add(p);
            }

            // Campaigns
            var campNames = new[] { "Hoş Geldin İndirimi", "Yaz Kampanyası", "Arkadaşını Getir", "Sezon Sonu", "İlk Randevu" };
            for (int i = 0; i < Rng.Next(2, 5); i++)
            {
                var c = New<Campaign>();
                Set(c, nameof(Campaign.Id), Guid.NewGuid());
                Set(c, nameof(Campaign.TenantId), tenantId);
                Set(c, nameof(Campaign.Name), $"{Pick(campNames)} - {d.BizName}");
                Set(c, nameof(Campaign.Description), $"%{Rng.Next(10, 40)} indirim fırsatı!");
                Set(c, nameof(Campaign.DiscountType), DiscountType.Percentage);
                Set(c, nameof(Campaign.DiscountValue), Rng.Next(10, 40));
                Set(c, nameof(Campaign.StartDate), Now.AddDays(-Rng.Next(5, 30)));
                Set(c, nameof(Campaign.EndDate), Now.AddDays(Rng.Next(15, 60)));
                Set(c, nameof(Campaign.Status), Pick(new[] { CampaignStatus.Active, CampaignStatus.Active, CampaignStatus.Draft }));
                Set(c, nameof(Campaign.UsageLimit), Rng.Next(20, 100));
                Set(c, nameof(Campaign.UsageCount), Rng.Next(0, 20));
                ctx.Campaigns.Add(c);
            }

            // Coupons
            for (int i = 0; i < Rng.Next(3, 7); i++)
            {
                var c = New<Coupon>();
                Set(c, nameof(Coupon.Id), Guid.NewGuid());
                Set(c, nameof(Coupon.TenantId), tenantId);
                Set(c, nameof(Coupon.Code), $"KUPON{Rng.Next(1000, 9999)}");
                Set(c, nameof(Coupon.Description), $"{Rng.Next(10, 50)}% indirim");
                Set(c, nameof(Coupon.DiscountType), Pick(new[] { DiscountType.Percentage, DiscountType.FixedAmount }));
                Set(c, nameof(Coupon.DiscountValue), Rng.Next(2) == 0 ? Rng.Next(10, 40) : Rng.Next(50, 200));
                Set(c, nameof(Coupon.MinimumOrderAmount), Rng.Next(2) == 0 ? Rng.Next(100, 500) : (decimal?)null);
                Set(c, nameof(Coupon.ExpiresAt), Now.AddDays(Rng.Next(15, 90)));
                Set(c, nameof(Coupon.UsageLimit), Rng.Next(10, 50));
                Set(c, nameof(Coupon.UsageCount), Rng.Next(0, 10));
                Set(c, nameof(Coupon.IsActive), true);
                ctx.Coupons.Add(c);
            }

            // Packages
            var pkgNames = new[] { "Bronz Paket", "Gümüş Paket", "Altın Paket", "Premium Paket", "Ekonomik Paket" };
            for (int i = 0; i < Rng.Next(2, 5); i++)
            {
                var selected = services.OrderBy(_ => Rng.Next()).Take(Rng.Next(2, 4)).ToList();
                var totalPkgPrice = selected.Sum(s => s.Price);
                var p = New<Package>();
                Set(p, nameof(Package.Id), Guid.NewGuid());
                Set(p, nameof(Package.TenantId), tenantId);
                Set(p, nameof(Package.Name), Pick(pkgNames));
                Set(p, nameof(Package.Description), $"{selected.Count} hizmet bir arada!");
                Set(p, nameof(Package.Price), (int)(totalPkgPrice * 0.75m));
                Set(p, nameof(Package.OriginalPrice), (int)totalPkgPrice);
                Set(p, nameof(Package.ValidityDays), Rng.Next(30, 181));
                Set(p, nameof(Package.IsActive), true);
                Set(p, nameof(Package.Items), selected.Select(s => new PackageItem
                {
                    ServiceId = s.Id,
                    ServiceName = s.Name,
                    Quantity = Rng.Next(1, 4)
                }).ToList());
                ctx.Packages.Add(p);
            }

            // Products
            var productTemplates = d.Cat switch
            {
                BusinessCategory.BeautySalon => new[] { ("Nemlendirici Krem", 250), ("Saç Serumu", 180), ("Güneş Kremi", 200), ("Tonik", 120), ("El Kremi", 90) },
                BusinessCategory.Barbershop => new[] { ("Saç Jölesi", 80), ("Sakal Yağı", 120), ("Tıraş Köpüğü", 60), ("Saç Kremi", 90), ("Kolonya", 50) },
                BusinessCategory.Dentist => new[] { ("Diş Fırçası", 40), ("Diş Macunu", 30), ("Diş İpi", 25), ("Ağız Gargarası", 45) },
                BusinessCategory.Spa => new[] { ("Aromaterapi Yağı", 150), ("Vücut Losyonu", 100), ("Masaj Yağı", 120), ("Banyo Tuzu", 60) },
                BusinessCategory.NailSalon => new[] { ("Oje Seti", 80), ("Tırnak Törpüsü", 30), ("Base Coat", 40), ("Top Coat", 40) },
                BusinessCategory.Gym => new[] { ("Protein Tozu", 350), ("Shaker", 80), ("Antrenman Eldiveni", 120), ("Su Şişesi", 50) },
                BusinessCategory.Veterinarian => new[] { ("Kuru Mama", 200), ("Yaş Mama", 80), ("Vitamin", 150), ("Tasma", 90) },
                BusinessCategory.CarService => new[] { ("Motor Yağı", 300), ("Hava Filtresi", 120), ("Yağ Filtresi", 100), ("Klima Spreyi", 80) },
                _ => new[] { ("Kalem", 30), ("Defter", 50), ("Bardak", 40), ("Tişört", 100) }
            };
            foreach (var (name, price) in productTemplates)
            {
                var pr = New<Product>();
                Set(pr, nameof(Product.Id), Guid.NewGuid());
                Set(pr, nameof(Product.TenantId), tenantId);
                Set(pr, nameof(Product.Name), name);
                Set(pr, nameof(Product.SalePrice), price);
                Set(pr, nameof(Product.CostPrice), (int)(price * 0.5m));
                Set(pr, nameof(Product.StockQuantity), Rng.Next(5, 100));
                Set(pr, nameof(Product.MinStockLevel), 5);
                Set(pr, nameof(Product.Unit), "Adet");
                Set(pr, nameof(Product.IsActive), true);
                ctx.Products.Add(pr);
            }

            // EmployeeCommissions
            foreach (var emp in employees)
            {
                var ec = New<EmployeeCommission>();
                Set(ec, nameof(EmployeeCommission.Id), Guid.NewGuid());
                Set(ec, nameof(EmployeeCommission.TenantId), tenantId);
                Set(ec, nameof(EmployeeCommission.EmployeeId), emp.Id);
                Set(ec, nameof(EmployeeCommission.EmployeeName), emp.Name);
                Set(ec, nameof(EmployeeCommission.Period), $"{Now:yyyy-MM}");
                Set(ec, nameof(EmployeeCommission.Type), Pick(new[] { CommissionType.Service, CommissionType.Sales, CommissionType.Mixed }));
                Set(ec, nameof(EmployeeCommission.BaseAmount), Rng.Next(50, 300) * 10m);
                Set(ec, nameof(EmployeeCommission.CommissionRate), Rng.Next(5, 25));
                Set(ec, nameof(EmployeeCommission.CommissionAmount), Rng.Next(50, 300) * 10m * Rng.Next(5, 25) / 100m);
                Set(ec, nameof(EmployeeCommission.BonusAmount), Rng.Next(2) == 0 ? Rng.Next(5, 30) * 10m : 0m);
                Set(ec, nameof(EmployeeCommission.Status), Pick(new[] { CommissionStatus.Pending, CommissionStatus.Approved, CommissionStatus.Paid }));
                ctx.EmployeeCommissions.Add(ec);
            }

            // GiftCoupons
            for (int i = 0; i < Rng.Next(3, 8); i++)
            {
                var gc = New<GiftCoupon>();
                Set(gc, nameof(GiftCoupon.Id), Guid.NewGuid());
                Set(gc, nameof(GiftCoupon.TenantId), tenantId);
                Set(gc, nameof(GiftCoupon.Code), $"HEDIYE{Rng.Next(10000, 99999)}");
                Set(gc, nameof(GiftCoupon.Amount), Rng.Next(5, 30) * 10);
                Set(gc, nameof(GiftCoupon.RecipientName), $"{Pick(FirstNames)} {Pick(LastNames)}");
                Set(gc, nameof(GiftCoupon.RecipientEmail), $"hediye{Rng.Next(1, 999)}@email.com");
                Set(gc, nameof(GiftCoupon.PurchasedBy), $"{Pick(FirstNames)} {Pick(LastNames)}");
                Set(gc, nameof(GiftCoupon.PurchaseDate), Now.AddDays(-Rng.Next(1, 30)));
                Set(gc, nameof(GiftCoupon.ExpiryDate), Now.AddDays(Rng.Next(30, 180)));
                Set(gc, nameof(GiftCoupon.UsedAmount), 0m);
                Set(gc, nameof(GiftCoupon.Status), Pick(new[] { GiftCouponStatus.Active, GiftCouponStatus.Active, GiftCouponStatus.Used }));
                Set(gc, nameof(GiftCoupon.Message), Pick(new[] { "Mutlu yıllar!", "İyi Bayramlar!", "Doğum günün kutlu olsun!", "" }));
                ctx.GiftCoupons.Add(gc);
            }

            // Advertisements
            for (int i = 0; i < Rng.Next(1, 4); i++)
            {
                var ad = New<Advertisement>();
                Set(ad, nameof(Advertisement.Id), Guid.NewGuid());
                Set(ad, nameof(Advertisement.TenantId), tenantId);
                Set(ad, nameof(Advertisement.Title), $"{d.BizName} - {Pick(new[] { "Öne Çıkan", "Tanıtım", "Kampanya" })}");
                Set(ad, nameof(Advertisement.Description), $"{d.BizName} hizmetlerini keşfedin!");
                Set(ad, nameof(Advertisement.PackageType), Pick(new[] { AdPackageType.BasicBoost, AdPackageType.ProfessionalBoost, AdPackageType.PremiumSpotlight }));
                Set(ad, nameof(Advertisement.TargetCategory), AdTargetCategory.All);
                Set(ad, nameof(Advertisement.Budget), Rng.Next(50, 200) * 10);
                Set(ad, nameof(Advertisement.StartDate), Now.AddDays(-Rng.Next(0, 10)));
                Set(ad, nameof(Advertisement.EndDate), Now.AddDays(Rng.Next(10, 40)));
                Set(ad, nameof(Advertisement.Status), Pick(new[] { AdStatus.Active, AdStatus.Active, AdStatus.Pending }));
                Set(ad, nameof(Advertisement.Impressions), Rng.Next(100, 5000));
                Set(ad, nameof(Advertisement.Clicks), Rng.Next(10, 300));
                Set(ad, nameof(Advertisement.Conversions), Rng.Next(1, 30));
                ctx.Advertisements.Add(ad);
            }

            // QueueItems (walk-in)
            for (int i = 0; i < Rng.Next(2, 6); i++)
            {
                var q = New<QueueItem>();
                Set(q, nameof(QueueItem.Id), Guid.NewGuid());
                Set(q, nameof(QueueItem.TenantId), tenantId);
                Set(q, nameof(QueueItem.BusinessId), bizId);
                Set(q, nameof(QueueItem.QueueNumber), Rng.Next(1, 50));
                Set(q, nameof(QueueItem.CustomerName), $"{Pick(FirstNames)} {Pick(LastNames)}");
                Set(q, nameof(QueueItem.CustomerPhone), Phone());
                Set(q, nameof(QueueItem.Status), Pick(new[] { QueueStatus.Waiting, QueueStatus.InService, QueueStatus.Completed }));
                Set(q, nameof(QueueItem.EstimatedWaitMinutes), Rng.Next(5, 45));
                ctx.QueueItems.Add(q);
            }

            // WaitingListEntries
            for (int i = 0; i < Rng.Next(1, 4); i++)
            {
                var w = New<WaitingListEntry>();
                Set(w, nameof(WaitingListEntry.Id), Guid.NewGuid());
                Set(w, nameof(WaitingListEntry.TenantId), tenantId);
                Set(w, nameof(WaitingListEntry.BusinessId), bizId);
                Set(w, nameof(WaitingListEntry.CustomerName), $"{Pick(FirstNames)} {Pick(LastNames)}");
                Set(w, nameof(WaitingListEntry.CustomerPhone), Phone());
                Set(w, nameof(WaitingListEntry.Status), Pick(new[] { WaitingListStatus.Waiting, WaitingListStatus.Notified, WaitingListStatus.Confirmed }));
                Set(w, nameof(WaitingListEntry.PreferredDate), DateOnly.FromDateTime(DateTime.Now.AddDays(Rng.Next(1, 14))));
                Set(w, nameof(WaitingListEntry.PreferredTime), new TimeOnly(Rng.Next(9, 18), 0));
                ctx.WaitingListEntries.Add(w);
            }

            // Receivables + Installments
            for (int i = 0; i < Rng.Next(2, 5); i++)
            {
                var cust = Pick(customers);
                var total = Rng.Next(10, 100) * 100m;
                var instCount = Pick(new[] { 1, 1, 2, 3 });
                var paidAmt = instCount > 1 ? total / instCount * Rng.Next(0, 2) : Rng.Next(2) == 0 ? total : 0m;

                var rec = New<Receivable>();
                Set(rec, nameof(Receivable.Id), Guid.NewGuid());
                Set(rec, nameof(Receivable.TenantId), tenantId);
                Set(rec, nameof(Receivable.CustomerName), cust.Name);
                Set(rec, nameof(Receivable.CustomerPhone), cust.Phone);
                Set(rec, nameof(Receivable.TotalAmount), total);
                Set(rec, nameof(Receivable.PaidAmount), paidAmt);
                Set(rec, nameof(Receivable.DueDate), DateOnly.FromDateTime(DateTime.Now.AddDays(Rng.Next(-10, 31))));
                Set(rec, nameof(Receivable.Status), paidAmt == 0 ? ReceivableStatus.Open : paidAmt >= total ? ReceivableStatus.Paid : ReceivableStatus.PartiallyPaid);
                Set(rec, nameof(Receivable.InstallmentCount), instCount);
                ctx.Receivables.Add(rec);

                for (int j = 0; j < instCount; j++)
                {
                    var inst = New<Installment>();
                    Set(inst, nameof(Installment.Id), Guid.NewGuid());
                    Set(inst, nameof(Installment.TenantId), tenantId);
                    Set(inst, nameof(Installment.ReceivableId), rec.Id);
                    Set(inst, nameof(Installment.InstallmentNumber), j + 1);
                    Set(inst, nameof(Installment.Amount), total / instCount);
                    Set(inst, nameof(Installment.DueDate), DateOnly.FromDateTime(DateTime.Now.AddDays(j * 30 - 10)));
                    Set(inst, nameof(Installment.IsPaid), j == 0 && paidAmt > 0);
                    ctx.Installments.Add(inst);
                }
            }

            // DebtRecords
            var debtCats = new[] { DebtCategory.Rent, DebtCategory.Supplier, DebtCategory.Tax, DebtCategory.Equipment };
            for (int i = 0; i < Rng.Next(2, 5); i++)
            {
                var debtCat = Pick(debtCats);
                var total = Rng.Next(5, 100) * 1000m;
                var paid = Rng.Next(2) == 0 ? 0m : Rng.Next(1, (int)(total / 1000)) * 1000m;

                var dr = New<DebtRecord>();
                Set(dr, nameof(DebtRecord.Id), Guid.NewGuid());
                Set(dr, nameof(DebtRecord.TenantId), tenantId);
                Set(dr, nameof(DebtRecord.Title), debtCat switch { DebtCategory.Rent => "Kira", DebtCategory.Supplier => "Tedarikçi Faturası", DebtCategory.Tax => "Vergi", _ => "Ekipman" });
                Set(dr, nameof(DebtRecord.TotalAmount), total);
                Set(dr, nameof(DebtRecord.PaidAmount), paid);
                Set(dr, nameof(DebtRecord.DueDate), DateOnly.FromDateTime(DateTime.Now.AddDays(Rng.Next(-15, 45))));
                Set(dr, nameof(DebtRecord.Category), debtCat);
                Set(dr, nameof(DebtRecord.Status), paid == 0 ? DebtStatus.Open : paid >= total ? DebtStatus.Paid : DebtStatus.PartiallyPaid);
                ctx.DebtRecords.Add(dr);
            }

            // Deposits
            foreach (var appt in completedAppointments.Take(Rng.Next(2, 6)))
            {
                var dep = New<Deposit>();
                Set(dep, nameof(Deposit.Id), Guid.NewGuid());
                Set(dep, nameof(Deposit.TenantId), tenantId);
                Set(dep, nameof(Deposit.AppointmentId), appt.Id);
                Set(dep, nameof(Deposit.Amount), appt.Price * 0.3m);
                Set(dep, nameof(Deposit.Currency), "TRY");
                Set(dep, nameof(Deposit.Status), DepositStatus.Paid);
                Set(dep, nameof(Deposit.PaymentMethod), Pick(new[] { "CreditCard", "BankTransfer", "Cash" }));
                Set(dep, nameof(Deposit.PaidAt), appt.StartTime.AddDays(-1));
                ctx.Deposits.Add(dep);
            }

            // Surveys
            foreach (var appt in completedAppointments.Take(Rng.Next(3, 8)))
            {
                var s = New<Survey>();
                Set(s, nameof(Survey.Id), Guid.NewGuid());
                Set(s, nameof(Survey.TenantId), tenantId);
                Set(s, nameof(Survey.BusinessId), bizId);
                Set(s, nameof(Survey.AppointmentId), appt.Id);
                Set(s, nameof(Survey.CustomerName), Pick(customers).Name);
                Set(s, nameof(Survey.Rating), Rng.Next(3, 6));
                Set(s, nameof(Survey.Comment), Pick(new[] { "Çok memnun kaldım!", "Harika hizmet!", "Profesyonel ekip.", "Tavsiye ederim.", "Mükemmel deneyim!" }));
                Set(s, nameof(Survey.IsApproved), true);
                ctx.Surveys.Add(s);
            }

            // User account for panel login (tenant_admin)
            var demoPassword = "Demo1234!";
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(demoPassword);
            var ownerUser = New<User>();
            Set(ownerUser, nameof(User.Id), Guid.NewGuid());
            Set(ownerUser, nameof(User.Email), $"admin@{Slug(d.BizName)}.com");
            Set(ownerUser, nameof(User.PasswordHash), passwordHash);
            Set(ownerUser, nameof(User.FirstName), d.BizName.Split(' ')[0]);
            Set(ownerUser, nameof(User.LastName), "Admin");
            Set(ownerUser, nameof(User.Role), "tenant_admin");
            Set(ownerUser, nameof(User.TenantId), tenantId);
            Set(ownerUser, nameof(User.IsActive), true);
            Set(ownerUser, nameof(User.EmailVerified), true);
            ctx.Users.Add(ownerUser);

            await ctx.SaveChangesAsync();
            Console.WriteLine($"  ✓ [{bi + 1}/20] {d.BizName} ({city}) — {empCount} çalışan, {custCount} müşteri, {upcoming + past} randevu | Giriş: admin@{Slug(d.BizName)}.com / Demo1234!");
        }

        Console.WriteLine("═══════════════════════════════════════════");
        Console.WriteLine("  ✅ Demo seed tamamlandı!");
        Console.WriteLine($"  • 20 işletme (tüm kategoriler) · logolu + 5'er galeri fotoğraflı");
        Console.WriteLine($"  • {totalEmployees} çalışan · {totalCustomers} müşteri · {totalAppointments} randevu");
        Console.WriteLine("═══════════════════════════════════════════");
    }

    private static async Task EnsureDemoUsersExistAsync(ApplicationDbContext ctx)
    {
        var demoTenants = await ctx.Tenants
            .Where(t => t.Subdomain.EndsWith("-demo"))
            .ToListAsync();

        var existingUserTenantIds = await ctx.Users
            .Where(u => u.TenantId != null && u.Role == "tenant_admin")
            .Select(u => u.TenantId!.Value)
            .ToListAsync();

        var tenantsNeedingUsers = demoTenants
            .Where(t => !existingUserTenantIds.Contains(t.Id))
            .ToList();

        if (tenantsNeedingUsers.Count == 0)
        {
            Console.WriteLine("  ℹ️ Demo kullanıcıları zaten mevcut.");
            return;
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Demo1234!");
        foreach (var t in tenantsNeedingUsers)
        {
            var ownerUser = New<User>();
            Set(ownerUser, nameof(User.Id), Guid.NewGuid());
            Set(ownerUser, nameof(User.Email), $"admin@{t.Subdomain}.com");
            Set(ownerUser, nameof(User.PasswordHash), passwordHash);
            Set(ownerUser, nameof(User.FirstName), t.Name.Split(' ')[0]);
            Set(ownerUser, nameof(User.LastName), "Admin");
            Set(ownerUser, nameof(User.Role), "tenant_admin");
            Set(ownerUser, nameof(User.TenantId), t.Id);
            Set(ownerUser, nameof(User.IsActive), true);
            Set(ownerUser, nameof(User.EmailVerified), true);
            ctx.Users.Add(ownerUser);
            Console.WriteLine($"  ✓ Kullanıcı eklendi: admin@{t.Subdomain}.com ({t.Name})");
        }

        await ctx.SaveChangesAsync();
        Console.WriteLine($"  ✅ {tenantsNeedingUsers.Count} demo kullanıcı eklendi.");
    }
}
