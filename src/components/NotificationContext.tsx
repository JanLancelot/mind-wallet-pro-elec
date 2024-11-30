import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { useAuth } from '@/useAuth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date | null;
};

type NotificationContextType = {
    notifications: Notification[];
    addNotification: (message: string, type?: Notification['type']) => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
    isLoading: boolean;
  };
const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);  

  useEffect(() => {
    const ensureNotificationsCollectionExists = async () => {
      if (!user?.uid) return;
  
      try {
        const userDocRef = doc(db, "users", user.uid);
        const notificationsCollectionRef = collection(userDocRef, "notifications");
  
        const notificationsCollectionSnap = await getDocs(notificationsCollectionRef);
  
        if (notificationsCollectionSnap.empty) {
          await setDoc(doc(notificationsCollectionRef), { initialized: true });
          console.log("Notifications collection created!");
        } else {
          console.log("Notifications collection already exists.");
        }
      } catch (error) {
        console.error("Error ensuring notifications collection exists:", error);
        toast.error("Failed to initialize notifications.");
      }
    };
  
    ensureNotificationsCollectionExists();
  }, [user?.uid]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'users', user.uid, 'notifications'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotifications = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message,
            type: data.type,
            createdAt: data.createdAt?.toDate() || null,
          };
        }) as Notification[];
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to fetch notifications.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.uid]);

  const addNotification = async (
    message: string,
    type: Notification['type'] = 'info'
  ) => {
    if (!user?.uid) {
      console.error('User not logged in.');
      toast.error('User not logged in.');
      return;
    }

    try {
      const docRef = await addDoc(
        collection(db, 'users', user.uid, 'notifications'),
        {
          message,
          type,
          createdAt: serverTimestamp(),
        }
      );

      const newNotification: Notification = {
        id: docRef.id,
        message,
        type,
        createdAt: new Date(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Failed to add notification.');
    }
  };

  const removeNotification = async (id: string) => {
    if (!user?.uid) {
      console.error('User not logged in.');
      toast.error('User not logged in.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
      toast.error('Failed to remove notification.');
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, isLoading }}
    >
      {children}
    </NotificationContext.Provider>
  );
};