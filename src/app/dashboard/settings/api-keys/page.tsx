'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Key, Copy, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    last_used_at: string | null;
}

export default function ApiKeysSettingsPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [creating, setCreating] = useState(false);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch('/api/settings/api-keys');
            const data = await res.json();
            setKeys(data.keys ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchKeys(); }, [fetchKeys]);

    async function handleCreateKey() {
        if (!newKeyName) return;
        setCreating(true);
        try {
            const res = await fetch('/api/settings/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();
            if (res.ok) {
                setRevealedKey(data.secret);
                await fetchKeys();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    }

    async function handleDeleteKey(id: string) {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/settings/api-keys?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchKeys();
            }
        } catch (e) {
            console.error(e);
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) {
        return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-zinc-900 font-display">Developer API Keys</h3>
                    <p className="text-sm text-zinc-500">Enable external integrations with your Kultures workspace.</p>
                </div>
                <Button onClick={() => { setRevealedKey(null); setCreateDialogOpen(true); }} className="gap-2">
                    <Plus className="w-4 h-4" /> Generate New Key
                </Button>
            </div>

            <Card className="border-zinc-200">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-zinc-50/50">
                                <TableHead className="py-4">Name</TableHead>
                                <TableHead>Prefix</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-zinc-400 italic">
                                        No API keys generated yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                keys.map((key) => (
                                    <TableRow key={key.id} className="hover:bg-zinc-50/30 transition-colors">
                                        <TableCell className="font-medium text-zinc-900">{key.name}</TableCell>
                                        <TableCell>
                                            <code className="text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-600 font-mono">
                                                {key.key_prefix}...
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-sm text-zinc-500">
                                            {new Date(key.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm text-zinc-500">
                                            {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-zinc-400 hover:text-red-600"
                                                onClick={() => handleDeleteKey(key.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900 text-zinc-100 border-zinc-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-zinc-800 flex flex-row items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                        <Info className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-semibold">External API Access</CardTitle>
                        <CardDescription className="text-zinc-500 text-xs">How to use your API keys.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            API keys allow you to programmatically access your tenant data.
                            Include the key in the <code className="text-zinc-200">X-API-Key</code> header for all requests to
                            <code className="text-zinc-200 ml-1">api.kultures.com/v1/*</code>.
                        </p>
                        <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-400">
                            curl -X GET "https://api.kultures.com/v1/employees" \<br />
                            &nbsp;&nbsp;-H "X-API-Key: kt_xxxxxxxxxxxxxxxx"
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{revealedKey ? 'Key Generated Successfully' : 'Generate API Key'}</DialogTitle>
                        <DialogDescription>
                            {revealedKey
                                ? 'Copy this secret now. For security, it will NOT be shown again.'
                                : 'Give your key a name to help you identify it later.'}
                        </DialogDescription>
                    </DialogHeader>

                    {revealedKey ? (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p>This secret is sensitive. Never share it or commit it to version control.</p>
                            </div>
                            <div className="relative group">
                                <Input
                                    readOnly
                                    value={revealedKey}
                                    className="pr-10 bg-zinc-50 font-mono text-sm border-zinc-200 focus-visible:ring-amber-500"
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                                    onClick={() => copyToClipboard(revealedKey)}
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="key-name">Key Name</Label>
                                <Input
                                    id="key-name"
                                    placeholder="e.g. Website Integration"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {revealedKey ? (
                            <Button className="w-full" onClick={() => setCreateDialogOpen(false)}>
                                I've saved the key
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={handleCreateKey} disabled={creating || !newKeyName}>
                                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                                Generate Key
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
