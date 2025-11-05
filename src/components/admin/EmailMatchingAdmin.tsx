'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UnmatchedEmail {
  id: string;
  email: string;
  payment_id?: string;
  subscription_id?: string;
  amount?: number;
  currency: string;
  status: string;
  created_at: string;
  webhook_data?: any;
}

interface EmailAlias {
  id: string;
  user_id: string;
  alias_email: string;
  status: string;
  created_at: string;
  notes?: string;
  users: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface MatchingLog {
  id: string;
  searched_email: string;
  matched_user_id?: string;
  matched_email?: string;
  match_type: string;
  webhook_event_type: string;
  created_at: string;
  users?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export default function EmailMatchingAdmin() {
  const [unmatchedEmails, setUnmatchedEmails] = useState<UnmatchedEmail[]>([]);
  const [emailAliases, setEmailAliases] = useState<EmailAlias[]>([]);
  const [matchingLogs, setMatchingLogs] = useState<MatchingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('unmatched');
  
  // 表单状态
  const [newAliasEmail, setNewAliasEmail] = useState('');
  const [newAliasUserId, setNewAliasUserId] = useState('');
  const [newAliasNotes, setNewAliasNotes] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // 加载未匹配的邮箱
  const loadUnmatchedEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/unmatched-emails?status=pending');
      const data = await response.json();
      setUnmatchedEmails(data.unmatchedEmails || []);
    } catch (error) {
      console.error('Failed to load unmatched emails:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载邮箱别名
  const loadEmailAliases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-aliases');
      const data = await response.json();
      setEmailAliases(data.aliases || []);
    } catch (error) {
      console.error('Failed to load email aliases:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载匹配日志
  const loadMatchingLogs = async () => {
    setLoading(true);
    try {
      const url = searchEmail 
        ? `/api/admin/email-matching-logs?email=${encodeURIComponent(searchEmail)}`
        : '/api/admin/email-matching-logs';
      const response = await fetch(url);
      const data = await response.json();
      setMatchingLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load matching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 解决未匹配的邮箱
  const resolveUnmatchedEmail = async (emailId: string, userId: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/unmatched-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unmatchedEmailId: emailId,
          userId,
          action: 'resolve',
          notes
        })
      });

      if (response.ok) {
        await loadUnmatchedEmails();
        alert('Email resolved successfully');
      } else {
        alert('Failed to resolve email');
      }
    } catch (error) {
      console.error('Failed to resolve email:', error);
      alert('Failed to resolve email');
    }
  };

  // 忽略未匹配的邮箱
  const ignoreUnmatchedEmail = async (emailId: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/unmatched-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unmatchedEmailId: emailId,
          action: 'ignore',
          notes
        })
      });

      if (response.ok) {
        await loadUnmatchedEmails();
        alert('Email ignored successfully');
      } else {
        alert('Failed to ignore email');
      }
    } catch (error) {
      console.error('Failed to ignore email:', error);
      alert('Failed to ignore email');
    }
  };

  // 创建邮箱别名
  const createEmailAlias = async () => {
    if (!newAliasEmail || !newAliasUserId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/email-aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newAliasUserId,
          aliasEmail: newAliasEmail,
          notes: newAliasNotes
        })
      });

      if (response.ok) {
        setNewAliasEmail('');
        setNewAliasUserId('');
        setNewAliasNotes('');
        await loadEmailAliases();
        alert('Email alias created successfully');
      } else {
        const error = await response.json();
        alert(`Failed to create alias: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create alias:', error);
      alert('Failed to create alias');
    }
  };

  useEffect(() => {
    loadUnmatchedEmails();
  }, []);

  const getMatchTypeBadge = (matchType: string) => {
    const variants = {
      exact: 'default',
      case_insensitive: 'secondary',
      alias: 'outline',
      none: 'destructive',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[matchType as keyof typeof variants] || 'default'}>
        {matchType}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">邮箱匹配管理</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unmatched">未匹配邮箱</TabsTrigger>
          <TabsTrigger value="aliases">邮箱别名</TabsTrigger>
          <TabsTrigger value="logs">匹配日志</TabsTrigger>
        </TabsList>

        <TabsContent value="unmatched" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                未匹配的支付邮箱
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {unmatchedEmails.length === 0 ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        没有待处理的未匹配邮箱
                      </AlertDescription>
                    </Alert>
                  ) : (
                    unmatchedEmails.map((email) => (
                      <Card key={email.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="font-medium">{email.email}</div>
                            <div className="text-sm text-gray-600">
                              金额: {email.amount} {email.currency} | 
                              时间: {new Date(email.created_at).toLocaleString()}
                            </div>
                            {email.payment_id && (
                              <div className="text-sm text-gray-500">
                                支付ID: {email.payment_id}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const userId = prompt('请输入用户ID:');
                                if (userId) {
                                  resolveUnmatchedEmail(email.id, userId);
                                }
                              }}
                            >
                              解决
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => ignoreUnmatchedEmail(email.id)}
                            >
                              忽略
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aliases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                创建邮箱别名
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userId">用户ID</Label>
                  <Input
                    id="userId"
                    value={newAliasUserId}
                    onChange={(e) => setNewAliasUserId(e.target.value)}
                    placeholder="输入用户ID"
                  />
                </div>
                <div>
                  <Label htmlFor="aliasEmail">别名邮箱</Label>
                  <Input
                    id="aliasEmail"
                    value={newAliasEmail}
                    onChange={(e) => setNewAliasEmail(e.target.value)}
                    placeholder="输入别名邮箱"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">备注</Label>
                <Input
                  id="notes"
                  value={newAliasNotes}
                  onChange={(e) => setNewAliasNotes(e.target.value)}
                  placeholder="可选备注信息"
                />
              </div>
              <Button onClick={createEmailAlias} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '创建别名'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>现有邮箱别名</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={loadEmailAliases} className="mb-4">
                刷新列表
              </Button>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {emailAliases.map((alias) => (
                    <Card key={alias.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="font-medium">{alias.alias_email}</div>
                          <div className="text-sm text-gray-600">
                            用户: {alias.users.full_name} ({alias.users.email})
                          </div>
                          {alias.notes && (
                            <div className="text-sm text-gray-500">
                              备注: {alias.notes}
                            </div>
                          )}
                        </div>
                        <Badge variant={alias.status === 'active' ? 'default' : 'secondary'}>
                          {alias.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                邮箱匹配日志
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="搜索邮箱..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button onClick={loadMatchingLogs}>
                  搜索
                </Button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {matchingLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="font-medium">{log.searched_email}</div>
                          <div className="text-sm text-gray-600">
                            事件: {log.webhook_event_type} | 
                            时间: {new Date(log.created_at).toLocaleString()}
                          </div>
                          {log.matched_email && (
                            <div className="text-sm text-gray-500">
                              匹配到: {log.matched_email}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getMatchTypeBadge(log.match_type)}
                          {log.users && (
                            <Badge variant="outline">
                              {log.users.full_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
