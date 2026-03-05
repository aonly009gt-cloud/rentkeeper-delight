import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, Calendar, Settings, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpenseManager() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('อื่นๆ');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) fetchExpenses();
    }, [user]);

    const fetchExpenses = async () => {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user!.id)
                .order('date', { ascending: false })
                .limit(50);

            if (error) throw error;
            setExpenses(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        setEditId(null);
        setTitle('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategory('อื่นๆ');
        setOpen(true);
    };

    const handleEdit = (expense: any) => {
        setEditId(expense.id);
        setTitle(expense.title);
        setAmount(expense.amount.toString());
        setDate(expense.date);
        setCategory(expense.category || 'อื่นๆ');
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบรายจ่ายนี้?')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            toast.success('ลบรายจ่ายสำเร็จ');
            fetchExpenses();
        } catch (error: any) {
            toast.error('เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount || !date) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        setSaving(true);
        try {
            const expenseData = {
                title,
                amount: parseFloat(amount),
                date,
                category,
                user_id: user!.id
            };

            if (editId) {
                const { error } = await supabase.from('expenses').update(expenseData).eq('id', editId);
                if (error) throw error;
                toast.success('แก้ไขข้อมูลสำเร็จ');
            } else {
                const { error } = await supabase.from('expenses').insert(expenseData);
                if (error) throw error;
                toast.success('เพิ่มรายจ่ายสำเร็จ');
            }

            setOpen(false);
            fetchExpenses();
        } catch (error: any) {
            toast.error('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;

    return (
        <div className="bg-card rounded-xl border p-4 sm:p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-destructive" /> บันทึกรายจ่าย
                </h3>
                <Button onClick={handleOpenNew} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="w-4 h-4 mr-1" /> เพิ่มรายจ่าย
                </Button>
            </div>

            {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                    <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p>ยังไม่มีบันทึกรายจ่าย</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-muted-foreground bg-muted/50 rounded-lg">
                            <tr>
                                <th className="px-4 py-3 font-medium rounded-l-lg">วันที่</th>
                                <th className="px-4 py-3 font-medium">รายการ</th>
                                <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                                <th className="px-4 py-3 font-medium text-right">จำนวนเงิน (฿)</th>
                                <th className="px-4 py-3 font-medium rounded-r-lg text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp: any) => (
                                <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">{new Date(exp.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-4 py-3 font-medium">{exp.title}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{exp.category}</td>
                                    <td className="px-4 py-3 text-right font-medium text-destructive">{exp.amount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editId ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่ายใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">วันที่</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="pl-9" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">ชื่อรายการ</Label>
                            <Input id="title" placeholder="เช่น ค่าทำความสะอาดแม่บ้าน, ค่าซ่อมแอร์..." value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
                                <Input id="amount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">หมวดหมู่</Label>
                                <select
                                    id="category"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="ซ่อมบำรุง">ซ่อมบำรุง</option>
                                    <option value="ทำความสะอาด">ทำความสะอาด</option>
                                    <option value="สาธารณูปโภค">สาธารณูปโภค</option>
                                    <option value="การตลาด">การตลาด</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังบันทึก</> : 'บันทึก'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
