import { useAppSelector, useAppDispatch } from '@/store'
import { markAsRead, markAllAsRead, clearNotification } from '@/store/slices/notificationsSlice'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Bell, Check, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Notification } from '@/types'

const notificationIcons: Record<string, string> = {
  appointment_new: '📅',
  appointment_cancelled: '❌',
  appointment_reminder: '⏰',
  payment_received: '💳',
  review_new: '⭐',
  system: '🔔',
}

const notificationTypeLabels: Record<string, string> = {
  appointment_new: 'Yeni Randevu',
  appointment_cancelled: 'Randevu İptali',
  appointment_reminder: 'Randevu Hatırlatması',
  payment_received: 'Ödeme Alındı',
  review_new: 'Yeni Değerlendirme',
  system: 'Sistem',
}

function NotificationItem({ notification }: { notification: Notification }) {
  const dispatch = useAppDispatch()

  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-xl border p-4 transition-colors',
        !notification.isRead ? 'border-blue-100 bg-blue-50/50' : 'bg-white'
      )}
    >
      <span className="mt-0.5 text-2xl">{notificationIcons[notification.type] ?? '🔔'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('text-sm', !notification.isRead ? 'font-semibold' : 'font-medium')}>
            {notification.title}
          </p>
          <span className="text-[10px] text-muted-foreground/60 rounded-full bg-muted px-2 py-0.5">
            {notificationTypeLabels[notification.type]}
          </span>
          {!notification.isRead && (
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
        <p className="mt-1 text-xs text-muted-foreground/50">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!notification.isRead && (
          <button
            onClick={() => dispatch(markAsRead(notification.id))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Okundu işaretle"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => dispatch(clearNotification(notification.id))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const dispatch = useAppDispatch()
  const { items, unreadCount } = useAppSelector((s) => s.notifications)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirimler"
        description="İşletmenizle ilgili tüm bildirimler"
      >
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => dispatch(markAllAsRead())}>
            <Check className="h-4 w-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{items.length}</span> bildirim
        </span>
        {unreadCount > 0 && (
          <span className="flex items-center gap-1.5 text-blue-600">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="font-medium">{unreadCount}</span> okunmamış
          </span>
        )}
      </div>

      {/* Notification list */}
      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Bildirim yok"
          description="Yeni randevu, ödeme veya sistem bildirimleri burada görünecek."
        />
      ) : (
        <div className="space-y-2">
          {/* Unread */}
          {items.filter((n) => !n.isRead).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 px-1">
                Okunmamış
              </h2>
              {items
                .filter((n) => !n.isRead)
                .map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
            </div>
          )}
          {/* Read */}
          {items.filter((n) => n.isRead).length > 0 && (
            <div className="space-y-2 mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 px-1">
                Daha Önce
              </h2>
              {items
                .filter((n) => n.isRead)
                .map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
