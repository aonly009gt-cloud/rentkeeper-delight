import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, FileSignature, Eraser } from 'lucide-react';
import { toast } from 'sonner';

export default function LeaseSignature() {
    const [searchParams] = useSearchParams();
    const leaseId = searchParams.get('lease_id');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lease, setLease] = useState<any>(null);
    const sigPad = useRef<SignatureCanvas>(null);

    useEffect(() => {
        if (leaseId) fetchLease();
    }, [leaseId]);

    const fetchLease = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leases')
                .select(`
          *,
          rooms (name),
          tenants (full_name)
        `)
                .eq('id', leaseId)
                .single();

            if (error) throw error;
            setLease(data);
        } catch (error: any) {
            toast.error('ไม่พบข้อมูลสัญญาเช่า');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        sigPad.current?.clear();
    };

    const handleSign = async () => {
        if (sigPad.current?.isEmpty()) {
            toast.error('กรุณาเซ็นชื่อก่อนกดยืนยัน');
            return;
        }

        try {
            setSubmitting(true);

            // Get base64 string from canvas
            const signatureDataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');

            if (!signatureDataUrl) throw new Error('Failed to generate signature image');

            // Convert data URL to Blob
            const res = await fetch(signatureDataUrl);
            const blob = await res.blob();

            const fileName = `sig-${lease.id}-${Date.now()}.png`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('signatures')
                .upload(fileName, blob, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('signatures')
                .getPublicUrl(fileName);

            const publicUrl = publicUrlData.publicUrl;

            // Update Lease record
            const { error: updateError } = await supabase
                .from('leases')
                .update({
                    signature_url: publicUrl,
                    signed_at: new Date().toISOString()
                })
                .eq('id', lease.id);

            if (updateError) throw updateError;

            toast.success('บันทึกลายเซ็นเรียบร้อยแล้ว');
            fetchLease(); // Refresh

        } catch (error: any) {
            toast.error('เกิดข้อผิดพลาดในการบันทึกลายเซ็น: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
                <div>
                    <FileSignature className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-bold mb-2">ไม่พบสัญญาเช่า</h2>
                    <p className="text-muted-foreground">ลิงก์อาจไม่ถูกต้องหรือหมดอายุ</p>
                </div>
            </div>
        );
    }

    const isSigned = !!lease.signature_url;

    return (
        <div className="min-h-screen bg-muted/30 p-4 font-sans">
            <div className="max-w-xl mx-auto bg-card rounded-2xl shadow-sm border overflow-hidden">
                <div className="bg-primary/5 p-6 border-b text-center">
                    <FileSignature className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h1 className="text-2xl font-bold text-foreground">สัญญาเช่าห้องพัก</h1>
                    <p className="text-muted-foreground mt-1">ห้อง {lease.rooms?.name} | {lease.tenants?.full_name}</p>

                    {isSigned && (
                        <Badge className="mt-4 bg-success text-success-foreground px-3 py-1 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1.5 inline-block" /> ลงนามเรียบร้อยแล้ว
                        </Badge>
                    )}
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="font-semibold text-sm text-muted-foreground mb-3">รายละเอียดสัญญา</h3>
                        <div className="bg-muted/50 p-4 rounded-xl border whitespace-pre-wrap text-sm leading-relaxed" style={{ fontFamily: 'Sarabun, sans-serif' }}>
                            {lease.contract_text}
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-semibold text-sm text-foreground mb-4">การลงลายมือชื่อผู้เช่า</h3>

                        {isSigned ? (
                            <div className="text-center p-6 border rounded-xl bg-slate-50">
                                <img src={lease.signature_url} alt="Tenant Signature" className="max-h-32 mx-auto mix-blend-multiply" />
                                <div className="mt-4 text-sm text-muted-foreground">
                                    <p>ลงนามเมื่อ: {new Date(lease.signed_at).toLocaleString('th-TH')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-primary/20 rounded-xl bg-white overflow-hidden relative touch-none">
                                    <SignatureCanvas
                                        ref={sigPad}
                                        penColor="black"
                                        canvasProps={{ className: 'w-full h-48 sm:h-64' }}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white/80 shadow-sm" onClick={handleClear} type="button">
                                            <Eraser className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-20">
                                        <span className="text-xl font-bold tracking-widest">เซ็นชื่อที่นี่</span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground text-center px-4">
                                    * การเซ็นชื่อนับเป็นการยอมรับเงื่อนไขและข้อตกลงในสัญญาเช่าฉบับนี้โดยสมบูรณ์
                                </p>

                                <Button
                                    className="w-full h-12 text-lg shadow-sm"
                                    onClick={handleSign}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> กำลังบันทึก...</>
                                    ) : (
                                        <><CheckCircle className="w-5 h-5 mr-2" /> ยืนยันและส่งลายเซ็น</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
