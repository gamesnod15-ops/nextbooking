using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using RandevumKolay.Domain.Entities;
using RandevumKolay.Domain.Enums;

namespace RandevumKolay.Persistence.Seed;

public static class SeedData
{
    private static readonly Random Rng = new(42);
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    // ── Helpers ───────────────────────────────────────────────────────────────
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

    private static readonly string[] MaleNames =
    [
        "Ahmet","Mehmet","Ali","Veli","Mustafa","Hasan","Hüseyin","İbrahim","Osman","Yusuf",
        "Ömer","Emre","Can","Burak","Kerem","Murat","Serkan","Tolga","Cem","Onur",
        "Fatih","Uğur","Volkan","Kemal","Erkan","Gökhan","Hakan","Levent","Mert","Okan",
        "Selim","Berk","Doruk","Efe","Kaan","Alper","Cihan","Deniz","Eren","Fırat",
    ];

    private static readonly string[] FemaleNames =
    [
        "Ayşe","Fatma","Zeynep","Elif","Merve","Hülya","Derya","Gülşen","Sibel","Aslı",
        "Büşra","Cansu","Didem","Esra","Filiz","Gamze","Hande","Işıl","Kübra","Lale",
        "Meltem","Nalan","Nur","Özlem","Pelin","Rukiye","Sevgi","Şule","Tuğba","Yasemin",
        "Aylin","Bahar","Çiğdem","Defne","Ece","Funda","Gizem","İrem","Melek","Nazlı",
    ];

    private static readonly string[] LastNames =
    [
        "Yılmaz","Kaya","Demir","Çelik","Şahin","Arslan","Yıldız","Öztürk","Aydın","Koç",
        "Kurt","Polat","Ak","Kara","Güneş","Aslan","Doğan","Özdemir","Kılıç","Aksoy",
        "Yalçın","Köse","Taş","Özkan","Tekin","Bulut","Erdoğan","Karaca","Turan","Acar",
        "Tunç","Gündüz","Orhan","Çetin","Kaplan","Güler","Ercan","Küçük","Işık","Uysal",
    ];

    private static readonly string[] Cities =
    [
        "İstanbul","Ankara","İzmir","Bursa","Antalya","Adana","Konya","Gaziantep",
        "Mersin","Kayseri","Eskişehir","Trabzon","Samsun","Denizli","Balıkesir","Malatya",
        "Kocaeli","Sakarya","Manisa","Edirne","Muğla","Aydın","Çanakkale","Ordu","Van","Hatay",
    ];

    private static string Phone() =>
        $"05{Rng.Next(532, 560)}{Rng.Next(1000000, 9999999)}";

    private static T Pick<T>(IReadOnlyList<T> a) => a[Rng.Next(a.Count)];
    private static T Pick<T>(T[] a) => a[Rng.Next(a.Length)];

    private static DateOnly RandomDate(int y1, int y2) =>
        new(Rng.Next(y1, y2 + 1), Rng.Next(1, 13), Rng.Next(1, 29));

    private static DateTimeOffset PastDay(int max) =>
        Now.AddDays(-Rng.Next(1, max)).AddHours(Rng.Next(8, 19)).AddMinutes(Rng.Next(0, 4) * 15);

    private static DateTimeOffset FutureDay(int max) =>
        Now.AddDays(Rng.Next(1, max + 1)).AddHours(Rng.Next(8, 19)).AddMinutes(Rng.Next(0, 4) * 15);

