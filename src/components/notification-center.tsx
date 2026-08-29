"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { loadAppNotifications, loadReadNotificationIds, markAllNotificationsRead, markNotificationRead, type AppNotification } from "@/persistence/app-notifications"
import { getNotificationPermission, requestDesktopNotifications, showReturnReminder } from "@/notifications/desktop-reminder"

function BellIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
}

const KIND_LABEL: Record<AppNotification["kind"], string> = { practice: "DSA practice", patterns: "Pattern Desk", design: "System design", lld: "Low-level design", db: "Database design", quiz: "Pattern quiz", review: "Review queue" }

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [read, setRead] = useState<string[]>([])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default")

  const refresh = () => {
    setItems(loadAppNotifications())
    setRead(loadReadNotificationIds())
  }

  useEffect(() => {
    refresh()
    setNotificationPermission(getNotificationPermission())
    const onStorage = () => {
      refresh()
      setNotificationPermission(getNotificationPermission())
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("focus", onStorage)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("focus", onStorage)
    }
  }, [])

  useEffect(() => {
    let leaveTimer: number | undefined
    const cancel = () => { if (leaveTimer !== undefined) window.clearTimeout(leaveTimer) }
    const onVisibilityChange = () => {
      cancel()
      if (document.visibilityState === "hidden") {
        leaveTimer = window.setTimeout(() => { void showReturnReminder() }, 2500)
      }
    }
    const onPageHide = () => { void showReturnReminder() }
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      cancel()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", onPageHide)
    }
  }, [])

  const unread = items.filter(item => !read.includes(item.id))
  const markAll = () => {
    markAllNotificationsRead(items.map(item => item.id))
    refresh()
  }
  const enableReminders = async () => setNotificationPermission(await requestDesktopNotifications())

  return (
    <div className="notification-center">
      <button className="notification-trigger" onClick={() => setOpen(value => !value)} aria-label={unread.length ? `${unread.length} unread notifications` : "Open notifications"} aria-expanded={open}>
        <BellIcon />
        {unread.length > 0 && <span className="notification-count">{unread.length}</span>}
      </button>
      {open && <div className="notification-panel" role="dialog" aria-label="Notifications">
        <div className="notification-panel-head"><div><span className="notification-kicker">Your next moves</span><b>Notifications</b></div><button onClick={markAll} className="notification-mark">Mark all read</button></div>
        {notificationPermission === "default" && <div className="notification-reminder"><span>Get a reminder when you leave Deriva.</span><button onClick={enableReminders}>Enable</button></div>}
        {notificationPermission === "denied" && <div className="notification-reminder blocked"><span>Browser notifications are blocked.</span><Link href="/settings" onClick={() => setOpen(false)}>Open Settings</Link></div>}
        <div className="notification-list">
          {items.map(item => <Link key={item.id} href={item.href} className={`notification-item${read.includes(item.id) ? " read" : ""}`} onClick={() => { markNotificationRead(item.id); setOpen(false) }}>
            <span className="notification-kind">{KIND_LABEL[item.kind]}</span><b>{item.title}</b><span>{item.body}</span>
          </Link>)}
        </div>
      </div>}
    </div>
  )
}
