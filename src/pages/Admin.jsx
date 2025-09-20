
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { PresaleConfig } from "@/api/entities";
import { SwapRequest } from "@/api/entities";
import { Notification } from "@/api/entities"; // Import new entity
import { clearTestSwaps } from "@/api/functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // For multiline message
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For type
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Shield, 
  Settings, 
  Trash2,
  RefreshCw,
  DollarSign,
  Users,
  Activity,
  Megaphone // New icon
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from 'date-fns';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [notifications, setNotifications] = useState([]); // State for notifications
  const [newNotification, setNewNotification] = useState({ title: '', message: '', type: 'info' }); // State for new notification form
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [testTxHash, setTestTxHash] = useState('YsEFeQTXDHoqsRk2cDvZYV5tzaap5CocJYQUhA5WeupvCdswnM9vq9j6MTsHgyddTxuRcUohXF7TG4ei4nD7WJ4');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.role !== 'admin') {
        setMessage('Access denied. Admin role required.');
        setLoading(false);
        return;
      }
      
      const [configs, requests, notifs] = await Promise.all([
        PresaleConfig.list(),
        SwapRequest.list('-created_date', 50),
        Notification.list('-created_date', 20)
      ]);

      if (configs.length > 0) {
        setConfig(configs[0]);
      } else {
        // Create default config
        const newConfig = await PresaleConfig.create({
          is_active: false,
          sol_deposit_address: "ENTER_SOLANA_ADDRESS_HERE",
          exchange_rate: 1000,
          total_bluc_sold: 0,
          total_sol_collected: 0
        });
        setConfig(newConfig);
      }

      setSwapRequests(requests);
      setNotifications(notifs);

    } catch (error) {
      console.error("Error loading admin data:", error);
      setMessage("Error loading admin data: " + error.message);
    }
    setLoading(false);
  };

  const updateConfig = async (updates) => {
    setUpdating(true);
    try {
      const updated = await PresaleConfig.update(config.id, updates);
      setConfig(updated);
      setMessage("Configuration updated successfully!");
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage("Error updating config: " + error.message);
    }
    setUpdating(false);
  };

  const clearTestTransaction = async () => {
    if (!testTxHash.trim()) {
      setMessage("Please enter a transaction hash to clear.");
      return;
    }
    
    setClearing(true);
    try {
      const { data, error } = await clearTestSwaps({ txHash: testTxHash });
      if (error) {
        setMessage("Error: " + error.message);
      } else {
        setMessage(data.message);
        await loadData(); // Refresh data
        setTestTxHash(''); // Clear input
      }
    } catch (error) {
      setMessage("Error clearing transaction: " + error.message);
    }
    setClearing(false);
  };

  const handleSendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
        setMessage("Title and message are required for notifications.");
        return;
    }
    setUpdating(true);
    try {
        await Notification.create(newNotification);
        setMessage("Notification sent successfully!");
        setNewNotification({ title: '', message: '', type: 'info' });
        await loadData();
        setTimeout(() => setMessage(''), 3000);
    } catch (error) {
        setMessage("Error sending notification: " + error.message);
    }
    setUpdating(false);
  };

  const handleToggleNotification = async (notification, checked) => {
    try {
        await Notification.update(notification.id, { is_active: checked });
        // Update local state for immediate feedback
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_active: checked } : n));
    } catch (error) {
        setMessage("Error updating notification status: " + error.message);
    }
  };


  if (loading) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen">
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>Access denied. Administrator privileges required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* SOL to BluC Swap Configuration */}
          {config && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  SOL to BluC Swap Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Swap Service Active</Label>
                    <p className="text-sm text-gray-400">Enable/disable the SOL to BluC swap feature</p>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => updateConfig({ is_active: checked })}
                    disabled={updating}
                  />
                </div>

                <Separator className="bg-gray-700" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sol-address">SOL Deposit Address</Label>
                    <Input
                      id="sol-address"
                      value={config.sol_deposit_address}
                      onChange={(e) => setConfig({...config, sol_deposit_address: e.target.value})}
                      onBlur={() => updateConfig({ sol_deposit_address: config.sol_deposit_address })}
                      className="bg-gray-900 border-gray-600 text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exchange-rate">Exchange Rate (BLC per SOL)</Label>
                    <Input
                      id="exchange-rate"
                      type="number"
                      value={config.exchange_rate}
                      onChange={(e) => setConfig({...config, exchange_rate: parseFloat(e.target.value)})}
                      onBlur={() => updateConfig({ exchange_rate: config.exchange_rate })}
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Total SOL Collected</p>
                    <p className="text-lg font-semibold text-white">{config.total_sol_collected} SOL</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total BluC Sold</p>
                    <p className="text-lg font-semibold text-white">{config.total_bluc_sold.toLocaleString()} BLC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Testing Tools */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Testing Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-tx">Clear Test Transaction</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="test-tx"
                    placeholder="Enter Solana transaction hash to clear"
                    value={testTxHash}
                    onChange={(e) => setTestTxHash(e.target.value)}
                    className="bg-gray-900 border-gray-600 text-white font-mono text-sm"
                  />
                  <Button 
                    onClick={clearTestTransaction} 
                    disabled={clearing || !testTxHash}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {clearing ? 'Clearing...' : 'Clear'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  This will remove the swap record for the specified transaction, allowing it to be processed again for testing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Community Notifications */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-yellow-400" />
                Community Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Notification Form */}
              <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
                <h3 className="font-semibold text-white">Create New Notification</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="notif-title">Title</Label>
                    <Input id="notif-title" placeholder="e.g., Scheduled Maintenance" value={newNotification.title} onChange={(e) => setNewNotification({...newNotification, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notif-type">Type</Label>
                    <Select value={newNotification.type} onValueChange={(value) => setNewNotification({...newNotification, type: value})}>
                      <SelectTrigger id="notif-type" className="bg-gray-900 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="info" className="hover:bg-gray-700">Info (Blue)</SelectItem>
                        <SelectItem value="success" className="hover:bg-gray-700">Success (Green)</SelectItem>
                        <SelectItem value="warning" className="hover:bg-gray-700">Warning (Yellow)</SelectItem>
                        <SelectItem value="alert" className="hover:bg-gray-700">Alert (Red)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-message">Message</Label>
                  <Textarea 
                    id="notif-message" 
                    placeholder="Enter notification content..." 
                    value={newNotification.message} 
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})} 
                    className="bg-gray-900 border-gray-600 text-white"
                  />
                </div>
                <Button onClick={handleSendNotification} disabled={updating}>
                  {updating ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
              
              <Separator className="bg-gray-700" />
              
              {/* Recent Notifications List */}
              <div>
                <h3 className="font-semibold text-white mb-2">Recent Notifications</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar visibility */}
                    {notifications.length > 0 ? notifications.map(notif => (
                        <div key={notif.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{notif.title}</p>
                                <p className="text-sm text-gray-400 truncate">{notif.message}</p>
                                <p className="text-xs text-gray-500">
                                  {notif.type.toUpperCase()} - Sent {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                                <Badge variant={notif.is_active ? 'default' : 'secondary'}>
                                  {notif.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Switch checked={notif.is_active} onCheckedChange={(checked) => handleToggleNotification(notif, checked)} />
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-400 text-center py-4">No notifications sent yet.</p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Swap Requests */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Recent Swap Requests ({swapRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {swapRequests.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No swap requests yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar visibility */}
                  {swapRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {request.user_email}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {request.sol_tx_hash?.slice(0, 20)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.sol_amount} SOL → {request.bluc_amount} BLC
                        </p>
                      </div>
                      <Badge variant={
                        request.status === 'completed' ? 'default' : 
                        request.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