    // ── Main ──────────────────────────────────────────────────────────────────
    public static async Task InitializeAsync(ApplicationDbContext ctx)
    {
        if (await ctx.Tenants.AnyAsync()) return;

        // 1 ── Tenant ──────────────────────────────────────────────────────────
        var tenant = New<Tenant>();
        Set(tenant, nameof(Tenant.Id), TenantId);
        Set(tenant, nameof(Tenant.Name), "NextBooking Demo");
        Set(tenant, nameof(Tenant.Subdomain), "demo");
        Set(tenant, nameof(Tenant.Email), "demo@randevumkolay.com");
        Set(tenant, nameof(Tenant.Plan), "professional");
        Set(tenant, nameof(Tenant.IsActive), true);
        Set(tenant, nameof(Tenant.CreatedAt), Now.AddMonths(-6));
        ctx.Tenants.Add(tenant);

        // 2 ── Businesses ──────────────────────────────────────────────────────
        var bizDefs = new (string Name, BusinessCategory Cat, string City)[]
        {
            ("Güzellik Merkezi", BusinessCategory.BeautySalon, "İstanbul"),
            ("Berkay Kuaför", BusinessCategory.Barbershop, "Ankara"),
            ("MediCare Kliniği", BusinessCategory.Clinic, "İzmir"),
            ("Parlak Diş Polikliniği", BusinessCategory.Dentist, "Bursa"),
            ("FizyoLife Terapi", BusinessCategory.Physiotherapy, "Antalya"),
            ("PowerFit Spor Salonu", BusinessCategory.Gym, "İstanbul"),
            ("Zen Yoga Stüdyosu", BusinessCategory.Yoga, "İzmir"),
            ("Royal Spa & Masaj", BusinessCategory.Spa, "Ankara"),
            ("Pembe Tırnak Stüdyosu", BusinessCategory.NailSalon, "İstanbul"),
            ("Dövme Sanat Atölyesi", BusinessCategory.Tattoo, "Adana"),
            ("Patim Veteriner Kliniği", BusinessCategory.Veterinarian, "İzmir"),
            ("OtoEksper Servis", BusinessCategory.CarService, "Bursa"),
            ("DanışmanPlus", BusinessCategory.Consultant, "Ankara"),
            ("İçHuzur Psikoloji", BusinessCategory.Psychologist, "İstanbul"),
            ("Özel Ders Akademi", BusinessCategory.Tutor, "İzmir"),
        };

        var bizList = new List<Business>();
        foreach (var (n, cat, city) in bizDefs)
        {
            var b = New<Business>();
            Set(b, nameof(Business.Id), Guid.NewGuid());
            Set(b, nameof(Business.TenantId), TenantId);
            Set(b, nameof(Business.Name), n);
            Set(b, nameof(Business.Category), cat);
            Set(b, nameof(Business.City), city);
            Set(b, nameof(Business.Phone), Phone());
            Set(b, nameof(Business.Email), $"{n.ToLower().Replace(" ","").Replace("İ","i").Replace("ı","i").Replace("ü","u").Replace("ö","o").Replace("ç","c").Replace("ş","s").Replace("ğ","g")}@randevumkolay.com");
            Set(b, nameof(Business.IsActive), true);
            Set(b, nameof(Business.Timezone), "Europe/Istanbul");
            Set(b, nameof(Business.Description), $"{n} olarak {city}'da en iyi hizmeti sunuyoruz.");
            ctx.Businesses.Add(b);
            bizList.Add(b);
        }
        await Save(ctx, "Businesses");

        // 3 ── Branches ────────────────────────────────────────────────────────
        foreach (var b in bizList)
        {
            var br = New<Branch>();
            Set(br, nameof(Branch.Id), Guid.NewGuid());
            Set(br, nameof(Branch.TenantId), TenantId);
            Set(br, nameof(Branch.Name), "Merkez Şube");
            Set(br, nameof(Branch.City), b.GetType().GetProperty("City")?.GetValue(b));
            Set(br, nameof(Branch.Phone), Phone());
            Set(br, nameof(Branch.IsActive), true);
            Set(br, nameof(Branch.IsMainBranch), true);
            ctx.Branches.Add(br);
        }
        await Save(ctx, "Branches");

        // 4 ── Services per Business ───────────────────────────────────────────
        var svcTemplates = new Dictionary<BusinessCategory, string[]>
        {
            [BusinessCategory.BeautySalon] = ["Cilt Bakımı","Epilasyon","Kaş & Kirpik","Kalıcı Makyaj","Protez Tırnak","Pedikür & Manikür","Cilt Yenileme"],
            [BusinessCategory.Barbershop] = ["Saç Kesimi","Sakal Tıraşı","Saç Boyama","Fön Çekimi","Cilt Bakımı","Keratin Bakım"],
            [BusinessCategory.Clinic] = ["Check-up","Kan Tahlili","EKG","Aşı","Dahiliye","Göz Muayenesi"],
            [BusinessCategory.Dentist] = ["Diş Muayenesi","Diş Temizliği","Kanal Tedavisi","Diş Beyazlatma","Diş Çekimi","İmplant"],
            [BusinessCategory.Physiotherapy] = ["Manuel Terapi","Kuru İğne","Lazer","Egzersiz","Masaj Terapi","Postür Düzeltme"],
            [BusinessCategory.Gym] = ["Bireysel Antrenman","Grup Dersi","CrossFit","Pilates","Kardiyo","Ağırlık Antrenmanı"],
            [BusinessCategory.Yoga] = ["Hatha Yoga","Vinyasa Yoga","Yin Yoga","Meditasyon","Nefes Egzersizi","Hamile Yogası"],
            [BusinessCategory.Spa] = ["Klasik Masaj","Aromaterapi","Sıcak Taş","Lenf Drenaj","Vücut Sargısı","Sauna & Buhar"],
            [BusinessCategory.NailSalon] = ["Manikür","Pedikür","Kalıcı Oje","Protez Tırnak","Tırnak Süsleme","El Bakımı"],
            [BusinessCategory.Tattoo] = ["Dövme Tasarım","Küçük Dövme","Büyük Dövme","Cover-up","Piercing","Özel Tasarım"],
            [BusinessCategory.Veterinarian] = ["Genel Muayene","Aşı","Kısırlaştırma","Diş Temizliği","Acil Müdahale","Laboratuvar"],
            [BusinessCategory.CarService] = ["Yağ Değişimi","Fren Bakımı","Lastik Değişimi","Motor Bakımı","Periyodik Bakım","Klima Bakımı"],
            [BusinessCategory.Consultant] = ["İş Planı","Dijital Dönüşüm","Pazarlama","Finans Danışmanlık","İK Danışmanlık","E-ticaret"],
            [BusinessCategory.Psychologist] = ["Bireysel Terapi","Çift Terapisi","Aile Danışmanlığı","Çocuk Terapisi","Online Terapi","Stres Yönetimi"],
            [BusinessCategory.Tutor] = ["Matematik","Fizik","Kimya","İngilizce","Almanca","YKS Hazırlık"],
        };

        var svcList = new List<Service>();
        foreach (var b in bizList)
        {
            var cat = (BusinessCategory)b.GetType().GetProperty("Category")!.GetValue(b)!;
            var templates = svcTemplates[cat];
            for (int i = 0; i < templates.Length; i++)
            {
                var minPrice = cat switch { BusinessCategory.Dentist => 300, BusinessCategory.Clinic => 200, BusinessCategory.CarService => 500, BusinessCategory.Tattoo => 1000, _ => 100 };
                var maxPrice = cat switch { BusinessCategory.Dentist => 2000, BusinessCategory.Clinic => 1500, BusinessCategory.CarService => 5000, BusinessCategory.Tattoo => 10000, _ => 500 };
                var s = New<Service>();
                Set(s, nameof(Service.Id), Guid.NewGuid());
                Set(s, nameof(Service.TenantId), TenantId);
                Set(s, nameof(Service.BusinessId), b.GetType().GetProperty("Id")!.GetValue(b)!);
                Set(s, nameof(Service.Name), templates[i]);
                Set(s, nameof(Service.DurationMinutes), Rng.Next(2) == 0 ? 45 : 60);
                Set(s, nameof(Service.BufferMinutes), Rng.Next(2) * 5);
                Set(s, nameof(Service.Price), Rng.Next(minPrice / 10, maxPrice / 10 + 1) * 10);
                Set(s, nameof(Service.SortOrder), i);
                Set(s, nameof(Service.IsActive), true);
                ctx.Services.Add(s);
                svcList.Add(s);
            }
        }
        await Save(ctx, "Services");

        // 5 ── Employees ───────────────────────────────────────────────────────
        var empNames = new[] { ("Ayşe","Yılmaz"),("Mehmet","Kaya"),("Zeynep","Demir"),("Ali","Çelik"),("Elif","Şahin"),("Hasan","Arslan"),("Merve","Yıldız"),("Fatih","Öztürk"),("Büşra","Aydın"),("Emre","Koç"),("Sibel","Kurt"),("Murat","Polat"),("Hande","Ak"),("Kemal","Kara"),("Aslı","Doğan"),("Serkan","Özdemir"),("Gamze","Kılıç"),("Can","Aksoy"),("Derya","Yalçın"),("Burak","Köse"),("Tuğba","Taş"),("İbrahim","Özkan"),("Pelin","Tekin"),("Okan","Bulut"),("Esra","Erdoğan"),("Hakan","Karaca"),("Özlem","Turan"),("Levent","Acar") };

        var empList = new List<Employee>();
        int ei = 0;
        var svcByBiz = svcList.GroupBy(s => (Guid)s.GetType().GetProperty("BusinessId")!.GetValue(s)!).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var b in bizList)
        {
            var bizId = (Guid)b.GetType().GetProperty("Id")!.GetValue(b)!;
            var count = Rng.Next(4, 7);
            for (int i = 0; i < count && ei < empNames.Length; i++, ei++)
            {
                var (fn, ln) = empNames[ei];
                var e = New<Employee>();
                Set(e, nameof(Employee.Id), Guid.NewGuid());
                Set(e, nameof(Employee.TenantId), TenantId);
                Set(e, nameof(Employee.BusinessId), bizId);
                Set(e, nameof(Employee.Name), $"{fn} {ln}");
                Set(e, nameof(Employee.Phone), Phone());
                Set(e, nameof(Employee.IsActive), true);
                Set(e, nameof(Employee.AcceptsOnlineBookings), true);
                ctx.Employees.Add(e);
                empList.Add(e);
            }
        }
        await Save(ctx, "Employees");

