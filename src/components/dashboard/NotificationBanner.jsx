import React, { useState, useEffect } from 'react';
import { Notification } from '@/api/entities';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, AlertTriangle, CheckCircle, Megaphone, X } from 'lucide-react';

const notificationStyles = {
    info: {
        icon: <Info className="h-4 w-4 text-blue-400" />,
        className: "bg-blue-900/50 border-blue-500/30 text-blue-200",
    },
    success: {
        icon: <CheckCircle className="h-4 w-4 text-green-400" />,
        className: "bg-green-900/50 border-green-500/30 text-green-200",
    },
    warning: {
        icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
        className: "bg-yellow-900/50 border-yellow-500/30 text-yellow-200",
    },
    alert: {
        icon: <Megaphone className="h-4 w-4 text-red-400" />,
        className: "bg-red-900/50 border-red-500/30 text-red-200",
    },
};

export default function NotificationBanner() {
    const [notification, setNotification] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchNotification = async () => {
            try {
                // Fetch the most recent, active notification
                const activeNotifications = await Notification.filter(
                    { is_active: true },
                    '-created_date',
                    1
                );

                if (activeNotifications.length > 0) {
                    setNotification(activeNotifications[0]);
                    setIsVisible(true);
                } else {
                    setNotification(null);
                    setIsVisible(false);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotification();
    }, []);

    if (!notification || !isVisible) {
        return null;
    }

    const style = notificationStyles[notification.type] || notificationStyles.info;

    return (
        <Alert className={`relative pr-10 ${style.className}`}>
            {style.icon}
            <AlertTitle className="font-bold">{notification.title}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setIsVisible(false)}
            >
                <X className="h-4 w-4" />
            </Button>
        </Alert>
    );
}