'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/providers/azure-auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Upload, ShieldCheck, Clock, XCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface KYCData {
    fullName: string;
    dob: string;
    country: string;
    idType: string;
    idNumber: string;
    documents: {
        front: string;
        back: string;
        selfie: string;
    };
}

export default function KYCPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const [status, setStatus] = useState<KYCStatus>('none');
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState<string>('');

    const [formData, setFormData] = useState<KYCData>({
        fullName: '',
        dob: '',
        country: '',
        idType: 'passport',
        idNumber: '',
        documents: {
            front: '',
            back: '',
            selfie: ''
        }
    });

    // Fetch status on load
    useEffect(() => {
        const fetchStatus = async () => {
            if (!user) return;
            try {
                const res = await fetch(`/api/kyc/status?userId=${user.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data.kycStatus);
                    if (data.rejectionReason) {
                        setRejectionReason(data.rejectionReason);
                    }
                }
            } catch (error) {
                console.error('Error fetching KYC status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [user]);

    const handleInputChange = (field: keyof KYCData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDocumentUpload = (type: 'front' | 'back' | 'selfie', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // For now, we'll just use a fake URL or base64 placeholder
            // In a real app, upload to storage and get URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    documents: {
                        ...prev.documents,
                        [type]: reader.result as string
                    }
                }));
                toast({ title: 'Uploaded', description: `${type} uploaded successfully` });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/kyc/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                    data: formData
                })
            });

            if (res.ok) {
                setStatus('pending');
                toast({ title: 'Submitted', description: 'KYC submitted successfully' });
            } else {
                const data = await res.json();
                toast({ title: 'Error', description: data.error || 'Failed to submit KYC', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Error submitting KYC', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    // Status Views
    if (status === 'pending') {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4">
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">Verification Pending</h2>
                        <p className="text-muted-foreground">
                            Your documents have been submitted and are currently under review.
                            This process usually takes 24-48 hours. You will be notified once completed.
                        </p>
                        <Button variant="outline" onClick={() => router.push('/')}>Return to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'approved') {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4">
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-700 dark:text-green-500">Verified</h2>
                        <p className="text-muted-foreground">
                            Congratulations! Your identity has been verified.
                            You now have full access to all features including withdrawals.
                        </p>
                        <Button onClick={() => router.push('/withdrawals')}>Go to Withdrawals</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Form View (None or Rejected)
    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
                <p className="text-muted-foreground">
                    Complete KYC to unlock withdrawals and higher limits.
                </p>
            </div>

            {status === 'rejected' && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>
                        Your previous application was rejected: {rejectionReason}. Please correct the issues and try again.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
                            <div className="h-1 w-12 bg-muted">
                                <div className={`h-full bg-primary transition-all ${step > 1 ? 'w-full' : 'w-0'}`} />
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                            <div className="h-1 w-12 bg-muted">
                                <div className={`h-full bg-primary transition-all ${step > 2 ? 'w-full' : 'w-0'}`} />
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
                        </div>
                        <span className="text-sm text-muted-foreground">Step {step} of 3</span>
                    </div>
                    <CardTitle>
                        {step === 1 && 'Personal Information'}
                        {step === 2 && 'Document Upload'}
                        {step === 3 && 'Review & Submit'}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && 'Please enter your details exactly as they appear on your ID'}
                        {step === 2 && 'Upload clear photos of your identity document'}
                        {step === 3 && 'Review your information before submitting'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => handleInputChange('dob', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Select onValueChange={(v) => handleInputChange('country', v)} defaultValue={formData.country}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="US">United States</SelectItem>
                                            <SelectItem value="IN">India</SelectItem>
                                            <SelectItem value="UK">United Kingdom</SelectItem>
                                            <SelectItem value="CA">Canada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label>ID Type</Label>
                                <Select onValueChange={(v) => handleInputChange('idType', v)} defaultValue={formData.idType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select ID type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="passport">Passport</SelectItem>
                                        <SelectItem value="national_id">National ID</SelectItem>
                                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>ID Number</Label>
                                <Input
                                    placeholder="Enter ID number"
                                    value={formData.idNumber}
                                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleDocumentUpload('front', e)}
                                    />
                                    <div className="space-y-2">
                                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                        <div className="text-sm font-medium">Front of ID</div>
                                        {formData.documents.front ? (
                                            <div className="text-xs text-green-500 flex items-center justify-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground">Click to upload</div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleDocumentUpload('selfie', e)}
                                    />
                                    <div className="space-y-2">
                                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                        <div className="text-sm font-medium">Selfie</div>
                                        {formData.documents.selfie ? (
                                            <div className="text-xs text-green-500 flex items-center justify-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground">Click to upload</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">Full Name:</span>
                                    <span className="font-medium">{formData.fullName}</span>

                                    <span className="text-muted-foreground">Date of Birth:</span>
                                    <span className="font-medium">{formData.dob}</span>

                                    <span className="text-muted-foreground">Country:</span>
                                    <span className="font-medium">{formData.country}</span>

                                    <span className="text-muted-foreground">ID Type:</span>
                                    <span className="font-medium capitalize">{formData.idType.replace('_', ' ')}</span>

                                    <span className="text-muted-foreground">ID Number:</span>
                                    <span className="font-medium">{formData.idNumber}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>
                                    By submitting this form, you certify that the information provided is true and accurate.
                                    False information may result in account termination.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={() => setStep(step - 1)}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <Button onClick={() => setStep(step + 1)} disabled={
                            (step === 1 && (!formData.fullName || !formData.dob || !formData.country)) ||
                            (step === 2 && (!formData.idNumber || !formData.documents.front || !formData.documents.selfie))
                        }>
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Verification'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