        // 6 ── EmployeeServices ────────────────────────────────────────────────
        var empByBiz = empList.GroupBy(e => (Guid)e.GetType().GetProperty("BusinessId")!.GetValue(e)!).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var (bizId, emps) in empByBiz)
        {
            if (!svcByBiz.TryGetValue(bizId, out var svcs)) continue;
            foreach (var emp in emps)
            {
                var assigned = svcs.OrderBy(_ => Rng.Next()).Take(Rng.Next(2, svcs.Count + 1));
                foreach (var svc in assigned)
                {
                    var es = New<EmployeeService>();
                    Set(es, nameof(EmployeeService.EmployeeId), emp.GetType().GetProperty("Id")!.GetValue(emp)!);
                    Set(es, nameof(EmployeeService.ServiceId), svc.GetType().GetProperty("Id")!.GetValue(svc)!);
                    ctx.EmployeeServices.Add(es);
                }
            }
        }
        await Save(ctx, "EmployeeServices");

        // 7 ── Schedules ───────────────────────────────────────────────────────
        foreach (var emp in empList)
        {
            var empId = (Guid)emp.GetType().GetProperty("Id")!.GetValue(emp)!;
            foreach (var day in new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday })
            {
                if (day == DayOfWeek.Saturday && Rng.Next(2) == 0) continue;
                var s = New<Schedule>();
                Set(s, nameof(Schedule.Id), Guid.NewGuid());
                Set(s, nameof(Schedule.TenantId), TenantId);
                Set(s, nameof(Schedule.EmployeeId), empId);
                Set(s, nameof(Schedule.DayOfWeek), day);
                Set(s, nameof(Schedule.StartTime), new TimeOnly(9 + Rng.Next(0, 3), 0));
                Set(s, nameof(Schedule.EndTime), new TimeOnly(17 + Rng.Next(0, 2), 0));
                Set(s, nameof(Schedule.IsActive), true);
                ctx.Schedules.Add(s);
            }
        }
        await Save(ctx, "Schedules");

        // 8 ── Customers (1500) ────────────────────────────────────────────────
        var custList = new List<Customer>();
        var usedPhones = new HashSet<string>();
        for (int i = 0; i < 1500; i++)
        {
            var isMale = Rng.Next(2) == 0;
            var fn = isMale ? Pick(MaleNames) : Pick(FemaleNames);
            var ln = Pick(LastNames);
            var phone = Phone();
            while (usedPhones.Contains(phone)) phone = Phone();
            usedPhones.Add(phone);

            var c = New<Customer>();
            Set(c, nameof(Customer.Id), Guid.NewGuid());
            Set(c, nameof(Customer.TenantId), TenantId);
            Set(c, nameof(Customer.Name), $"{fn} {ln}");
            Set(c, nameof(Customer.Phone), phone);
            Set(c, nameof(Customer.Email), $"{fn.ToLower()}.{ln.ToLower()}@email.com");
            Set(c, nameof(Customer.Gender), isMale ? "male" : "female");
            Set(c, nameof(Customer.BirthDate), RandomDate(1965, 2005));
            Set(c, nameof(Customer.IsBlocked), false);
            Set(c, nameof(Customer.Tags), Enumerable.Range(0, Rng.Next(0, 4)).Select(_ => Pick(new[] { "VIP", "Düzenli", "Aktif", "Sadık" })).Distinct().ToList());
            ctx.Customers.Add(c);
            custList.Add(c);
        }
        await Save(ctx, "Customers");

        // 9 ── Appointments ────────────────────────────────────────────────────
        var appList = new List<Appointment>();
        var statuses = new[] { AppointmentStatus.Completed, AppointmentStatus.Completed, AppointmentStatus.Completed, AppointmentStatus.Confirmed, AppointmentStatus.Pending, AppointmentStatus.Cancelled, AppointmentStatus.NoShow };

        foreach (var b in bizList)
        {
            var bizId = (Guid)b.GetType().GetProperty("Id")!.GetValue(b)!;
            if (!empByBiz.TryGetValue(bizId, out var emps)) continue;
            if (!svcByBiz.TryGetValue(bizId, out var svcs)) continue;

            int count = Rng.Next(15, 30);
            for (int i = 0; i < count; i++)
            {
                var customer = custList[Rng.Next(custList.Count)];
                var emp = emps[Rng.Next(emps.Count)];
                var svc = svcs[Rng.Next(svcs.Count)];
                var status = Pick(statuses);
                var start = status == AppointmentStatus.Completed ? PastDay(90) : status is AppointmentStatus.Cancelled or AppointmentStatus.NoShow ? PastDay(14) : FutureDay(14);
                var end = start.AddMinutes((int)svc.GetType().GetProperty("DurationMinutes")!.GetValue(svc)!);

                var a = New<Appointment>();
                Set(a, nameof(Appointment.Id), Guid.NewGuid());
                Set(a, nameof(Appointment.TenantId), TenantId);
                Set(a, nameof(Appointment.BusinessId), bizId);
                Set(a, nameof(Appointment.ServiceId), svc.GetType().GetProperty("Id")!.GetValue(svc)!);
                Set(a, nameof(Appointment.EmployeeId), emp.GetType().GetProperty("Id")!.GetValue(emp)!);
                Set(a, nameof(Appointment.CustomerId), customer.GetType().GetProperty("Id")!.GetValue(customer)!);
                Set(a, nameof(Appointment.StartTime), start);
                Set(a, nameof(Appointment.EndTime), end);
                Set(a, nameof(Appointment.Status), status);
                Set(a, nameof(Appointment.Price), svc.GetType().GetProperty("Price")!.GetValue(svc)!);
                Set(a, nameof(Appointment.Source), Pick(["web","mobile","whatsapp","panel"]));
                Set(a, nameof(Appointment.ReminderSent), status is AppointmentStatus.Completed or AppointmentStatus.Confirmed);
                ctx.Appointments.Add(a);
                appList.Add(a);
            }
        }
        await Save(ctx, "Appointments");

        // 10 ── Payments ──────────────────────────────────────────────────────
        foreach (var a in appList.Where(a => (AppointmentStatus)a.GetType().GetProperty("Status")!.GetValue(a)! == AppointmentStatus.Completed))
        {
            var p = New<Payment>();
            Set(p, nameof(Payment.Id), Guid.NewGuid());
            Set(p, nameof(Payment.TenantId), TenantId);
            Set(p, nameof(Payment.AppointmentId), a.GetType().GetProperty("Id")!.GetValue(a)!);
            Set(p, nameof(Payment.Provider), "iyzico");
            Set(p, nameof(Payment.Amount), a.GetType().GetProperty("Price")!.GetValue(a)!);
            Set(p, nameof(Payment.Currency), "TRY");
            Set(p, nameof(Payment.Status), PaymentStatus.Completed);
            ctx.Payments.Add(p);
        }
        await Save(ctx, "Payments");

        // 11 ── Campaigns ──────────────────────────────────────────────────────
        var campTemplates = new[] { ("Hoş Geldin %20", 20m), ("Sevgililer Günü %25", 25m), ("Paket Hediye", 16m), ("İlk Randevu %15", 15m), ("Arkadaşını Getir %30", 30m) };
        foreach (var b in bizList)
        {
            foreach (var (name, value) in campTemplates.Take(3))
            {
                var c = New<Campaign>();
                Set(c, nameof(Campaign.Id), Guid.NewGuid());
                Set(c, nameof(Campaign.TenantId), TenantId);
                Set(c, nameof(Campaign.Name), $"{name} - {(string)b.GetType().GetProperty("Name")!.GetValue(b)!}");
                Set(c, nameof(Campaign.DiscountType), DiscountType.Percentage);
                Set(c, nameof(Campaign.DiscountValue), value);
                Set(c, nameof(Campaign.StartDate), Now.AddDays(-15));
                Set(c, nameof(Campaign.EndDate), Now.AddDays(30));
                Set(c, nameof(Campaign.Status), CampaignStatus.Active);
                Set(c, nameof(Campaign.UsageLimit), Rng.Next(20, 101));
                Set(c, nameof(Campaign.UsageCount), Rng.Next(0, 15));
                ctx.Campaigns.Add(c);
            }
        }
        await Save(ctx, "Campaigns");

        // 12 ── Coupons ────────────────────────────────────────────────────────
        int couponIndex = 1;
        foreach (var b in bizList)
        {
            for (int i = 0; i < 3; i++)
            {
                var c = New<Coupon>();
                Set(c, nameof(Coupon.Id), Guid.NewGuid());
                Set(c, nameof(Coupon.TenantId), TenantId);
                Set(c, nameof(Coupon.Code), $"IND{couponIndex:D5}");
                Set(c, nameof(Coupon.DiscountType), Pick([DiscountType.Percentage, DiscountType.FixedAmount]));
                Set(c, nameof(Coupon.DiscountValue), Rng.Next(10, 50) * (Rng.Next(2) == 0 ? 1 : 10));
                Set(c, nameof(Coupon.ExpiresAt), Now.AddDays(Rng.Next(10, 60)));
                Set(c, nameof(Coupon.UsageLimit), Rng.Next(10, 50));
                Set(c, nameof(Coupon.UsageCount), Rng.Next(0, 10));
                Set(c, nameof(Coupon.IsActive), true);
                ctx.Coupons.Add(c);
                couponIndex++;
            }
        }
        await Save(ctx, "Coupons");

        // 13 ── Packages ───────────────────────────────────────────────────────
        foreach (var (b, svcs) in bizList.Zip(svcByBiz.Values))
        {
            var bizName = (string)b.GetType().GetProperty("Name")!.GetValue(b)!;
            for (int i = 0; i < Rng.Next(3, 6); i++)
            {
                var selected = svcs.OrderBy(_ => Rng.Next()).Take(Rng.Next(2, 4)).ToList();
                var totalPrice = selected.Sum(s => (decimal)s.GetType().GetProperty("Price")!.GetValue(s)!);

                var p = New<Package>();
                Set(p, nameof(Package.Id), Guid.NewGuid());
                Set(p, nameof(Package.TenantId), TenantId);
                Set(p, nameof(Package.Name), Pick(["Bronz Paket","Gümüş Paket","Altın Paket","Premium Paket","Ekonomik Paket"]));
                Set(p, nameof(Package.Price), (int)(totalPrice * (0.6m + (decimal)Rng.NextDouble() * 0.25m)));
                Set(p, nameof(Package.OriginalPrice), (int)totalPrice);
                Set(p, nameof(Package.ValidityDays), Rng.Next(30, 181));
                Set(p, nameof(Package.IsActive), true);
                Set(p, nameof(Package.Items), selected.Select(s => new PackageItem { ServiceId = (Guid)s.GetType().GetProperty("Id")!.GetValue(s)!, ServiceName = (string)s.GetType().GetProperty("Name")!.GetValue(s)!, Quantity = Rng.Next(1, 4) }).ToList());
                ctx.Packages.Add(p);
            }
        }
        await Save(ctx, "Packages");

        // 14 ── Products ───────────────────────────────────────────────────────
        var prodNames = new Dictionary<BusinessCategory, string[]>
        {
            [BusinessCategory.BeautySalon] = ["Nemlendirici Krem","Saç Serumu","El Kremi","Makyaj Temizleyici","Tonik","Güneş Kremi"],
            [BusinessCategory.Barbershop] = ["Saç Jölesi","Sakal Yağı","Tıraş Köpüğü","Saç Kremi","Tarak Seti","Kolonya"],
            [BusinessCategory.Dentist] = ["Diş Fırçası","Diş Macunu","Diş İpi","Ağız Gargarası","Protez Temizleyici"],
            [BusinessCategory.Spa] = ["Aromaterapi Yağı","Vücut Losyonu","Masaj Yağı","Mum Seti","Banyo Tuzu"],
            [BusinessCategory.NailSalon] = ["Oje Seti","Tırnak Törpüsü","Tırnak Eti Yağı","Base Coat","Top Coat"],
            [BusinessCategory.Gym] = ["Protein Tozu","Shaker","Antrenman Eldiveni","Su Şişesi","Havlu","Spor Bandı"],
            [BusinessCategory.Veterinarian] = ["Kuru Mama","Yaş Mama","Vitamin","Tasma","Oyuncak","Pire Tasması"],
            [BusinessCategory.CarService] = ["Motor Yağı","Antifriz","Cam Suyu","Hava Filtresi","Yağ Filtresi","Klima Spreyi"],
        };

        foreach (var b in bizList)
        {
            var cat = (BusinessCategory)b.GetType().GetProperty("Category")!.GetValue(b)!;
            if (!prodNames.TryGetValue(cat, out var names)) continue;
            foreach (var pn in names)
            {
                var p = New<Product>();
                Set(p, nameof(Product.Id), Guid.NewGuid());
                Set(p, nameof(Product.TenantId), TenantId);
                Set(p, nameof(Product.Name), pn);
                Set(p, nameof(Product.SalePrice), Rng.Next(5, 200) * 10);
                Set(p, nameof(Product.CostPrice), Rng.Next(3, 80) * 10);
                Set(p, nameof(Product.StockQuantity), Rng.Next(5, 100));
                Set(p, nameof(Product.MinStockLevel), 5);
                Set(p, nameof(Product.Unit), "Adet");
                Set(p, nameof(Product.IsActive), true);
                ctx.Products.Add(p);
            }
        }
        await Save(ctx, "Products");

        // 15 ── Reviews ────────────────────────────────────────────────────────
        var reviewTexts = new[] { "Harika hizmet!","Çok memnun kaldım.","Profesyonel ekip.","Temiz ve düzenli.","Tavsiye ederim.","Mükemmel!","Güler yüzlü hizmet.","Çok ilgilendiler.","Her zamanki gibi harika.","Kesinlikle gelmelisiniz!" };
        foreach (var b in bizList)
        {
            var bizId = (Guid)b.GetType().GetProperty("Id")!.GetValue(b)!;
            foreach (var c in custList.OrderBy(_ => Rng.Next()).Take(Rng.Next(5, 16)))
            {
                var r = New<Review>();
                Set(r, nameof(Review.Id), Guid.NewGuid());
                Set(r, nameof(Review.BusinessId), bizId);
                Set(r, nameof(Review.AuthorName), c.GetType().GetProperty("Name")!.GetValue(c)!);
                Set(r, nameof(Review.Rating), Rng.Next(4, 6));
                Set(r, nameof(Review.Comment), Pick(reviewTexts));
                Set(r, nameof(Review.IsApproved), true);
                Set(r, nameof(Review.CreatedAt), PastDay(60));
                ctx.Reviews.Add(r);
            }
        }
        await Save(ctx, "Reviews");

        // 16 ── Receivables & Installments ─────────────────────────────────────
        foreach (var b in bizList)
        {
            foreach (var c in custList.OrderBy(_ => Rng.Next()).Take(Rng.Next(3, 6)))
            {
                var total = Rng.Next(10, 100) * 100;
                var installments = Pick([1, 1, 2, 3]);
                var paidAmt = installments > 1 ? total / installments * Rng.Next(0, 2) : Rng.Next(2) == 0 ? total : 0;

                var r = New<Receivable>();
                Set(r, nameof(Receivable.Id), Guid.NewGuid());
                Set(r, nameof(Receivable.TenantId), TenantId);
                Set(r, nameof(Receivable.CustomerName), c.GetType().GetProperty("Name")!.GetValue(c)!);
                Set(r, nameof(Receivable.CustomerPhone), c.GetType().GetProperty("Phone")!.GetValue(c)!);
                Set(r, nameof(Receivable.TotalAmount), total);
                Set(r, nameof(Receivable.PaidAmount), paidAmt);
                Set(r, nameof(Receivable.DueDate), DateOnly.FromDateTime(DateTime.Now.AddDays(Rng.Next(-10, 31))));
                Set(r, nameof(Receivable.Status), paidAmt == 0 ? ReceivableStatus.Open : paidAmt >= total ? ReceivableStatus.Paid : ReceivableStatus.PartiallyPaid);
                Set(r, nameof(Receivable.InstallmentCount), installments);
                ctx.Receivables.Add(r);

                for (int i = 0; i < installments; i++)
                {
                    var inst = New<Installment>();
                    Set(inst, nameof(Installment.Id), Guid.NewGuid());
                    Set(inst, nameof(Installment.TenantId), TenantId);
                    Set(inst, nameof(Installment.ReceivableId), r.GetType().GetProperty("Id")!.GetValue(r)!);
                    Set(inst, nameof(Installment.InstallmentNumber), i + 1);
                    Set(inst, nameof(Installment.Amount), total / installments);
                    Set(inst, nameof(Installment.DueDate), DateOnly.FromDateTime(DateTime.Now.AddDays(i * 30 - 10)));
                    Set(inst, nameof(Installment.IsPaid), i == 0 && paidAmt > 0);
                    ctx.Installments.Add(inst);
                }
            }
        }
        await Save(ctx, "Receivables & Installments");

        // 17 ── DebtRecords ────────────────────────────────────────────────────
        var debtCats = new[] { DebtCategory.Rent, DebtCategory.Supplier, DebtCategory.Tax, DebtCategory.Equipment };
        foreach (var b in bizList)
        {
            foreach (var _ in Enumerable.Range(0, Rng.Next(2, 5)))
            {
                var cat = Pick(debtCats);
                var total = Rng.Next(5, 100) * 1000;
                var paid = Rng.Next(2) == 0 ? 0 : Rng.Next(1, (int)(total / 1000)) * 1000;

                var d = New<DebtRecord>();
                Set(d, nameof(DebtRecord.Id), Guid.NewGuid());
                Set(d, nameof(DebtRecord.TenantId), TenantId);
                Set(d, nameof(DebtRecord.Title), cat switch { DebtCategory.Rent => "Kira", DebtCategory.Supplier => "Tedarikçi Faturası", DebtCategory.Tax => "Vergi", _ => "Ekipman" });
                Set(d, nameof(DebtRecord.TotalAmount), total);
                Set(d, nameof(DebtRecord.PaidAmount), paid);
                Set(d, nameof(DebtRecord.DueDate), DateOnly.FromDateTime(DateTime.Now.AddDays(Rng.Next(-15, 45))));
                Set(d, nameof(DebtRecord.Category), cat);
                Set(d, nameof(DebtRecord.Status), paid == 0 ? DebtStatus.Open : paid >= total ? DebtStatus.Paid : DebtStatus.PartiallyPaid);
                ctx.DebtRecords.Add(d);
            }
        }
        await Save(ctx, "DebtRecords");

        // 18 ── EmployeeCommissions ────────────────────────────────────────────
        var month = $"{DateTime.UtcNow:yyyy-MM}";
        foreach (var emp in empList)
        {
            var baseAmt = (decimal)Rng.Next(50, 300) * 10;
            var rate = (decimal)Rng.Next(5, 31);
            var ec = New<EmployeeCommission>();
            Set(ec, nameof(EmployeeCommission.Id), Guid.NewGuid());
            Set(ec, nameof(EmployeeCommission.TenantId), TenantId);
            Set(ec, nameof(EmployeeCommission.EmployeeId), emp.GetType().GetProperty("Id")!.GetValue(emp)!);
            Set(ec, nameof(EmployeeCommission.EmployeeName), emp.GetType().GetProperty("Name")!.GetValue(emp)!);
            Set(ec, nameof(EmployeeCommission.Period), month);
            Set(ec, nameof(EmployeeCommission.Type), Pick([CommissionType.Service, CommissionType.Sales, CommissionType.Mixed]));
            Set(ec, nameof(EmployeeCommission.BaseAmount), baseAmt);
            Set(ec, nameof(EmployeeCommission.CommissionRate), rate);
            Set(ec, nameof(EmployeeCommission.CommissionAmount), baseAmt * rate / 100m);
            Set(ec, nameof(EmployeeCommission.BonusAmount), Rng.Next(2) == 0 ? (decimal)Rng.Next(5, 30) * 10 : 0m);
            Set(ec, nameof(EmployeeCommission.Status), Pick([CommissionStatus.Pending, CommissionStatus.Approved, CommissionStatus.Paid]));
            ctx.EmployeeCommissions.Add(ec);
        }
        await Save(ctx, "EmployeeCommissions");

        // 19 ── GiftCoupons ────────────────────────────────────────────────────
        foreach (var _ in Enumerable.Range(0, 20))
        {
            var buyer = Pick(custList);
            var recipient = Pick(custList);
            var gc = New<GiftCoupon>();
            Set(gc, nameof(GiftCoupon.Id), Guid.NewGuid());
            Set(gc, nameof(GiftCoupon.TenantId), TenantId);
            Set(gc, nameof(GiftCoupon.Code), $"HEDIYE{Rng.Next(10000, 99999)}");
            Set(gc, nameof(GiftCoupon.Amount), Rng.Next(5, 30) * 10);
            Set(gc, nameof(GiftCoupon.RecipientName), recipient.GetType().GetProperty("Name")!.GetValue(recipient)!);
            Set(gc, nameof(GiftCoupon.RecipientEmail), (string?)recipient.GetType().GetProperty("Email")!.GetValue(recipient)!);
            Set(gc, nameof(GiftCoupon.PurchasedBy), (string)buyer.GetType().GetProperty("Name")!.GetValue(buyer)!);
            Set(gc, nameof(GiftCoupon.PurchaseDate), Now.AddDays(-Rng.Next(1, 30)));
            Set(gc, nameof(GiftCoupon.ExpiryDate), Now.AddDays(Rng.Next(30, 180)));
            Set(gc, nameof(GiftCoupon.UsedAmount), 0m);
            Set(gc, nameof(GiftCoupon.Status), GiftCouponStatus.Active);
            ctx.GiftCoupons.Add(gc);
        }
        await Save(ctx, "GiftCoupons");

        // 20 ── Advertisements ─────────────────────────────────────────────────
        foreach (var b in bizList)
        {
            var ad = New<Advertisement>();
            Set(ad, nameof(Advertisement.Id), Guid.NewGuid());
            Set(ad, nameof(Advertisement.TenantId), TenantId);
            Set(ad, nameof(Advertisement.Title), $"{b.GetType().GetProperty("Name")!.GetValue(b)} - Öne Çıkan");
            Set(ad, nameof(Advertisement.PackageType), Pick([AdPackageType.BasicBoost, AdPackageType.ProfessionalBoost, AdPackageType.PremiumSpotlight]));
            Set(ad, nameof(Advertisement.TargetCategory), AdTargetCategory.All);
            Set(ad, nameof(Advertisement.Budget), Rng.Next(50, 200) * 10);
            Set(ad, nameof(Advertisement.StartDate), Now.AddDays(-Rng.Next(0, 10)));
            Set(ad, nameof(Advertisement.EndDate), Now.AddDays(Rng.Next(10, 40)));
            Set(ad, nameof(Advertisement.Status), Pick([AdStatus.Active, AdStatus.Active, AdStatus.Pending]));
            Set(ad, nameof(Advertisement.Impressions), Rng.Next(100, 5000));
            Set(ad, nameof(Advertisement.Clicks), Rng.Next(10, 300));
            Set(ad, nameof(Advertisement.Conversions), Rng.Next(1, 30));
            ctx.Advertisements.Add(ad);
        }
        await Save(ctx, "Advertisements");

        // 21 ── QueueItems ───────────────────────────────────────────────────────
        var queueItemsCreated = 0;
        foreach (var b in bizList)
        {
            var bizId = (Guid)b.GetType().GetProperty("Id")!.GetValue(b)!;
            foreach (var _ in Enumerable.Range(0, Rng.Next(2, 6)))
            {
                var q = New<QueueItem>();
                Set(q, nameof(QueueItem.Id), Guid.NewGuid());
                Set(q, nameof(QueueItem.TenantId), TenantId);
                Set(q, nameof(QueueItem.BusinessId), bizId);
                Set(q, nameof(QueueItem.QueueNumber), Rng.Next(1, 50));
                Set(q, nameof(QueueItem.CustomerName), $"{Pick(MaleNames)} {Pick(LastNames)}");
                Set(q, nameof(QueueItem.CustomerPhone), Phone());
                Set(q, nameof(QueueItem.Status), Pick([QueueStatus.Waiting, QueueStatus.InService, QueueStatus.Completed]));
                Set(q, nameof(QueueItem.EstimatedWaitMinutes), Rng.Next(5, 45));
                ctx.QueueItems.Add(q);
                queueItemsCreated++;
            }
        }
        await Save(ctx, "QueueItems");

        // 22 ── WaitingListEntries ──────────────────────────────────────────────
        var wleCreated = 0;
        foreach (var b in bizList)
        {
            foreach (var _ in Enumerable.Range(0, Rng.Next(1, 4)))
            {
                var w = New<WaitingListEntry>();
                Set(w, nameof(WaitingListEntry.Id), Guid.NewGuid());
                Set(w, nameof(WaitingListEntry.TenantId), TenantId);
                Set(w, nameof(WaitingListEntry.BusinessId), (Guid)b.GetType().GetProperty("Id")!.GetValue(b)!);
                Set(w, nameof(WaitingListEntry.CustomerName), $"{Pick(MaleNames)} {Pick(LastNames)}");
                Set(w, nameof(WaitingListEntry.CustomerPhone), Phone());
                Set(w, nameof(WaitingListEntry.Status), Pick([WaitingListStatus.Waiting, WaitingListStatus.Notified, WaitingListStatus.Confirmed, WaitingListStatus.Cancelled]));
                Set(w, nameof(WaitingListEntry.PreferredDate), DateOnly.FromDateTime(DateTime.Now.AddDays(Rng.Next(1, 14))));
                Set(w, nameof(WaitingListEntry.PreferredTime), new TimeOnly(Rng.Next(9, 18), 0));
                ctx.WaitingListEntries.Add(w);
                wleCreated++;
            }
        }
        await Save(ctx, "WaitingListEntries");

        // 23 ── Surveys ──────────────────────────────────────────────────────────
        var surveyTexts = new[] { "Çok memnun kaldım!", "İlgili ve güler yüzlü hizmet.", "Harika bir deneyimdi.", "Zamanında ve profesyonel.", "Her şey mükemmeldi.", "Beğendim, tekrar gelirim.", "Fiyat/performans harika.", "Temiz ve hijyenik ortam." };
        var surveyCreated = 0;
        foreach (var a in appList.Where(a => (AppointmentStatus)a.GetType().GetProperty("Status")!.GetValue(a)! == AppointmentStatus.Completed).Take(100))
        {
            var s = New<Survey>();
            Set(s, nameof(Survey.Id), Guid.NewGuid());
            Set(s, nameof(Survey.TenantId), TenantId);
            Set(s, nameof(Survey.BusinessId), a.GetType().GetProperty("BusinessId")!.GetValue(a)!);
            Set(s, nameof(Survey.AppointmentId), a.GetType().GetProperty("Id")!.GetValue(a)!);
            Set(s, nameof(Survey.CustomerName), Pick(custList).GetType().GetProperty("Name")!.GetValue(Pick(custList))!);
            Set(s, nameof(Survey.Rating), Rng.Next(3, 6));
            Set(s, nameof(Survey.Comment), Pick(surveyTexts));
            Set(s, nameof(Survey.IsApproved), true);
            ctx.Surveys.Add(s);
            surveyCreated++;
        }
        await Save(ctx, "Surveys");

        // 24 ── CustomForms ─────────────────────────────────────────────────────
        var formDefs = new (string Title, string Description, List<FormField> Fields)[]
        {
            ("İletişim Formu", "Müşterilerimizden geri bildirim almak için", new()
            {
                new() { Key = "fullName", Label = "Ad Soyad", Type = "text", Required = true, SortOrder = 1 },
                new() { Key = "phone", Label = "Telefon", Type = "tel", Required = true, SortOrder = 2 },
                new() { Key = "message", Label = "Mesaj", Type = "textarea", Required = true, SortOrder = 3 },
            }),
            ("Randevu Öncesi Bilgi Formu", "Randevu öncesi müşteri bilgilerini alır", new()
            {
                new() { Key = "fullName", Label = "Ad Soyad", Type = "text", Required = true, SortOrder = 1 },
                new() { Key = "age", Label = "Yaş", Type = "number", Required = false, SortOrder = 2 },
                new() { Key = "notes", Label = "Ek Notlar", Type = "textarea", Required = false, SortOrder = 3 },
                new() { Key = "isFirstVisit", Label = "İlk ziyaret mi?", Type = "checkbox", Required = true, SortOrder = 4 },
            }),
            ("Hizmet Memnuniyet Anketi", "Hizmet sonrası memnuniyet değerlendirmesi", new()
            {
                new() { Key = "serviceQuality", Label = "Hizmet kalitesi", Type = "radio", Required = true, Options = new() { "1","2","3","4","5" }, SortOrder = 1 },
                new() { Key = "punctuality", Label = "Zamanında hizmet", Type = "radio", Required = true, Options = new() { "1","2","3","4","5" }, SortOrder = 2 },
                new() { Key = "comment", Label = "Yorum", Type = "textarea", Required = false, SortOrder = 3 },
            }),
        };

        foreach (var (title, desc, fields) in formDefs)
        {
            var f = New<CustomForm>();
            Set(f, nameof(CustomForm.Id), Guid.NewGuid());
            Set(f, nameof(CustomForm.TenantId), TenantId);
            var fb = bizList[Rng.Next(bizList.Count)];
            Set(f, nameof(CustomForm.BusinessId), fb.GetType().GetProperty("Id")!.GetValue(fb)!);
            Set(f, nameof(CustomForm.Title), title);
            Set(f, nameof(CustomForm.Description), desc);
            Set(f, nameof(CustomForm.Fields), fields);
            Set(f, nameof(CustomForm.IsActive), true);
            ctx.CustomForms.Add(f);
        }
        await Save(ctx, "CustomForms");

        // 25 ── FormSubmissions ─────────────────────────────────────────────────
        var savedForms = ctx.ChangeTracker.Entries<CustomForm>()
            .Select(e => e.Entity)
            .ToList();

        foreach (var f in savedForms)
        {
            var fid = (Guid)f.GetType().GetProperty("Id")!.GetValue(f)!;
            var fields = (List<FormField>)f.GetType().GetProperty("Fields")!.GetValue(f)!;
            foreach (var _ in Enumerable.Range(0, Rng.Next(2, 6)))
            {
                var sub = New<FormSubmission>();
                Set(sub, nameof(FormSubmission.Id), Guid.NewGuid());
                Set(sub, nameof(FormSubmission.TenantId), TenantId);
                Set(sub, nameof(FormSubmission.FormId), fid);
                Set(sub, nameof(FormSubmission.CustomerName), $"{Pick(MaleNames)} {Pick(LastNames)}");
                Set(sub, nameof(FormSubmission.CustomerPhone), Phone());
                Set(sub, nameof(FormSubmission.Data), fields.ToDictionary(g => g.Key, g => g.Type == "checkbox" ? "true" : g.Type == "number" ? Rng.Next(18, 65).ToString() : "Örnek cevap"));
                ctx.FormSubmissions.Add(sub);
            }
        }
        await Save(ctx, "FormSubmissions");

        // ── Done ──────────────────────────────────────────────────────────────
        Console.WriteLine("");
        Console.WriteLine("═══════════════════════════════════════════");
        Console.WriteLine("  ✅ Seed data created successfully!");
        Console.WriteLine($"  • 1 Tenant | {bizList.Count} Businesses");
        Console.WriteLine($"  • {custList.Count} Customers");
        Console.WriteLine($"  • {svcList.Count} Services | {empList.Count} Employees");
        Console.WriteLine($"  • {appList.Count} Appointments");
        Console.WriteLine($"  • {queueItemsCreated} QueueItems");
        Console.WriteLine($"  • {wleCreated} WaitingListEntries");
        Console.WriteLine($"  • {surveyCreated} Surveys");
        Console.WriteLine($"  • {formDefs.Length} CustomForms");
        Console.WriteLine("═══════════════════════════════════════════");
    }

    private static async Task Save(ApplicationDbContext ctx, string label)
    {
        await ctx.SaveChangesAsync();
        Console.WriteLine($"  ✓ {label}");
    }
}
