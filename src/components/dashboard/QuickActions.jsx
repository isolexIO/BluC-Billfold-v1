import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Send, Download, History, Settings } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Send",
      description: "Send BLC to others",
      icon: Send,
      url: createPageUrl("Send"),
    },
    {
      title: "Receive",
      description: "Share your address",
      icon: Download,
      url: createPageUrl("Receive"),
    },
    {
      title: "History",
      description: "View all transactions",
      icon: History,
      url: createPageUrl("History"),
    },
    {
      title: "Settings",
      description: "Manage your wallet",
      icon: Settings,
      url: createPageUrl("Settings"),
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {actions.map((action) => (
        <Link key={action.title} to={action.url}>
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-shadow duration-200 cursor-pointer h-full">
            <CardContent className="p-3 md:p-4 text-center flex flex-col items-center justify-center">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2 md:mb-3`}>
                <action.icon className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white text-sm md:text-base mb-1">{action.title}</h3>
              <p className="text-xs text-gray-400 hidden sm:block">{action.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}