import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceRequestFormProps {
    open: boolean;
    onClose: () => void;
    roomId: string;
    tenantId: string;
}

export default function MaintenanceRequestForm({ open, onClose, roomId, tenantId }: MaintenanceRequestFormProps) {
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleClearFile = () => {
        setFile(null);
        setPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error('กรุณาระบุรายละเอียดปัญหา');
            return;
        }

        setUploading(true);
        let photo_url = null;

        try {
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${roomId}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError, data } = await supabase.storage
                    .from('maintenance-photos')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('maintenance-photos')
                    .getPublicUrl(filePath);

                photo_url = publicUrlData.publicUrl;
            }

            const { error } = await supabase
                .from('maintenance_requests')
                .insert({
                    room_id: roomId,
                    tenant_id: tenantId,
                    description: description.trim(),
                    photo_url,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success('ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว');
            setDescription('');
            handleClearFile();
            onClose();
        } catch (error: any) {
            console.error('Error submitting maintenance request:', error);
            toast.error(error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
            <DialogContent className="max-w-md w-[90vw] rounded-xl">
                <DialogHeader>
                    <DialogTitle>แจ้งซ่อม / ร้องเรียน</DialogTitle>
                    <DialogDescription>
                        โปรดอธิบายปัญหาที่พบ และแนบรูปภาพประกอบ (ถ้ามี)
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="เช่น แอร์ไม่เย็น, ท่อน้ำรั่ว, ... "
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none h-24"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        {!preview ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">แตะเพื่อถ่ายรูปหรือเลือกรูปภาพ</p>
                                </div>
                                <input type="file" accept="image/*" className="hidden" capture="environment" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="relative">
                                <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl border" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 rounded-full w-8 h-8"
                                    onClick={handleClearFile}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={uploading}>
                            {uploading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังส่งข้อมูล...</>
                            ) : (
                                <><UploadCloud className="w-4 h-4 mr-2" /> ส่งเรื่องแจ้งซ่อม</>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
