import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { NotificationDrawer } from '@/components/NotificationDrawer';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        openDrawer,
        closeDrawer,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
      <NotificationDrawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
